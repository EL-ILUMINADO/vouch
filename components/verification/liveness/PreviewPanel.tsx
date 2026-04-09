"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface PreviewPanelProps {
  previewRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  onRetake: () => void;
  onSubmit: () => void;
}

/**
 * Shown after the 10-second recording completes.
 *
 * The user can:
 * - Watch their clip back via the native <video controls> element. The browser
 *   provides seek, play/pause, and volume — no custom player needed.
 * - Hit "Retake" to discard the blob and restart the camera (new instructions
 *   are picked so the session stays unpredictable).
 * - Hit "Submit to Security" to trigger the Cloudinary upload + DB write.
 *
 * If a submission error occurred, it surfaces above the action buttons so the
 * user knows what went wrong before deciding whether to retry or retake.
 *
 * The video element's `src` is assigned imperatively by a useEffect in the
 * parent hook (useLivenessRecorder) rather than as a prop, because blob: URLs
 * need to be revoked on cleanup — the hook manages their lifecycle.
 */
export function PreviewPanel({
  previewRef,
  error,
  onRetake,
  onSubmit,
}: PreviewPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-zinc-900 aspect-3/4">
        <video
          ref={previewRef}
          controls
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRetake}
          className="h-11 rounded-2xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retake
        </button>
        <button
          onClick={onSubmit}
          className="h-11 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20"
        >
          Submit to Security
        </button>
      </div>
    </div>
  );
}
