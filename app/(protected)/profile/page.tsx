import { db } from "@/db";
import { users, vouchCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LogoutButton,
  DeleteAccountButton,
  CopyButtonClient,
} from "./account-actions";
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
      verificationStatus: users.verificationStatus,
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
    .select({ code: vouchCodes.code, isUsed: vouchCodes.isUsed })
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
              {userCodes.map(({ code, isUsed }) => (
                <div
                  key={code}
                  className={`bg-card p-4 rounded-2xl border flex justify-between items-center transition-opacity ${
                    isUsed
                      ? "border-border opacity-50"
                      : "border-rose-200 dark:border-rose-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
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
                      <span className="text-[9px] font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-500/15 text-rose-500 px-2 py-1 rounded-full">
                        Available
                      </span>
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
          <p className="text-[10px] text-muted-foreground px-2 italic">
            Share these with friends — you are responsible for who you vouch
            for.
          </p>
        </section>

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
