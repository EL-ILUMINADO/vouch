"use server";

import { db } from "@/db";
import { messages, users, conversations, blocks } from "@/db/schema";
import { decrypt } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";
import { cookies } from "next/headers";
import { eq, desc, or, and, lt, ne } from "drizzle-orm";
import { sendPushToUser } from "@/lib/push";

const PAGE_SIZE = 20;

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
    .select({ verificationStatus: users.verificationStatus, name: users.name })
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

    // Web push to the other user — content deliberately hidden
    sendPushToUser(
      otherUserId,
      "New message",
      `${me.name ?? "Someone"} sent you a message.`,
      `/uplink/${conversationId}`,
    ).catch(() => {});

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
 * Cursor-based pagination for chat history.
 * Returns up to 20 messages older than `beforeId`, in ascending order
 * (ready to be prepended to the existing list).
 */
export async function fetchOlderMessages(
  conversationId: string,
  beforeId: string,
): Promise<import("../types").Message[]> {
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

/**
 * Marks all incoming messages in the specified conversation as read for the current user.
 */
export async function markChatAsRead(conversationId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { success: false };

  const session = await decrypt(token);
  if (!session) return { success: false };

  const currentUserId = session.userId as string;

  await db
    .update(messages)
    .set({ isRead: true })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, currentUserId),
        eq(messages.isRead, false),
      ),
    );

  return { success: true };
}
