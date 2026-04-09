"use server";

import { db } from "@/db";
import { messages, reports, users } from "@/db/schema";
import { decrypt } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";

export async function sendMessage(conversationId: string, content: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Authentication required." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  try {
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.userId as string,
        content,
      })
      .returning();

    // Trigger Pusher event
    // Channel name: The conversation ID
    // Event name: 'new-message'
    await pusherServer.trigger(conversationId, "new-message", newMessage);

    return { success: true };
  } catch {
    return { error: "Broadcast failed." };
  }
}

export type ReportResult = { success: true } | { error: string };

export async function reportUser(
  conversationId: string,
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
    // Fetch the last 20 messages from the conversation
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

    // Fetch sender names for the snapshot
    const allSenders = await db
      .select({ id: users.id, name: users.name })
      .from(users);
    const nameMap = new Map(allSenders.map((u) => [u.id, u.name]));

    const snapshot = last20
      .reverse() // chronological order for admin readability
      .map((m) => ({
        senderId: m.senderId,
        senderName: nameMap.get(m.senderId) ?? "Unknown",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));

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
