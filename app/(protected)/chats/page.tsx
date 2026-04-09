import { db } from "@/db";
import { conversations, users, platformMessages } from "@/db/schema";
import { eq, or, desc, sql, and, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import Link from "next/link";
import { MessageSquareOff } from "lucide-react";

export default async function ChatsPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  const currentUserId = session?.userId as string;

  const [userConversations, unreadPlatformCount, latestPlatformMsg] =
    await Promise.all([
      db
        .select({
          id: conversations.id,
          updatedAt: conversations.updatedAt,
          otherUser: {
            id: users.id,
            name: users.name,
            department: users.department,
          },
        })
        .from(conversations)
        .innerJoin(
          users,
          or(
            sql`${conversations.userOneId} = ${users.id} AND ${conversations.userTwoId} = ${currentUserId}`,
            sql`${conversations.userTwoId} = ${users.id} AND ${conversations.userOneId} = ${currentUserId}`,
          ),
        )
        .where(
          and(
            or(
              eq(conversations.userOneId, currentUserId),
              eq(conversations.userTwoId, currentUserId),
            ),
            ne(conversations.status, "closed_inactive"),
          ),
        )
        .orderBy(desc(conversations.updatedAt)),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(platformMessages)
        .where(
          and(
            eq(platformMessages.recipientId, currentUserId),
            eq(platformMessages.isRead, false),
          ),
        )
        .then((r) => r[0]?.count ?? 0),

      db
        .select({
          content: platformMessages.content,
          createdAt: platformMessages.createdAt,
        })
        .from(platformMessages)
        .where(eq(platformMessages.recipientId, currentUserId))
        .orderBy(desc(platformMessages.createdAt))
        .limit(1)
        .then((r) => r[0] ?? null),
    ]);

  const totalConnections =
    userConversations.length + (latestPlatformMsg ? 1 : 0);

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 py-8">
        <h1 className="text-3xl font-black text-foreground tracking-tighter italic">
          CHATS.
        </h1>
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-1">
          {totalConnections} Chat
          {totalConnections !== 1 ? "s" : ""}
        </p>
      </header>

      <div className="px-4 space-y-1">
        {/* Vouch Platform Inbox — pinned at top if any messages exist */}
        {latestPlatformMsg && (
          <Link
            href="/inbox"
            className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-accent transition-all active:scale-[0.98] group"
          >
            <div className="relative w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-xl shrink-0">
              V
              {unreadPlatformCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-background">
                  {unreadPlatformCount > 9 ? "9+" : unreadPlatformCount}
                </span>
              )}
            </div>
            <div className="flex-1 border-b border-border pb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-foreground flex items-center gap-1.5">
                  Vouch
                  <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-full">
                    Platform
                  </span>
                </h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                  {new Date(latestPlatformMsg.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                {latestPlatformMsg.content.split("\n")[0]}
              </p>
            </div>
          </Link>
        )}

        {userConversations.length === 0 && !latestPlatformMsg ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-4">
            <MessageSquareOff className="w-12 h-12 stroke-1" />
            <p className="text-sm font-medium">No active handshakes yet.</p>
          </div>
        ) : (
          userConversations.map((convo) => (
            <Link
              key={convo.id}
              href={`/uplink/${convo.id}`}
              className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-accent transition-all active:scale-[0.98] group"
            >
              <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 dark:text-rose-400 font-bold text-xl border-2 border-transparent group-hover:border-rose-200 dark:group-hover:border-rose-800 transition-all">
                {convo.otherUser.name[0]}
              </div>
              <div className="flex-1 border-b border-border pb-4 group-last:border-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-foreground">
                    {convo.otherUser.name}
                  </h3>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                    {new Date(convo.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                  {convo.otherUser.department} • Tap to resume chatting.
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
