"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  AlertTriangle,
  Ban,
  ShieldOff,
  ShieldCheck,
  X,
  Eye,
} from "lucide-react";
import { sendWarning, suspendUser, unsuspendUser, banUser } from "./actions";
import {
  ADMIN_WARNING_COPY,
  SUSPENSION_COPY,
  UNSUSPENSION_COPY,
  ADMIN_BAN_COPY,
} from "@/lib/moderation-copy";

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
  isSuspended: boolean | null;
  warningCount: number | null;
  createdAt: Date;
};

type PendingAction = {
  label: string;
  messageType: "warning" | "announcement";
  preview: string;
  confirmLabel: string;
  confirmVariant: "amber" | "orange" | "green" | "red";
  run: () => Promise<{ error?: string }>;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  pending_review: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  banned: "bg-red-900/20 text-red-300 border-red-700/40",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  unverified: "bg-zinc-700/40 text-zinc-400 border-zinc-600/40",
};

const STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  pending_review: "Pending",
  rejected: "Rejected",
  banned: "Banned",
  suspended: "Suspended",
  unverified: "Unverified",
};

function StatusBadge({
  status,
  isBanned,
  isSuspended,
}: {
  status: VerificationStatus | null;
  isBanned: boolean | null;
  isSuspended: boolean | null;
}) {
  const key = isBanned
    ? "banned"
    : isSuspended
      ? "suspended"
      : (status ?? "unverified");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[key] ?? STATUS_STYLES.unverified}`}
    >
      {STATUS_LABELS[key] ?? "Unknown"}
    </span>
  );
}

// ─── Message type badge (used inside the preview modal) ───────────────────────

const MSG_TYPE_STYLE: Record<string, string> = {
  warning: "bg-red-900/50 text-red-400 border-red-800",
  announcement: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
};

const MSG_TYPE_LABEL: Record<string, string> = {
  warning: "⚠️ Warning",
  announcement: "📢 Announcement",
};

// ─── Preview modal ────────────────────────────────────────────────────────────

const CONFIRM_BTN: Record<PendingAction["confirmVariant"], string> = {
  amber:
    "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-600/40",
  orange:
    "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-600/40",
  green:
    "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-600/40",
  red: "bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/40",
};

function PreviewModal({
  pending,
  user,
  onCancel,
  onConfirm,
  isRunning,
}: {
  pending: PendingAction;
  user: User;
  onCancel: () => void;
  onConfirm: () => void;
  isRunning: boolean;
}) {
  // Trap focus — close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="space-y-0.5">
            <p className="text-white font-bold text-sm">{pending.label}</p>
            <p className="text-zinc-500 text-xs">
              Recipient:{" "}
              <span className="text-zinc-300">
                {user.name} · {user.email}
              </span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview */}
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${MSG_TYPE_STYLE[pending.messageType]}`}
            >
              {MSG_TYPE_LABEL[pending.messageType]}
            </span>
            <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
              Message preview
            </span>
          </div>

          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4">
            <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
              {pending.preview}
            </p>
          </div>

          <p className="text-xs text-zinc-600">
            This message will be delivered to the user&apos;s notification feed
            and via push notification.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRunning}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${CONFIRM_BTN[pending.confirmVariant]}`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Sending…
              </span>
            ) : (
              pending.confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Per-row action menu ──────────────────────────────────────────────────────

function UserActions({
  user,
  onSchedule,
}: {
  user: User;
  onSchedule: (action: PendingAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isBanned = !!user.isBanned;
  const isSuspended = !!user.isSuspended;
  const warnings = user.warningCount ?? 0;

  function schedule(action: PendingAction) {
    setOpen(false);
    onSchedule(action);
  }

  if (isBanned) {
    return (
      <span className="text-[10px] text-red-400/60 font-black uppercase tracking-wider">
        Banned
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
        aria-label="User actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1.5 w-52 text-sm overflow-hidden">
          {/* Warning */}
          {warnings < 3 ? (
            <button
              onClick={() =>
                schedule({
                  label: `Send Warning (${warnings + 1}/3)`,
                  messageType: "warning",
                  preview:
                    ADMIN_WARNING_COPY[warnings + 1] ?? ADMIN_WARNING_COPY[3],
                  confirmLabel: "Send Warning",
                  confirmVariant: "amber",
                  run: () => sendWarning(user.id),
                })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-400 hover:bg-zinc-800 transition-colors text-left"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-semibold">
                Send Warning{" "}
                <span className="text-amber-600">({warnings}/3)</span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 text-zinc-600">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-semibold">Max warnings sent</span>
            </div>
          )}

          <div className="border-t border-zinc-800 my-1" />

          {/* Suspend / Unsuspend */}
          {isSuspended ? (
            <button
              onClick={() =>
                schedule({
                  label: "Lift Suspension",
                  messageType: "announcement",
                  preview: UNSUSPENSION_COPY,
                  confirmLabel: "Lift Suspension",
                  confirmVariant: "green",
                  run: () => unsuspendUser(user.id),
                })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 text-emerald-400 hover:bg-zinc-800 transition-colors text-left"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-semibold">Lift Suspension</span>
            </button>
          ) : (
            <button
              onClick={() =>
                schedule({
                  label: "Suspend Account",
                  messageType: "warning",
                  preview: SUSPENSION_COPY,
                  confirmLabel: "Suspend Account",
                  confirmVariant: "orange",
                  run: () => suspendUser(user.id),
                })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 text-orange-400 hover:bg-zinc-800 transition-colors text-left"
            >
              <ShieldOff className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-semibold">Suspend Account</span>
            </button>
          )}

          <div className="border-t border-zinc-800 my-1" />

          {/* Ban */}
          {warnings >= 3 ? (
            <button
              onClick={() =>
                schedule({
                  label: "Permanent Ban",
                  messageType: "warning",
                  preview: ADMIN_BAN_COPY,
                  confirmLabel: "Ban Permanently",
                  confirmVariant: "red",
                  run: () => banUser(user.id),
                })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-950/60 transition-colors text-left"
            >
              <Ban className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-semibold">Ban Permanently</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 text-zinc-600 cursor-not-allowed">
              <Ban className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-semibold">
                Ban{" "}
                <span className="text-zinc-700">
                  (need {3 - warnings} more warning
                  {3 - warnings !== 1 ? "s" : ""})
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────

export function UsersListClient({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered =
    query.trim() === ""
      ? users
      : users.filter(
          (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase()) ||
            u.university.toLowerCase().includes(query.toLowerCase()),
        );

  function openModal(user: User, action: PendingAction) {
    setActiveUser(user);
    setPendingAction(action);
    setActionError(null);
  }

  function closeModal() {
    if (isPending) return;
    setPendingAction(null);
    setActiveUser(null);
    setActionError(null);
  }

  function confirm() {
    if (!pendingAction) return;
    startTransition(async () => {
      const result = await pendingAction.run();
      if (result?.error) {
        setActionError(result.error);
      } else {
        setPendingAction(null);
        setActiveUser(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Preview modal */}
      {pendingAction && activeUser && (
        <PreviewModal
          pending={pendingAction}
          user={activeUser}
          onCancel={closeModal}
          onConfirm={confirm}
          isRunning={isPending}
        />
      )}

      {/* Action error (shown outside modal if needed) */}
      {actionError && !pendingAction && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-300 text-sm rounded-xl px-4 py-3">
          {actionError}
        </div>
      )}

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

      {/* ── Mobile card list (< sm) ───────────────────────────────────────── */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-2xl">
            {query ? "No users match your search." : "No users yet."}
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              {/* Avatar */}
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt=""
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">
                    {user.name[0]}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-semibold truncate">
                    {user.name}
                  </p>
                  <StatusBadge
                    status={user.verificationStatus}
                    isBanned={user.isBanned}
                    isSuspended={user.isSuspended}
                  />
                </div>
                <p className="text-zinc-500 text-xs truncate mt-0.5">
                  {user.email}
                </p>
                <p className="text-zinc-600 text-xs mt-0.5 truncate">
                  {user.university} · {user.level}
                </p>
                {(user.warningCount ?? 0) > 0 && !user.isBanned && (
                  <p className="text-amber-500/80 text-[10px] font-semibold mt-1">
                    ⚠️ {user.warningCount}/3 warnings
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-1">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                  aria-label="View profile"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <UserActions
                  user={user}
                  onSchedule={(action) => openModal(user, action)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table (≥ sm) ──────────────────────────────────────────── */}
      <div className="hidden sm:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[25%] hidden md:table-column" />
            <col className="w-[8%]" />
            <col className="w-[15%]" />
            <col className="w-[20%] hidden lg:table-column" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/30">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">
                User
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden md:table-cell">
                University
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Lvl
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hidden lg:table-cell">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors"
              >
                {/* User */}
                <td className="px-4 py-3 max-w-0">
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
                      {(user.warningCount ?? 0) > 0 && !user.isBanned && (
                        <p className="text-amber-500/80 text-[10px] font-semibold mt-0.5">
                          ⚠️ {user.warningCount}/3 warnings
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* University */}
                <td className="px-4 py-3 hidden md:table-cell max-w-0">
                  <p className="text-zinc-300 text-sm capitalize truncate">
                    {user.university}
                  </p>
                  <p className="text-zinc-500 text-xs truncate">
                    {user.department}
                  </p>
                </td>

                {/* Level */}
                <td className="px-4 py-3">
                  <span className="text-zinc-300 text-sm">{user.level}</span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge
                    status={user.verificationStatus}
                    isBanned={user.isBanned}
                    isSuspended={user.isSuspended}
                  />
                </td>

                {/* Joined */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-zinc-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
                      aria-label="View profile"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <UserActions
                      user={user}
                      onSchedule={(action) => openModal(user, action)}
                    />
                  </div>
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
  );
}
