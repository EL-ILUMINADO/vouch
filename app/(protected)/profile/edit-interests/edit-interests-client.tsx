"use client";

import { useState, useTransition } from "react";
import { InterestsPicker } from "@/app/(onboarding)/onboarding/bio/interests-picker";
import { Button } from "@/components/ui/button";
import { updateInterests } from "@/app/(protected)/profile/actions";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  currentInterests: string[];
}

export function EditInterestsClient({ currentInterests }: Props) {
  const [selected, setSelected] = useState<string[]>(currentInterests);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canSave = selected.length >= 3;

  function handleSave() {
    startTransition(async () => {
      const result = await updateInterests(selected);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Interests updated!");
        router.push("/profile");
      }
    });
  }

  return (
    <main className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to profile
          </Link>
          <h1 className="text-2xl font-black tracking-tight">
            Edit Your Interests
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick at least 3 interests — they shape who shows up on your radar.
          </p>
        </div>

        {/* Picker */}
        <InterestsPicker initial={currentInterests} onChange={setSelected} />

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground">
            {canSave
              ? `${selected.length} selected`
              : "Select at least 3 interests"}
          </span>
          <Button
            onClick={handleSave}
            disabled={!canSave || isPending}
            className="font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-sm shadow-rose-200 dark:shadow-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save interests"
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
