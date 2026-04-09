import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { approveVerification, rejectVerification } from "./actions";
import { Button } from "@/components/ui/button";

async function getPendingVerifications() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      university: users.university,
      department: users.department,
      level: users.level,
      verificationVideoUrl: users.verificationVideoUrl,
      verificationMethod: users.verificationMethod,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.verificationStatus, "pending_review"))
    .orderBy(users.createdAt);
}

export default async function VerificationsPage() {
  const pending = await getPendingVerifications();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Verifications</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {pending.length} user{pending.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-12 text-center">
          <p className="text-zinc-400 font-medium">
            All caught up — no pending verifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((user) => (
            <div
              key={user.id}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-white font-bold text-lg">{user.name}</p>
                  <p className="text-zinc-400 text-sm">{user.email}</p>
                  <p className="text-zinc-500 text-xs">
                    {user.university} · {user.department} · {user.level}
                  </p>
                  <p className="text-zinc-600 text-xs">
                    Method:{" "}
                    <span className="text-zinc-400 capitalize">
                      {user.verificationMethod}
                    </span>
                  </p>
                </div>
                <p className="text-zinc-600 text-xs shrink-0">
                  {new Date(user.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {user.verificationVideoUrl ? (
                <video
                  src={user.verificationVideoUrl}
                  controls
                  className="w-full max-w-md rounded-lg bg-black border border-zinc-700"
                  style={{ maxHeight: "280px" }}
                />
              ) : (
                <p className="text-zinc-600 text-sm italic">
                  No verification video uploaded.
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <form action={approveVerification.bind(null, user.id)}>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-5"
                  >
                    Approve
                  </Button>
                </form>
                <form action={rejectVerification.bind(null, user.id)}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300 font-bold h-9 px-5"
                  >
                    Reject
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
