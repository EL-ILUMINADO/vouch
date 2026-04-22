"use server";

import { db } from "@/db";
import { users, platformMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adjustTrustScore, TRUST_DELTAS } from "@/lib/trust-score";
import { pusherServer } from "@/lib/pusher-server";

export async function approveVerification(
  userId: string,
): Promise<{ error?: string }> {
  try {
    await db
      .update(users)
      .set({
        verificationStatus: "verified",
        requiresPulseCheck: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await adjustTrustScore(userId, TRUST_DELTAS.VERIFICATION_APPROVED);

    const [msg] = await db
      .insert(platformMessages)
      .values({
        recipientId: userId,
        type: "announcement",
        content:
          "You're verified. ✅\n\nYour identity has been confirmed — you now have full access to Vouch. Start connecting, liking, and discovering people near you on campus.\n\nWelcome to the network.",
      })
      .returning();

    await pusherServer.trigger(`user-${userId}`, "platform-message", {
      id: msg.id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt,
    });

    revalidatePath("/admin/verifications");
    return {};
  } catch (err) {
    console.error("[approveVerification]", err);
    return { error: "Failed to approve. Please try again." };
  }
}

export async function rejectVerification(
  userId: string,
): Promise<{ error?: string }> {
  try {
    await db
      .update(users)
      .set({ verificationStatus: "rejected", updatedAt: new Date() })
      .where(eq(users.id, userId));

    const [msg] = await db
      .insert(platformMessages)
      .values({
        recipientId: userId,
        type: "announcement",
        content:
          "Verification unsuccessful. ❌\n\nWe weren't able to confirm your identity from the submitted clip. This can happen if the video was unclear, too dark, or didn't match the instructions.\n\nYou can re-submit a new liveness check from your profile. Make sure you're in good lighting and follow the on-screen prompts carefully.",
      })
      .returning();

    await pusherServer.trigger(`user-${userId}`, "platform-message", {
      id: msg.id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt,
    });

    revalidatePath("/admin/verifications");
    return {};
  } catch (err) {
    console.error("[rejectVerification]", err);
    return { error: "Failed to reject. Please try again." };
  }
}
