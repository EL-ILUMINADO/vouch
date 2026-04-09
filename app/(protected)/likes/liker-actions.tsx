"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";
import { likeBack, rejectLike } from "./actions";

interface LikerActionsProps {
  likerId: string;
}

export function LikerActions({ likerId }: LikerActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handleLikeBack = async () => {
    setState("loading");
    const result = await likeBack(likerId);
    if ("conversationId" in result) {
      router.push(`/uplink/${result.conversationId}`);
    } else {
      // Revert on error so the user can try again
      setState("idle");
    }
  };

  const handleReject = async () => {
    setState("loading");
    await rejectLike(likerId);
    setState("done");
  };

  // Slide out once rejected
  if (state === "done") return null;

  return (
    <div className="flex gap-1.5 mt-2">
      <button
        onClick={handleReject}
        disabled={state === "loading"}
        className="flex-1 h-9 rounded-xl border border-border text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-950/20 transition-all disabled:opacity-40"
        aria-label="Pass"
      >
        <X className="w-3.5 h-3.5" />
        Pass
      </button>
      <button
        onClick={handleLikeBack}
        disabled={state === "loading"}
        className="flex-1 h-9 rounded-xl bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm shadow-rose-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-60"
        aria-label="Like back"
      >
        <Heart className="w-3.5 h-3.5 fill-white" />
        {state === "loading" ? "..." : "Like"}
      </button>
    </div>
  );
}
