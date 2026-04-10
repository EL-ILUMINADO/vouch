"use client";

import * as React from "react";
import { Shield, Clock, RefreshCw } from "lucide-react";
import { LivenessTestModal } from "@/components/verification/LivenessTestModal";

interface RadarGateProps {
  verificationStatus: "unverified" | "pending_review" | "rejected";
  children: React.ReactNode;
}

/**
 * Full-screen overlay that gates access to the radar for users who haven't
 * passed liveness verification yet.
 *
 * - unverified   → prompt to start the liveness check
 * - pending_review → waiting state; admin hasn't reviewed the clip yet
 * - rejected     → resubmit CTA with a reason
 *
 * The radar renders behind the overlay (blurred) so returning users can see
 * what they're unlocking.
 */
export function RadarGate({ verificationStatus, children }: RadarGateProps) {
  return (
    <div className="relative w-full h-full">
      {/* Blurred radar content in the background */}
      <div className="absolute inset-0 pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center bg-background/60 backdrop-blur-md z-10">
        {verificationStatus === "pending_review" && <PendingState />}
        {verificationStatus === "rejected" && <RejectedState />}
        {verificationStatus === "unverified" && <UnverifiedState />}
      </div>
    </div>
  );
}

function UnverifiedState() {
  return (
    <div className="flex flex-col items-center gap-5 max-w-xs animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <Shield className="w-8 h-8 text-rose-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black tracking-tight text-foreground">
          Verify Your Identity
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vouch requires a quick liveness check before you can access Radar. It
          takes under 15 seconds.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 w-full">
        {/* LivenessTestModal renders its own trigger button when closed */}
        <LivenessTestModal />
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold">
          Camera required
        </p>
      </div>
    </div>
  );
}

function PendingState() {
  return (
    <div className="flex flex-col items-center gap-5 max-w-xs animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black tracking-tight text-foreground">
          Under Review
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your liveness clip is being reviewed by the Vouch security team.
          You&apos;ll be notified once you&apos;re cleared — usually within a
          few hours.
        </p>
      </div>
      <span className="text-[10px] text-amber-500/80 uppercase tracking-widest font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
        Pending Review
      </span>
    </div>
  );
}

function RejectedState() {
  return (
    <div className="flex flex-col items-center gap-5 max-w-xs animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black tracking-tight text-foreground">
          Verification Failed
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your liveness check could not be verified. Please record a new clip —
          ensure your face is clearly visible and well-lit.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 w-full">
        <LivenessTestModal />
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold">
          Retry required
        </p>
      </div>
    </div>
  );
}
