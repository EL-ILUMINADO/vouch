import { db } from "@/db";
import {
  conversations,
  users,
  platformMessages,
  radarRequests,
  messages,
} from "@/db/schema";
import { eq, or, desc, sql, and, ne, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import Link from "next/link";
import { MessageSquareOff } from "lucide-react";
import { RadarRequestCard } from "./radar-request-card";
import type { PendingRadarRequest } from "./radar-request-card";

export default async function ChatsPage() {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  const currentUserId = session?.userId as string;

  const [
    userConversations,
    unreadPlatformCount,
    latestPlatformMsg,
    rawPendingPings,
  ] = await Promise.all([
    db
      .select({
        id: conversations.id,
        updatedAt: conversations.updatedAt,
        otherUser: {
          id: users.id,
          name: users.name,
          department: users.department,
          profileImage: users.profileImage,
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

    // Incoming radar pings awaiting my response.
    db
      .select({
        id: radarRequests.id,
        senderId: radarRequests.senderId,
      })
      .from(radarRequests)
      .where(
        and(
          eq(radarRequests.receiverId, currentUserId),
          eq(radarRequests.status, "pending"),
        ),
      ),
  ]);

  // Hydrate sender details for each pending ping.
  let pendingPings: PendingRadarRequest[] = [];
  if (rawPendingPings.length > 0) {
    const senderIds = rawPendingPings.map((r) => r.senderId);
    const senders = await db
      .select({
        id: users.id,
        name: users.name,
        department: users.department,
        level: users.level,
        hideLevel: users.hideLevel,
      })
      .from(users)
      .where(inArray(users.id, senderIds));

    const senderMap = Object.fromEntries(senders.map((s) => [s.id, s]));

    pendingPings = rawPendingPings
      .filter((r) => senderMap[r.senderId])
      .map((r) => {
        const s = senderMap[r.senderId];
        return {
          requestId: r.id,
          senderId: s.id,
          senderName: s.name,
          senderDepartment: s.department,
          senderLevel: s.level,
          senderHideLevel: s.hideLevel,
        };
      });
  }

  // Fetch the latest message preview for each active conversation.
  const convIds = userConversations.map((c) => c.id);
  type LastMsg = { content: string; senderId: string; deletedAt: Date | null };
  const lastMsgMap: Record<string, LastMsg> = {};

  if (convIds.length > 0) {
    const latestPerConvo = db
      .select({
        conversationId: messages.conversationId,
        maxCreatedAt: sql<Date>`max(${messages.createdAt})`.as(
          "max_created_at",
        ),
      })
      .from(messages)
      .where(inArray(messages.conversationId, convIds))
      .groupBy(messages.conversationId)
      .as("latest_per_convo");

    const lastMsgs = await db
      .select({
        conversationId: messages.conversationId,
        content: messages.content,
        senderId: messages.senderId,
        deletedAt: messages.deletedAt,
      })
      .from(messages)
      .innerJoin(
        latestPerConvo,
        and(
          eq(messages.conversationId, latestPerConvo.conversationId),
          eq(messages.createdAt, latestPerConvo.maxCreatedAt),
        ),
      );

    for (const msg of lastMsgs) {
      lastMsgMap[msg.conversationId] = {
        content: msg.content,
        senderId: msg.senderId,
        deletedAt: msg.deletedAt,
      };
    }
  }

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
        {/* Incoming radar pings — requires action before a chat opens */}
        {pendingPings.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 px-1 mb-3">
              Radar Pings · {pendingPings.length} pending
            </p>
            {pendingPings.map((ping) => (
              <RadarRequestCard key={ping.requestId} request={ping} />
            ))}
          </div>
        )}

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
            <div className="flex-1 min-w-0 border-b border-border pb-4">
              <div className="flex justify-between items-baseline gap-2">
                <h3 className="font-bold text-foreground flex items-center gap-1.5 truncate">
                  Vouch
                  <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-full">
                    Platform
                  </span>
                </h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter shrink-0">
                  {new Date(latestPlatformMsg.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                {latestPlatformMsg.content.split("\n")[0]}
              </p>
            </div>
          </Link>
        )}

        {userConversations.length === 0 &&
        !latestPlatformMsg &&
        pendingPings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-4">
            <MessageSquareOff className="w-12 h-12 stroke-1" />
            <p className="text-sm font-medium">No active handshakes yet.</p>
          </div>
        ) : (
          userConversations.map((convo) => {
            const lastMsg = lastMsgMap[convo.id];
            const isMyMsg = lastMsg?.senderId === currentUserId;

            let preview = "Say hi 👋";
            if (lastMsg) {
              if (lastMsg.deletedAt) {
                preview = "This message was deleted";
              } else {
                preview = `${isMyMsg ? "You: " : ""}${lastMsg.content}`;
              }
            }

            return (
              <Link
                key={convo.id}
                href={`/uplink/${convo.id}`}
                className="flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-accent transition-all active:scale-[0.98] group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 dark:text-rose-400 font-bold text-xl border-2 border-transparent group-hover:border-rose-200 dark:group-hover:border-rose-800 transition-all shrink-0">
                  {convo.otherUser.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={convo.otherUser.profileImage}
                      alt={convo.otherUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    convo.otherUser.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0 border-b border-border pb-4 group-last:border-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-foreground">
                      {convo.otherUser.name}
                    </h3>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter shrink-0">
                      {new Date(convo.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                    {preview}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
