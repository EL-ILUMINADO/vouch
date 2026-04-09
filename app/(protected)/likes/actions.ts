"use server";

import { db } from "@/db";
import { likes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { recordLikeAndCheckMatch } from "@/lib/match";

/**
 * Called when the current user accepts a like by liking back.
 * Since the other person already liked us, this always produces a mutual match.
 * Returns the conversation to navigate to, or an error.
 */
export async function likeBack(
  likerId: string,
): Promise<{ conversationId: string } | { error: string }> {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) return { error: "Not authenticated" };

  const currentUserId = session.userId as string;

  const result = await recordLikeAndCheckMatch(currentUserId, likerId);

  if (!result.matched || !result.conversationId) {
    return {
      error: "Could not create match. The other user may have been removed.",
    };
  }

  return { conversationId: result.conversationId };
}

/**
 * Marks a pending like as rejected so it no longer appears in the likes list.
 */
export async function rejectLike(likerId: string): Promise<void> {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) return;

  const currentUserId = session.userId as string;

  await db
    .update(likes)
    .set({ status: "rejected" })
    .where(
      and(eq(likes.likerId, likerId), eq(likes.likedUserId, currentUserId)),
    );
}
