import { db } from "@/db";
import { users, reports } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    [{ total: totalUsers }],
    [{ total: pendingVerifications }],
    [{ total: pendingReports }],
    [{ total: bannedUsers }],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db
      .select({ total: count() })
      .from(users)
      .where(eq(users.verificationStatus, "pending_review")),
    db
      .select({ total: count() })
      .from(reports)
      .where(eq(reports.status, "pending")),
    db.select({ total: count() }).from(users).where(eq(users.isBanned, true)),
  ]);

  return { totalUsers, pendingVerifications, pendingReports, bannedUsers };
}

const STAT_CARDS = [
  { label: "Total Users", key: "totalUsers", color: "text-white" },
  {
    label: "Pending Verifications",
    key: "pendingVerifications",
    color: "text-amber-400",
  },
  { label: "Pending Reports", key: "pendingReports", color: "text-red-400" },
  { label: "Banned Users", key: "bannedUsers", color: "text-zinc-400" },
] as const;

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, key, color }) => (
          <div
            key={key}
            className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-5 space-y-1"
          >
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
              {label}
            </p>
            <p className={`text-4xl font-black ${color}`}>{stats[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
