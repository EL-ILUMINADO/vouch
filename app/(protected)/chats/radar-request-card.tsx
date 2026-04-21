"use client";

import * as React from "react";
import { Radio, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { respondToRadarRequest } from "@/app/(protected)/radar/actions";

export interface PendingRadarRequest {
  requestId: string;
  senderId: string;
  senderName: string;
  senderDepartment: string;
  senderLevel: string;
  senderHideLevel: boolean;
}

export function RadarRequestCard({
  request,
}: {
  request: PendingRadarRequest;
}) {
  const [state, setState] = React.useState<"idle" | "busy" | "done">("idle");

  const handle = async (action: "accepted" | "declined") => {
    setState("busy");
    try {
      await respondToRadarRequest(request.requestId, action);
      if (action === "declined") {
        toast.info(`Declined ${request.senderName}'s ping.`);
        setState("done");
      }
      // Accepted → server redirects to /uplink/... automatically.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("NEXT_REDIRECT")) {
        toast.error(msg || "Something went wrong.");
        setState("idle");
      }
    }
  };

  if (state === "done") return null;

  const levelLabel = request.senderHideLevel ? null : request.senderLevel;

  return (
    <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-card border border-rose-200 dark:border-rose-800/50 shadow-sm animate-in fade-in duration-300">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-lg">
          {request.senderName[0]}
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-background flex items-center justify-center">
          <Radio className="w-2.5 h-2.5 text-white" />
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground truncate">
          {request.senderName}
        </p>
        <p className="text-[10px] text-muted-foreground font-medium truncate">
          {request.senderDepartment}
          {levelLabel ? ` • ${levelLabel}` : ""}
        </p>
        <p className="text-[10px] text-rose-500 font-bold mt-0.5 uppercase tracking-widest">
          Radar Ping
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => handle("declined")}
          disabled={state === "busy"}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-950/20 transition-all disabled:opacity-40"
          aria-label="Decline"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => handle("accepted")}
          disabled={state === "busy"}
          className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-60"
          aria-label="Accept"
        >
          {state === "busy" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Radio className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
