import { db } from "@/db";
import { users, platformMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ComposeForm } from "./compose-form";

async function getData() {
  const [allUsers, recentMessages] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .orderBy(users.name),
    db
      .select({
        id: platformMessages.id,
        type: platformMessages.type,
        content: platformMessages.content,
        createdAt: platformMessages.createdAt,
        recipientId: platformMessages.recipientId,
      })
      .from(platformMessages)
      .orderBy(desc(platformMessages.createdAt))
      .limit(30),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  return {
    users: allUsers,
    recentMessages: recentMessages.map((m) => ({
      ...m,
      recipient: userMap.get(m.recipientId),
    })),
  };
}

const TYPE_BADGE: Record<string, string> = {
  warning: "bg-red-900/50 text-red-400 border-red-800",
  promotion: "bg-blue-900/50 text-blue-400 border-blue-800",
  announcement: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
};

export default async function AdminMessagesPage() {
  const { users: allUsers, recentMessages } = await getData();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-white">Messages</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Send platform messages to users. Users cannot reply.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Compose */}
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Compose</h2>
          <ComposeForm users={allUsers} />
        </div>

        {/* Recent messages */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white">
            Recent ({recentMessages.length})
          </h2>
          {recentMessages.length === 0 ? (
            <p className="text-zinc-500 text-sm">No messages sent yet.</p>
          ) : (
            recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${TYPE_BADGE[msg.type] ?? ""}`}
                    >
                      {msg.type}
                    </span>
                    <span className="text-xs text-zinc-400">
                      → {msg.recipient?.name ?? "All Users"}
                    </span>
                  </div>
                  <span className="text-zinc-600 text-xs">
                    {new Date(msg.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-line line-clamp-3">
                  {msg.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
