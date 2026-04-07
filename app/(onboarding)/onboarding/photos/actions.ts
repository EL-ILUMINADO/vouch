"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cloudinary } from "@/lib/cloudinary";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/login");
  const session = await decrypt(token);
  if (!session) redirect("/login");
  return session.userId;
}

export async function uploadAndSavePhotos(
  userId: string,
  base64Images: string[],
) {
  try {
    const uploadPromises = base64Images.map((base64) =>
      cloudinary.uploader.upload(base64, {
        folder: "vouch-images",
        resource_type: "image",
      }),
    );

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map((res) => res.secure_url);

    // Update the user profile with the new URLs
    await db
      .update(users)
      .set({ images: imageUrls })
      .where(eq(users.id, userId));

    return { success: true, urls: imageUrls };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return { success: false, error: "Failed to store images." };
  }
}
