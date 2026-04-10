"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

interface BioData {
  gender?: string;
  looking_for?: string;
  intent?: string;
  relationship_style?: string;
  energy_vibe?: string;
  social_energy?: string;
  weekend_activity?: string;
  happiness_trigger?: string;
  lifestyle_snapshot?: string;
  conflict_style?: string;
  deal_breakers?: string;
  growth_focus?: string;
  relationship_vision?: string;
  passion_signal?: string;
  misunderstood_trait?: string;
  prompt_question?: string;
  prompt_answer?: string;
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
        gender: data.gender,
        lookingFor: data.looking_for,
        bio: data.bio_headline,
        intent: data.intent,
        relationship_style: data.relationship_style,
        energy_vibe: data.energy_vibe,
        social_energy: data.social_energy,
        conflict_style: data.conflict_style,
        deal_breakers: data.deal_breakers,
        lifestyle_snapshot: data.lifestyle_snapshot,
        relationship_vision: data.relationship_vision,
        bio_headline: data.bio_headline,
        prompt_question: data.prompt_question,
        prompt_answer: data.prompt_answer,
        onboarding_answers: data,
      })
      .where(eq(users.id, session.userId as string));
  } catch {
    return { success: false, error: "Failed to update profile identity." };
  }

  const { redirect } = await import("next/navigation");
  redirect("/onboarding/liveness");
}
