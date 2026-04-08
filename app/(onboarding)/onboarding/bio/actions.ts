"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

interface BioData {
  intent?: string;
  relationship_style?: string;
  energy_vibe?: string;
  social_energy?: string;
  weekend_activity?: string;
  happiness_trigger?: string;
  conflict_style?: string;
  deal_breakers?: string;
  growth_focus?: string;
  passion_signal?: string;
  misunderstood_trait?: string;
  bio_headline?: string;
  [key: string]: unknown;
}

export async function saveUserBio(data: BioData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return { success: false, error: "Session expired." };
  const session = await decrypt(token);
  if (!session) return { success: false, error: "Invalid session." };

  try {
    await db
      .update(users)
      .set({
        intent: data.intent,
        social_energy: data.social_energy,
        energy_vibe: data.energy_vibe,
        conflict_style: data.conflict_style,
        deal_breakers: data.deal_breakers,
        bio_headline: data.bio_headline,
        onboarding_answers: data,
      })
      .where(eq(users.id, session.userId as string));
  } catch {
    return { success: false, error: "Failed to update profile identity." };
  }

  const { redirect } = await import("next/navigation");
  redirect("/radar");
}
