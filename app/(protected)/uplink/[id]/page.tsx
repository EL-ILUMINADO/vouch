import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChatInterface } from "./chat-interface";
import { ReportDialog } from "@/components/chat/report-dialog";

export const dynamic = "force-dynamic";

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

  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (
    !convo ||
    (convo.userOneId !== session.userId && convo.userTwoId !== session.userId)
  ) {
    return notFound();
  }

  const otherUserId =
    convo.userOneId === session.userId ? convo.userTwoId : convo.userOneId;
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

  return (
    <main className="h-screen flex flex-col bg-background">
      <header className="px-6 py-4 border-b border-border flex items-center gap-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 dark:text-rose-400 font-bold shrink-0">
          {otherUser.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {otherUser.name}
          </h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
            {otherUser.department} • {otherUser.level}
          </p>
        </div>
        <ReportDialog
          conversationId={conversationId}
          reportedUserId={otherUser.id}
          reportedUserName={otherUser.name}
        />
      </header>

      <ChatInterface
        initialMessages={JSON.parse(JSON.stringify(history))}
        conversationId={conversationId}
        currentUserId={session.userId as string}
      />
    </main>
  );
}
