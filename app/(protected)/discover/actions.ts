"use server";

import { conversations } from "@/db/schema";
import { db } from "@/db";
import { and, or, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { recordLikeAndCheckMatch } from "@/lib/match";

/**
 * Records a like and checks for a mutual match.
 * Returns the conversationId if both users have now liked each other.
 */
export async function recordLike(
  likedUserId: string,
): Promise<{ matched: boolean; conversationId?: string }> {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) return { matched: false };

  const likerId = session.userId as string;
  if (likerId === likedUserId) return { matched: false };

  return recordLikeAndCheckMatch(likerId, likedUserId);
}

/**
 * Opens a direct conversation with another user (Ping / Radar flow).
 * Does NOT require mutual likes — this is the explicit "I want to chat" path.
 */
export async function pingUser(
  otherUserId: string,
): Promise<{ conversationId: string }> {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) redirect("/");

  const userId = session.userId as string;

  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        and(
          eq(conversations.userOneId, userId),
          eq(conversations.userTwoId, otherUserId),
        ),
        and(
          eq(conversations.userOneId, otherUserId),
          eq(conversations.userTwoId, userId),
        ),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { conversationId: existing[0].id };
  }

  const [newConvo] = await db
    .insert(conversations)
    .values({ userOneId: userId, userTwoId: otherUserId })
    .returning({ id: conversations.id });

  return { conversationId: newConvo.id };
}
