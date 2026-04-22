/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Users } from "lucide-react";
import { SectionHeading } from "./ui";
import { timeAgo, fmtDate } from "./utils";

type Handshake = {
  id: string;
  status: string;
  origin: string;
  lastActivityAt: Date | string;
  createdAt: Date | string;
  partnerId: string;
  partner?: {
    id: string;
    name: string;
    profileImage: string | null;
    isBanned: boolean;
  };
};

export function UserHandshakes({ handshakes }: { handshakes: Handshake[] }) {
  return (
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
  );
}
