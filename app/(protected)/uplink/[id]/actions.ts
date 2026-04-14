"use server";

import { db } from "@/db";
import {
  messages,
  reports,
  users,
  conversations,
  blocks,
  radarRequests,
  likes,
} from "@/db/schema";
import { decrypt } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";
import { cookies } from "next/headers";
import { eq, desc, or, and, lt, asc } from "drizzle-orm";
import { recordLikeAndCheckMatch } from "@/lib/match";
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

export async function sendMessage(
  conversationId: string,
  content: string,
  replyToId?: string | null,
  replyToContent?: string | null,
  replyToSenderId?: string | null,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  // Server-side verification gate.
  const [me] = await db
    .select({ verificationStatus: users.verificationStatus })
    .from(users)
    .where(eq(users.id, session.userId as string))
    .limit(1);

  if (!me || me.verificationStatus !== "verified") {
    return { error: "Your identity must be verified before you can message." };
  }

  // Reject sends to closed conversations
  const [convo] = await db
    .select({
      status: conversations.status,
      userOneId: conversations.userOneId,
      userTwoId: conversations.userTwoId,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!convo || convo.status === "closed_inactive") {
    return { error: "This chat is closed." };
  }

  const otherUserId =
    convo.userOneId === (session.userId as string)
      ? convo.userTwoId
      : convo.userOneId;

  // Block guard — prevent messaging if either party has blocked the other.
  const [blockRecord] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(
          eq(blocks.blockerId, session.userId as string),
          eq(blocks.blockedId, otherUserId),
        ),
        and(
          eq(blocks.blockerId, otherUserId),
          eq(blocks.blockedId, session.userId as string),
        ),
      ),
    )
    .limit(1);

  if (blockRecord) {
    return { error: "This chat is closed." };
  }

  try {
    const now = new Date();

    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.userId as string,
        content,
        replyToId: replyToId ?? null,
        replyToContent: replyToContent ?? null,
        replyToSenderId: replyToSenderId ?? null,
      })
      .returning();

    // Keep lastActivityAt fresh so the 24h timer resets on every message
    await db
      .update(conversations)
      .set({ lastActivityAt: now, updatedAt: now })
      .where(eq(conversations.id, conversationId));

    await pusherServer.trigger(conversationId, "new-message", newMessage);

    return { success: true };
  } catch {
    return { error: "Broadcast failed." };
  }
}

export async function deleteMessage(
  messageId: string,
  deleteForEveryone: boolean,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const userId = session.userId as string;

  // Fetch the message and verify the user is a participant in the conversation
  const [msg] = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      conversationId: messages.conversationId,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) return { error: "Message not found." };

  // Verify this user is a participant in the conversation
  const [convo] = await db
    .select({
      userOneId: conversations.userOneId,
      userTwoId: conversations.userTwoId,
    })
    .from(conversations)
    .where(eq(conversations.id, msg.conversationId))
    .limit(1);

  if (!convo || (convo.userOneId !== userId && convo.userTwoId !== userId)) {
    return { error: "Not authorized." };
  }

  const isSender = msg.senderId === userId;

  if (deleteForEveryone) {
    await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));

    await pusherServer.trigger(msg.conversationId, "message-deleted", {
      messageId,
      deleteForEveryone: true,
      deletedBySender: isSender,
    });
  } else {
    // Delete for self only
    if (isSender) {
      await db
        .update(messages)
        .set({ deletedForSender: true })
        .where(eq(messages.id, messageId));
    } else {
      await db
        .update(messages)
        .set({ deletedForReceiver: true })
        .where(eq(messages.id, messageId));
    }
    // No need to notify the other party for self-only deletion
  }

  return { success: true };
}

export async function editMessage(messageId: string, newContent: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const userId = session.userId as string;

  const [msg] = await db
    .select({
      senderId: messages.senderId,
      conversationId: messages.conversationId,
      deletedAt: messages.deletedAt,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) return { error: "Message not found." };
  if (msg.senderId !== userId)
    return { error: "Can only edit your own messages." };
  if (msg.deletedAt) return { error: "Cannot edit a deleted message." };

  const now = new Date();

  await db
    .update(messages)
    .set({ content: newContent.trim(), editedAt: now })
    .where(eq(messages.id, messageId));

  await pusherServer.trigger(msg.conversationId, "message-edited", {
    messageId,
    newContent: newContent.trim(),
    editedAt: now.toISOString(),
  });

  return { success: true };
}

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

export type ReportResult = { success: true } | { error: string };

export async function reportUser(
  conversationId: string | null,
  reportedUserId: string,
  reason: string,
  description: string,
): Promise<ReportResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const reporterId = session.userId as string;

  if (reporterId === reportedUserId)
    return { error: "Cannot report yourself." };

  try {
    // Only fetch a message snapshot when there is an associated conversation.
    let snapshot: Array<{
      senderId: string;
      senderName: string;
      content: string;
      createdAt: string;
    }> = [];

    if (conversationId) {
      const last20 = await db
        .select({
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(20);

      const allSenders = await db
        .select({ id: users.id, name: users.name })
        .from(users);
      const nameMap = new Map(allSenders.map((u) => [u.id, u.name]));

      snapshot = last20.reverse().map((m) => ({
        senderId: m.senderId,
        senderName: nameMap.get(m.senderId) ?? "Unknown",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
    }

    await db.insert(reports).values({
      reporterId,
      reportedUserId,
      conversationId,
      reason: reason as
        | "harassment"
        | "fake_profile"
        | "inappropriate_content"
        | "spam"
        | "other",
      description: description || null,
      messageSnapshot: snapshot,
    });

    return { success: true };
  } catch (err) {
    console.error("[REPORT_ERROR]", err);
    return { error: "Failed to submit report." };
  }
}

const PAGE_SIZE = 20;

/**
 * Cursor-based pagination for chat history.
 * Returns up to 20 messages older than `beforeId`, in ascending order
 * (ready to be prepended to the existing list).
 */
export async function fetchOlderMessages(
  conversationId: string,
  beforeId: string,
): Promise<import("./types").Message[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return [];

  const session = await decrypt(token);
  if (!session) return [];

  // Resolve the cursor message's createdAt so we can page by timestamp.
  const [cursor] = await db
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.id, beforeId))
    .limit(1);

  if (!cursor) return [];

  const older = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        lt(messages.createdAt, cursor.createdAt),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(PAGE_SIZE);

  // Return in ascending order so they can be prepended correctly.
  return older.reverse();
}
