import { db } from "@/db";
import { likes, conversations } from "@/db/schema";
import { and, or, eq } from "drizzle-orm";

/**
 * Records a like from `likerId` → `likedUserId`, then checks for a mutual match.
 * On mutual match:
 *  - If a closed_inactive conversation exists between them, it is reactivated
 *    (history preserved).
 *  - Otherwise a new conversation is created.
 *
 * Returns `{ matched: true, conversationId }` when both users have liked each
 * other, or `{ matched: false }` when only the initiator has liked so far.
 */
export async function recordLikeAndCheckMatch(
  likerId: string,
  likedUserId: string,
): Promise<{ matched: boolean; conversationId?: string }> {
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

  if (!theirLike) return { matched: false };

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
    .values({ userOneId: likerId, userTwoId: likedUserId })
    .returning({ id: conversations.id });

  return { matched: true, conversationId: newConvo.id };
}
