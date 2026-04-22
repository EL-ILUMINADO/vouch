"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { recordLikeAndCheckMatch } from "@/lib/match";

/**
 * Called when the "at fault" party wants to re-open a closed conversation.
 * Behaves identically to a normal like — the other person must accept from
 * their Likes page for the conversation to reactivate.
 */
export async function reLikeUser(
  otherUserId: string,
): Promise<{ sent: boolean }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { sent: false };

  const session = await decrypt(token);
  if (!session) return { sent: false };

  const userId = session.userId as string;

  // Server-side verification gate.
  const [me] = await db
    .select({ verificationStatus: users.verificationStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!me || me.verificationStatus !== "verified") return { sent: false };

  await recordLikeAndCheckMatch(userId, otherUserId);
  return { sent: true };
}
