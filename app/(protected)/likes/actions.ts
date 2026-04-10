"use server";

import { db } from "@/db";
import { likes, users } from "@/db/schema";
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

  // Server-side verification gate — block unverified users regardless of client state.
  const [me] = await db
    .select({ verificationStatus: users.verificationStatus })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  if (!me || me.verificationStatus !== "verified") {
    return { error: "Your identity must be verified before you can connect." };
  }

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
