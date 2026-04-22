"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Heart } from "lucide-react";
import { pingUser, recordLike } from "@/app/(protected)/discover/actions";

export function PingLikeButtons({ userId }: { userId: string }) {
  const router = useRouter();
  const [pingLoading, setPingLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const handlePing = async () => {
    setPingLoading(true);
    try {
      const result = await pingUser(userId);
      if ("error" in result) return;
      router.push(`/uplink/${result.conversationId}`);
    } finally {
      setPingLoading(false);
    }
  };

  const handleLike = async () => {
    setLikeLoading(true);
    try {
      const result = await recordLike(userId);
      if (result.matched && result.conversationId) {
        router.push(`/uplink/${result.conversationId}`);
      } else {
        setLiked(true);
      }
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handlePing}
        disabled={pingLoading}
        className="flex-1 h-14 rounded-2xl bg-rose-500 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none active:scale-[0.98] transition-transform disabled:opacity-70"
      >
        <MessageCircle className="w-4 h-4" />
        {pingLoading ? "Opening..." : "Ping"}
      </button>

      <button
        onClick={handleLike}
        disabled={likeLoading || liked}
        className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-60 ${
          liked
            ? "bg-rose-500 border-rose-500 text-white"
            : "border-border bg-background text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        }`}
        aria-label="Like"
      >
        <Heart className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
      </button>
    </div>
  );
}
