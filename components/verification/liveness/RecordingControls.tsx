"use client";

import { Camera } from "lucide-react";
import type { Phase } from "./types";

interface RecordingControlsProps {
  phase: Phase;
  countdown: number;
  recordingTime: number;
  onRecord: () => void;
}

/**
 * The action bar that sits below the viewfinder and instruction list.
 * Its content changes with the current phase:
 *
 * "ready"      → Primary "Record" button. Clicking it starts the 3-second
 *                countdown via onRecord().
 *
 * "countdown"  → A neutral status bar mirroring the countdown number on the
 *                viewfinder. Non-interactive — the user shouldn't be able to
 *                interrupt the countdown.
 *
 * "recording"  → A neutral status bar showing remaining seconds with a pulsing
 *                dot. Also non-interactive — the clip stops automatically.
 *
 * Keeping this component phase-aware (rather than rendering three separate
 * siblings in the parent) means the layout doesn't shift between phases —
 * the bar occupies the same h-12 slot throughout.
 */
export function RecordingControls({
  phase,
  countdown,
  recordingTime,
  onRecord,
}: RecordingControlsProps) {
  if (phase === "ready") {
    return (
      <button
        onClick={onRecord}
        className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20"
      >
        <Camera className="w-4 h-4" />
        Record 10-Second Clip
      </button>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="w-full h-12 rounded-2xl bg-zinc-900 flex items-center justify-center">
        <span className="text-sm font-bold text-zinc-400">
          Starting in {countdown}…
        </span>
      </div>
    );
  }

  // phase === "recording"
  return (
    <div className="w-full h-12 rounded-2xl bg-zinc-900 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      <span className="text-sm font-bold text-zinc-400 tabular-nums">
        {recordingTime}s remaining
      </span>
    </div>
  );
}
