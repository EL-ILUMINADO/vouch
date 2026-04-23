import { BottomNavWrapper } from "@/components/nav/bottom-nav-wrapper";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { PresencePing } from "@/components/PresencePing";
import { NotificationProvider } from "@/components/notification-provider";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function getGlobalState(): Promise<{
  unreadCount: number;
  needsLocation: boolean;
}> {
  try {
    const cookieStore = await cookies();
    const session = await decrypt(
      cookieStore.get("vouch_session")?.value ?? "",
    );
    if (!session?.userId) return { unreadCount: 0, needsLocation: false };

    const [[unreadRow], [userRow]] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, session.userId as string),
            eq(notifications.isRead, false),
          ),
        ),
      db
        .select({ city: users.city, neighborhood: users.neighborhood })
        .from(users)
        .where(eq(users.id, session.userId as string)),
    ]);

    return {
      unreadCount: unreadRow?.count ?? 0,
      needsLocation: !userRow?.city || !userRow?.neighborhood,
    };
  } catch {
    return { unreadCount: 0, needsLocation: false };
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { unreadCount, needsLocation } = await getGlobalState();

  return (
    <NotificationProvider initialUnreadCount={unreadCount}>
      <div className="relative min-h-dvh bg-background">
        <PresencePing />
        <VerificationBanner />
        {needsLocation && (
          <div className="bg-emerald-500 text-black px-4 py-3 flex items-center justify-between z-50">
            <span className="text-xs font-bold w-[70%]">
              Improve your matches by adding your location.
            </span>
            <a
              href="/onboarding/location?mode=update"
              className="bg-black text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0"
            >
              Set Location
            </a>
          </div>
        )}
        <div className="pb-16">{children}</div>
        <BottomNavWrapper />
      </div>
    </NotificationProvider>
  );
}
