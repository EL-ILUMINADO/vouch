"use client";

import * as React from "react";
import { MapPin, Loader2, Copy, Check } from "lucide-react";
import { verifyLocation } from "./actions";

export function PulseCheck() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const copyError = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (error) {
      navigator.clipboard.writeText(error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePulse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsScanning(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await verifyLocation(
          position.coords.latitude,
          position.coords.longitude,
        );

        if (result?.error) {
          setError(result.error);
          setIsScanning(false);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsScanning(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15_000,
      },
    );
  };

  return (
    <div
      className="group relative flex flex-col justify-between p-8 rounded-3xl border-2 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 text-foreground hover:border-rose-400 dark:hover:border-rose-400/60 hover:shadow-lg transition-all duration-300 min-h-[320px] cursor-pointer"
      onClick={handlePulse}
    >
      <div className="space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-rose-500/15 flex items-center justify-center shadow-sm">
          <MapPin
            className={`w-6 h-6 text-rose-500 ${isScanning ? "animate-pulse" : ""}`}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight">Use my location</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isScanning
              ? "Getting your location…"
              : "Instant verification — just tap and confirm you're on campus."}
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        {error && (
          <div className="flex items-start justify-between gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <p className="text-xs font-medium text-destructive leading-relaxed flex-1">
              {error}
            </p>
            <button
              onClick={copyError}
              className="p-1 hover:bg-foreground/10 rounded-lg transition-colors shrink-0"
              title="Copy error"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}

        <button
          onClick={handlePulse}
          disabled={isScanning}
          className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-[0.98] shadow-md shadow-rose-200 dark:shadow-none"
        >
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Verify Location
            </>
          )}
        </button>
      </div>
    </div>
  );
}
