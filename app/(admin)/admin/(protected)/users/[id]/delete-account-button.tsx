"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { deleteUser } from "../actions";

const CONFIRM_PHRASE = "Confirm delete";

export function DeleteAccountButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openModal() {
    setConfirmText("");
    setPassword("");
    setError(null);
    setOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUser(userId, password);
      if (result?.error) {
        setError(result.error);
      } else if (result?.deleted) {
        router.push("/admin/users");
      }
    });
  }

  const canSubmit =
    confirmText === CONFIRM_PHRASE && password.length > 0 && !isPending;

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-xl text-sm font-semibold text-red-400 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete Account
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-white font-bold text-sm">Delete Account</p>
              </div>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="text-zinc-500 hover:text-white transition-colors p-1 disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              <p className="text-sm text-zinc-300">
                You are about to permanently delete{" "}
                <span className="font-bold text-white">{userName}</span>
                &apos;s account. This will erase all their data including
                conversations, matches, and profile information.{" "}
                <span className="text-red-400 font-semibold">
                  This cannot be undone.
                </span>
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 tracking-wider">
                  Type &ldquo;{CONFIRM_PHRASE}&rdquo; to continue
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isPending}
                  placeholder={CONFIRM_PHRASE}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-700 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Admin password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  placeholder="Enter admin password"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-700 disabled:opacity-50"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 font-medium">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
