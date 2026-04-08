"use client";

import * as React from "react";
import { X, MessageCircle, ShieldCheck, Loader2 } from "lucide-react";
import { useRadarPing as radarPing } from "./actions";

interface SignalDetailsProps {
  signal: {
    id: string;
    name: string;
    department: string;
    level: string;
    distance: number;
  } | null;
  onClose: () => void;
  currentUserId: string;
}

export function SignalDetails({
  signal,
  onClose,
  currentUserId,
}: SignalDetailsProps) {
  const [isPinging, setIsPinging] = React.useState(false);

  if (!signal) return null;

  const handlePing = async () => {
    try {
      setIsPinging(true);
      await radarPing(currentUserId, signal.id);
    } catch (error) {
      console.error(error);
      setIsPinging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
      {/* The Modal Card */}
      <div className="w-full max-w-[320px] bg-card rounded-[2rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Banner & Avatar */}
        <div className="relative h-24 bg-rose-50 dark:bg-rose-900/20 flex justify-center">
          <button
            onClick={onClose}
            disabled={isPinging}
            className="absolute top-4 right-4 p-2 bg-card/60 hover:bg-card rounded-full backdrop-blur-md transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Avatar Bubble overlapping the banner */}
          <div className="absolute -bottom-10 w-20 h-20 bg-card rounded-full p-1.5">
            <div className="w-full h-full bg-linear-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-md">
              {signal.name[0]}
            </div>
          </div>
        </div>

        {/* Identity Info */}
        <div className="pt-14 pb-6 px-6 text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {signal.name}
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span>{signal.department}</span>
              <span>•</span>
              <span>{signal.level || "100L"}</span>
            </div>
          </div>

          {/* Context Badges */}
          <div className="flex justify-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-full text-[10px] font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse" />
              {signal.distance.toFixed(2)} KM
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Vouched
            </div>
          </div>
        </div>

        {/* Action Buttons - Stacked to show the cost */}
        <div className="p-4 bg-muted/50 border-t border-border flex flex-col gap-3">
          <button
            onClick={handlePing}
            disabled={isPinging}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {isPinging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-4 h-4 fill-white/20" />
                Direct Connect
              </>
            )}
          </button>

          {/* Sub-text reminding them of the cost */}
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Costs 1 Radar Ping
            </span>
            <button
              onClick={onClose}
              disabled={isPinging}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
