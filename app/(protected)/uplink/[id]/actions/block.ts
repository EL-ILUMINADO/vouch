"use server";

import { db } from "@/db";
import { blocks, conversations, radarRequests, likes } from "@/db/schema";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { eq, or, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Block a user. Severs the active conversation, cancels pending radar requests,
 * and prevents both parties from appearing on each other's Radar / Discover.
 */
export async function blockUser(
  conversationId: string,
  targetId: string,
): Promise<{ success: true } | { error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const currentUserId = session.userId as string;
  if (currentUserId === targetId) return { error: "Cannot block yourself." };

  try {
    // 1. Insert block (ignore if already blocked).
    await db
      .insert(blocks)
      .values({ blockerId: currentUserId, blockedId: targetId })
      .onConflictDoNothing();

    // 2. Close the conversation.
    await db
      .update(conversations)
      .set({
        status: "closed_inactive",
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // 3. Cancel pending radar requests in both directions.
    await db
      .update(radarRequests)
      .set({ status: "declined" })
      .where(
        and(
          eq(radarRequests.status, "pending"),
          or(
            and(
              eq(radarRequests.senderId, currentUserId),
              eq(radarRequests.receiverId, targetId),
            ),
            and(
              eq(radarRequests.senderId, targetId),
              eq(radarRequests.receiverId, currentUserId),
            ),
          ),
        ),
      );

    // 4. Remove any pending mutual likes so neither party shows in the other's likes page.
    await db
      .delete(likes)
      .where(
        or(
          and(
            eq(likes.likerId, currentUserId),
            eq(likes.likedUserId, targetId),
          ),
          and(
            eq(likes.likerId, targetId),
            eq(likes.likedUserId, currentUserId),
          ),
        ),
      );

    revalidatePath("/radar");
    revalidatePath("/discover");
    revalidatePath("/chats");

    return { success: true };
  } catch (err) {
    console.error("[BLOCK_ERROR]", err);
    return { error: "Failed to block user." };
  }
}
