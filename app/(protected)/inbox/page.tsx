import { db } from "@/db";
import { platformMessages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InboxRealtime } from "./inbox-realtime";

export const dynamic = "force-dynamic";

async function markAllRead(userId: string) {
  await db
    .update(platformMessages)
    .set({ isRead: true })
    .where(eq(platformMessages.recipientId, userId));
}

export default async function InboxPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) redirect("/");

  const currentUserId = session.userId as string;

  const msgs = await db
    .select()
    .from(platformMessages)
    .where(eq(platformMessages.recipientId, currentUserId))
    .orderBy(asc(platformMessages.createdAt));

  // Mark all as read (fire-and-forget)
  markAllRead(currentUserId).catch(() => {});

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 py-4 border-b border-border flex items-center gap-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link
          href="/chats"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          ←
        </Link>
        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-black shrink-0">
          V
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            Vouch
          </h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Platform · Read-only
          </p>
        </div>
      </header>

      <div className="p-4 space-y-3 pb-24">
        <InboxRealtime
          initialMessages={msgs.map((m) => ({
            id: m.id,
            content: m.content,
            type: m.type as "warning" | "promotion" | "announcement",
            createdAt: m.createdAt,
            isRead: m.isRead,
          }))}
          currentUserId={currentUserId}
        />

        <div className="pt-4 text-center">
          <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest">
            Official Vouch Platform Messages · Cannot Reply
          </p>
        </div>
      </div>
    </main>
  );
}
