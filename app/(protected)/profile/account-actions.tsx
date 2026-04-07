"use client";

import * as React from "react";
import {
  LogOut,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { logout, deleteAccount } from "./actions";

// ---------------------------------------------------------------------------
// Logout button
// ---------------------------------------------------------------------------

export function LogoutButton() {
  const [pending, setPending] = React.useState(false);

  const handleLogout = async () => {
    setPending(true);
    await logout();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="w-full flex items-center justify-between px-4 py-4 bg-card rounded-2xl border border-border hover:border-foreground/30 transition-all group disabled:opacity-60"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <LogOut className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <span className="text-sm font-bold text-foreground">
          {pending ? "Signing out…" : "Log Out"}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Delete account — double confirmation
// ---------------------------------------------------------------------------

type Step = "idle" | "confirm1" | "confirm2" | "deleting";

export function DeleteAccountButton() {
  const [step, setStep] = React.useState<Step>("idle");
  const [confirmText, setConfirmText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const canDelete = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!canDelete) return;
    setStep("deleting");
    setError(null);
    const result = await deleteAccount();
    if (result?.error) {
      setError(result.error);
      setStep("confirm2");
    }
  };

  const reset = () => {
    setStep("idle");
    setConfirmText("");
    setError(null);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setStep("confirm1")}
        className="w-full flex items-center justify-between px-4 py-4 bg-card rounded-2xl border border-border hover:border-red-500/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
            <Trash2 className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-sm font-bold text-red-500">Delete Account</span>
        </div>
      </button>

      {/* ── Step 1: First confirmation overlay ── */}
      {step === "confirm1" && (
        <Modal onClose={reset}>
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight">
                Delete your account?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
                This is{" "}
                <span className="font-bold text-foreground">permanent</span>.
                Your profile, photos, conversations, and vouch codes will be
                wiped and cannot be recovered.
              </p>
            </div>
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                onClick={() => setStep("confirm2")}
                className="w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all active:scale-[0.98]"
              >
                Yes, delete my account
              </button>
              <button
                onClick={reset}
                className="w-full py-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Step 2: Type DELETE to confirm ── */}
      {(step === "confirm2" || step === "deleting") && (
        <Modal onClose={step === "deleting" ? undefined : reset}>
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mt-0.5">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black tracking-tight leading-tight">
                  Final confirmation
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Type{" "}
                  <span className="font-mono font-bold text-foreground">
                    DELETE
                  </span>{" "}
                  in the field below to permanently erase your account and all
                  associated data.
                </p>
              </div>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={step === "deleting"}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 disabled:opacity-50 transition-all"
            />

            {error && (
              <p className="text-xs font-bold text-red-500 -mt-2">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={!canDelete || step === "deleting"}
                className="w-full py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 disabled:bg-muted disabled:text-muted-foreground text-white font-bold text-sm transition-all active:scale-[0.98] disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {step === "deleting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Permanently Delete"
                )}
              </button>
              <button
                onClick={reset}
                disabled={step === "deleting"}
                className="w-full py-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Copy button for vouch codes
// ---------------------------------------------------------------------------

export function CopyButtonClient({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] font-black uppercase tracking-widest bg-muted px-3 py-1.5 rounded-full text-muted-foreground hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared modal shell
// ---------------------------------------------------------------------------

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  // Trap focus & close on backdrop click
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-[340px] bg-card rounded-[2rem] p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
