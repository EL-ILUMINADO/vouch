import type { Metadata } from "next";
import { db } from "@/db";
import { users, vouchCodes, notifications } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Bell,
  MapPin,
  Ticket,
  ChevronLeft,
  Globe,
  AppWindow,
  Info,
} from "lucide-react";
import {
  LogoutButton,
  DeleteAccountButton,
  RadarVisibilityToggle,
} from "./account-actions";
import { ProfileCard } from "./profile-card";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";
import { SettingsItem } from "./settings-item";
import { TrustView } from "./trust-view";
import { CodesView } from "./codes-view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Vouch profile, settings, and notifications.",
};

export default async function ProfilePage(props: {
  searchParams: Promise<{ view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const view = searchParams?.view;

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
      city: users.city,
      neighborhood: users.neighborhood,
      hideLevel: users.hideLevel,
      isRadarVisible: users.isRadarVisible,
      verificationStatus: users.verificationStatus,
      requiresPulseCheck: users.requiresPulseCheck,
      images: users.images,
      profileImage: users.profileImage,
      gender: users.gender,
      lookingFor: users.lookingFor,
      intent: users.intent,
      relationshipStyle: users.relationship_style,
      energyVibe: users.energy_vibe,
      socialEnergy: users.social_energy,
      conflictStyle: users.conflict_style,
      dealBreakers: users.deal_breakers,
      lifestyleSnapshot: users.lifestyle_snapshot,
      relationshipVision: users.relationship_vision,
      promptQuestion: users.prompt_question,
      promptAnswer: users.prompt_answer,
      bioHeadline: users.bio_headline,
      interests: users.interests,
      onboardingAnswers: users.onboarding_answers,
      trustScore: users.trustScore,
    })
    .from(users)
    .where(eq(users.id, session.userId as string))
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
  const availableCodesCount = userCodes.filter((c) => !c.isUsed).length;

  const locationDisplay =
    user.city && user.neighborhood
      ? `${user.neighborhood}, ${user.city}`
      : "Not Set";

  // VIEW: EDIT PROFILE (Renders Original ProfileCard full screen)
  if (view === "edit") {
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
              Manage Profile
            </h1>
            <div className="w-10 h-10" />
          </div>
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
        </div>
      </main>
    );
  }

  // VIEW: TRUST & IDENTITY
  if (view === "trust") {
    return (
      <TrustView
        score={user.trustScore}
        verificationStatus={user.verificationStatus}
        requiresPulseCheck={user.requiresPulseCheck}
      />
    );
  }

  // VIEW: VOUCH CODES
  if (view === "codes") {
    return (
      <CodesView
        userCodes={userCodes}
        availableCodesCount={availableCodesCount}
      />
    );
  }

  // --- MAIN PROFILE SETTINGS VIEW (Matches the Reference Image) ---
  return (
    <main className="min-h-screen bg-muted/30 pb-24 p-6">
      <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header Title */}
        <h1 className="text-center text-lg font-extrabold tracking-tight pt-2">
          Profile
        </h1>

        {/* Profile Info Card */}
        <div className="bg-card rounded-3xl p-4 flex items-center gap-4 shadow-xs border border-border/50">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-rose-400 to-pink-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
              {user.name[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">
              {user.name}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">
              {uniName}
            </p>
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
            Account
          </p>
          <div className="bg-card rounded-3xl border border-border/50 shadow-xs overflow-hidden">
            <SettingsItem
              icon={User}
              label="Manage Profile"
              href="/profile?view=edit"
            />
            <SettingsItem
              icon={ShieldCheck}
              label="Identity & Trust"
              value={`Score: ${user.trustScore}`}
              href="/profile?view=trust"
            />
            <SettingsItem
              icon={Ticket}
              label="Vouch Codes"
              value={`${availableCodesCount} left`}
              href="/profile?view=codes"
            />
            <SettingsItem
              icon={Bell}
              label="Notifications"
              href="/notifications"
              value={unreadCount > 0 ? `${unreadCount} unread` : "All clear"}
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
            Preferences
          </p>
          <div className="bg-card rounded-3xl border border-border/50 shadow-xs overflow-hidden">
            <SettingsItem
              icon={MapPin}
              label="Location"
              value={locationDisplay}
            />

            <div className="flex items-center justify-between p-4 bg-card border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-semibold">Radar Visibility</span>
              </div>
              <RadarVisibilityToggle initialVisible={user.isRadarVisible} />
            </div>

            {/* We inline the Theme Toggle nicely to fit the layout */}
            <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <AppWindow className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-semibold">Theme</span>
              </div>
              <div className="scale-90 origin-right">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
            Support & Danger Zone
          </p>
          <div className="bg-card rounded-3xl border border-border/50 shadow-xs overflow-hidden">
            <SettingsItem
              icon={Info}
              label="Help Center"
              href="mailto:support@vouch.com"
              isExternal
            />
            <div className="p-2 border-t border-border">
              <LogoutButton />
            </div>
            <div className="p-2 pt-0">
              <DeleteAccountButton />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
