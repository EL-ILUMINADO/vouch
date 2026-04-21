"use client";

import * as React from "react";
import Image from "next/image";
import { X } from "lucide-react";

const DISMISS_KEY = "vouch_pwa_dismissed_at";
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - parseInt(raw) < SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * Mounted in the root layout.
 * 1. Registers /sw.js so caching + push work on every page.
 * 2. Captures the browser's beforeinstallprompt event.
 * 3. Shows a dismissable "Add to Home Screen" banner when installable.
 *    Dismissed state persists for 30 days via localStorage so the banner
 *    doesn't reappear on every route change or new session.
 */
export function PwaInit() {
  const [promptEvent, setPromptEvent] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }

    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (isDismissedRecently()) return;

    const handler = (e: Event) => {
      if (isDismissedRecently()) return;

      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);

      // Remove immediately — beforeinstallprompt re-fires on every client-side
      // navigation in some browsers, so we self-destruct after the first capture
      // to prevent the banner queuing up on every route change.
      window.removeEventListener("beforeinstallprompt", handler);

      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setShowBanner(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-60 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Vouch"
          width={40}
          height={40}
          className="rounded-xl shrink-0"
          style={{ height: "auto" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            Add Vouch to your home screen
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Instant access, no app store needed
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Augment the Window type for the non-standard event.
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}
