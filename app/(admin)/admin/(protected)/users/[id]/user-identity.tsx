/* eslint-disable @next/next/no-img-element */
import { Image as ImageIcon, ShieldAlert } from "lucide-react";
import { SectionHeading, InfoRow } from "./ui";
import { VERIFICATION_STATUS_STYLE } from "./constants";
import { timeAgo, fmtDate } from "./utils";

type User = {
  name: string;
  email: string;
  profileImage: string | null;
  images: string[] | null;
  university: string;
  department: string;
  level: string;
  gender: string | null;
  lookingFor: string | null;
  createdAt: Date | string;
  lastActiveAt: Date | string | null;
  radarPings: number;
  pingsResetAt: Date | string | null;
  verificationStatus: string | null;
  verificationMethod: string | null;
  isBanned: boolean;
  isSuspended: boolean;
  warningCount: number;
  trustScore: number;
  deviceId: string | null;
};

export function UserIdentity({ user }: { user: User }) {
  const photos = (user.images ?? []).filter(Boolean);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Avatar + photos */}
      <div className="lg:col-span-1 space-y-4">
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
  );
}
