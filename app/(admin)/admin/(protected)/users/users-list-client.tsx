"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

type VerificationStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "rejected"
  | "banned";

type User = {
  id: string;
  name: string;
  email: string;
  university: string;
  department: string;
  level: string;
  profileImage: string | null;
  verificationStatus: VerificationStatus | null;
  isBanned: boolean | null;
  createdAt: Date;
};

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pending_review: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  banned: "bg-red-900/20 text-red-300 border-red-700/40",
  unverified: "bg-zinc-700/40 text-zinc-400 border-zinc-600/40",
};

const STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  pending_review: "Pending",
  rejected: "Rejected",
  banned: "Banned",
  unverified: "Unverified",
};

function StatusBadge({
  status,
  isBanned,
}: {
  status: VerificationStatus | null;
  isBanned: boolean | null;
}) {
  const key = isBanned ? "banned" : (status ?? "unverified");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[key] ?? STATUS_STYLES.unverified}`}
    >
      {STATUS_LABELS[key] ?? "Unknown"}
    </span>
  );
}

export function UsersListClient({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");

  const filtered =
    query.trim() === ""
      ? users
      : users.filter(
          (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase()) ||
            u.university.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, email, or university…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {query.trim() !== "" && (
        <p className="text-zinc-500 text-sm">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/30">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  User
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden md:table-cell">
                  University
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden sm:table-cell">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden lg:table-cell">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt=""
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-sm">
                            {user.name[0]}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {user.name}
                        </p>
                        <p className="text-zinc-500 text-xs truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-zinc-300 text-sm capitalize">
                      {user.university}
                    </p>
                    <p className="text-zinc-500 text-xs">{user.department}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-zinc-300 text-sm">{user.level}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={user.verificationStatus}
                      isBanned={user.isBanned}
                    />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-zinc-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-zinc-500 text-sm">
              {query ? "No users match your search." : "No users yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
