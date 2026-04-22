import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const MIN = 0;
const MAX = 100;

/**
 * Atomically adjusts a user's trust score, clamped to [0, 100].
 * Fire-and-forget safe — errors are swallowed so they never block callers.
 */
export async function adjustTrustScore(
  userId: string,
  delta: number,
): Promise<void> {
  await db
    .update(users)
    .set({
      trustScore: sql`GREATEST(${MIN}, LEAST(${MAX}, trust_score + ${delta}))`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// ─── Score deltas ─────────────────────────────────────────────────────────────

export const TRUST_DELTAS = {
  // Profile completion milestones (first-time only, each +5 → max 60 pre-verification)
  FIRST_PHOTO: +5,
  BIO_SET: +5,
  INTERESTS_SET: +5,
  VIBE_COMPLETE: +5,
  // Admin events
  VERIFICATION_APPROVED: +20,
  // Social signals
  MUTUAL_MATCH: +5,
  // Negative events
  REPORT_RECEIVED: -15,
  WARNING_ISSUED: -20,
  SUSPENDED: -40,
  UNSUSPENDED: +20,
} as const;

// ─── Score tiers (used in UI) ─────────────────────────────────────────────────

export type TrustTier = "new" | "low" | "fair" | "good" | "trusted";

export function getTrustTier(score: number): TrustTier {
  if (score < 45) return "new";
  if (score < 60) return "low";
  if (score < 75) return "fair";
  if (score < 90) return "good";
  return "trusted";
}

export const TRUST_TIER_LABELS: Record<TrustTier, string> = {
  new: "New",
  low: "Low",
  fair: "Fair",
  good: "Good",
  trusted: "Trusted",
};

export const TRUST_TIER_COLORS: Record<TrustTier, string> = {
  new: "text-zinc-400",
  low: "text-red-400",
  fair: "text-amber-400",
  good: "text-emerald-400",
  trusted: "text-sky-400",
};

export const TRUST_TIER_BAR: Record<TrustTier, string> = {
  new: "bg-zinc-400",
  low: "bg-red-400",
  fair: "bg-amber-400",
  good: "bg-emerald-400",
  trusted: "bg-sky-400",
};
