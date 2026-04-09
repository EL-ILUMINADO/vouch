import { db } from "@/db";
import { users, platformMessages } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ComposeForm } from "./compose-form";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";

async function getData() {
  const [allUsers, recentMessages, recentlyJoined] = await Promise.all([
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
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        university: users.university,
        department: users.department,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  return {
    users: allUsers,
    recentMessages: recentMessages.map((m) => ({
      ...m,
      recipient: userMap.get(m.recipientId),
    })),
    recentlyJoined,
  };
}

const TYPE_BADGE: Record<string, string> = {
  warning: "bg-red-900/50 text-red-400 border-red-800",
  promotion: "bg-blue-900/50 text-blue-400 border-blue-800",
  announcement: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
};

function timeAgo(date: Date | string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { users: allUsers, recentMessages, recentlyJoined } = await getData();
  const { welcome } = await searchParams;

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
          <ComposeForm
            users={allUsers}
            defaultRecipientId={welcome}
            defaultContent={
              welcome
                ? "Hey! Welcome to Vouch 🎉 We're thrilled to have you here. Take a moment to complete your profile and start connecting with people around campus!"
                : undefined
            }
          />
        </div>

        <div className="space-y-8">
          {/* Recently joined */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus size={14} className="text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Recently Joined
              </h2>
              <span className="text-xs text-zinc-500 font-medium">
                (last 10)
              </span>
            </div>
            {recentlyJoined.length === 0 ? (
              <p className="text-zinc-500 text-sm">No new users.</p>
            ) : (
              <div className="space-y-2">
                {recentlyJoined.map((u) => {
                  const uniName =
                    SUPPORTED_UNIVERSITIES.find((s) => s.id === u.university)
                      ?.name ?? u.university;
                  return (
                    <div
                      key={u.id}
                      className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {u.department
                            ? `${u.department} · ${uniName ?? u.university}`
                            : (uniName ?? u.university)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-zinc-600">
                          {timeAgo(u.createdAt)}
                        </span>
                        <Link
                          href={`/admin/messages?welcome=${u.id}`}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                        >
                          Welcome →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent messages sent */}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${TYPE_BADGE[msg.type] ?? ""}`}
                      >
                        {msg.type}
                      </span>
                      <span className="text-xs text-zinc-400">
                        → {msg.recipient?.name ?? "All Users"}
                      </span>
                    </div>
                    <span className="text-zinc-600 text-xs shrink-0">
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
    </div>
  );
}
