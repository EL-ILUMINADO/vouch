"use server";

import { db } from "@/db";
import { users, conversations } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function useRadarPing(targetUserId: string) {
  // Authenticate via session — never trust a userId passed from the client.
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) throw new Error("Not authenticated.");
  const session = await decrypt(token);
  if (!session) throw new Error("Invalid session.");

  const currentUserId = session.userId as string;

  const [currentUser] = await db
    .select({
      radarPings: users.radarPings,
      pingsResetAt: users.pingsResetAt,
      verificationStatus: users.verificationStatus,
    })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  if (!currentUser) throw new Error("User not found");

  // Server-side verification gate.
  if (currentUser.verificationStatus !== "verified") {
    throw new Error("Your identity must be verified before you can connect.");
  }

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
