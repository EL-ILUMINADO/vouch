"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UNIVERSITY_LOCATIONS } from "@/lib/constants/locations";

export type LocationState = { error?: string };

export async function saveLocation(
  _prevState: LocationState,
  formData: FormData,
): Promise<LocationState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { error: "Session expired. Re-authenticate." };

  const session = await decrypt(token);
  if (!session) return { error: "Invalid session." };

  const city = (formData.get("city") as string | null)?.trim();
  // Neighborhood is optional — saved when provided, silently omitted if not
  const neighborhood =
    (formData.get("neighborhood") as string | null)?.trim() || null;

  if (!city) return { error: "Select your city." };

  const [user] = await db
    .select({ id: users.id, university: users.university })
    .from(users)
    .where(eq(users.id, session.userId as string))
    .limit(1);

  if (!user) return { error: "Identity not found." };

  const uniCities = UNIVERSITY_LOCATIONS[user.university];
  if (!uniCities)
    return { error: "No location data available for your university." };

  const cityConfig = uniCities.find((c) => c.id === city);
  if (!cityConfig) return { error: "Invalid city selection." };

  // Only check the list when the city doesn't allow free-text input.
  // allowsCustomInput cities have "Other" as an escape hatch, so any value is valid.
  if (
    neighborhood &&
    !cityConfig.allowsCustomInput &&
    !cityConfig.neighborhoods.includes(neighborhood)
  ) {
    return { error: "Invalid neighborhood selection." };
  }

  await db
    .update(users)
    .set({ city, neighborhood })
    .where(eq(users.id, user.id));

  const mode = formData.get("mode") as string | null;

  if (mode === "update") {
    redirect("/radar");
  } else {
    redirect("/onboarding/verify");
  }
}
