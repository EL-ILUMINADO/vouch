"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";
import { checkUniversityProximity } from "@/lib/utils/geo";
import { redirect } from "next/navigation";

export type GeoState = {
  error?: string;
  success?: boolean;
};

/**
 * Verifies that the user's GPS fix is within their university's boundaries.
 *
 * @param lat      - WGS-84 latitude reported by the browser
 * @param lng      - WGS-84 longitude reported by the browser
 * @param accuracyM - Horizontal accuracy radius in metres as reported by the
 *                    browser's Geolocation API (position.coords.accuracy).
 *                    The server adds this value (capped at 1 500 m) to each
 *                    zone radius before the distance check, so a user whose
 *                    phone GPS is drifted by 300 m is not falsely rejected.
 */
export async function verifyLocation(
  lat: number,
  lng: number,
  accuracyM: number,
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

    const result = checkUniversityProximity(lat, lng, accuracyM, uniConfig);

    if (!result.within) {
      const distanceStr = result.distanceKm.toFixed(2);
      const radiusStr = result.effectiveRadiusKm.toFixed(2);
      const accuracyStr = Math.round(result.accuracyUsedM);
      return {
        error:
          `Outside ${uniConfig.name} boundaries. ` +
          `Closest zone: ${result.closestZoneLabel}. ` +
          `Distance: ${distanceStr} km — allowed: ${radiusStr} km ` +
          `(includes ${accuracyStr} m GPS tolerance). ` +
          `Move to an open area for a better GPS fix and try again.`,
      };
    }

    // GPS check confirms the user is physically on campus — store the fix and
    // method, but do NOT mark them as "verified" yet. Liveness review by the
    // admin is what grants full verification. The user continues onboarding.
    await db
      .update(users)
      .set({
        verificationMethod: "gps",
        latitude: lat,
        longitude: lng,
      })
      .where(eq(users.id, user.id));
  } catch {
    return { error: "Telemetry failure. Retry." };
  }

  redirect("/onboarding/photos");
}
