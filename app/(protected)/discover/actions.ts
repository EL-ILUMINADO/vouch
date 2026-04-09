"use server";

import { db } from "@/db";
import { conversations, likes } from "@/db/schema";
import { and, or, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

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

export async function recordLike(likedUserId: string): Promise<void> {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get("vouch_session")?.value ?? "");
  if (!session) return;

  const likerId = session.userId as string;
  if (likerId === likedUserId) return;

  await db.insert(likes).values({ likerId, likedUserId }).onConflictDoNothing();
}
