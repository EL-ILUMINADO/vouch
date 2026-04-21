// lib/platform-messages.ts
// Handles all platform-to-user messaging and the warning/ban system.
import { db } from "@/db";
import { platformMessages, notifications, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendPushToUser } from "./push";

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
  await db.insert(platformMessages).values({ recipientId, content, type });

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
  await db
    .insert(platformMessages)
    .values(allUsers.map((u) => ({ recipientId: u.id, content, type })));

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

const WARNING_COPY: Record<number, string> = {
  1: "Your account was reported for violating community guidelines. Please ensure you keep to our community guidelines to keep the platform safe for everyone.\n\n⚠️ This is your 1st warning. You have 2 more warnings before your account is permanently banned.",
  2: "Your account has received another report for violating community guidelines. We take platform safety very seriously.\n\n⚠️ This is your 2nd warning. You have 1 more warning before your account is permanently banned.",
  3: "Your account has been permanently banned for repeatedly violating Vouch community guidelines. This decision is final.",
};

const BAN_COPY =
  "Your account has been permanently banned by our moderation team for violating community guidelines. This decision is final.";

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
  const copy = WARNING_COPY[count] ?? WARNING_COPY[3];

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
  await sendPlatformMessage(reportedUserId, BAN_COPY, "warning");
}
