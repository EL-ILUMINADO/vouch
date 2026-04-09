"use client";

import { AlertCircle } from "lucide-react";

const BROWSER_GUIDES = [
  {
    icon: "🌐",
    label: "Chrome / Edge",
    steps:
      'Click the lock icon in the address bar → Permissions → set Camera & Mic to "Allow", then reload.',
  },
  {
    icon: "🦊",
    label: "Firefox",
    steps:
      "Click the lock icon → Connection Secure → More Information → Permissions tab → unblock Camera & Microphone.",
  },
  {
    icon: "🧭",
    label: "Safari",
    steps:
      "Safari menu → Settings for This Website → Camera & Microphone → Allow.",
  },
] as const;

/**
 * Shown when getUserMedia() throws — meaning the user explicitly denied the
 * camera/mic prompt, or the browser blocked it via a previously-saved choice.
 *
 * We can't programmatically re-request permissions once denied; the user must
 * change the setting themselves. This component gives them the exact steps for
 * the three major desktop browsers.
 *
 * No props — purely informational, no interactivity needed.
 */
export function PermissionDeniedFallback() {
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-rose-400" />
      </div>

      <div className="space-y-1.5">
        <p className="font-bold text-white">Camera access blocked</p>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
          Vouch needs your camera and microphone to verify you&apos;re a real
          person. No footage is stored without your approval.
        </p>
      </div>

      <div className="w-full space-y-2 text-left">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          How to enable in your browser
        </p>

        {BROWSER_GUIDES.map(({ icon, label, steps }) => (
          <div
            key={label}
            className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/80"
          >
            <span className="text-base leading-none mt-0.5">{icon}</span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-zinc-300">{label}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{steps}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
