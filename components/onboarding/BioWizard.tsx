"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";
import { z } from "zod";
import { PhaseOne } from "./PhaseOne";
import { PhaseTwo } from "./PhaseTwo";
import { PhaseThree } from "./PhaseThree";
import { PhaseFour } from "./PhaseFour";
import { saveUserBio } from "@/app/(onboarding)/onboarding/bio/actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PHASE_CONTEXT: Record<
  number,
  { emoji: string; label: string; subtitle: string }
> = {
  1: { emoji: "💡", label: "The Basics", subtitle: "What you're looking for" },
  2: {
    emoji: "🌟",
    label: "Your Lifestyle",
    subtitle: "How you spend your time",
  },
  3: {
    emoji: "💭",
    label: "Deep Stuff",
    subtitle: "What really matters to you",
  },
  4: { emoji: "✨", label: "The Hook", subtitle: "Make them want to connect" },
};

type BioFormData = z.infer<typeof completeOnboardingSchema>;

export function BioWizard() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initialize the Master Form
  const methods = useForm<BioFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(completeOnboardingSchema as any),
    mode: "onChange",
    defaultValues: {
      gender: undefined,
      looking_for: undefined,
      intent: undefined,
      relationship_style: undefined,
      energy_vibe: undefined,
      social_energy: undefined,
      weekend_activity: "",
      happiness_trigger: "",
      lifestyle_snapshot: "",
      conflict_style: undefined,
      deal_breakers: "",
      growth_focus: "",
      relationship_vision: "",
      passion_signal: "",
      misunderstood_trait: "",
      prompt_question: undefined,
      prompt_answer: "",
      bio_headline: "",
    },
  });

  // 2. The "Smart" Next Button Logic
  const handleNext = async () => {
    let fieldsToValidate: (keyof BioFormData)[] = [];

    if (currentPhase === 1) {
      fieldsToValidate = [
        "gender",
        "looking_for",
        "intent",
        "relationship_style",
        "energy_vibe",
      ];
    } else if (currentPhase === 2) {
      fieldsToValidate = [
        "social_energy",
        "weekend_activity",
        "happiness_trigger",
        "lifestyle_snapshot",
      ];
    } else if (currentPhase === 3) {
      fieldsToValidate = [
        "conflict_style",
        "deal_breakers",
        "growth_focus",
        "relationship_vision",
      ];
    } else if (currentPhase === 4) {
      fieldsToValidate = [
        "passion_signal",
        "misunderstood_trait",
        "prompt_question",
        "prompt_answer",
        "bio_headline",
      ];
    }

    const isStepValid = await methods.trigger(fieldsToValidate);

    if (isStepValid) {
      setCurrentPhase((prev) => prev + 1);
    }
  };

  // 3. The Final Submit
  const onSubmit = async (data: BioFormData) => {
    setIsSubmitting(true);
    const result = await saveUserBio(data);
    // saveUserBio redirects to /radar on success; result only exists on error
    if (result) {
      console.error(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress Bar Container */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">
                {PHASE_CONTEXT[currentPhase].emoji}
              </span>
              <div>
                <p className="text-sm font-black text-foreground leading-none">
                  {PHASE_CONTEXT[currentPhase].label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {PHASE_CONTEXT[currentPhase].subtitle}
                </p>
              </div>
            </div>
            <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">
              {currentPhase} / 4
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-500 ease-expo"
              style={{ width: `${(currentPhase / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="pt-4 min-h-[300px]">
          {currentPhase === 1 && <PhaseOne />}
          {currentPhase === 2 && <PhaseTwo />}
          {currentPhase === 3 && <PhaseThree />}
          {currentPhase === 4 && <PhaseFour />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {currentPhase > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentPhase((p) => p - 1)}
              className="font-bold border-2"
              disabled={isSubmitting}
            >
              Back
            </Button>
          ) : (
            <div /> // Spacer
          )}

          {currentPhase < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="font-bold bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-sm shadow-rose-200 dark:shadow-none"
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-bold bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-sm shadow-rose-200 dark:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Securing...
                </>
              ) : (
                "Let's Go →"
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
