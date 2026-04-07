"use server";

import { db } from "@/db";
// 1. FIXED: Imported your tables from your schema
import { users, conversations } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { redirect } from "next/navigation";
// 2. FIXED: Imported revalidatePath from Next.js cache
import { revalidatePath } from "next/cache";

export async function useRadarPing(
  currentUserId: string,
  targetUserId: string,
) {
  // 3. FIXED: Swapped to standard db.select() to avoid DrizzleTypeError
  const [currentUser] = await db
    .select({
      radarPings: users.radarPings,
      pingsResetAt: users.pingsResetAt,
    })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  if (!currentUser) throw new Error("User not found");

  const now = new Date();
  let availablePings = currentUser.radarPings ?? 0;

  // Reset logic: If a week has passed, reset to 10
  if (currentUser.pingsResetAt && now > currentUser.pingsResetAt) {
    availablePings = 10;
  }

  // Enforce the limit
  if (availablePings <= 0) {
    throw new Error("Radar battery depleted. Recharges next week.");
  }

  // Deduct the ping and update reset date if it was just refreshed
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db
    .update(users)
    .set({
      radarPings: availablePings - 1,
      ...(availablePings === 10 ? { pingsResetAt: nextWeek } : {}),
    })
    .where(eq(users.id, currentUserId));

  // Check if a conversation already exists between these two users
  const [existingConvo] = await db
    .select()
    .from(conversations)
    .where(
      or(
        and(
          eq(conversations.userOneId, currentUserId),
          eq(conversations.userTwoId, targetUserId),
        ),
        and(
          eq(conversations.userOneId, targetUserId),
          eq(conversations.userTwoId, currentUserId),
        ),
      ),
    )
    .limit(1);

  let conversationId;

  if (existingConvo) {
    conversationId = existingConvo.id;
  } else {
    // 4. FIXED: Removed 'status' field to match your actual schema
    const [newConvo] = await db
      .insert(conversations)
      .values({
        userOneId: currentUserId,
        userTwoId: targetUserId,
      })
      .returning({ id: conversations.id });

    conversationId = newConvo.id;
  }

  // Refresh the radar page to show deducted pings, then teleport to chat
  revalidatePath("/radar");
  redirect(`/uplink/${conversationId}`);
}
