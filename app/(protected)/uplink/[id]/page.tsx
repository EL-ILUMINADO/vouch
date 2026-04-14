import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChatInterface } from "./chat-interface";
import { ReportDialog } from "@/components/chat/report-dialog";
import { ClosedChatBanner } from "./closed-chat-banner";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const INACTIVITY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UplinkPageProps {
  params: Promise<{ id: string }>;
}

export default async function UplinkPage({ params }: UplinkPageProps) {
  const { id: conversationId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;

  if (!token) redirect("/login");
  const session = await decrypt(token);
  if (!session) redirect("/login");

  const currentUserId = session.userId as string;

  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (
    !convo ||
    (convo.userOneId !== currentUserId && convo.userTwoId !== currentUserId)
  ) {
    return notFound();
  }

  // --- Lazy 24h inactivity enforcement ---
  if (convo.status === "active") {
    // eslint-disable-next-line react-hooks/purity -- server component, not a hook
    const inactiveMs = Date.now() - new Date(convo.lastActivityAt).getTime();
    if (inactiveMs > INACTIVITY_MS) {
      // Find who sent the last message to determine who is "at fault"
      const [lastMsg] = await db
        .select({ senderId: messages.senderId })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // At-fault = the user who did NOT send the last message (they should have replied)
      let closedByUserId: string | null = null;
      if (lastMsg) {
        closedByUserId =
          lastMsg.senderId === convo.userOneId
            ? convo.userTwoId
            : convo.userOneId;
      }

      const now = new Date();
      await db
        .update(conversations)
        .set({
          status: "closed_inactive",
          closedAt: now,
          closedByUserId,
          updatedAt: now,
        })
        .where(eq(conversations.id, conversationId));

      // Reflect closure in local object so the rest of the page renders correctly
      convo.status = "closed_inactive";
      convo.closedByUserId = closedByUserId;
    }
  }

  const otherUserId =
    convo.userOneId === currentUserId ? convo.userTwoId : convo.userOneId;

  const [otherUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, otherUserId))
    .limit(1);

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  const isClosed = convo.status === "closed_inactive";

  return (
    <main className="fixed inset-0 bottom-16 flex flex-col bg-background">
      <header className="px-4 py-3 border-b border-border flex items-center gap-3 bg-background/80 backdrop-blur-md z-50 shrink-0">
        <Link
          href="/chats"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
          aria-label="Back to chats"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Link>
        {/* Avatar — tap to view the other user's profile */}
        <Link
          href={`/user/${otherUser.id}`}
          className="w-9 h-9 rounded-full overflow-hidden bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 dark:text-rose-400 font-bold shrink-0 ring-2 ring-transparent hover:ring-rose-400/40 transition-all"
          aria-label={`View ${otherUser.name}'s profile`}
        >
          {otherUser.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={otherUser.profileImage}
              alt={otherUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            otherUser.name[0]
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {otherUser.name}
          </h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
            {otherUser.department} • {otherUser.level}
          </p>
        </div>
        {isClosed && (
          <span className="text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-2 py-1 rounded-full">
            Closed
          </span>
        )}
        <ReportDialog
          conversationId={conversationId}
          reportedUserId={otherUser.id}
          reportedUserName={otherUser.name}
        />
      </header>

      {isClosed ? (
        <>
          {/* Greyed-out history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 opacity-30 pointer-events-none select-none">
            {history.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? "bg-rose-500 text-white rounded-br-none"
                        : "bg-card text-card-foreground border border-border rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Closed state banner with re-like CTA */}
          <ClosedChatBanner
            isAtFault={convo.closedByUserId === currentUserId}
            otherUserId={otherUserId}
            otherUserName={otherUser.name}
          />
        </>
      ) : (
        <ChatInterface
          initialMessages={JSON.parse(JSON.stringify(history))}
          conversationId={conversationId}
          currentUserId={currentUserId}
        />
      )}
    </main>
  );
}
