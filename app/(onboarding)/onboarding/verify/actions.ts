"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";
import { calculateDistance } from "@/lib/utils/geo";
import { redirect } from "next/navigation";
import { z } from "zod";

export type GeoState = {
  error?: string;
  success?: boolean;
};

export async function verifyLocation(
  lat: number,
  lng: number,
): Promise<GeoState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;

  if (!token) return { error: "Session expired. Re-authenticate." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) return { error: "Identity not found." };

    const uniConfig = SUPPORTED_UNIVERSITIES.find(
      (u) => u.id === user.university,
    );
    if (!uniConfig) return { error: "University sector not recognized." };

    const distance = calculateDistance(
      lat,
      lng,
      uniConfig.coordinates.lat,
      uniConfig.coordinates.lng,
    );

    if (distance > uniConfig.radiusKm) {
      return {
        error: `Outside ${uniConfig.name} boundaries. Distance: ${distance.toFixed(2)}km. Required: within ${uniConfig.radiusKm}km.`,
      };
    }

    // Store coordinates alongside verification status so the radar
    // can calculate distances relative to the user's actual position.
    await db
      .update(users)
      .set({
        verificationStatus: "verified",
        verificationMethod: "gps",
        latitude: lat,
        longitude: lng,
      })
      .where(eq(users.id, user.id));

    cookieStore.set("vouch_status", "verified", { path: "/" });
  } catch {
    return { error: "Telemetry failure. Retry." };
  }

  redirect("/onboarding/photos");
}

const documentSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size < 5_000_000, "File must be under 5MB."),
});

export async function verifyDocument(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const file = formData.get("document") as File;

  if (!file || file.size === 0) {
    return { error: "No document detected in uplink." };
  }

  try {
    // Validate schema before any processing
    documentSchema.parse({ file });

    // Simulate OCR processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // TODO: Implement actual OCR text extraction.
    // Logic: Look for university name and current academic session.

    return {
      error: "OCR Analysis: Manual review required. Sector admin notified.",
    };
  } catch {
    return { error: "Uplink failure during document transmission." };
  }
}
