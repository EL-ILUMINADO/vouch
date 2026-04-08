// lib/validations/onboarding.ts
import { z } from "zod";
import { validateBioPrompt } from "../validations";

const strictVouchText = z
  .string()
  .min(2, "Answer is too short.")
  .superRefine((val, ctx) => {
    const check = validateBioPrompt(val);
    if (!check.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: check.error,
      });
    }
  });

export const phaseOneSchema = z.object({
  intent: z.enum([
    "Long-term",
    "Short-term",
    "Casual/Friends",
    "Networking",
    "Not sure",
  ]),
  relationship_style: z.enum([
    "Traditional",
    "Modern/Equal",
    "Independent",
    "Still figuring it out",
  ]),
  energy_vibe: z.enum([
    "Highly Spontaneous",
    "Calculated & Planned",
    "A bit of both",
  ]),
});

// Phase 2: Daily Pulse (Text + Dropdowns)
export const phaseTwoSchema = z.object({
  social_energy: z.enum(["Extrovert", "Introvert", "Ambivert"]),
  weekend_activity: strictVouchText,
  happiness_trigger: strictVouchText,
});

// Phase 3: Core Values (Text)
export const phaseThreeSchema = z.object({
  conflict_style: z.enum([
    "Direct & Immediate",
    "Need time to process",
    "Avoidant (Working on it)",
  ]),
  deal_breakers: strictVouchText,
  growth_focus: strictVouchText,
});

// Phase 4: The Hook (Text)
export const phaseFourSchema = z.object({
  passion_signal: strictVouchText,
  misunderstood_trait: strictVouchText,
  bio_headline: z.string().min(10, "Bio too short.").max(1200, "Bio too long."), // AI-generated, no regex restrictions
});

// The Master Schema (Used by the final Server Action to save everything)
export const completeOnboardingSchema = phaseOneSchema
  .merge(phaseTwoSchema)
  .merge(phaseThreeSchema)
  .merge(phaseFourSchema);
