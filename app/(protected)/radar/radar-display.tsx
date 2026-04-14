"use client";

import * as React from "react";
import { RadarSignalItem } from "./radar-signal";
import { SignalDetails } from "./signal-details";
import { ThemeToggle } from "@/components/theme-toggle";
import type { RadarSignal, RadarRequestState } from "@/types/radar";
import { getPresenceLabel } from "@/lib/utils/presence";

interface RadarDisplayProps {
  signals: RadarSignal[];
  carouselSignals: RadarSignal[];
  isPending?: boolean;
  remainingPings: number;
  /** Map of signalId → current request state between me and that user. */
  requestStates: Record<string, RadarRequestState>;
}

export function RadarDisplay({
  signals,
  carouselSignals,
  isPending,
  remainingPings,
  requestStates,
}: RadarDisplayProps) {
  const [selectedSignal, setSelectedSignal] =
    React.useState<RadarSignal | null>(null);

  // Optimistic local overrides — updated immediately when a ping is sent so
  // the UI reflects "Request Sent" without waiting for a server round-trip.
  const [localOverrides, setLocalOverrides] = React.useState<
    Record<string, RadarRequestState>
  >({});

  const getRequestState = (signalId: string): RadarRequestState =>
    localOverrides[signalId] ?? requestStates[signalId] ?? { type: "none" };

  const handleRequestSent = (signalId: string) => {
    setLocalOverrides((prev) => ({ ...prev, [signalId]: { type: "sent" } }));
  };

  // Matches RADAR_MAX_KM in lib/constants/universities.ts
  const radarRange = 1.5;
  const totalSignals = signals.length;
  const angleStep = totalSignals > 0 ? 360 / totalSignals : 0;

  const processedSignals: RadarSignal[] = signals.map((signal, index) => ({
    ...signal,
    angle: index * angleStep,
  }));

  // Carousel sorted closest-first so the most relevant signals lead.
  const sortedCarousel = [...carouselSignals].sort(
    (a, b) => a.distance - b.distance,
  );

  // Count incoming requests for the highlight ring on radar dots.
  const hasIncoming = (signalId: string) =>
    getRequestState(signalId).type === "received";

  return (
    <div className="relative flex flex-col h-[calc(100dvh-4rem)] overflow-hidden pt-8 bg-background">
      {/* Sticky UI */}
      <div className="absolute top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="bg-rose-500 text-white px-4 py-1.5 rounded-full shadow-md">
          <p className="text-[10px] font-black uppercase tracking-widest">
            {totalSignals} Active Signal{totalSignals !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-card/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border shadow-sm">
          <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">
            Range: {radarRange.toFixed(1)} KM
          </p>
        </div>
        <div
          className={`px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${
            remainingPings <= 2
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
              : "bg-card/90 border-border"
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-widest ${
              remainingPings <= 2
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}
          >
            {remainingPings} Ping{remainingPings !== 1 ? "s" : ""} Left
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
              isSelected={selectedSignal?.id === signal.id}
              hasIncomingRequest={hasIncoming(signal.id)}
              onClick={() => setSelectedSignal(signal)}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {totalSignals === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2 opacity-40">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              No signals in range
            </p>
            <p className="text-[10px] text-muted-foreground">
              Move closer to campus or check back later
            </p>
          </div>
        </div>
      )}

      {/* Carousel — sorted by distance */}
      {sortedCarousel.length > 0 && (
        <div className="flex-none w-full border-t border-border bg-card/30 backdrop-blur-xl">
          <div className="flex gap-3 overflow-x-auto py-6 px-4 scrollbar-hide snap-x">
            {sortedCarousel.map((signal) => {
              const state = getRequestState(signal.id);
              return (
                <button
                  key={signal.id}
                  onClick={() => setSelectedSignal(signal)}
                  className={`shrink-0 w-[240px] snap-center bg-card p-4 rounded-3xl border text-left transition-all group shadow-sm ${
                    state.type === "received"
                      ? "border-rose-400 dark:border-rose-500"
                      : selectedSignal?.id === signal.id
                        ? "border-rose-300 dark:border-rose-700"
                        : "border-border hover:border-rose-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white font-black text-lg">
                        {signal.name[0]}
                      </div>
                      {state.type === "received" && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-background animate-pulse" />
                      )}
                      {state.type === "sent" && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{signal.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-black truncate">
                        {signal.department}
                      </p>
                      {(() => {
                        const { isOnline, label } = getPresenceLabel(
                          signal.lastActiveAt ?? null,
                        );
                        return (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isOnline
                                  ? "bg-green-500"
                                  : "bg-muted-foreground/40"
                              }`}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {label}
                            </span>
                          </div>
                        );
                      })()}
                      {state.type === "received" && (
                        <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                          Pinged you!
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SignalDetails
        signal={selectedSignal}
        isPending={isPending}
        requestState={
          selectedSignal ? getRequestState(selectedSignal.id) : { type: "none" }
        }
        onRequestSent={handleRequestSent}
        onClose={() => setSelectedSignal(null)}
      />
    </div>
  );
}

// Named import used inside the component — hoisted here to avoid a separate import.
function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
