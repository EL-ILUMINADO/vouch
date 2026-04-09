// lib/platform-messages.ts
// Handles all platform-to-user messaging and the warning/ban system.
import { db } from "@/db";
import { platformMessages, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { pusherServer } from "./pusher-server";

type MessageType = "warning" | "promotion" | "announcement";

export async function sendPlatformMessage(
  recipientId: string,
  content: string,
  type: MessageType = "announcement",
): Promise<void> {
  const [msg] = await db
    .insert(platformMessages)
    .values({ recipientId, content, type })
    .returning();

  // Push to the recipient's personal channel so their inbox updates instantly
  await pusherServer
    .trigger(`user-${recipientId}`, "platform-message", {
      id: msg.id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt,
    })
    .catch(() => {}); // don't fail the send if Pusher is unreachable
}

export async function sendPlatformMessageToAll(
  content: string,
  type: MessageType = "announcement",
): Promise<void> {
  const allUsers = await db.select({ id: users.id }).from(users);
  if (allUsers.length === 0) return;

  const [firstMsg] = await db
    .insert(platformMessages)
    .values(allUsers.map((u) => ({ recipientId: u.id, content, type })))
    .returning();

  // Broadcast on the shared announcements channel — all clients listen here
  await pusherServer
    .trigger("vouch-announcements", "platform-message", {
      id: firstMsg?.id,
      content,
      type,
      createdAt: firstMsg?.createdAt ?? new Date(),
    })
    .catch(() => {});
}

const WARNING_COPY: Record<number, string> = {
  1: "Your account was reported for violating community guidelines. Please ensure you keep to our community guidelines to keep the platform safe for everyone.\n\n⚠️ This is your 1st warning. You have 2 more warnings before your account is permanently banned.",
  2: "Your account has received another report for violating community guidelines. We take platform safety very seriously.\n\n⚠️ This is your 2nd warning. You have 1 more warning before your account is permanently banned.",
  3: "Your account has been permanently banned for repeatedly violating Vouch community guidelines. This decision is final.",
};

const BAN_COPY =
  "Your account has been permanently banned by our moderation team for violating community guidelines. This decision is final.";

/**
 * Increments warningCount, sends the appropriate warning message,
 * and auto-bans at 3 warnings.
 * Returns the new warning count.
 */
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
