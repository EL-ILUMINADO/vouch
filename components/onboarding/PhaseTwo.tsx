"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

const SOCIAL_ENERGY_OPTIONS = [
  { value: "Extrovert", label: "Extrovert 🎉" },
  { value: "Introvert", label: "Introvert 🌙" },
  { value: "Ambivert", label: "Ambivert ✨" },
];

const MAX = 80;

export function PhaseTwo() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const currentEnergy = watch("social_energy");
  const weekendActivity = watch("weekend_activity") || "";
  const happinessTrigger = watch("happiness_trigger") || "";

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">Social battery type?</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            After a long week, you need...
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_ENERGY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setValue("social_energy", option.value, {
                  shouldValidate: true,
                })
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
        {errors.social_energy && (
          <p className="text-red-500 text-xs">
            {String(errors.social_energy.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold">
              Your typical weekend looks like...
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Be specific — FIFA counts. So does hiking at 6am.
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-mono shrink-0 ml-2",
              weekendActivity.length > MAX
                ? "text-red-500 font-bold"
                : "text-muted-foreground",
            )}
          >
            {weekendActivity.length}/{MAX}
          </span>
        </div>
        <input
          {...register("weekend_activity")}
          maxLength={MAX}
          placeholder="e.g., FIFA tournaments, loud music, or just sleeping in 😅"
          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-muted-foreground/50"
        />
        {errors.weekend_activity && (
          <p className="text-red-500 text-xs">
            {String(errors.weekend_activity.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold">
              What genuinely makes you happy?
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Think small, real moments — not just &quot;traveling.&quot;
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-mono shrink-0 ml-2",
              happinessTrigger.length > MAX
                ? "text-red-500 font-bold"
                : "text-muted-foreground",
            )}
          >
            {happinessTrigger.length}/{MAX}
          </span>
        </div>
        <input
          {...register("happiness_trigger")}
          maxLength={MAX}
          placeholder="e.g., A perfectly cooked plate of jollof at 11pm 🍛"
          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-muted-foreground/50"
        />
        {errors.happiness_trigger && (
          <p className="text-red-500 text-xs">
            {String(errors.happiness_trigger.message || "")}
          </p>
        )}
      </div>
    </div>
  );
}
