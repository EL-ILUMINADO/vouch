"use client";

import * as React from "react";
import { MapPin, Loader2, Copy, Check, Signal } from "lucide-react";
import { verifyLocation } from "./actions";

/**
 * How many GPS samples to collect before picking the best one.
 * More samples → better chance of a tight fix; fewer → faster UX.
 */
const MAX_SAMPLES = 5;

/**
 * Stop early if we get a fix this accurate (metres). On a clear day outdoors
 * modern phones regularly hit 5-20 m; inside buildings expect 50-300 m.
 */
const EARLY_STOP_ACCURACY_M = 30;

/**
 * Wall-clock budget for sampling (ms). If MAX_SAMPLES haven't landed in this
 * time we use whatever we collected.
 */
const SAMPLE_BUDGET_MS = 20_000;

interface GpsSample {
  lat: number;
  lng: number;
  accuracyM: number;
}

function accuracyLabel(m: number): { text: string; colour: string } {
  if (m <= 30)
    return {
      text: `±${Math.round(m)} m — excellent`,
      colour: "text-emerald-500",
    };
  if (m <= 100)
    return { text: `±${Math.round(m)} m — good`, colour: "text-yellow-500" };
  if (m <= 300)
    return { text: `±${Math.round(m)} m — fair`, colour: "text-orange-500" };
  return { text: `±${Math.round(m)} m — poor`, colour: "text-rose-500" };
}

export function PulseCheck() {
  const [phase, setPhase] = React.useState<
    "idle" | "sampling" | "verifying" | "done"
  >("idle");
  const [sampleCount, setSampleCount] = React.useState(0);
  const [currentBestM, setCurrentBestM] = React.useState<number | null>(null);
  const [bestSample, setBestSample] = React.useState<GpsSample | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const watchIdRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const samplesRef = React.useRef<GpsSample[]>([]);

  const stopWatching = React.useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const submitBestSample = React.useCallback(async (samples: GpsSample[]) => {
    if (samples.length === 0) {
      setError("Could not obtain a GPS fix. Move to an open area and retry.");
      setPhase("idle");
      return;
    }

    // Pick the sample with the lowest (best) reported accuracy
    const best = samples.reduce((a, b) => (a.accuracyM <= b.accuracyM ? a : b));
    setBestSample(best);
    setPhase("verifying");

    const result = await verifyLocation(best.lat, best.lng, best.accuracyM);

    if (result?.error) {
      setError(result.error);
      setPhase("idle");
    }
    // On success, the server action redirects — no extra state needed.
  }, []);

  const handlePulse = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (phase !== "idle") return;

      setError(null);
      setSampleCount(0);
      setCurrentBestM(null);
      setBestSample(null);
      samplesRef.current = [];
      setPhase("sampling");

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const sample: GpsSample = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyM: position.coords.accuracy,
          };

          samplesRef.current = [...samplesRef.current, sample];
          setSampleCount(samplesRef.current.length);
          setCurrentBestM((prev) =>
            prev === null ? sample.accuracyM : Math.min(prev, sample.accuracyM),
          );

          // Early exit: good-enough fix found
          if (
            sample.accuracyM <= EARLY_STOP_ACCURACY_M ||
            samplesRef.current.length >= MAX_SAMPLES
          ) {
            stopWatching();
            submitBestSample(samplesRef.current);
          }
        },
        (err) => {
          stopWatching();
          setError(`Location error: ${err.message}`);
          setPhase("idle");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: SAMPLE_BUDGET_MS,
        },
      );

      // Hard deadline: stop sampling regardless after SAMPLE_BUDGET_MS
      timerRef.current = setTimeout(() => {
        stopWatching();
        submitBestSample(samplesRef.current);
      }, SAMPLE_BUDGET_MS);
    },
    [phase, stopWatching, submitBestSample],
  );

  const copyError = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (error) {
      navigator.clipboard.writeText(error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isScanning = phase === "sampling" || phase === "verifying";

  const statusText = React.useMemo(() => {
    if (phase === "sampling") {
      return sampleCount === 0
        ? "Acquiring GPS signal…"
        : `Refining fix… (${sampleCount}/${MAX_SAMPLES} samples)`;
    }
    if (phase === "verifying") return "Verifying location…";
    return "Instant verification — just tap and confirm you're on campus.";
  }, [phase, sampleCount]);

  return (
    <div
      className="group relative flex flex-col justify-between p-8 rounded-3xl border-2 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 text-foreground hover:border-rose-400 dark:hover:border-rose-400/60 hover:shadow-lg transition-all duration-300 min-h-[320px] cursor-pointer"
      onClick={isScanning ? undefined : handlePulse}
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
            {statusText}
          </p>
        </div>

        {/* Live accuracy indicator while sampling */}
        {phase === "sampling" && bestSample === null && sampleCount === 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Signal className="w-3 h-3 animate-pulse" />
            <span>Searching for satellites…</span>
          </div>
        )}
        {phase === "sampling" && sampleCount > 0 && currentBestM !== null && (
          <div className="flex items-center gap-2 text-xs">
            <Signal className="w-3 h-3" />
            <span className={accuracyLabel(currentBestM).colour}>
              Best fix so far: {accuracyLabel(currentBestM).text}
            </span>
          </div>
        )}
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
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {phase === "verifying" ? "Verifying…" : "Scanning…"}
            </>
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
