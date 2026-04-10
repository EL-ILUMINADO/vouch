"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Check, ArrowRight, Clock } from "lucide-react";
import { useLivenessRecorder } from "@/components/verification/liveness/useLivenessRecorder";
import { CameraViewfinder } from "@/components/verification/liveness/CameraViewfinder";
import { InstructionList } from "@/components/verification/liveness/InstructionList";
import { RecordingControls } from "@/components/verification/liveness/RecordingControls";
import { PreviewPanel } from "@/components/verification/liveness/PreviewPanel";
import { PermissionDeniedFallback } from "@/components/verification/liveness/PermissionDeniedFallback";

interface LivenessCaptureProps {
  alreadyPending?: boolean;
}

export function LivenessCapture({
  alreadyPending = false,
}: LivenessCaptureProps) {
  const router = useRouter();
  // Capture the prop value at mount time only. After a server action, Next.js
  // refreshes server components and this prop might flip to true — but we must
  // NOT let that override the "submitted" phase the user just reached, otherwise
  // they'd be yanked away before clicking "Go to Radar".
  const [initiallyPending] = React.useState(alreadyPending);

  const {
    phase,
    countdown,
    recordingTime,
    instructions,
    error,
    previewUrl,
    videoRef,
    previewRef,
    openModal,
    startRecording,
    handleRetake,
    handleSubmit,
  } = useLivenessRecorder();

  // Auto-start camera on mount — but only for fresh submissions.
  // If the user navigated here while already pending review, skip the camera.
  React.useEffect(() => {
    if (!initiallyPending) openModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Direct-navigation guard: user landed on this page while already pending.
  // Show a static "pending review" screen instead of the recorder UI.
  if (initiallyPending && phase === "idle") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              Under Review
            </p>
            <h1 className="text-2xl font-black tracking-tight">
              Tape Received
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Our team is reviewing your identity clip. You&apos;ll hear back
              within{" "}
              <span className="font-bold text-foreground">6–24 hours</span>.
            </p>
          </div>
          <div className="w-full space-y-2">
            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-center">
              Connecting &amp; liking are locked until verified
            </div>
            <button
              onClick={() => router.push("/radar")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-[0.98]"
            >
              Go to Radar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActivePhase =
    phase === "ready" || phase === "countdown" || phase === "recording";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Final Step
          </p>
          <h1 className="text-2xl font-black tracking-tight">Liveness Check</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            A quick 10-second clip to confirm it&apos;s really you. Reviewed
            within 6–24 hours.
          </p>
        </div>

        {/* Body card */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 space-y-4">
            {/* Requesting camera */}
            {phase === "idle" || phase === "requesting" ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Requesting camera access…
                </p>
              </div>
            ) : null}

            {/* Camera/mic blocked */}
            {phase === "denied" && <PermissionDeniedFallback />}

            {/* Live viewfinder + instructions + controls */}
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

            {/* Preview + submit */}
            {phase === "preview" && previewUrl && (
              <PreviewPanel
                previewRef={previewRef}
                error={error}
                onRetake={handleRetake}
                onSubmit={handleSubmit}
              />
            )}

            {/* Uploading */}
            {phase === "submitting" && (
              <div className="flex flex-col items-center gap-4 py-10">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Transmitting to Security…
                </p>
              </div>
            )}

            {/* Success — pending screen */}
            {phase === "submitted" && (
              <div className="flex flex-col items-center gap-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-black text-foreground text-lg">
                    Tape received.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
                    Our team will review your clip within{" "}
                    <span className="font-bold text-foreground">
                      6–24 hours
                    </span>
                    . You can browse the radar while you wait.
                  </p>
                </div>
                <div className="w-full space-y-2 pt-2">
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    Connecting & liking are locked until verified
                  </div>
                  <button
                    onClick={() => router.push("/radar")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-[0.98]"
                  >
                    Go to Radar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
