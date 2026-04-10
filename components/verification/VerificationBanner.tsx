import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Shield, Clock } from "lucide-react";
import { LivenessTestModal } from "./LivenessTestModal";

export async function VerificationBanner() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) return null;

  const session = await decrypt(token);
  if (!session) return null;

  const [user] = await db
    .select({
      verificationStatus: users.verificationStatus,
      requiresPulseCheck: users.requiresPulseCheck,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;

  const { verificationStatus, requiresPulseCheck } = user;

  // Banned — handled elsewhere
  if (verificationStatus === "banned") return null;

  // Verified with no pending pulse check — nothing to show
  if (verificationStatus === "verified" && !requiresPulseCheck) return null;

  // Muted pulsing banner — review in progress, no action needed
  if (verificationStatus === "pending_review") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/95 border-b border-zinc-800">
        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
          <Clock className="w-3 h-3 text-zinc-400" />
        </div>
        <p className="text-xs text-zinc-300 flex-1">
          Security is currently reviewing your Liveness Tape. Hang tight.
        </p>
      </div>
    );
  }

  // 'unverified', 'rejected', or verified-but-pulse-check-required — high-priority dark banner with CTA
  const isRejected = verificationStatus === "rejected";
  const isPulseCheck = verificationStatus === "verified" && requiresPulseCheck;

  const message = isRejected
    ? "Your Liveness Tape was rejected. Resubmit to unlock Handshakes and Chats."
    : isPulseCheck
      ? "Routine identity check required. Record a quick liveness tape to continue."
      : "Security Alert: Complete your Identity Check to unlock Handshakes and Chats.";

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 border-b border-rose-900/50">
      <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
        <Shield className="w-3 h-3 text-rose-400" />
      </div>
      <p className="text-xs font-medium text-zinc-300 flex-1 leading-relaxed">
        {message}
      </p>
      <LivenessTestModal />
    </div>
  );
}
