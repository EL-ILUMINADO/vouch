"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

const CONFLICT_STYLE_OPTIONS = [
  { value: "Direct & Immediate", label: "Direct & Immediate 🗣️" },
  { value: "Need time to process", label: "Need time to process 🧘" },
  { value: "Avoidant (Working on it)", label: "Avoidant (Working on it) 🌱" },
];

const MAX = 80;

export function PhaseThree() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const currentConflict = watch("conflict_style");
  const dealBreakers = watch("deal_breakers") || "";
  const growthFocus = watch("growth_focus") || "";
  const relationshipVision = watch("relationship_vision") || "";

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">When things get tense...</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Knowing this now saves a lot of awkward silences later.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONFLICT_STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setValue("conflict_style", option.value, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95",
                currentConflict === option.value
                  ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-rose-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.conflict_style && (
          <p className="text-red-500 text-xs">
            {String(errors.conflict_style.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold">Hard nos for you?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              The things you know you just cannot get past.
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-mono shrink-0 ml-2",
              dealBreakers.length > MAX
                ? "text-red-500 font-bold"
                : "text-muted-foreground",
            )}
          >
            {dealBreakers.length}/{MAX}
          </span>
        </div>
        <textarea
          {...register("deal_breakers")}
          maxLength={MAX}
          placeholder="e.g., Dishonesty, lack of ambition, bad hygiene..."
          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 min-h-[80px] resize-none placeholder:text-muted-foreground/50"
        />
        {errors.deal_breakers && (
          <p className="text-red-500 text-xs">
            {String(errors.deal_breakers.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold">
              What are you actively working on?
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Growth is attractive. What are you working on right now?
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-mono shrink-0 ml-2",
              growthFocus.length > MAX
                ? "text-red-500 font-bold"
                : "text-muted-foreground",
            )}
          >
            {growthFocus.length}/{MAX}
          </span>
        </div>
        <textarea
          {...register("growth_focus")}
          maxLength={MAX}
          placeholder="e.g., Reading more, staying consistent at the gym, being more present..."
          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 min-h-[80px] resize-none placeholder:text-muted-foreground/50"
        />
        {errors.growth_focus && (
          <p className="text-red-500 text-xs">
            {String(errors.growth_focus.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold">Your relationship vision</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              What does a healthy relationship look like to you?
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-mono shrink-0 ml-2",
              relationshipVision.length > MAX
                ? "text-red-500 font-bold"
                : "text-muted-foreground",
            )}
          >
            {relationshipVision.length}/{MAX}
          </span>
        </div>
        <textarea
          {...register("relationship_vision")}
          maxLength={MAX}
          placeholder="e.g., Two people who push each other to grow while actually enjoying each other..."
          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 min-h-[80px] resize-none placeholder:text-muted-foreground/50"
        />
        {errors.relationship_vision && (
          <p className="text-red-500 text-xs">
            {String(errors.relationship_vision.message || "")}
          </p>
        )}
      </div>
    </div>
  );
}
