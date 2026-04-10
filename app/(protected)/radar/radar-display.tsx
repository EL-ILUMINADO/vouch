"use client";

import * as React from "react";
import { RadarSignalItem } from "./radar-signal";
import { SignalDetails } from "./signal-details";
import { ThemeToggle } from "@/components/theme-toggle";
import { RadarSignal } from "@/types/radar";

interface RadarDisplayProps {
  signals: RadarSignal[];
  carouselSignals: RadarSignal[];
  isPending?: boolean;
}

export function RadarDisplay({
  signals,
  carouselSignals,
  isPending,
}: RadarDisplayProps) {
  const [selectedSignal, setSelectedSignal] =
    React.useState<RadarSignal | null>(null);

  // Matches RADAR_MAX_KM in lib/constants/universities.ts
  const radarRange = 1.5;
  const totalSignals = signals.length;
  const angleStep = totalSignals > 0 ? 360 / totalSignals : 0;

  // We explicitly return a RadarSignal array to keep 'hideLevel' alive
  const processedSignals: RadarSignal[] = signals.map((signal, index) => ({
    ...signal,
    angle: index * angleStep,
  }));

  return (
    <div className="relative flex flex-col h-[calc(100dvh-4rem)] overflow-hidden pt-8 bg-background">
      {/* Sticky UI */}
      <div className="absolute top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="bg-rose-500 text-white px-4 py-1.5 rounded-full shadow-md">
          <p className="text-[10px] font-black uppercase tracking-widest">
            {totalSignals} Active Signals
          </p>
        </div>
        <div className="bg-card/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border shadow-sm">
          <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">
            Range: {radarRange.toFixed(1)} KM
          </p>
        </div>
      </div>

      {/* The Radar Map */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
        <div className="relative w-full h-full max-w-[500px] max-h-[500px] flex items-center justify-center">
          {[0.5, 1.0, 1.5].map((dist) => (
            <div
              key={dist}
              className={`absolute border rounded-full pointer-events-none flex items-center justify-center
                ${dist === 0.5 ? "border-red-500/20 border-dashed bg-red-500/2" : "border-border/50"}`}
              style={{
                width: `${(dist / radarRange) * 100}%`,
                height: `${(dist / radarRange) * 100}%`,
              }}
            >
              {dist === 0.5 && (
                <span className="text-[8px] font-black text-red-500/30 uppercase tracking-tighter">
                  Safe Zone
                </span>
              )}
            </div>
          ))}

          <div className="absolute inset-0 animate-radar-sweep pointer-events-none z-10 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-linear-to-r from-rose-500/15 to-transparent origin-right" />
          </div>

          <div className="relative z-30 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 shadow-lg" />

          {processedSignals.map((signal) => (
            <RadarSignalItem
              key={signal.id}
              signal={signal}
              radarRange={radarRange}
              onClick={() => setSelectedSignal(signal)}
            />
          ))}
        </div>
      </div>

      {/* Synced Carousel */}
      <div className="flex-none w-full border-t border-border bg-card/30 backdrop-blur-xl">
        <div className="flex gap-3 overflow-x-auto py-6 px-4 scrollbar-hide snap-x">
          {carouselSignals.map((signal) => (
            <button
              key={signal.id}
              onClick={() => setSelectedSignal(signal)}
              className="shrink-0 w-[240px] snap-center bg-card p-4 rounded-3xl border border-border text-left hover:border-rose-400 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white font-black text-lg">
                  {signal.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{signal.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-black truncate">
                    {signal.department}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SignalDetails
        signal={selectedSignal}
        isPending={isPending}
        onClose={() => setSelectedSignal(null)}
      />
    </div>
  );
}
