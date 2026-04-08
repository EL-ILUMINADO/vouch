"use server";

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface FormPayload {
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
}

export async function curateBioHeadline(formData: FormPayload) {
  if (!process.env.GROQ_API_KEY)
    return { error: "GROQ_API_KEY missing from environment." };

  const prompt = `Write a warm, personal, first-person dating app bio paragraph for someone with this profile.

Rules:
- First-person ("I"), 100–150 words, single paragraph
- No bullet points, no headers, no lists
- Use commas instead of dashes
- Sound genuine and attractive, like a real person
- Only output the bio paragraph, nothing else

Profile:
Looking for: ${formData.intent || "something meaningful"}
Style: ${formData.relationship_style || "flexible"}
Vibe: ${formData.energy_vibe || "balanced"}
Social: ${formData.social_energy || "ambivert"}
Weekend: ${formData.weekend_activity || "relaxing"}
Happy when: ${formData.happiness_trigger || "good moments"}
Conflict: ${formData.conflict_style || "direct"}
Deal breakers: ${formData.deal_breakers || "dishonesty"}
Working on: ${formData.growth_focus || "self-improvement"}
Passion: ${formData.passion_signal || "life"}
Misunderstood as: ${formData.misunderstood_trait || "reserved"}

Bio:`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 350,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const clean = raw.replace(/^["']|["']$/g, "").trim();

    if (!clean) return { error: "Failed to generate bio." };

    return { headline: clean };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: `Generation failed: ${message}` };
  }
}
