"use client";

import * as React from "react";
import { RadarSignal } from "@/types/radar";

interface RadarSignalProps {
  signal: RadarSignal;
  radarRange: number;
  isSelected: boolean;
  hasIncomingRequest: boolean;
  onClick: () => void;
}

export const RadarSignalItem = ({
  signal,
  radarRange,
  isSelected,
  hasIncomingRequest,
  onClick,
}: RadarSignalProps) => {
  const angle = signal.angle ?? 0;

  /**
   * POLAR TO CARTESIAN:
   * Subtract 90° so 0° points up (12 o'clock).
   */
  const radians = (angle - 90) * (Math.PI / 180);
  const radius = (signal.distance / radarRange) * 50;
  const x = 50 + radius * Math.cos(radians);
  const y = 50 + radius * Math.sin(radians);

  return (
    <button
      onClick={onClick}
      className="absolute z-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:z-30 active:scale-75"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="w-11 h-11 flex items-center justify-center -m-5 bg-transparent group">
        <div className="relative">
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 shadow-lg transition-all group-hover:scale-125 ${
              isSelected
                ? "bg-white border-rose-500 scale-125"
                : hasIncomingRequest
                  ? "bg-amber-400 dark:bg-amber-300 border-white dark:border-slate-950"
                  : "bg-rose-500 dark:bg-rose-400 border-white dark:border-slate-950"
            }`}
          />
          <div
            className={`absolute inset-0 w-full h-full rounded-full animate-ping opacity-20 ${
              hasIncomingRequest ? "bg-amber-400" : "bg-rose-400"
            }`}
          />
        </div>
      </div>
    </button>
  );
};

RadarSignalItem.displayName = "RadarSignalItem";
