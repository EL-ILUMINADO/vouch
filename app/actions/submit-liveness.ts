"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { cloudinary } from "@/lib/cloudinary";

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
      .select({ id: users.id, verificationStatus: users.verificationStatus })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) return { error: "Identity not found." };

    if (user.verificationStatus === "verified") {
      return { error: "Account is already verified." };
    }

    if (user.verificationStatus === "pending_review") {
      return { error: "A review is already in progress. Hang tight." };
    }

    await db
      .update(users)
      .set({
        verificationStatus: "pending_review",
        verificationVideoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch {
    return { error: "Transmission failure. Please retry." };
  }
}
