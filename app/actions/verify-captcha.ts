"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";

function campusJitter(center: { lat: number; lng: number }) {
  const distKm = 0.6 + Math.random() * 0.5;
  const angle = Math.random() * 2 * Math.PI;
  return {
    lat: center.lat + (distKm / 111.0) * Math.cos(angle),
    lng:
      center.lng +
      (distKm / (111.0 * Math.cos((center.lat * Math.PI) / 180))) *
        Math.sin(angle),
  };
}

export type CaptchaVerifyResult =
  | { success: true }
  | { error: string; lockedUntil?: string };

/**
 * Called when the user completes (or exhausts) the Hyper-Captcha Culture Check.
 *
 * - `passed: true`  → marks the user as "verified"
 * - `passed: false` → records a 24-hour lockout timestamp so the check cannot
 *                     be brute-forced; status becomes "rejected" until the
 *                     lockout expires, at which point the client can retry.
 */
export async function verifyCaptcha(
  passed: boolean,
): Promise<CaptchaVerifyResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Session expired. Re-authenticate." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  try {
    const [user] = await db
      .select({
        id: users.id,
        university: users.university,
        verificationStatus: users.verificationStatus,
        captchaLockedUntil: users.captchaLockedUntil,
        latitude: users.latitude,
        longitude: users.longitude,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) return { error: "Identity not found." };

    if (user.verificationStatus === "verified") {
      return { error: "Account is already verified." };
    }

    // Guard: reject if still within a lockout window
    if (user.captchaLockedUntil && user.captchaLockedUntil > new Date()) {
      return {
        error: "Too many failed attempts.",
        lockedUntil: user.captchaLockedUntil.toISOString(),
      };
    }

    if (passed) {
      // Culture check confirms campus knowledge — record the method but do NOT
      // mark the user as "verified". Liveness video + admin review does that.
      // The user continues onboarding: photos → interests → bio → liveness.

      // Seed lat/lng so the user appears on Radar (GPS verification was removed).
      // Jitter within 0.6–1.1 km of campus center: keeps each user at a distinct
      // visual ring position rather than collapsing everyone to distance 0.
      const uniCenter = SUPPORTED_UNIVERSITIES.find(
        (u) => u.id === user.university,
      )?.coordinates;

      const jitteredCoords =
        uniCenter && !user.latitude && !user.longitude
          ? campusJitter(uniCenter)
          : null;

      await db
        .update(users)
        .set({
          verificationMethod: "culture_check",
          captchaLockedUntil: null,
          ...(jitteredCoords
            ? { latitude: jitteredCoords.lat, longitude: jitteredCoords.lng }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return { success: true };
    } else {
      // All 3 attempts exhausted — impose a 24-hour cooldown
      const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db
        .update(users)
        .set({
          verificationStatus: "rejected",
          captchaLockedUntil: lockedUntil,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        error: "Verification failed. You are locked out for 24 hours.",
        lockedUntil: lockedUntil.toISOString(),
      };
    }
  } catch {
    return { error: "Transmission failure. Please retry." };
  }
}
