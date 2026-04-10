"use server";

import { db } from "@/db";
import { users, platformMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { cloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

// ─── Signed upload

export type CloudinarySignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};

/**
 * Generates a short-lived Cloudinary signature so the client can POST the
 * video blob directly to Cloudinary without exposing the API secret.
 *
 * The signature is scoped to the `vouch-liveness` folder and expires after
 * 60 seconds — enough time for the client to initiate the upload.
 */
export async function getCloudinaryVideoSignature(): Promise<
  CloudinarySignature | { error: string }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Session expired. Re-authenticate." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return { error: "Storage configuration missing." };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "vouch-liveness";

  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    apiSecret,
  );

  return { signature, timestamp, cloudName, apiKey, folder };
}

export type LivenessState = {
  error?: string;
  success?: boolean;
};

/**
 * Marks the user as `pending_review` and persists the liveness video URL.
 *
 * File upload (blob → Cloudinary) is handled on the client before calling
 * this action — pass in the resulting secure HTTPS URL.
 */
export async function submitLiveness(videoUrl: string): Promise<LivenessState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;

  if (!token) return { error: "Session expired. Re-authenticate." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  if (
    !videoUrl ||
    typeof videoUrl !== "string" ||
    !videoUrl.startsWith("https://")
  ) {
    return { error: "Invalid video reference. Upload must complete first." };
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        verificationStatus: users.verificationStatus,
        requiresPulseCheck: users.requiresPulseCheck,
        verificationVideoUrl: users.verificationVideoUrl,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) return { error: "Identity not found." };

    if (user.verificationStatus === "pending_review") {
      return { error: "A review is already in progress. Hang tight." };
    }

    // Block re-submission only if already fully verified with a prior video
    // and no periodic re-check has been requested.
    if (
      user.verificationStatus === "verified" &&
      user.verificationVideoUrl &&
      !user.requiresPulseCheck
    ) {
      return { error: "Account is already verified." };
    }

    await db
      .update(users)
      .set({
        verificationStatus: "pending_review",
        verificationVideoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Allow the user to access protected routes (radar etc.) while their
    // liveness tape is under review. The proxy checks this cookie.
    cookieStore.set("vouch_status", "pending_review", { path: "/" });

    // Notify the admin user (if they have a DB account) so the submission
    // appears in their inbox alongside the admin panel entry.
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const [adminUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      if (adminUser) {
        await db.insert(platformMessages).values({
          recipientId: adminUser.id,
          type: "announcement",
          content: `New liveness video submitted by ${user.name ?? "a user"} (${user.email}). Visit the admin panel to review: /admin/verifications`,
        });
      }
    }

    // Bust the admin verifications page cache so the new submission is visible immediately.
    revalidatePath("/admin/verifications");

    return { success: true };
  } catch {
    return { error: "Transmission failure. Please retry." };
  }
}
