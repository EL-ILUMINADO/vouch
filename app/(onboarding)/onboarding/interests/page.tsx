"use client";

import { useState, useTransition } from "react";
import { saveInterests } from "./actions";
import { InterestsPicker } from "@/app/(onboarding)/onboarding/bio/interests-picker";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InterestsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(async () => {
      const result = await saveInterests(selected);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  const canContinue = selected.length >= 3;

  return (
    <main className="min-h-screen bg-linear-to-br from-rose-50 via-background to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose-200/25 dark:bg-rose-500/8 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Step 3 of 4
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            What are you into?
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick at least 5 interests — they shape who shows up on your radar.
          </p>
        </div>

        {/* Picker */}
        <InterestsPicker initial={[]} onChange={setSelected} />

        {/* Footer CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground">
            {canContinue
              ? `${selected.length} selected ✓`
              : `Select at least 3`}
          </span>
          <Button
            onClick={handleContinue}
            disabled={!canContinue || isPending}
            className="font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-sm shadow-rose-200 dark:shadow-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue →"
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
