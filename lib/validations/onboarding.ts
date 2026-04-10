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
  gender: z.enum(["Man", "Woman", "Non-binary"], {
    message: "Select your gender.",
  }),
  looking_for: z.enum(["Men", "Women", "Everyone"], {
    message: "Select who you're looking for.",
  }),
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
  lifestyle_snapshot: strictVouchText,
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
  relationship_vision: strictVouchText,
});

const PROMPT_QUESTIONS = [
  "The most spontaneous thing I've done is...",
  "You'll win me over if you...",
  "A green flag I look for is...",
  "Hot take:",
  "My version of a perfect Sunday is...",
  "I'll know we're a match if...",
  "The thing I'm most proud of is...",
  "Two truths and a lie:",
  "Change my mind:",
  "I'd describe myself as...",
] as const;

export { PROMPT_QUESTIONS };

// Phase 4: The Hook (Text)
export const phaseFourSchema = z.object({
  passion_signal: strictVouchText,
  misunderstood_trait: strictVouchText,
  prompt_question: z.enum(PROMPT_QUESTIONS, { message: "Pick a prompt." }),
  prompt_answer: strictVouchText,
  bio_headline: z.string().min(10, "Bio too short.").max(1200, "Bio too long."), // AI-generated, no regex restrictions
});

// The Master Schema (Used by the final Server Action to save everything)
export const completeOnboardingSchema = phaseOneSchema
  .merge(phaseTwoSchema)
  .merge(phaseThreeSchema)
  .merge(phaseFourSchema);
