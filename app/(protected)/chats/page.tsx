import { db } from "@/db";
import { conversations, users } from "@/db/schema";
import { eq, or, desc, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import Link from "next/link";
import { MessageSquareOff } from "lucide-react";

export default async function ChatsPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  const currentUserId = session?.userId as string;

  const userConversations = await db
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
      or(
        eq(conversations.userOneId, currentUserId),
        eq(conversations.userTwoId, currentUserId),
      ),
    )
    .orderBy(desc(conversations.updatedAt));

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 py-8">
        <h1 className="text-3xl font-black text-foreground tracking-tighter italic">
          CHATS.
        </h1>
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">
          {userConversations.length} Active Connections
        </p>
      </header>

      <div className="px-4 space-y-1">
        {userConversations.length === 0 ? (
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
              {/* Avatar Bubble */}
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl border-2 border-transparent group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-all">
                {convo.otherUser.name[0]}
              </div>

              {/* Chat Preview Info */}
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
