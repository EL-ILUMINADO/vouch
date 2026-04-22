// lib/platform-messages.ts
// Handles all platform-to-user messaging and the warning/ban system.
import { db } from "@/db";
import { platformMessages, notifications, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendPushToUser } from "./push";
import { pusherServer } from "./pusher-server";
import {
  ADMIN_WARNING_COPY,
  SUSPENSION_COPY,
  UNSUSPENSION_COPY,
  ADMIN_BAN_COPY,
  REPORT_WARNING_COPY,
} from "./moderation-copy";

type MessageType = "warning" | "promotion" | "announcement";

const NOTIFICATION_TITLE: Record<MessageType, string> = {
  announcement: "Message from Vouch",
  promotion: "Update from Vouch",
  warning: "⚠️ Account Warning",
};

export async function sendPlatformMessage(
  recipientId: string,
  content: string,
  type: MessageType = "announcement",
): Promise<void> {
  // Keep platformMessages insert — admin panel audit log
  const [msg] = await db
    .insert(platformMessages)
    .values({ recipientId, content, type })
    .returning();

  // Trigger real-time delivery to the client's inbox
  await pusherServer.trigger(`user-${recipientId}`, "platform-message", {
    id: msg.id,
    content: msg.content,
    type: msg.type,
    createdAt: msg.createdAt,
  });

  // Write to notifications so the Activity page SSE stream picks it up
  await db.insert(notifications).values({
    userId: recipientId,
    type: "admin",
    title: NOTIFICATION_TITLE[type],
    body: content,
  });

  // Web push — content deliberately hidden
  sendPushToUser(
    recipientId,
    "New message from Vouch",
    "You have a new message. Open the app to read it.",
    "/notifications",
  ).catch(() => {});
}

export async function sendPlatformMessageToAll(
  content: string,
  type: MessageType = "announcement",
): Promise<void> {
  const allUsers = await db.select({ id: users.id }).from(users);
  if (allUsers.length === 0) return;

  // Admin panel audit log
  const insertedMessages = await db
    .insert(platformMessages)
    .values(allUsers.map((u) => ({ recipientId: u.id, content, type })))
    .returning();

  const msgTemplate = insertedMessages[0];
  if (msgTemplate) {
    await pusherServer.trigger("vouch-announcements", "platform-message", {
      id: "broadcast-" + Date.now(),
      content: msgTemplate.content,
      type: msgTemplate.type,
      createdAt: msgTemplate.createdAt,
    });
  }

  // Activity page feed
  await db.insert(notifications).values(
    allUsers.map((u) => ({
      userId: u.id,
      type: "admin" as const,
      title: NOTIFICATION_TITLE[type],
      body: content,
    })),
  );

  // Web push to each recipient — content deliberately hidden
  await Promise.allSettled(
    allUsers.map((u) =>
      sendPushToUser(
        u.id,
        "New message from Vouch",
        "You have a new message. Open the app to read it.",
        "/notifications",
      ).catch(() => {}),
    ),
  );
}

export async function adminIssueWarning(userId: string): Promise<number> {
  const [updated] = await db
    .update(users)
    .set({
      warningCount: sql`${users.warningCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ warningCount: users.warningCount });

  const count = updated.warningCount;
  const copy = ADMIN_WARNING_COPY[count] ?? ADMIN_WARNING_COPY[3];
  await sendPlatformMessage(userId, copy, "warning");
  return count;
}

export async function sendSuspensionNotice(userId: string): Promise<void> {
  await sendPlatformMessage(userId, SUSPENSION_COPY, "warning");
}

export async function sendUnsuspensionNotice(userId: string): Promise<void> {
  await sendPlatformMessage(userId, UNSUSPENSION_COPY, "announcement");
}

export async function issueWarning(reportedUserId: string): Promise<number> {
  const [updated] = await db
    .update(users)
    .set({
      warningCount: sql`${users.warningCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, reportedUserId))
    .returning({ warningCount: users.warningCount });

  const count = updated.warningCount;
  const copy = REPORT_WARNING_COPY[count] ?? REPORT_WARNING_COPY[3];

  await sendPlatformMessage(reportedUserId, copy, "warning");

  if (count >= 3) {
    await db
      .update(users)
      .set({
        isBanned: true,
        verificationStatus: "banned",
        updatedAt: new Date(),
      })
      .where(eq(users.id, reportedUserId));
  }

  return count;
}

export async function sendBanNotice(reportedUserId: string): Promise<void> {
  await sendPlatformMessage(reportedUserId, ADMIN_BAN_COPY, "warning");
}
