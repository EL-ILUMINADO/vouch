"use server";

import { db } from "@/db";
import { users, bannedDevices, bannedEmails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  adminIssueWarning,
  sendBanNotice,
  sendSuspensionNotice,
  sendUnsuspensionNotice,
} from "@/lib/platform-messages";
import { adjustTrustScore, TRUST_DELTAS } from "@/lib/trust-score";

export type UserActionResult = { error?: string };

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
