"use client";

import { Camera, Shield, X, Loader2, Check } from "lucide-react";
import { useLivenessRecorder } from "./liveness/useLivenessRecorder";
import { CameraViewfinder } from "./liveness/CameraViewfinder";
import { InstructionList } from "./liveness/InstructionList";
import { RecordingControls } from "./liveness/RecordingControls";
import { PreviewPanel } from "./liveness/PreviewPanel";
import { PermissionDeniedFallback } from "./liveness/PermissionDeniedFallback";

/**
 * Entry point for the liveness check flow.
 *
 * Rendered by VerificationBanner (a server component) inside the protected
 * layout. When the modal is closed, this component renders only the "Start
 * Check" trigger button — a small inline element that fits naturally in the
 * banner's flex row.
 *
 * All state and media logic live in useLivenessRecorder. This component is
 * responsible solely for layout and routing the right panel to each phase.
 */
export function LivenessTestModal() {
  const {
    isOpen,
    phase,
    countdown,
    recordingTime,
    instructions,
    error,
    previewUrl,
    videoRef,
    previewRef,
    openModal,
    closeModal,
    startRecording,
    handleRetake,
    handleSubmit,
  } = useLivenessRecorder();

  // ── Closed: render only the trigger button

  if (!isOpen) {
    return (
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-bold hover:bg-zinc-100 active:scale-[0.97] transition-all shrink-0"
      >
        <Camera className="w-3 h-3" />
        Start Check
      </button>
    );
  }

  // ── Open: render the full modal

  const isActivePhase =
    phase === "ready" || phase === "countdown" || phase === "recording";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-bold text-white">Liveness Check</span>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Requesting camera access */}
          {phase === "requesting" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-sm text-zinc-400">Requesting camera access…</p>
            </div>
          )}

          {/* Camera/mic blocked */}
          {phase === "denied" && <PermissionDeniedFallback />}

          {/* Live viewfinder, instructions, and phase-aware CTA */}
          {isActivePhase && (
            <div className="space-y-4">
              <CameraViewfinder
                videoRef={videoRef}
                phase={phase}
                countdown={countdown}
                recordingTime={recordingTime}
              />
              <InstructionList instructions={instructions} />
              <RecordingControls
                phase={phase}
                countdown={countdown}
                recordingTime={recordingTime}
                onRecord={startRecording}
              />
            </div>
          )}

          {/* Review recorded clip */}
          {phase === "preview" && previewUrl && (
            <PreviewPanel
              previewRef={previewRef}
              error={error}
              onRetake={handleRetake}
              onSubmit={handleSubmit}
            />
          )}

          {/* Uploading + saving */}
          {phase === "submitting" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-sm text-zinc-400">Transmitting to Security…</p>
            </div>
          )}

          {/* Success confirmation */}
          {phase === "submitted" && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-white">Tape received.</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Security will review your clip shortly. You&apos;ll be
                  notified once cleared.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
