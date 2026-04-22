import type { Metadata } from "next";
import { db } from "@/db";
import { users, conversations, radarRequests, blocks } from "@/db/schema";

export const metadata: Metadata = {
  title: "Radar",
  description: "See verified students near you on campus in real-time.",
};
import { eq, and, ne, or, sql, inArray, isNull, notExists } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BatteryCharging, Zap } from "lucide-react";
import { RadarDisplay } from "./radar-display";
import { RadarGate } from "@/components/radar/RadarGate";
import {
  SUPPORTED_UNIVERSITIES,
  RADAR_MAX_SIGNALS,
} from "@/lib/constants/universities";
import type { RadarSignal, RadarRequestState } from "@/types/radar";

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

  if (!currentUser) redirect("/login");

  // pending_review users can browse the radar but cannot connect or like
  const isPending = currentUser.verificationStatus === "pending_review";

  const isGated =
    (!isPending && currentUser.verificationStatus !== "verified") ||
    currentUser.requiresPulseCheck;

  const now = new Date();
  const pings = currentUser.radarPings ?? 10;
  const resetAt = currentUser.pingsResetAt;

  // Effective remaining pings — if the weekly window has passed, show the
  // refreshed value even before the DB is updated (that happens on next use).
  const effectiveRemainingPings =
    resetAt !== null && now > resetAt && pings === 0 ? 10 : pings;

  const hasPings = effectiveRemainingPings > 0;

  if (isGated) {
    const gateStatus = currentUser.requiresPulseCheck
      ? "unverified"
      : (currentUser.verificationStatus as
          | "unverified"
          | "pending_review"
          | "rejected");

    return (
      <main className="w-full h-[calc(100dvh-4rem)] overflow-hidden bg-background relative">
        <RadarGate verificationStatus={gateStatus}>
          <div className="w-full h-full" />
        </RadarGate>
      </main>
    );
  }

  if (!hasPings) {
    return (
      <main className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] w-full overflow-hidden bg-background px-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner">
          <BatteryCharging className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Radar Cooling Down
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-70">
          You&apos;ve used all 10 direct pings for this week. Head over to
          Discover to keep networking.
        </p>
        <Link
          href="/discover"
          className="flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-sm shadow-md active:scale-95 transition-all"
        >
          <Zap className="w-4 h-4 fill-white/20" />
          Go to Discover
        </Link>
      </main>
    );
  }

  const uniConfig = SUPPORTED_UNIVERSITIES.find(
    (u) => u.id === currentUser.university,
  );
  const refLat = currentUser.latitude ?? uniConfig?.coordinates.lat ?? 0;
  const refLng = currentUser.longitude ?? uniConfig?.coordinates.lng ?? 0;

  // Pythagorean approximation — accurate to <0.1% within 1.5km.
  const distanceSql = sql<number>`
    sqrt(
      pow(111.0 * (${users.latitude} - ${refLat}), 2) +
      pow(111.0 * (${users.longitude} - ${refLng}) * cos(${refLat} / 57.2958), 2)
    )
  `;

  const rawSignals = await db
    .select({
      id: users.id,
      name: users.name,
      department: users.department,
      level: users.level,
      hideLevel: users.hideLevel,
      lastActiveAt: users.lastActiveAt,
      distance: distanceSql.as("distance"),
    })
    .from(users)
    .where(
      and(
        eq(users.university, currentUser.university),
        eq(users.verificationStatus, "verified"),
        eq(users.isRadarVisible, true),
        ne(users.id, currentUser.id),
        // Exclude users who have explicitly declared "Short-term" intent.
        or(ne(users.intent, "Short-term"), isNull(users.intent)),
        // Exclude blocked users (in either direction).
        notExists(
          db
            .select({ id: blocks.id })
            .from(blocks)
            .where(
              or(
                and(
                  eq(blocks.blockerId, currentUser.id),
                  eq(blocks.blockedId, users.id),
                ),
                and(
                  eq(blocks.blockerId, users.id),
                  eq(blocks.blockedId, currentUser.id),
                ),
              ),
            ),
        ),
        sql`${users.latitude} IS NOT NULL`,
        sql`${users.longitude} IS NOT NULL`,
      ),
    )
    .limit(RADAR_MAX_SIGNALS);

  const signals = rawSignals as RadarSignal[];
  const signalIds = signals.map((s) => s.id);

  // Build the request-state map for every signal in range.
  const requestStates: Record<string, RadarRequestState> = {};

  if (signalIds.length > 0) {
    const [sentRequests, receivedRequests, existingConversations] =
      await Promise.all([
        // Requests I've sent to people currently on radar.
        db
          .select({ receiverId: radarRequests.receiverId })
          .from(radarRequests)
          .where(
            and(
              eq(radarRequests.senderId, currentUser.id),
              eq(radarRequests.status, "pending"),
              inArray(radarRequests.receiverId, signalIds),
            ),
          ),

        // Requests sent to me from people currently on radar.
        db
          .select({
            id: radarRequests.id,
            senderId: radarRequests.senderId,
          })
          .from(radarRequests)
          .where(
            and(
              eq(radarRequests.receiverId, currentUser.id),
              eq(radarRequests.status, "pending"),
              inArray(radarRequests.senderId, signalIds),
            ),
          ),

        // Active conversations I already have with people on radar.
        db
          .select({
            id: conversations.id,
            userOneId: conversations.userOneId,
            userTwoId: conversations.userTwoId,
          })
          .from(conversations)
          .where(
            and(
              or(
                and(
                  eq(conversations.userOneId, currentUser.id),
                  inArray(conversations.userTwoId, signalIds),
                ),
                and(
                  inArray(conversations.userOneId, signalIds),
                  eq(conversations.userTwoId, currentUser.id),
                ),
              ),
              ne(conversations.status, "closed_inactive"),
            ),
          ),
      ]);

    // Populate the map — "connected" wins over "sent"/"received".
    for (const r of sentRequests) {
      requestStates[r.receiverId] = { type: "sent" };
    }
    for (const r of receivedRequests) {
      requestStates[r.senderId] = { type: "received", requestId: r.id };
    }
    for (const c of existingConversations) {
      const otherId =
        c.userOneId === currentUser.id ? c.userTwoId : c.userOneId;
      requestStates[otherId] = { type: "connected", conversationId: c.id };
    }
  }

  // Server-side shuffle for carousel variety without hydration mismatches.
  const carouselSignals = [...signals]
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);

  return (
    <main className="w-full h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <RadarDisplay
        signals={signals}
        carouselSignals={carouselSignals}
        isPending={isPending}
        remainingPings={effectiveRemainingPings}
        requestStates={requestStates}
      />
    </main>
  );
}
