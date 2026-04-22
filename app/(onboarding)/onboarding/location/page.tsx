import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { decrypt } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";
import { UNIVERSITY_LOCATIONS } from "@/lib/constants/locations";
import { LocationForm } from "./location-form";

export default async function LocationPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;
  if (!token) redirect("/onboarding/vouch");

  const session = await decrypt(token);
  if (!session) redirect("/onboarding/vouch");

  const [user] = await db
    .select({
      university: users.university,
      city: users.city,
      neighborhood: users.neighborhood,
    })
    .from(users)
    .where(eq(users.id, session.userId as string))
    .limit(1);

  if (!user) redirect("/onboarding/vouch");

  // Already completed — skip ahead
  if (user.city && user.neighborhood) redirect("/onboarding/verify");

  // Guard: university not in location config yet (shouldn't happen with
  // current supported universities, but prevents a blank form)
  if (!UNIVERSITY_LOCATIONS[user.university]) redirect("/onboarding/verify");

  const uniConfig = SUPPORTED_UNIVERSITIES.find(
    (u) => u.id === user.university,
  );
  const universityName = uniConfig?.name ?? user.university;

  return (
    <main className="min-h-screen bg-linear-to-br from-rose-50 via-background to-pink-50/30 dark:from-rose-950/20 dark:via-background dark:to-pink-950/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose-200/20 dark:bg-rose-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-pink-200/25 dark:bg-pink-500/8 blur-3xl" />

      <div className="relative z-10 max-w-sm w-full space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Step 1 of 4
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Where do you stay?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Helps you connect with people from your area on campus.
          </p>
        </header>

        <LocationForm
          universityId={user.university}
          universityName={universityName}
        />

        <footer className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>Only shown to people you connect with</span>
        </footer>
      </div>
    </main>
  );
}
