import type { Metadata } from "next";
import { db } from "@/db";
import { users, vouchCodes, notifications } from "@/db/schema";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Vouch profile, settings, and notifications.",
};
import { eq, and, count } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationToggle } from "@/components/NotificationToggle";
import Link from "next/link";
import { ExternalLink, Bell } from "lucide-react";
import {
  getTrustTier,
  TRUST_TIER_LABELS,
  TRUST_TIER_COLORS,
  TRUST_TIER_BAR,
  TRUST_DELTAS,
} from "@/lib/trust-score";
import {
  LogoutButton,
  DeleteAccountButton,
  CopyButtonClient,
  CodeVisibilityToggle,
  RadarVisibilityToggle,
} from "./account-actions";
import { LivenessTestModal } from "@/components/verification/LivenessTestModal";
import { ProfileCard } from "./profile-card";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/login");

  const session = await decrypt(token);
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      university: users.university,
      department: users.department,
      level: users.level,
      hideLevel: users.hideLevel,
      isRadarVisible: users.isRadarVisible,
      verificationStatus: users.verificationStatus,
      requiresPulseCheck: users.requiresPulseCheck,
      images: users.images,
      profileImage: users.profileImage,
      // Onboarding fields — phase 1
      gender: users.gender,
      lookingFor: users.lookingFor,
      intent: users.intent,
      relationshipStyle: users.relationship_style,
      energyVibe: users.energy_vibe,
      // Onboarding fields — phase 2
      socialEnergy: users.social_energy,
      // Onboarding fields — phase 3
      conflictStyle: users.conflict_style,
      dealBreakers: users.deal_breakers,
      // Onboarding fields — text
      lifestyleSnapshot: users.lifestyle_snapshot,
      relationshipVision: users.relationship_vision,
      // Onboarding fields — phase 4
      promptQuestion: users.prompt_question,
      promptAnswer: users.prompt_answer,
      // Bio & interests
      bioHeadline: users.bio_headline,
      interests: users.interests,
      // JSONB catch-all for remaining answers
      onboardingAnswers: users.onboarding_answers,
      // Trust
      trustScore: users.trustScore,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) redirect("/login");

  const [userCodes, unreadResult] = await Promise.all([
    db
      .select({
        id: vouchCodes.id,
        code: vouchCodes.code,
        isUsed: vouchCodes.isUsed,
        isPublic: vouchCodes.isPublic,
      })
      .from(vouchCodes)
      .where(eq(vouchCodes.issuerId, user.id)),

    db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, user.id), eq(notifications.isRead, false)),
      ),
  ]);

  const unreadCount = unreadResult[0]?.count ?? 0;

  const uniName =
    SUPPORTED_UNIVERSITIES.find((u) => u.id === user.university)?.name ??
    user.university;

  return (
    <main className="min-h-screen bg-background pb-24 p-6">
      <div className="max-w-md mx-auto space-y-8">
        {/* Unread notifications banner */}
        {unreadCount > 0 && (
          <Link
            href="/notifications"
            className="flex items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl px-4 py-3 hover:bg-rose-500/15 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tap to read your activity
                </p>
              </div>
            </div>
            <span className="text-rose-500 text-xs font-black uppercase tracking-widest shrink-0">
              View →
            </span>
          </Link>
        )}

        {/* Profile Card + Photo Management (shared client state for instant avatar updates) */}
        <ProfileCard
          name={user.name}
          email={user.email}
          university={uniName}
          department={user.department}
          level={user.level}
          hideLevel={user.hideLevel}
          verificationStatus={user.verificationStatus}
          initialImages={user.images ?? []}
          initialProfileImage={user.profileImage ?? null}
          bioHeadline={user.bioHeadline}
          intent={user.intent}
          socialEnergy={user.socialEnergy}
          energyVibe={user.energyVibe}
          interests={user.interests ?? []}
          gender={user.gender}
          lookingFor={user.lookingFor}
          relationshipStyle={user.relationshipStyle}
          conflictStyle={user.conflictStyle}
          lifestyleSnapshot={user.lifestyleSnapshot}
          dealBreakers={user.dealBreakers}
          relationshipVision={user.relationshipVision}
          promptQuestion={user.promptQuestion}
          promptAnswer={user.promptAnswer}
          passionSignal={
            (user.onboardingAnswers as Record<string, string> | null)
              ?.passion_signal ?? null
          }
          misunderstoodTrait={
            (user.onboardingAnswers as Record<string, string> | null)
              ?.misunderstood_trait ?? null
          }
          growthFocus={
            (user.onboardingAnswers as Record<string, string> | null)
              ?.growth_focus ?? null
          }
          weekendActivity={
            (user.onboardingAnswers as Record<string, string> | null)
              ?.weekend_activity ?? null
          }
          happinessTrigger={
            (user.onboardingAnswers as Record<string, string> | null)
              ?.happiness_trigger ?? null
          }
        />

        {/* Trust Score */}
        {(() => {
          const score = user.trustScore;
          const tier = getTrustTier(score);
          const label = TRUST_TIER_LABELS[tier];
          const barColor = TRUST_TIER_BAR[tier];
          const textColor = TRUST_TIER_COLORS[tier];

          const gains: { label: string; delta: number }[] = [
            { label: "Upload first photo", delta: TRUST_DELTAS.FIRST_PHOTO },
            { label: "Set bio headline", delta: TRUST_DELTAS.BIO_SET },
            { label: "Add interests", delta: TRUST_DELTAS.INTERESTS_SET },
            {
              label: "Complete vibe profile",
              delta: TRUST_DELTAS.VIBE_COMPLETE,
            },
            {
              label: "Identity verified",
              delta: TRUST_DELTAS.VERIFICATION_APPROVED,
            },
            { label: "Mutual handshake", delta: TRUST_DELTAS.MUTUAL_MATCH },
          ];
          const losses: { label: string; delta: number }[] = [
            {
              label: "Reported by another user",
              delta: TRUST_DELTAS.REPORT_RECEIVED,
            },
            { label: "Warning from admin", delta: TRUST_DELTAS.WARNING_ISSUED },
            { label: "Account suspended", delta: TRUST_DELTAS.SUSPENDED },
          ];

          return (
            <section className="space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest px-2">
                Trust Score
              </h3>

              {/* Score card */}
              <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-4xl font-black ${textColor}`}>
                      {score}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
                      out of 100
                    </p>
                  </div>
                  <span
                    className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-full border ${textColor} border-current/30`}
                  >
                    {label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your trust score reflects how you engage on Vouch. It goes up
                  when you connect genuinely and down when you behave in ways
                  that harm others.
                </p>

                {/* Gains & losses table */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      How you gain
                    </p>
                    {gains.map((g) => (
                      <div
                        key={g.label}
                        className="flex items-center justify-between gap-2"
                      >
                        <p className="text-xs text-muted-foreground">
                          {g.label}
                        </p>
                        <span className="text-[10px] font-black text-emerald-500 shrink-0">
                          +{g.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                      How you lose
                    </p>
                    {losses.map((l) => (
                      <div
                        key={l.label}
                        className="flex items-center justify-between gap-2"
                      >
                        <p className="text-xs text-muted-foreground">
                          {l.label}
                        </p>
                        <span className="text-[10px] font-black text-red-400 shrink-0">
                          {l.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Vouch Code Management */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
              Your Vouch Codes
            </h3>
            <span className="text-[10px] font-bold text-muted-foreground">
              {userCodes.filter((c) => !c.isUsed).length} remaining
            </span>
          </div>
          {userCodes.length > 0 ? (
            <div className="space-y-2">
              {userCodes.map(({ id, code, isUsed, isPublic }) => (
                <div
                  key={code}
                  className={`bg-card p-4 rounded-2xl border flex justify-between items-center gap-2 transition-opacity ${
                    isUsed
                      ? "border-border opacity-50"
                      : "border-rose-200 dark:border-rose-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <code
                      className={`font-mono font-bold text-sm ${
                        isUsed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {code}
                    </code>
                    {isUsed ? (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-1 rounded-full text-muted-foreground">
                        Used
                      </span>
                    ) : (
                      <>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-500/15 text-rose-500 px-2 py-1 rounded-full">
                          Available
                        </span>
                        {/* Public / Private toggle — only on unused codes */}
                        <CodeVisibilityToggle
                          codeId={id}
                          initialIsPublic={isPublic}
                        />
                      </>
                    )}
                  </div>
                  {!isUsed && <CopyButtonClient text={code} />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-2 italic">
              No vouch codes yet.
            </p>
          )}
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] text-muted-foreground italic">
              Share these with friends — you are responsible for who you vouch
              for.
            </p>
            <Link
              href="/codes"
              target="_blank"
              className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors shrink-0 ml-3"
            >
              Code board
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </section>

        {/* Identity Verification */}
        {(user.verificationStatus !== "verified" ||
          user.requiresPulseCheck) && (
          <section className="space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest px-2">
              Identity
            </h3>
            {user.verificationStatus === "pending_review" ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                  <span className="text-amber-500 text-base">⏳</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Under Review
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your liveness tape is being reviewed. You&apos;ll be
                    notified once cleared.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-rose-900/40 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                  <span className="text-rose-400 text-base">🛡</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">
                    {user.verificationStatus === "rejected"
                      ? "Verification Failed"
                      : user.requiresPulseCheck
                        ? "Routine Identity Check"
                        : "Identity Check Required"}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {user.verificationStatus === "rejected"
                      ? "Your clip was rejected. Record a new one to unlock the app."
                      : user.requiresPulseCheck
                        ? "A routine liveness check has been requested. Record a quick clip to continue."
                        : "Complete your liveness check to unlock Handshakes and Chats."}
                  </p>
                </div>
                <LivenessTestModal />
              </div>
            )}
          </section>
        )}

        {/* App Settings */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest px-2">
            App Settings
          </h3>
          <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex justify-between items-center">
            <div>
              <span className="block text-sm font-bold text-foreground">
                Theme
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Display Mode
              </span>
            </div>
            <ThemeToggle />
          </div>

          <NotificationToggle />

          <div className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="block text-sm font-bold text-foreground">
                  Radar Visibility
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {user.isRadarVisible
                    ? "Visible to nearby students"
                    : "Hidden from radar"}
                </span>
              </div>
              <RadarVisibilityToggle initialVisible={user.isRadarVisible} />
            </div>
            {user.intent === "Short-term" && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed border-t border-border pt-3">
                Your intent is set to{" "}
                <span className="font-bold">Short-term</span>, so you won&apos;t
                appear on anyone&apos;s radar regardless of the toggle above.
                Update your intent in your profile to become discoverable via
                radar.
              </p>
            )}
          </div>
        </section>

        {/* Account Actions */}
        <section className="space-y-3">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest px-2">
            Account
          </h3>
          <LogoutButton />
          <DeleteAccountButton />
        </section>
      </div>
    </main>
  );
}
