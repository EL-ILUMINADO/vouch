import { db } from "@/db";
import {
  users,
  conversations,
  likes,
  radarRequests,
  reports,
} from "@/db/schema";
import { eq, or, and, inArray, desc, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BadgeCheck } from "lucide-react";

import { ProfileAdminActions } from "./profile-admin-actions";
import { DeleteAccountButton } from "./delete-account-button";
import { UserStats } from "./user-stats";
import { UserIdentity } from "./user-identity";
import { UserProfileContent } from "./user-profile-content";
import { UserHandshakes } from "./user-handshakes";
import { UserReports } from "./user-reports";
import { VERIFICATION_STATUS_STYLE } from "./constants";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserProfilePage({ params }: Props) {
  const { id: userId } = await params;

  const [
    userRows,
    convRows,
    [{ total: likesReceivedCount }],
    [{ total: likesSentCount }],
    [{ total: radarPendingIncoming }],
    [{ total: totalHandshakes }],
    reportRows,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        university: users.university,
        department: users.department,
        level: users.level,
        profileImage: users.profileImage,
        images: users.images,
        gender: users.gender,
        lookingFor: users.lookingFor,
        bio_headline: users.bio_headline,
        interests: users.interests,
        intent: users.intent,
        social_energy: users.social_energy,
        energy_vibe: users.energy_vibe,
        relationship_style: users.relationship_style,
        conflict_style: users.conflict_style,
        lifestyle_snapshot: users.lifestyle_snapshot,
        deal_breakers: users.deal_breakers,
        relationship_vision: users.relationship_vision,
        prompt_question: users.prompt_question,
        prompt_answer: users.prompt_answer,
        onboarding_answers: users.onboarding_answers,
        verificationStatus: users.verificationStatus,
        verificationMethod: users.verificationMethod,
        isBanned: users.isBanned,
        isSuspended: users.isSuspended,
        warningCount: users.warningCount,
        trustScore: users.trustScore,
        radarPings: users.radarPings,
        pingsResetAt: users.pingsResetAt,
        deviceId: users.deviceId,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),

    db
      .select({
        id: conversations.id,
        status: conversations.status,
        origin: conversations.origin,
        lastActivityAt: conversations.lastActivityAt,
        createdAt: conversations.createdAt,
        userOneId: conversations.userOneId,
        userTwoId: conversations.userTwoId,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.userOneId, userId),
          eq(conversations.userTwoId, userId),
        ),
      )
      .orderBy(desc(conversations.lastActivityAt)),

    db
      .select({ total: count() })
      .from(likes)
      .where(and(eq(likes.likedUserId, userId), eq(likes.status, "pending"))),

    db
      .select({ total: count() })
      .from(likes)
      .where(and(eq(likes.likerId, userId), eq(likes.status, "pending"))),

    db
      .select({ total: count() })
      .from(radarRequests)
      .where(
        and(
          eq(radarRequests.receiverId, userId),
          eq(radarRequests.status, "pending"),
        ),
      ),

    db
      .select({ total: count() })
      .from(conversations)
      .where(
        or(
          eq(conversations.userOneId, userId),
          eq(conversations.userTwoId, userId),
        ),
      ),

    db
      .select({
        id: reports.id,
        reason: reports.reason,
        description: reports.description,
        status: reports.status,
        adminNote: reports.adminNote,
        createdAt: reports.createdAt,
        reviewedAt: reports.reviewedAt,
        reporterId: reports.reporterId,
      })
      .from(reports)
      .where(eq(reports.reportedUserId, userId))
      .orderBy(desc(reports.createdAt)),
  ]);

  const user = userRows[0];
  if (!user) notFound();

  // Fetch handshake partners
  const partnerIds = convRows.map((c) =>
    c.userOneId === userId ? c.userTwoId : c.userOneId,
  );
  const uniquePartnerIds = [...new Set(partnerIds)];

  const partnerMap = new Map<
    string,
    { id: string; name: string; profileImage: string | null; isBanned: boolean }
  >();
  if (uniquePartnerIds.length > 0) {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        profileImage: users.profileImage,
        isBanned: users.isBanned,
      })
      .from(users)
      .where(inArray(users.id, uniquePartnerIds));
    rows.forEach((r) => partnerMap.set(r.id, r));
  }

  // Fetch reporters
  const reporterIds = [...new Set(reportRows.map((r) => r.reporterId))];
  const reporterMap = new Map<string, { id: string; name: string }>();
  if (reporterIds.length > 0) {
    const rows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, reporterIds));
    rows.forEach((r) => reporterMap.set(r.id, r));
  }

  const handshakes = convRows.map((c) => {
    const partnerId = c.userOneId === userId ? c.userTwoId : c.userOneId;
    return { ...c, partnerId, partner: partnerMap.get(partnerId) };
  });

  const displayStatus = user.isBanned
    ? "banned"
    : user.isSuspended
      ? "suspended"
      : (user.verificationStatus ?? "unverified");

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            aria-label="Back to users"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-white truncate">
                {user.name}
              </h1>
              {user.verificationStatus === "verified" && (
                <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest shrink-0 ${VERIFICATION_STATUS_STYLE[displayStatus] ?? VERIFICATION_STATUS_STYLE.unverified}`}
              >
                {displayStatus.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProfileAdminActions
            userId={user.id}
            userName={user.name}
            isBanned={user.isBanned}
            isSuspended={user.isSuspended}
            warningCount={user.warningCount}
          />
          <DeleteAccountButton userId={user.id} userName={user.name} />
        </div>
      </div>

      <UserStats
        totalHandshakes={totalHandshakes}
        likesReceivedCount={likesReceivedCount}
        likesSentCount={likesSentCount}
        radarPendingIncoming={radarPendingIncoming}
        warningCount={user.warningCount}
        trustScore={user.trustScore}
      />

      <UserIdentity user={user} />

      <UserProfileContent user={user} />

      <UserHandshakes handshakes={handshakes} />

      <UserReports reportRows={reportRows} reporterMap={reporterMap} />
    </div>
  );
}
