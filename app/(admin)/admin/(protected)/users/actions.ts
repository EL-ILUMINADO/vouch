"use server";

import { db } from "@/db";
import {
  users,
  bannedDevices,
  bannedEmails,
  conversations,
  reports,
  vouchCodes,
} from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  adminIssueWarning,
  sendBanNotice,
  sendSuspensionNotice,
  sendUnsuspensionNotice,
} from "@/lib/platform-messages";
import { adjustTrustScore, TRUST_DELTAS } from "@/lib/trust-score";

export type UserActionResult = { error?: string; deleted?: boolean };

export async function sendWarning(userId: string): Promise<UserActionResult> {
  const [user] = await db
    .select({ isBanned: users.isBanned, warningCount: users.warningCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "User not found." };
  if (user.isBanned) return { error: "User is already banned." };
  if (user.warningCount >= 3)
    return { error: "User has already received the maximum 3 warnings." };

  await adminIssueWarning(userId);
  await adjustTrustScore(userId, TRUST_DELTAS.WARNING_ISSUED);
  revalidatePath("/admin/users");
  return {};
}

export async function suspendUser(userId: string): Promise<UserActionResult> {
  const [user] = await db
    .select({ isBanned: users.isBanned, isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "User not found." };
  if (user.isBanned) return { error: "Cannot suspend a banned user." };
  if (user.isSuspended) return { error: "User is already suspended." };

  await db
    .update(users)
    .set({ isSuspended: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await sendSuspensionNotice(userId);
  await adjustTrustScore(userId, TRUST_DELTAS.SUSPENDED);
  revalidatePath("/admin/users");
  return {};
}

export async function unsuspendUser(userId: string): Promise<UserActionResult> {
  const [user] = await db
    .select({ isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "User not found." };
  if (!user.isSuspended) return { error: "User is not suspended." };

  await db
    .update(users)
    .set({ isSuspended: false, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await sendUnsuspensionNotice(userId);
  await adjustTrustScore(userId, TRUST_DELTAS.UNSUSPENDED);
  revalidatePath("/admin/users");
  return {};
}

export async function banUser(userId: string): Promise<UserActionResult> {
  const [user] = await db
    .select({
      isBanned: users.isBanned,
      warningCount: users.warningCount,
      deviceId: users.deviceId,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "User not found." };
  if (user.isBanned) return { error: "User is already banned." };
  if (user.warningCount < 3)
    return {
      error: `Cannot ban without 3 warnings first. This user has ${user.warningCount}/3.`,
    };

  await db
    .update(users)
    .set({
      isBanned: true,
      isSuspended: false,
      verificationStatus: "banned",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await db
    .insert(bannedEmails)
    .values({ email: user.email })
    .onConflictDoNothing();

  if (user.deviceId) {
    await db
      .insert(bannedDevices)
      .values({ deviceId: user.deviceId, userId })
      .onConflictDoNothing();
  }

  await sendBanNotice(userId);
  revalidatePath("/admin/users");
  return {};
}

export async function deleteUser(
  userId: string,
  adminPassword: string,
): Promise<UserActionResult> {
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return { error: "Incorrect admin password." };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "User not found." };

  // Null out self-referential FK on other users
  await db
    .update(users)
    .set({ vouchedById: null })
    .where(eq(users.vouchedById, userId));

  // Null out closedByUserId on conversations not belonging to this user
  await db
    .update(conversations)
    .set({ closedByUserId: null })
    .where(eq(conversations.closedByUserId, userId));

  // Delete reports involving this user
  await db
    .delete(reports)
    .where(
      or(eq(reports.reporterId, userId), eq(reports.reportedUserId, userId)),
    );

  // Delete conversations (cascades messages)
  await db
    .delete(conversations)
    .where(
      or(
        eq(conversations.userOneId, userId),
        eq(conversations.userTwoId, userId),
      ),
    );

  // Delete vouch codes issued or used by this user
  await db
    .delete(vouchCodes)
    .where(
      or(eq(vouchCodes.issuerId, userId), eq(vouchCodes.usedById, userId)),
    );

  // Delete banned device records linked to this user
  await db.delete(bannedDevices).where(eq(bannedDevices.userId, userId));

  // Delete the user (cascades: platformMessages, likes, radarRequests, blocks, pushSubscriptions, notifications)
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin/users");
  return { deleted: true };
}
