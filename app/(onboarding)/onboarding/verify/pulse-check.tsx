"use client";

import * as React from "react";
import { MapPin, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyLocation } from "./actions";
import { cn } from "@/lib/utils";

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
        setError(`Telemetry Error: ${err.message}`);
        setIsScanning(false);
      },
      {
        enableHighAccuracy: true,
        // Never use a cached position — always acquire a fresh GPS fix.
        // This prevents stale readings (e.g. from a VPN or prior session)
        // from producing wildly incorrect distances.
        maximumAge: 0,
        timeout: 15_000,
      },
    );
  };

  return (
    <div
      className="group relative flex flex-col justify-between p-10 border-2 border-foreground/10 bg-background text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-500 ease-expo min-h-[360px] cursor-pointer"
      onClick={handlePulse}
    >
      <div className="space-y-8 relative z-10">
        <MapPin
          className={cn(
            "w-12 h-12 stroke-[1.2]",
            isScanning && "animate-pulse",
          )}
        />
        <div className="space-y-3">
          <h3 className="text-4xl font-black tracking-tighter uppercase leading-none italic">
            Geo-Fence
          </h3>
          <p className="text-sm font-medium transition-colors duration-500 text-muted-foreground group-hover:text-background/70">
            {isScanning
              ? "Triangulating..."
              : "Instant clearance via GPS. Physical presence required."}
          </p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {error && (
          <div className="flex items-start justify-between gap-2 p-2 bg-destructive/10 border border-destructive/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-destructive group-hover:text-destructive-foreground">
              {"// [Auth_Fail]: "}
              {error}
            </p>
            <button
              onClick={copyError}
              className="p-1 hover:bg-foreground/10 rounded transition-colors"
              title="Copy error message"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full h-14 rounded-none border-2 border-foreground/20 bg-transparent font-black uppercase tracking-widest group-hover:border-background group-hover:bg-background group-hover:text-foreground"
        >
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Initiate Pulse"
          )}
        </Button>
      </div>
    </div>
  );
}
