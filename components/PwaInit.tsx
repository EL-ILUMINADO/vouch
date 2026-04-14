"use client";

import * as React from "react";
import Image from "next/image";
import { X } from "lucide-react";

const DISMISS_KEY = "vouch_pwa_banner_dismissed";

/**
 * Mounted in the root layout.
 * 1. Registers /sw.js so caching + push work on every page.
 * 2. Captures the browser's beforeinstallprompt event.
 * 3. Shows a dismissable "Add to Home Screen" banner when installable.
 */
export function PwaInit() {
  const [promptEvent, setPromptEvent] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    // Register the service worker.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }

    // Already running as a standalone PWA — no banner needed.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Already dismissed this session.
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setShowBanner(true);
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
    sessionStorage.setItem(DISMISS_KEY, "1");
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
