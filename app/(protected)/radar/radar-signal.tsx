"use client";

import * as React from "react";
import { RadarSignal } from "@/types/radar";

interface RadarSignalProps {
  signal: RadarSignal;
  radarRange: number;
  onClick: () => void;
}

export const RadarSignalItem = ({
  signal,
  radarRange,
  onClick,
}: RadarSignalProps) => {
  const angle = signal.angle ?? 0;

  /**
   * POLAR TO CARTESIAN CONVERSION:
   * 1. Degrees to Radians
   * 2. (angle - 90) to start 0 at the top (12 o'clock)
   */
  const radians = (angle - 90) * (Math.PI / 180);

  // Radius is expressed as a percentage of the 50% radius (half-width)
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
          <div className="w-3.5 h-3.5 bg-rose-500 dark:bg-rose-400 rounded-full border-2 border-white dark:border-slate-950 shadow-lg group-hover:scale-125 transition-all" />
          <div className="absolute inset-0 w-full h-full bg-rose-400 rounded-full animate-ping opacity-20" />
        </div>
      </div>
    </button>
  );
};

RadarSignalItem.displayName = "RadarSignalItem";
