import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";
import { PulseCheck } from "./pulse-check";
import { CultureCheckCard } from "./culture-check-card";

export default async function VerificationHub() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/onboarding/vouch");

  const session = await decrypt(token);
  if (!session) redirect("/onboarding/vouch");

  const [user] = await db
    .select({ university: users.university })
    .from(users)
    .where(eq(users.id, session.userId as string))
    .limit(1);

  if (!user) redirect("/onboarding/vouch");

  const uniConfig = SUPPORTED_UNIVERSITIES.find(
    (u) => u.id === user.university,
  );
  const universityName = uniConfig?.name ?? user.university;

  return (
    <main className="min-h-screen bg-linear-to-br from-rose-50 via-background to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Blob */}
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-pink-200/25 dark:bg-pink-500/8 blur-3xl" />

      <div className="relative z-10 max-w-2xl w-full space-y-8">
        <header className="text-center space-y-2">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Almost there ✨
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Verify you&apos;re on campus
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            One quick step to confirm you&apos;re a real student at your
            university.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PulseCheck />
          <CultureCheckCard
            universityId={user.university}
            universityName={universityName}
          />
        </div>

        <footer className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>Your data is only used for campus verification</span>
        </footer>
      </div>
    </main>
  );
}
