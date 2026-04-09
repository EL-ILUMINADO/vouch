"use client";

import * as React from "react";
import type { Phase } from "./types";

interface CameraViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  phase: Phase;
  countdown: number;
  recordingTime: number;
}

/**
 * Renders the live camera feed plus two overlays:
 *
 * - Countdown overlay (phase "countdown"): a large centred number with a dark
 *   scrim. The number counts from 3 → 1 before recording begins.
 *
 * - REC pill (phase "recording"): a top-left badge showing remaining seconds.
 *   The pulsing dot mimics a classic recording indicator.
 *
 * The video element is always rendered (even when its overlays are hidden)
 * so that React never unmounts it mid-stream — unmounting would stop the
 * MediaStream tracks and blank the feed.
 *
 * `scale-x-[-1]` mirrors the selfie feed horizontally so it behaves like a
 * mirror, which is what users intuitively expect from a front-facing camera.
 * The preview video (in PreviewPanel) is NOT mirrored — the recorded file is
 * already the correct non-mirrored orientation.
 */
export function CameraViewfinder({
  videoRef,
  phase,
  countdown,
  recordingTime,
}: CameraViewfinderProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-3/4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />

      {/* Countdown overlay */}
      {phase === "countdown" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-8xl font-black text-white tabular-nums drop-shadow-lg">
            {countdown}
          </span>
        </div>
      )}

      {/* REC indicator */}
      {phase === "recording" && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/90 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white tabular-nums">
            {recordingTime}s
          </span>
        </div>
      )}
    </div>
  );
}
