"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { curateBioHeadline } from "@/app/(onboarding)/onboarding/bio/ai-action";
import { PROMPT_QUESTIONS } from "@/lib/validations/onboarding";

const MAX = 80;
const PROMPT_MAX = 120;

export function PhaseFour() {
  const {
    register,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext();
  const [isCurating, setIsCurating] = useState(false);

  const passionSignal = watch("passion_signal") || "";
  const misunderstoodTrait = watch("misunderstood_trait") || "";
  const promptQuestion = watch("prompt_question");
  const promptAnswer = watch("prompt_answer") || "";
  const bioHeadline = watch("bio_headline") || "";

  const handleCurate = async () => {
    setIsCurating(true);
    const formVals = getValues();
    const result = await curateBioHeadline(formVals);
    setIsCurating(false);

    if (result.headline) {
      setValue("bio_headline", result.headline, { shouldValidate: true });
      toast.success(
        "Bio generated! Feel free to run it again for a different take.",
      );
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold">
              I could talk for hours about...
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your niche obsession is probably your best icebreaker.
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-mono shrink-0 ml-2",
              passionSignal.length > MAX
                ? "text-red-500 font-bold"
                : "text-muted-foreground",
            )}
          >
            {passionSignal.length}/{MAX}
          </span>
        </div>
        <input
          {...register("passion_signal")}
          maxLength={MAX}
          placeholder="e.g., Astrophysics, 90s hip-hop, F1 strategy, sourdough bread..."
          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-muted-foreground/50"
        />
        {errors.passion_signal && (
          <p className="text-red-500 text-xs">
            {String(errors.passion_signal.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold">
              People tend to misread me as...
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              The first impression that does not quite capture you?
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-mono shrink-0 ml-2",
              misunderstoodTrait.length > MAX
                ? "text-red-500 font-bold"
                : "text-muted-foreground",
            )}
          >
            {misunderstoodTrait.length}/{MAX}
          </span>
        </div>
        <input
          {...register("misunderstood_trait")}
          maxLength={MAX}
          placeholder="e.g., Intimidating, when really I'm just in my head..."
          className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-muted-foreground/50"
        />
        {errors.misunderstood_trait && (
          <p className="text-red-500 text-xs">
            {String(errors.misunderstood_trait.message || "")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">Pick a prompt</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            This shows on your profile card — make it a conversation starter.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() =>
                setValue("prompt_question", q, { shouldValidate: true })
              }
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 text-left",
                promptQuestion === q
                  ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                  : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-rose-300",
              )}
            >
              {q}
            </button>
          ))}
        </div>
        {errors.prompt_question && (
          <p className="text-red-500 text-xs">
            {String(errors.prompt_question.message || "")}
          </p>
        )}
        {promptQuestion && (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-end">
              <p className="text-sm font-bold text-rose-500">
                {promptQuestion}
              </p>
              <span
                className={cn(
                  "text-xs font-mono shrink-0 ml-2",
                  promptAnswer.length > PROMPT_MAX
                    ? "text-red-500 font-bold"
                    : "text-muted-foreground",
                )}
              >
                {promptAnswer.length}/{PROMPT_MAX}
              </span>
            </div>
            <input
              {...register("prompt_answer")}
              maxLength={PROMPT_MAX}
              placeholder="Your answer..."
              className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-muted-foreground/50"
            />
            {errors.prompt_answer && (
              <p className="text-red-500 text-xs">
                {String(errors.prompt_answer.message || "")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-black">Your bio headline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Let AI craft something from everything you shared. Regenerate as
            many times as you want.
          </p>
        </div>

        {/* Hidden input for React Hook Form */}
        <input type="hidden" {...register("bio_headline")} />

        <div className="flex flex-col gap-3">
          <div
            className={cn(
              "w-full border-2 rounded-xl p-4 min-h-[72px] flex items-center justify-center text-center transition-colors",
              bioHeadline
                ? "bg-rose-500/8 border-rose-400/25"
                : "bg-muted/40 border-dashed border-border",
            )}
          >
            {bioHeadline ? (
              <span className="text-base font-bold text-foreground leading-relaxed">
                {bioHeadline}
              </span>
            ) : (
              <span className="text-sm font-medium text-muted-foreground/50 italic">
                Hit the button below — AI will write this from your answers.
              </span>
            )}
          </div>

          <Button
            type="button"
            onClick={handleCurate}
            disabled={isCurating}
            className="w-full py-6 font-black uppercase tracking-widest gap-2 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 transition-all active:scale-95"
          >
            {isCurating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Writing your bio...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {bioHeadline ? "Regenerate Bio" : "Generate My Bio"}
              </>
            )}
          </Button>
        </div>

        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-center">
          Powered by Gemini AI
        </p>
        {errors.bio_headline && (
          <p className="text-red-500 text-xs text-center">
            {String(errors.bio_headline.message || "")}
          </p>
        )}
      </div>
    </div>
  );
}
