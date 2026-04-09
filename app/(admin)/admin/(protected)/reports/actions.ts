"use server";

import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { issueWarning, sendBanNotice } from "@/lib/platform-messages";

export async function dismissReport(reportId: string): Promise<void> {
  await db
    .update(reports)
    .set({ status: "dismissed", reviewedAt: new Date() })
    .where(eq(reports.id, reportId));

  revalidatePath("/admin/reports");
}

export async function markReportReviewed(
  reportId: string,
  reportedUserId: string,
): Promise<void> {
  const warningCount = await issueWarning(reportedUserId);

  // If auto-banned (3rd warning), mark as action_taken instead of reviewed
  const status = warningCount >= 3 ? "action_taken" : "reviewed";

  await db
    .update(reports)
    .set({ status, reviewedAt: new Date() })
    .where(eq(reports.id, reportId));

  revalidatePath("/admin/reports");
}

export async function banReportedUser(
  reportId: string,
  reportedUserId: string,
): Promise<void> {
  await Promise.all([
    db
      .update(users)
      .set({
        isBanned: true,
        verificationStatus: "banned",
        updatedAt: new Date(),
      })
      .where(eq(users.id, reportedUserId)),
    db
      .update(reports)
      .set({ status: "action_taken", reviewedAt: new Date() })
      .where(eq(reports.id, reportId)),
    sendBanNotice(reportedUserId),
  ]);

  revalidatePath("/admin/reports");
}
