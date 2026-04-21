import { BottomNavWrapper } from "@/components/nav/bottom-nav-wrapper";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { PresencePing } from "@/components/PresencePing";
import { NotificationProvider } from "@/components/notification-provider";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function getInitialUnreadCount(): Promise<number> {
  try {
    const cookieStore = await cookies();
    const session = await decrypt(
      cookieStore.get("vouch_session")?.value ?? "",
    );
    if (!session?.userId) return 0;

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.userId as string),
          eq(notifications.isRead, false),
        ),
      );
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUnreadCount = await getInitialUnreadCount();

  return (
    <NotificationProvider initialUnreadCount={initialUnreadCount}>
      <div className="relative min-h-dvh bg-background">
        <PresencePing />
        <VerificationBanner />
        <div className="pb-16">{children}</div>
        <BottomNavWrapper />
      </div>
    </NotificationProvider>
  );
}
