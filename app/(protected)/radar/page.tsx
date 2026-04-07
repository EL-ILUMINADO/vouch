import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BatteryCharging, Zap } from "lucide-react";
import { RadarDisplay } from "./radar-display";
import {
  SUPPORTED_UNIVERSITIES,
  RADAR_MIN_KM,
  RADAR_MAX_KM,
  RADAR_MAX_SIGNALS,
} from "@/lib/constants/universities";
import type { RadarSignal } from "@/types/radar";

export default async function RadarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vouch_session")?.value;

  if (!token) redirect("/login");
  const session = await decrypt(token);
  if (!session) redirect("/login");

  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!currentUser || currentUser.verificationStatus !== "verified") {
    redirect("/onboarding/verify");
  }

  const now = new Date();
  const pings = currentUser.radarPings ?? 10;
  const resetAt = currentUser.pingsResetAt;
  const hasPings = pings > 0 || (resetAt !== null && now > resetAt);

  if (!hasPings) {
    return (
      <main className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] w-full overflow-hidden bg-background px-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner">
          <BatteryCharging className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Radar Cooling Down
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-[280px]">
          You&apos;ve used all 10 direct pings for this week. Head over to
          Discover to keep networking.
        </p>
        <Link
          href="/discover"
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-md active:scale-95 transition-all"
        >
          <Zap className="w-4 h-4 fill-white/20" />
          Go to Discover
        </Link>
      </main>
    );
  }

  // Reference point for distance calculation:
  // 1. Use the user's stored GPS coordinates if available (GPS-verified users).
  // 2. Fall back to the university centre for users verified via vouch/document.
  const uniConfig = SUPPORTED_UNIVERSITIES.find(
    (u) => u.id === currentUser.university,
  );
  const refLat = currentUser.latitude ?? uniConfig?.coordinates.lat ?? 0;
  const refLng = currentUser.longitude ?? uniConfig?.coordinates.lng ?? 0;

  // Pythagorean approximation — accurate to < 0.1% error within 1.5km.
  // (refLat / 57.2958) converts degrees to radians for the longitude correction.
  const distanceSql = sql<number>`
    sqrt(
      pow(111.0 * (${users.latitude} - ${refLat}), 2) +
      pow(111.0 * (${users.longitude} - ${refLng}) * cos(${refLat} / 57.2958), 2)
    )
  `;

  // Fetch verified peers in the same university whose GPS-stored positions
  // fall within the radar ring (RADAR_MIN_KM to RADAR_MAX_KM) of the current user.
  // Users without stored coordinates are excluded — they cannot be accurately placed.
  const rawSignals = await db
    .select({
      id: users.id,
      name: users.name,
      department: users.department,
      level: users.level,
      hideLevel: users.hideLevel,
      distance: distanceSql.as("distance"),
    })
    .from(users)
    .where(
      and(
        eq(users.university, currentUser.university),
        eq(users.verificationStatus, "verified"),
        ne(users.id, currentUser.id),
        sql`${users.latitude} IS NOT NULL`,
        sql`${users.longitude} IS NOT NULL`,
        sql`${distanceSql} >= ${RADAR_MIN_KM}`,
        sql`${distanceSql} <= ${RADAR_MAX_KM}`,
      ),
    )
    .limit(RADAR_MAX_SIGNALS);

  const signals = rawSignals as RadarSignal[];

  // Server-side shuffle so carousel order varies per page load without
  // causing hydration mismatches (stable HTML sent to client).
  const carouselSignals = [...signals]
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);

  return (
    <main className="w-full h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <RadarDisplay
        signals={signals}
        carouselSignals={carouselSignals}
        currentUserId={currentUser.id}
      />
    </main>
  );
}
