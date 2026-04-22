"use client";

import { useState } from "react";
import { Clock, Heart, RotateCcw } from "lucide-react";
import { reLikeUser } from "./actions/connection";

interface ClosedChatBannerProps {
  /** True when the current user is the one who let 24 h pass without responding */
  isAtFault: boolean;
  otherUserId: string;
  otherUserName: string;
}

export function ClosedChatBanner({
  isAtFault,
  otherUserId,
  otherUserName,
}: ClosedChatBannerProps) {
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");

  const handleReLike = async () => {
    setState("loading");
    await reLikeUser(otherUserId);
    setState("sent");
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 text-center space-y-5">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Clock className="w-7 h-7 text-muted-foreground" />
      </div>

      <div className="space-y-1.5 max-w-xs">
        <h2 className="text-lg font-black text-foreground tracking-tight">
          Chat Closed
        </h2>
        {isAtFault ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            You didn&apos;t respond within 24 hours. Like{" "}
            <span className="font-bold text-foreground">{otherUserName}</span>{" "}
            again to ask for another chance — if they accept, your conversation
            will continue from where you left off.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">{otherUserName}</span>{" "}
            didn&apos;t respond within 24 hours. If they like you again, you can
            choose to accept or pass — your history will still be there.
          </p>
        )}
      </div>

      {isAtFault && state !== "sent" && (
        <button
          onClick={handleReLike}
          disabled={state === "loading"}
          className="h-12 px-8 rounded-2xl bg-rose-500 text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-60"
        >
          {state === "loading" ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className="w-4 h-4 fill-white" />
          )}
          {state === "loading" ? "Sending..." : "Like Again"}
        </button>
      )}

      {state === "sent" && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
          <Heart className="w-4 h-4 fill-current" />
          Like sent — waiting for {otherUserName} to accept.
        </div>
      )}
    </div>
  );
}
