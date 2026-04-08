"use client";

import { useState } from "react";
import { CAMPUS_INTERESTS } from "@/lib/constants/interests";
import { cn } from "@/lib/utils";
import { Check, Plus } from "lucide-react";

export function InterestsPicker({
  initial = [],
  onChange,
}: {
  initial?: string[];
  onChange: (items: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggleInterest = (item: string) => {
    let next: string[];

    if (selected.includes(item)) {
      next = selected.filter((i) => i !== item);
    } else {
      if (selected.length >= 8) return;
      next = [...selected, item];
    }

    setSelected(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-1">
        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Select Interests
        </label>
        <span
          className={cn(
            "text-[10px] font-mono font-bold px-2 py-1 rounded-full border",
            selected.length === 8
              ? "border-rose-500 text-rose-500 bg-rose-500/10"
              : "border-border text-muted-foreground",
          )}
        >
          {selected.length} / 8
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CAMPUS_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest);
          const isDisabled = !isSelected && selected.length >= 8;

          return (
            <button
              key={interest}
              type="button"
              disabled={isDisabled}
              onClick={() => toggleInterest(interest)}
              className={cn(
                "group flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 active:scale-95",
                // Selected State
                isSelected
                  ? "bg-rose-500 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-rose-400/50",
                // Disabled State (when limit reached)
                isDisabled && "opacity-40 cursor-not-allowed grayscale-[0.5]",
              )}
            >
              {isSelected ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <Plus
                  size={14}
                  className="text-muted-foreground/50 group-hover:text-rose-500"
                />
              )}
              {interest}
            </button>
          );
        })}
      </div>
    </div>
  );
}
