"use server";

import { db } from "@/db";
import { users, conversations, radarRequests } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

async function getVerifiedSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) throw new Error("Not authenticated.");
  const session = await decrypt(token);
  if (!session) throw new Error("Invalid session.");
  return session.userId as string;
}

/**
 * Send a radar ping to another user.
 *
 * - Costs 1 ping from the weekly budget.
 * - If the target has already sent a pending request to the current user,
 *   both requests are treated as mutual interest: the incoming request is
 *   accepted, a conversation is created, and the user is redirected to chat.
 * - Otherwise a new `radar_requests` row is inserted with status "pending"
 *   (24h expiry). The target must accept before a conversation opens.
 */
export async function sendRadarPing(targetUserId: string) {
  const currentUserId = await getVerifiedSession();

  const [currentUser] = await db
    .select({
      radarPings: users.radarPings,
      pingsResetAt: users.pingsResetAt,
      verificationStatus: users.verificationStatus,
    })
    .from(users)
    .where(eq(users.id, currentUserId))
    .limit(1);

  if (!currentUser) throw new Error("User not found.");

  if (currentUser.verificationStatus !== "verified") {
    throw new Error("Your identity must be verified before you can connect.");
  }

  const now = new Date();
  let availablePings = currentUser.radarPings ?? 0;

  // Weekly reset: if the reset window has passed, replenish to 10.
  if (currentUser.pingsResetAt && now > currentUser.pingsResetAt) {
    availablePings = 10;
  }

  if (availablePings <= 0) {
    throw new Error("Radar battery depleted. Recharges next week.");
  }

  // Guard: a pending request to this user already exists.
  const [existingOutgoing] = await db
    .select({ id: radarRequests.id })
    .from(radarRequests)
    .where(
      and(
        eq(radarRequests.senderId, currentUserId),
        eq(radarRequests.receiverId, targetUserId),
        eq(radarRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (existingOutgoing) {
    throw new Error("You already have a pending request to this person.");
  }

  // Check if the target has already sent a pending request to me (mutual).
  const [incomingRequest] = await db
    .select({ id: radarRequests.id })
    .from(radarRequests)
    .where(
      and(
        eq(radarRequests.senderId, targetUserId),
        eq(radarRequests.receiverId, currentUserId),
        eq(radarRequests.status, "pending"),
      ),
    )
    .limit(1);

  // Deduct the ping.
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db
    .update(users)
    .set({
      radarPings: availablePings - 1,
      ...(availablePings === 10 ? { pingsResetAt: nextWeek } : {}),
    })
    .where(eq(users.id, currentUserId));

  if (incomingRequest) {
    // Mutual interest — accept the incoming request and open a chat.
    await db
      .update(radarRequests)
      .set({ status: "accepted" })
      .where(eq(radarRequests.id, incomingRequest.id));

    const conversationId = await findOrCreateConversation(
      currentUserId,
      targetUserId,
    );

    revalidatePath("/radar");
    revalidatePath("/chats");
    redirect(`/uplink/${conversationId}`);
  }

  // One-way: create a pending request that expires in 24h.
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await db.insert(radarRequests).values({
    senderId: currentUserId,
    receiverId: targetUserId,
    status: "pending",
    expiresAt,
  });

  revalidatePath("/radar");
  // No redirect — the caller shows "Request Sent" state.
}

/**
 * Accept or decline an incoming radar connection request.
 * Only the designated receiver may call this.
 * Accepting creates a conversation and redirects to it.
 */
export async function respondToRadarRequest(
  requestId: string,
  action: "accepted" | "declined",
) {
  const currentUserId = await getVerifiedSession();

  const [request] = await db
    .select()
    .from(radarRequests)
    .where(
      and(
        eq(radarRequests.id, requestId),
        eq(radarRequests.receiverId, currentUserId),
        eq(radarRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) {
    throw new Error("Request not found or already handled.");
  }

  if (new Date() > request.expiresAt) {
    await db
      .update(radarRequests)
      .set({ status: "expired" })
      .where(eq(radarRequests.id, requestId));
    throw new Error("This request has expired.");
  }

  await db
    .update(radarRequests)
    .set({ status: action })
    .where(eq(radarRequests.id, requestId));

  revalidatePath("/radar");
  revalidatePath("/chats");

  if (action === "accepted") {
    const conversationId = await findOrCreateConversation(
      request.senderId,
      currentUserId,
    );
    redirect(`/uplink/${conversationId}`);
  }
}

async function findOrCreateConversation(
  userAId: string,
  userBId: string,
): Promise<string> {
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        and(
          eq(conversations.userOneId, userAId),
          eq(conversations.userTwoId, userBId),
        ),
        and(
          eq(conversations.userOneId, userBId),
          eq(conversations.userTwoId, userAId),
        ),
      ),
    )
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(conversations)
    .values({ userOneId: userAId, userTwoId: userBId, origin: "radar" })
    .returning({ id: conversations.id });

  return created.id;
}
