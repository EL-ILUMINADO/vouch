"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function approveVerification(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ verificationStatus: "verified", updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/admin/verifications");
}

export async function rejectVerification(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ verificationStatus: "rejected", updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/admin/verifications");
}
