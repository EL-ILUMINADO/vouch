/* eslint-disable @next/next/no-img-element */
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
import {
  ChevronLeft,
  BadgeCheck,
  ShieldAlert,
  Heart,
  Radio,
  Star,
  Flag,
  Image as ImageIcon,
  Users,
  AlertTriangle,
} from "lucide-react";
import { ProfileAdminActions } from "./profile-admin-actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string | null) {
  if (!date) return "Never";
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 space-y-2">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ?? "bg-zinc-700/60"}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
          {label}
        </p>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-xs font-semibold text-zinc-500 shrink-0 w-36">
        {label}
      </span>
      <span className="text-sm text-zinc-200 text-right min-w-0 wrap-break-word">
        {value ?? <span className="text-zinc-600 italic">—</span>}
      </span>
    </div>
  );
}

const VERIFICATION_STATUS_STYLE: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pending_review: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  banned: "bg-red-900/20 text-red-300 border-red-700/40",
  unverified: "bg-zinc-700/40 text-zinc-400 border-zinc-600/40",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const REPORT_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-900/50 text-amber-400 border-amber-800",
  reviewed: "bg-blue-900/50 text-blue-400 border-blue-800",
  dismissed: "bg-zinc-800 text-zinc-500 border-zinc-700",
  action_taken: "bg-red-900/50 text-red-400 border-red-800",
};

const REPORT_REASON_LABEL: Record<string, string> = {
  harassment: "Harassment",
  fake_profile: "Fake Profile",
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  other: "Other",
};

// ─── Page ────────────────────────────────────────────────────────────────────

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

  const answers =
    (user.onboarding_answers as Record<string, string | null>) ?? {};

  const displayStatus = user.isBanned
    ? "banned"
    : user.isSuspended
      ? "suspended"
      : (user.verificationStatus ?? "unverified");

  const photos = (user.images ?? []).filter(Boolean);

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

        <ProfileAdminActions
          userId={user.id}
          userName={user.name}
          isBanned={user.isBanned}
          isSuspended={user.isSuspended}
          warningCount={user.warningCount}
        />
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<Users className="w-4 h-4 text-emerald-400" />}
          label="Handshakes"
          value={totalHandshakes}
          accent="bg-emerald-500/10"
        />
        <StatCard
          icon={<Heart className="w-4 h-4 text-rose-400" />}
          label="Likes Pending"
          value={likesReceivedCount}
          sub="received"
          accent="bg-rose-500/10"
        />
        <StatCard
          icon={<Heart className="w-4 h-4 text-pink-400" />}
          label="Likes Sent"
          value={likesSentCount}
          sub="pending"
          accent="bg-pink-500/10"
        />
        <StatCard
          icon={<Radio className="w-4 h-4 text-blue-400" />}
          label="Radar Pings"
          value={radarPendingIncoming}
          sub="incoming"
          accent="bg-blue-500/10"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          label="Warnings"
          value={`${user.warningCount}/3`}
          accent="bg-amber-500/10"
        />
        <StatCard
          icon={<Star className="w-4 h-4 text-yellow-400" />}
          label="Trust Score"
          value={user.trustScore}
          accent="bg-yellow-500/10"
        />
      </div>

      {/* ── Identity & Account ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Avatar + photos */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile photo */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-zinc-800 flex items-center justify-center">
                <span className="text-6xl font-black text-zinc-600">
                  {user.name[0]}
                </span>
              </div>
            )}
          </div>

          {/* All photos */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                <SectionHeading>Photos ({photos.length})</SectionHeading>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt=""
                      className="w-full aspect-square object-cover rounded-xl border border-zinc-800 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-1">
            <SectionHeading>Account</SectionHeading>
            <div className="mt-3">
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="University" value={user.university} />
              <InfoRow label="Department" value={user.department} />
              <InfoRow label="Level" value={user.level} />
              <InfoRow label="Gender" value={user.gender} />
              <InfoRow label="Looking for" value={user.lookingFor} />
              <InfoRow label="Joined" value={fmtDate(user.createdAt)} />
              <InfoRow
                label="Last active"
                value={
                  user.lastActiveAt ? (
                    <span>
                      {timeAgo(user.lastActiveAt)}{" "}
                      <span className="text-zinc-600">
                        ({fmtDate(user.lastActiveAt)})
                      </span>
                    </span>
                  ) : null
                }
              />
              <InfoRow
                label="Radar pings left"
                value={
                  <span>
                    {user.radarPings ?? 0}/10
                    {user.pingsResetAt && (
                      <span className="text-zinc-600 ml-1">
                        resets {timeAgo(user.pingsResetAt)}
                      </span>
                    )}
                  </span>
                }
              />
            </div>
          </div>

          {/* Verification */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-1">
            <SectionHeading>Verification</SectionHeading>
            <div className="mt-3">
              <InfoRow
                label="Status"
                value={
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${VERIFICATION_STATUS_STYLE[user.verificationStatus ?? "unverified"]}`}
                  >
                    {user.verificationStatus?.replace("_", " ") ?? "unverified"}
                  </span>
                }
              />
              <InfoRow
                label="Method"
                value={user.verificationMethod?.replace("_", " ") ?? "none"}
              />
            </div>
          </div>

          {/* Moderation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              <SectionHeading>Moderation</SectionHeading>
            </div>
            <div className="mt-3">
              <InfoRow
                label="Banned"
                value={
                  user.isBanned ? (
                    <span className="text-red-400 font-bold">Yes</span>
                  ) : (
                    <span className="text-zinc-500">No</span>
                  )
                }
              />
              <InfoRow
                label="Suspended"
                value={
                  user.isSuspended ? (
                    <span className="text-orange-400 font-bold">Yes</span>
                  ) : (
                    <span className="text-zinc-500">No</span>
                  )
                }
              />
              <InfoRow
                label="Warnings"
                value={
                  <span
                    className={
                      user.warningCount >= 3
                        ? "text-red-400 font-bold"
                        : user.warningCount > 0
                          ? "text-amber-400 font-bold"
                          : "text-zinc-500"
                    }
                  >
                    {user.warningCount} / 3
                  </span>
                }
              />
              <InfoRow label="Trust score" value={user.trustScore} />
              <InfoRow
                label="Device ID"
                value={
                  user.deviceId ? (
                    <span className="font-mono text-xs text-zinc-400">
                      {user.deviceId.slice(0, 8)}…{user.deviceId.slice(-6)}
                    </span>
                  ) : null
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Content ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
        <SectionHeading>Profile Content</SectionHeading>

        {/* Bio */}
        {user.bio_headline && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Bio
            </p>
            <p className="text-sm text-zinc-200 italic leading-relaxed border-l-2 border-zinc-600 pl-3">
              &ldquo;{user.bio_headline}&rdquo;
            </p>
          </div>
        )}

        {/* Interests */}
        {(user.interests ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Interests ({user.interests!.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {user.interests!.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Vibe */}
        {(user.intent ||
          user.social_energy ||
          user.energy_vibe ||
          user.relationship_style ||
          user.conflict_style) && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Vibe
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {[
                ["Intent", user.intent],
                ["Social energy", user.social_energy],
                ["Energy vibe", user.energy_vibe],
                ["Relationship style", user.relationship_style],
                ["Conflict style", user.conflict_style],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="text-[10px] text-zinc-600 w-28 shrink-0 mt-0.5">
                      {label}
                    </span>
                    <span className="text-xs font-semibold text-zinc-300">
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Deep dives */}
        {(user.lifestyle_snapshot ||
          user.deal_breakers ||
          user.relationship_vision) && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Story
            </p>
            {[
              ["Lifestyle snapshot", user.lifestyle_snapshot],
              ["Deal-breakers", user.deal_breakers],
              ["Relationship vision", user.relationship_vision],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] text-zinc-600 font-semibold">
                    {label}
                  </p>
                  <p className="text-sm text-zinc-300">{value}</p>
                </div>
              ))}
          </div>
        )}

        {/* Prompt */}
        {user.prompt_question && (
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1.5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
              {user.prompt_question}
            </p>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {user.prompt_answer || (
                <span className="italic text-zinc-600">No answer yet.</span>
              )}
            </p>
          </div>
        )}

        {/* Quick takes from JSONB */}
        {[
          ["I could talk for hours about…", answers.passion_signal],
          ["People tend to misread me as…", answers.misunderstood_trait],
          ["What I&apos;m actively working on…", answers.growth_focus],
          ["My typical weekend…", answers.weekend_activity],
          ["What genuinely makes me happy…", answers.happiness_trigger],
        ]
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label as string} className="space-y-0.5">
              <p className="text-[10px] text-zinc-600 font-semibold">{label}</p>
              <p className="text-sm text-zinc-300">{value}</p>
            </div>
          ))}

        {!user.bio_headline &&
          (user.interests ?? []).length === 0 &&
          !user.intent &&
          !user.prompt_question &&
          !answers.passion_signal && (
            <p className="text-sm text-zinc-600 italic">
              This user has not filled in any profile content yet.
            </p>
          )}
      </div>

      {/* ── Handshakes ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <SectionHeading>Handshakes ({handshakes.length})</SectionHeading>
        </div>

        {handshakes.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-600 text-sm">
            No handshakes yet.
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {handshakes.map((h, i) => (
              <div
                key={h.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < handshakes.length - 1 ? "border-b border-zinc-800/60" : ""}`}
              >
                {/* Partner avatar */}
                {h.partner?.profileImage ? (
                  <img
                    src={h.partner.profileImage}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">
                      {h.partner?.name?.[0] ?? "?"}
                    </span>
                  </div>
                )}

                {/* Partner info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {h.partner?.name ?? "Deleted User"}
                    </p>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border shrink-0 ${
                        h.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-zinc-700/40 text-zinc-500 border-zinc-600/40"
                      }`}
                    >
                      {h.status === "active" ? "Active" : "Closed"}
                    </span>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider shrink-0">
                      via {h.origin}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Last active {timeAgo(h.lastActivityAt)} · Connected{" "}
                    {fmtDate(h.createdAt)}
                  </p>
                </div>

                {/* View link */}
                {h.partner && !h.partner.isBanned && (
                  <Link
                    href={`/admin/users/${h.partnerId}`}
                    className="shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  >
                    View →
                  </Link>
                )}
                {h.partner?.isBanned && (
                  <span className="shrink-0 text-[10px] text-red-400/60 font-bold">
                    Banned
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reports filed against this user ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flag className="w-3.5 h-3.5 text-zinc-500" />
          <SectionHeading>
            Reports Against This User ({reportRows.length})
          </SectionHeading>
        </div>

        {reportRows.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-600 text-sm">
            No reports on record.
          </div>
        ) : (
          <div className="space-y-3">
            {reportRows.map((r) => {
              const reporter = reporterMap.get(r.reporterId);
              return (
                <div
                  key={r.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${REPORT_STATUS_STYLE[r.status] ?? ""}`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                      <span className="text-xs font-semibold text-zinc-300">
                        {REPORT_REASON_LABEL[r.reason] ?? r.reason}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-600 shrink-0">
                      {fmtDate(r.createdAt)}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {r.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-600">
                    <span>
                      Reported by{" "}
                      {reporter ? (
                        <Link
                          href={`/admin/users/${r.reporterId}`}
                          className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                        >
                          {reporter.name}
                        </Link>
                      ) : (
                        "Deleted User"
                      )}
                    </span>
                    {r.reviewedAt && (
                      <span>Reviewed {fmtDate(r.reviewedAt)}</span>
                    )}
                  </div>

                  {r.adminNote && (
                    <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                        Admin Note
                      </p>
                      <p className="text-xs text-zinc-300">{r.adminNote}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
