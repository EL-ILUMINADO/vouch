import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { users, likes, platformMessages, radarRequests } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { BottomNav } from "./bottom-nav";

export async function BottomNavWrapper() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return <BottomNav />;

  const session = await decrypt(token);
  if (!session) return <BottomNav />;

  const userId = session.userId as string;

  const [likesCount, chatsCount, radarRequestCount, userData] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(likes)
        .where(and(eq(likes.likedUserId, userId), eq(likes.status, "pending")))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(platformMessages)
        .where(
          and(
            eq(platformMessages.recipientId, userId),
            eq(platformMessages.isRead, false),
          ),
        )
        .then((r) => r[0]?.count ?? 0),

      // Pending radar pings sent to me — drives the Radar nav badge.
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(radarRequests)
        .where(
          and(
            eq(radarRequests.receiverId, userId),
            eq(radarRequests.status, "pending"),
          ),
        )
        .then((r) => r[0]?.count ?? 0),

      db
        .select({
          verificationStatus: users.verificationStatus,
          requiresPulseCheck: users.requiresPulseCheck,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then((r) => r[0] ?? null),
    ]);

  const profileAlert =
    !!userData &&
    (userData.verificationStatus !== "verified" ||
      userData.requiresPulseCheck) &&
    userData.verificationStatus !== "banned";

  return (
    <BottomNav
      likesCount={likesCount}
      chatsCount={chatsCount}
      radarRequestCount={radarRequestCount}
      profileAlert={profileAlert}
    />
  );
}
