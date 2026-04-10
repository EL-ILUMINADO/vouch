"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = [
  { value: "Man", label: "Man 👨" },
  { value: "Woman", label: "Woman 👩" },
  { value: "Non-binary", label: "Non-binary 🌈" },
];

const LOOKING_FOR_OPTIONS = [
  { value: "Men", label: "Men 👨" },
  { value: "Women", label: "Women 👩" },
  { value: "Everyone", label: "Everyone 💫" },
];

const INTENT_OPTIONS = [
  { value: "Long-term", label: "Long-term 💍" },
  { value: "Short-term", label: "Short-term 🌱" },
  { value: "Casual/Friends", label: "Casual / Friends 🤝" },
  { value: "Networking", label: "Networking 💼" },
  { value: "Not sure", label: "Not sure yet 🤷" },
];

const RELATIONSHIP_STYLE_OPTIONS = [
  { value: "Traditional", label: "Traditional 💫" },
  { value: "Modern/Equal", label: "Modern & Equal ⚖️" },
  { value: "Independent", label: "Independent 🦅" },
  { value: "Still figuring it out", label: "Still figuring it out 🧩" },
];

const ENERGY_VIBE_OPTIONS = [
  { value: "Highly Spontaneous", label: "Spontaneous ⚡" },
  { value: "Calculated & Planned", label: "Planned & Intentional 📋" },
  { value: "A bit of both", label: "A bit of both 🌊" },
];

export function PhaseOne() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const currentGender = watch("gender");
  const currentLookingFor = watch("looking_for");
  const currentIntent = watch("intent");
  const currentStyle = watch("relationship_style");
  const currentEnergy = watch("energy_vibe");

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">I identify as...</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setValue("gender", option.value, { shouldValidate: true })
              }
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95",
                currentGender === option.value
                  ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-rose-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="text-red-500 text-xs">
            {String(errors.gender.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">I&apos;m interested in...</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setValue("looking_for", option.value, { shouldValidate: true })
              }
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95",
                currentLookingFor === option.value
                  ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-rose-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.looking_for && (
          <p className="text-red-500 text-xs">
            {String(errors.looking_for.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">What are you looking for?</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            No judgment — just honesty.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setValue("intent", option.value, { shouldValidate: true })
              }
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95",
                currentIntent === option.value
                  ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-rose-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.intent && (
          <p className="text-red-500 text-xs">
            {String(errors.intent.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">Relationship style?</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            How would you describe the dynamic you thrive in?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setValue("relationship_style", option.value, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95",
                currentStyle === option.value
                  ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-rose-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.relationship_style && (
          <p className="text-red-500 text-xs">
            {String(errors.relationship_style.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">Day-to-day energy?</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Planner or go-with-the-flow? Or somewhere in between?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ENERGY_VIBE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setValue("energy_vibe", option.value, { shouldValidate: true })
              }
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95",
                currentEnergy === option.value
                  ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-rose-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.energy_vibe && (
          <p className="text-red-500 text-xs">
            {String(errors.energy_vibe.message || "")}
          </p>
        )}
      </div>
    </div>
  );
}
