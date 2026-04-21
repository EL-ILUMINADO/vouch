import { db } from "@/db";
import { likes, conversations, users } from "@/db/schema";
import { and, or, eq, gte, count } from "drizzle-orm";
import { notify } from "@/lib/notifications";

const DAILY_HANDSHAKE_LIMIT = 50;

export async function recordLikeAndCheckMatch(
  likerId: string,
  likedUserId: string,
): Promise<{
  matched: boolean;
  conversationId?: string;
  limitReached?: boolean;
}> {
  // Daily handshake quota — count likes sent today (midnight UTC).
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);

  const [{ value: todayCount }] = await db
    .select({ value: count() })
    .from(likes)
    .where(
      and(eq(likes.likerId, likerId), gte(likes.createdAt, todayMidnight)),
    );

  if (todayCount >= DAILY_HANDSHAKE_LIMIT) {
    return { matched: false, limitReached: true };
  }

  // Upsert: reset a previously-rejected like back to pending (re-like flow)
  await db
    .insert(likes)
    .values({ likerId, likedUserId, status: "pending" })
    .onConflictDoUpdate({
      target: [likes.likerId, likes.likedUserId],
      set: { status: "pending", createdAt: new Date() },
    });

  // Is there a pending like from the other direction?
  const [theirLike] = await db
    .select({ id: likes.id })
    .from(likes)
    .where(
      and(
        eq(likes.likerId, likedUserId),
        eq(likes.likedUserId, likerId),
        eq(likes.status, "pending"),
      ),
    )
    .limit(1);

  if (!theirLike) {
    // One-way like — notify the liked user.
    const [liker] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, likerId))
      .limit(1);

    notify({
      userId: likedUserId,
      type: "like_received",
      title: "Someone liked you! 💜",
      body: `${liker?.name ?? "Someone"} liked your profile.`,
      actionUrl: "/likes",
      actorId: likerId,
    }).catch(() => {});

    return { matched: false };
  }

  // Mark their like as consumed so it disappears from the likes page
  await db
    .update(likes)
    .set({ status: "rejected" })
    .where(eq(likes.id, theirLike.id));

  // Mutual match — find any existing conversation between them
  const bothUsers = or(
    and(
      eq(conversations.userOneId, likerId),
      eq(conversations.userTwoId, likedUserId),
    ),
    and(
      eq(conversations.userOneId, likedUserId),
      eq(conversations.userTwoId, likerId),
    ),
  );

  // Check for a closed conversation to reactivate (preserves history)
  const [closedConvo] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(bothUsers, eq(conversations.status, "closed_inactive")))
    .limit(1);

  if (closedConvo) {
    await db
      .update(conversations)
      .set({
        status: "active",
        lastActivityAt: new Date(),
        closedAt: null,
        closedByUserId: null,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, closedConvo.id));
    return { matched: true, conversationId: closedConvo.id };
  }

  // Check for an already-active conversation
  const [activeConvo] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(bothUsers, eq(conversations.status, "active")))
    .limit(1);

  if (activeConvo) return { matched: true, conversationId: activeConvo.id };

  // Create a brand-new conversation
  const [newConvo] = await db
    .insert(conversations)
    .values({ userOneId: likerId, userTwoId: likedUserId, origin: "discover" })
    .returning({ id: conversations.id });

  // Notify the matched user (fire-and-forget).
  const [liker] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, likerId))
    .limit(1);

  notify({
    userId: likedUserId,
    type: "match",
    title: "You got a match!",
    body: `${liker?.name ?? "Someone"} matched with you on Vouch.`,
    actionUrl: `/uplink/${newConvo.id}`,
    actorId: likerId,
  }).catch(() => {});

  return { matched: true, conversationId: newConvo.id };
}
