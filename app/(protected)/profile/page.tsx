import { db } from "@/db";
import { users, vouchCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
      // Onboarding fields
      bioHeadline: users.bio_headline,
      intent: users.intent,
      socialEnergy: users.social_energy,
      energyVibe: users.energy_vibe,
      interests: users.interests,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) redirect("/login");

  const userCodes = await db
    .select({
      id: vouchCodes.id,
      code: vouchCodes.code,
      isUsed: vouchCodes.isUsed,
      isPublic: vouchCodes.isPublic,
    })
    .from(vouchCodes)
    .where(eq(vouchCodes.issuerId, user.id));

  const uniName =
    SUPPORTED_UNIVERSITIES.find((u) => u.id === user.university)?.name ??
    user.university;

  return (
    <main className="min-h-screen bg-background pb-24 p-6">
      <div className="max-w-md mx-auto space-y-8">
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
        />

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
