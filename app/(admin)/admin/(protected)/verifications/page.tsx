import Image from "next/image";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { VerificationActionButtons } from "./verification-actions-client";
import {
  ShieldCheck,
  Clock,
  GraduationCap,
  Mail,
  Building2,
  Hash,
} from "lucide-react";

// Always fetch fresh data — pending submissions must appear immediately.
export const dynamic = "force-dynamic";

async function getPendingVerifications() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      university: users.university,
      department: users.department,
      level: users.level,
      verificationVideoUrl: users.verificationVideoUrl,
      verificationMethod: users.verificationMethod,
      profileImage: users.profileImage,
      images: users.images,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.verificationStatus, "pending_review"))
    .orderBy(users.createdAt);
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function VerificationsPage() {
  const pending = await getPendingVerifications();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Verifications</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {pending.length} submission{pending.length !== 1 ? "s" : ""}{" "}
            awaiting review
          </p>
        </div>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-16 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 font-medium">
            All caught up — no pending verifications.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.map((user) => (
            <div
              key={user.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              {/* ── Card header ── */}
              <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-black text-lg shrink-0">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-bold text-base leading-tight">
                      {user.name}
                    </p>
                    <p className="text-zinc-400 text-xs mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {timeAgo(new Date(user.createdAt))}
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-700 rounded-full text-zinc-300 text-[10px] font-bold uppercase tracking-widest">
                    {user.verificationMethod ?? "liveness"}
                  </span>
                </div>
              </div>

              {/* ── Two-column body ── */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
                {/* ── Video panel ── */}
                <div className="bg-black flex items-center justify-center min-h-90">
                  {user.verificationVideoUrl ? (
                    <video
                      src={user.verificationVideoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-130 object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-16 text-zinc-600">
                      <ShieldCheck className="w-10 h-10" />
                      <p className="text-sm">No video submitted.</p>
                    </div>
                  )}
                </div>

                {/* ── Info + actions panel ── */}
                <div className="flex flex-col justify-between p-6 border-t lg:border-t-0 lg:border-l border-zinc-800 gap-6">
                  {/* Identity details */}
                  <div className="space-y-4">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                      Identity Details
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5">
                        <GraduationCap className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                            University
                          </p>
                          <p className="text-white text-sm font-semibold capitalize">
                            {user.university}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Building2 className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                            Department
                          </p>
                          <p className="text-white text-sm font-semibold">
                            {user.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Hash className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                            Level
                          </p>
                          <p className="text-white text-sm font-semibold">
                            {user.level}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                            Email
                          </p>
                          <p className="text-white text-sm font-semibold break-all">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Photos */}
                  {(user.profileImage ||
                    (user.images && user.images.length > 0)) && (
                    <div className="space-y-2">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                        Profile Photos
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {user.profileImage && (
                          <a
                            href={user.profileImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative"
                            title="Profile photo"
                          >
                            <Image
                              src={user.profileImage}
                              alt="Profile"
                              width={200}
                              height={200}
                              className="w-full aspect-square object-cover rounded-lg ring-2 ring-rose-500/40"
                            />
                            <span className="absolute bottom-0.5 left-0.5 text-[8px] font-black uppercase tracking-widest bg-rose-500 text-white px-1 rounded">
                              main
                            </span>
                          </a>
                        )}
                        {user.images?.map((img, i) => (
                          <a
                            key={i}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Image
                              src={img}
                              alt={`Photo ${i + 1}`}
                              width={200}
                              height={200}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-zinc-800" />

                  {/* Action buttons */}
                  <VerificationActionButtons
                    userId={user.id}
                    userName={user.name}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
