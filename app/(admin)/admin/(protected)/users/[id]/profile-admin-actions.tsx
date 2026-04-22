"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  ShieldOff,
  ShieldCheck,
  ChevronDown,
  X,
} from "lucide-react";
import { sendWarning, suspendUser, unsuspendUser, banUser } from "../actions";
import {
  ADMIN_WARNING_COPY,
  SUSPENSION_COPY,
  UNSUSPENSION_COPY,
  ADMIN_BAN_COPY,
} from "@/lib/moderation-copy";

type Variant = "amber" | "orange" | "green" | "red";

type PendingAction = {
  label: string;
  messageType: "warning" | "announcement";
  preview: string;
  confirmLabel: string;
  variant: Variant;
  run: () => Promise<{ error?: string }>;
};

const CONFIRM_BTN: Record<Variant, string> = {
  amber:
    "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-600/40",
  orange:
    "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-600/40",
  green:
    "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-600/40",
  red: "bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/40",
};

const MSG_TYPE_STYLE: Record<string, string> = {
  warning: "bg-red-900/50 text-red-400 border-red-800",
  announcement: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
};
const MSG_TYPE_LABEL: Record<string, string> = {
  warning: "⚠️ Warning",
  announcement: "📢 Announcement",
};

function PreviewModal({
  pending,
  recipientName,
  onCancel,
  onConfirm,
  isRunning,
  error,
}: {
  pending: PendingAction;
  recipientName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isRunning: boolean;
  error: string | null;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <p className="text-white font-bold text-sm">{pending.label}</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              Recipient: <span className="text-zinc-300">{recipientName}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
            Delivered to the user&apos;s notification feed and via push
            notification.
          </p>
          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
        </div>

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
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${CONFIRM_BTN[pending.variant]}`}
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

export function ProfileAdminActions({
  userId,
  userName,
  isBanned,
  isSuspended,
  warningCount,
}: {
  userId: string;
  userName: string;
  isBanned: boolean;
  isSuspended: boolean;
  warningCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function schedule(action: PendingAction) {
    setOpen(false);
    setError(null);
    setPending(action);
  }

  function confirm() {
    if (!pending) return;
    startTransition(async () => {
      const result = await pending.run();
      if (result?.error) {
        setError(result.error);
      } else {
        setPending(null);
        router.refresh();
      }
    });
  }

  if (isBanned) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-400/70 font-bold px-3 py-1.5 bg-red-900/20 border border-red-800/40 rounded-lg">
        <Ban className="w-3.5 h-3.5" />
        Permanently Banned
      </span>
    );
  }

  return (
    <>
      {pending && (
        <PreviewModal
          pending={pending}
          recipientName={userName}
          onCancel={() => {
            if (!isPending) {
              setPending(null);
              setError(null);
            }
          }}
          onConfirm={confirm}
          isRunning={isPending}
          error={error}
        />
      )}

      <div className="relative inline-block">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          Moderation Actions
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {open && (
          <div className="absolute right-0 z-20 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1.5 w-60 overflow-hidden">
            {/* Warning */}
            {warningCount < 3 ? (
              <button
                onClick={() =>
                  schedule({
                    label: `Send Warning (${warningCount + 1}/3)`,
                    messageType: "warning",
                    preview:
                      ADMIN_WARNING_COPY[warningCount + 1] ??
                      ADMIN_WARNING_COPY[3],
                    confirmLabel: "Send Warning",
                    variant: "amber",
                    run: () => sendWarning(userId),
                  })
                }
                className="w-full flex items-center gap-3 px-4 py-2.5 text-amber-400 hover:bg-zinc-800 transition-colors text-left"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">
                  Send Warning{" "}
                  <span className="text-amber-600">({warningCount}/3)</span>
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 text-zinc-600">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">Max warnings sent</span>
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
                    variant: "green",
                    run: () => unsuspendUser(userId),
                  })
                }
                className="w-full flex items-center gap-3 px-4 py-2.5 text-emerald-400 hover:bg-zinc-800 transition-colors text-left"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">Lift Suspension</span>
              </button>
            ) : (
              <button
                onClick={() =>
                  schedule({
                    label: "Suspend Account",
                    messageType: "warning",
                    preview: SUSPENSION_COPY,
                    confirmLabel: "Suspend Account",
                    variant: "orange",
                    run: () => suspendUser(userId),
                  })
                }
                className="w-full flex items-center gap-3 px-4 py-2.5 text-orange-400 hover:bg-zinc-800 transition-colors text-left"
              >
                <ShieldOff className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">Suspend Account</span>
              </button>
            )}

            <div className="border-t border-zinc-800 my-1" />

            {/* Ban */}
            {warningCount >= 3 ? (
              <button
                onClick={() =>
                  schedule({
                    label: "Permanent Ban",
                    messageType: "warning",
                    preview: ADMIN_BAN_COPY,
                    confirmLabel: "Ban Permanently",
                    variant: "red",
                    run: () => banUser(userId),
                  })
                }
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-950/60 transition-colors text-left"
              >
                <Ban className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">Ban Permanently</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 text-zinc-600 cursor-not-allowed">
                <Ban className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">
                  Ban{" "}
                  <span className="text-zinc-700">
                    (need {3 - warningCount} more warning
                    {3 - warningCount !== 1 ? "s" : ""})
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
