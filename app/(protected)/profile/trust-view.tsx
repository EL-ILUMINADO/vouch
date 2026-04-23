import Link from "next/link";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import {
  getTrustTier,
  TRUST_TIER_LABELS,
  TRUST_TIER_COLORS,
  TRUST_TIER_BAR,
  TRUST_DELTAS,
} from "@/lib/trust-score";
import { LivenessTestModal } from "@/components/verification/LivenessTestModal";

interface TrustViewProps {
  score: number;
  verificationStatus: string;
  requiresPulseCheck: boolean;
}

export function TrustView({
  score,
  verificationStatus,
  requiresPulseCheck,
}: TrustViewProps) {
  const tier = getTrustTier(score);
  const label = TRUST_TIER_LABELS[tier];
  const barColor = TRUST_TIER_BAR[tier];
  const textColor = TRUST_TIER_COLORS[tier];

  const gains = [
    { label: "Upload first photo", delta: TRUST_DELTAS.FIRST_PHOTO },
    { label: "Set bio headline", delta: TRUST_DELTAS.BIO_SET },
    { label: "Add interests", delta: TRUST_DELTAS.INTERESTS_SET },
    { label: "Complete vibe profile", delta: TRUST_DELTAS.VIBE_COMPLETE },
    { label: "Identity verified", delta: TRUST_DELTAS.VERIFICATION_APPROVED },
    { label: "Mutual handshake", delta: TRUST_DELTAS.MUTUAL_MATCH },
  ];
  const losses = [
    { label: "Reported by another user", delta: TRUST_DELTAS.REPORT_RECEIVED },
    { label: "Warning from admin", delta: TRUST_DELTAS.WARNING_ISSUED },
    { label: "Account suspended", delta: TRUST_DELTAS.SUSPENDED },
  ];

  return (
    <main className="min-h-screen bg-background pb-24 p-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="w-10 h-10 bg-card rounded-full border border-border flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-black tracking-tight">
            Identity & Trust
          </h1>
          <div className="w-10 h-10" />
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-5xl font-black ${textColor}`}>{score}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
                out of 100
              </p>
            </div>
            <span
              className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${textColor} border-current/30`}
            >
              {label}
            </span>
          </div>

          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${score}%` }}
            />
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed pt-2">
            Your trust score reflects how you engage on Vouch. It goes up when
            you connect genuinely and down when you behave in ways that harm
            others.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mt-4">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                How you gain
              </p>
              {gains.map((g) => (
                <div
                  key={g.label}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="text-xs text-muted-foreground leading-tight pr-2">
                    {g.label}
                  </p>
                  <span className="text-[10px] font-black text-emerald-500 shrink-0">
                    +{g.delta}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                How you lose
              </p>
              {losses.map((l) => (
                <div
                  key={l.label}
                  className="flex items-center justify-between gap-2"
                >
                  <p className="text-xs text-muted-foreground leading-tight pr-2">
                    {l.label}
                  </p>
                  <span className="text-[10px] font-black text-red-500 shrink-0">
                    {l.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(verificationStatus !== "verified" || requiresPulseCheck) && (
          <div className="bg-zinc-950 border border-rose-900/40 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">
                {verificationStatus === "rejected"
                  ? "Verification Failed"
                  : requiresPulseCheck
                    ? "Routine Identity Check"
                    : "Identity Check Required"}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {verificationStatus === "rejected"
                  ? "Your clip was rejected. Record a new one to unlock the app."
                  : "Complete your liveness check to unlock Handshakes and Chats."}
              </p>
            </div>
            <LivenessTestModal />
          </div>
        )}
      </div>
    </main>
  );
}
