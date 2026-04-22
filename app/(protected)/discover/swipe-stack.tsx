/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { MessageCircle, RotateCcw, X, Heart, BadgeCheck } from "lucide-react";
import { pingUser, recordLike } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SWIPE_THRESHOLD = 100;
const MAX_UNDOS = 3;
const UNDO_KEY = "vouch_undo_swipes";

// cspell:disable

export type DiscoverPeer = {
  id: string;
  name: string;
  department: string;
  level: string;
  hideLevel: boolean;
  interests: string[];
  bio_headline: string | null;
  intent: string | null;
  social_energy: string | null;
  energy_vibe: string | null;
  profileImage: string | null;
  images: string[] | null;
  prompt_question: string | null;
  prompt_answer: string | null;
  verificationStatus: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getUndosUsedToday(): number {
  try {
    const raw = localStorage.getItem(UNDO_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return parsed.date === today() ? (parsed.count ?? 0) : 0;
  } catch {
    return 0;
  }
}

function saveUndoCount(count: number) {
  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify({ date: today(), count }));
  } catch {}
}

function calcMatch(mine: string[], theirs: string[]): number {
  if (mine.length === 0 && theirs.length === 0) return 0;
  const union = new Set([...mine, ...theirs]);
  const shared = theirs.filter((i) => mine.includes(i));
  return Math.round((shared.length / union.size) * 100);
}

// ---------------------------------------------------------------------------
// Main SwipeStack component
// ---------------------------------------------------------------------------

export function SwipeStack({
  peers: initialPeers,
  myInterests,
}: {
  peers: DiscoverPeer[];
  myInterests: string[];
}) {
  const router = useRouter();
  const [stack, setStack] = useState(initialPeers);
  const [history, setHistory] = useState<DiscoverPeer[]>([]);
  const [undosUsed, setUndosUsed] = useState(0);
  const [pinging, setPinging] = useState(false);

  // Drag state
  const dragStartX = useRef(0);
  const dragMoved = useRef(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyDir, setFlyDir] = useState<"left" | "right" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUndosUsed(getUndosUsedToday());
  }, []);

  const current = stack[0];
  const next = stack[1];

  const popCard = useCallback((peer: DiscoverPeer, dir: "left" | "right") => {
    setFlyDir(dir);
    setTimeout(() => {
      setStack((prev) => prev.slice(1));
      setHistory((prev) => [peer, ...prev].slice(0, 10));
      setFlyDir(null);
      setOffset({ x: 0, y: 0 });
    }, 300);
  }, []);

  const handleSwipe = useCallback(
    (dir: "left" | "right") => {
      if (!current || flyDir) return;
      if (dir === "right") {
        recordLike(current.id)
          .then((result) => {
            if (result.limitReached) {
              toast.error(
                "Daily Handshake limit reached. Try again tomorrow.",
                {
                  description: "You've sent 50 likes today.",
                },
              );
              return;
            }
            if (result.matched && result.conversationId) {
              router.push(`/uplink/${result.conversationId}`);
            }
          })
          .catch(() => {});
      }
      popCard(current, dir);
    },
    [current, flyDir, popCard, router],
  );

  const handleUndo = () => {
    if (undosUsed >= MAX_UNDOS || history.length === 0) return;
    const [prev, ...rest] = history;
    setHistory(rest);
    setStack((s) => [prev, ...s]);
    const newCount = undosUsed + 1;
    setUndosUsed(newCount);
    saveUndoCount(newCount);
  };

  const handlePing = async (peerId: string) => {
    setPinging(true);
    try {
      const result = await pingUser(peerId);
      if ("error" in result) return;
      router.push(`/uplink/${result.conversationId}`);
    } finally {
      setPinging(false);
    }
  };

  // Pointer handlers
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragMoved.current = false;
    setIsDragging(true);
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 5) dragMoved.current = true;
    setOffset({ x: dx, y: dx * 0.05 });
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (!dragMoved.current && current) {
      // Tap — navigate to the user's full profile page
      setOffset({ x: 0, y: 0 });
      router.push(`/user/${current.id}`);
      return;
    }

    if (Math.abs(offset.x) > SWIPE_THRESHOLD && current) {
      // Use handleSwipe so recordLike is called on right-swipes
      handleSwipe(offset.x > 0 ? "right" : "left");
    } else {
      setOffset({ x: 0, y: 0 });
    }
  };

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 text-muted-foreground/40">
        <Heart className="w-12 h-12 stroke-1" />
        <p className="text-sm font-medium">
          You&apos;ve seen everyone for now.
        </p>
        <p className="text-xs">Check back later for new people.</p>
      </div>
    );
  }

  const matchPct = calcMatch(myInterests, current.interests);
  const swipeIndicatorOpacity = Math.min(
    Math.abs(offset.x) / SWIPE_THRESHOLD,
    1,
  );

  // Final transform values (fly-away or drag offset)
  const tx = flyDir ? (flyDir === "right" ? 700 : -700) : offset.x;
  const ty = flyDir ? -60 : offset.y;
  const rot = flyDir ? (flyDir === "right" ? 22 : -22) : offset.x * 0.07;

  return (
    <>
      {/* Card stack */}
      <div className="relative mx-auto h-[calc(100svh-220px)] max-w-sm">
        {/* Card behind */}
        {next && (
          <div
            className="absolute inset-0 rounded-[2rem] overflow-hidden border border-border"
            style={{ transform: "scale(0.95) translateY(14px)", zIndex: 0 }}
          >
            <CardFace peer={next} myInterests={myInterests} />
          </div>
        )}

        {/* Top card */}
        <div
          ref={cardRef}
          className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-lg border border-border cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`,
            transition: isDragging
              ? "none"
              : flyDir
                ? "transform 0.3s ease"
                : "transform 0.2s ease",
            zIndex: 1,
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Swipe indicators */}
          <div
            className="absolute top-6 left-5 z-10 bg-rose-500 text-white font-black text-sm px-3 py-1 rounded-full -rotate-12 border-2 border-white pointer-events-none"
            style={{
              opacity: offset.x < -10 ? swipeIndicatorOpacity : 0,
              transition: "opacity 0.1s",
            }}
          >
            PASS
          </div>
          <div
            className="absolute top-6 right-5 z-10 bg-emerald-500 text-white font-black text-sm px-3 py-1 rounded-full rotate-12 border-2 border-white pointer-events-none"
            style={{
              opacity: offset.x > 10 ? swipeIndicatorOpacity : 0,
              transition: "opacity 0.1s",
            }}
          >
            PING ✓
          </div>

          <CardFace
            peer={current}
            myInterests={myInterests}
            matchPct={matchPct}
          />
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center items-center gap-4 px-6 z-10">
        {/* Undo / swipe back */}
        <button
          onClick={handleUndo}
          disabled={undosUsed >= MAX_UNDOS || history.length === 0}
          title={`${MAX_UNDOS - undosUsed} swipe-backs left today`}
          className="relative w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          {undosUsed < MAX_UNDOS && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
              {MAX_UNDOS - undosUsed}
            </span>
          )}
        </button>

        {/* Pass */}
        <button
          onClick={() => handleSwipe("left")}
          className="w-14 h-14 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 transition-all active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Ping */}
        <button
          onClick={() => handlePing(current.id)}
          disabled={pinging}
          className="h-14 px-7 rounded-full bg-rose-500 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-transform disabled:opacity-70"
        >
          <MessageCircle className="w-4 h-4" />
          {pinging ? "..." : "Ping"}
        </button>

        {/* Like / swipe right */}
        <button
          onClick={() => handleSwipe("right")}
          className="w-14 h-14 rounded-full border border-border bg-background flex items-center justify-center text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all active:scale-95"
        >
          <Heart className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Card face
// ---------------------------------------------------------------------------

function CardFace({
  peer,
  myInterests,
  matchPct,
}: {
  peer: DiscoverPeer;
  myInterests: string[];
  matchPct?: number;
}) {
  const imgSrc = peer.profileImage ?? peer.images?.[0] ?? null;

  // Suppress unused-variable warning — myInterests kept for future shared-interest badge on card
  void myInterests;

  return (
    <div className="w-full h-full bg-card flex flex-col">
      <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 relative flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={peer.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <span className="text-8xl font-black text-rose-200 dark:text-rose-800 pointer-events-none">
            {peer.name[0]}
          </span>
        )}

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/75 via-black/30 to-transparent pointer-events-none">
          {matchPct !== undefined && matchPct > 0 && (
            <div className="mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                {matchPct}% match
              </span>
            </div>
          )}
          <h2 className="text-2xl font-bold text-white leading-none">
            {peer.name}
          </h2>
          <p className="text-white/80 text-xs font-medium mt-1">
            {peer.department}
            {!peer.hideLevel && ` • ${peer.level}`}
          </p>
          {peer.verificationStatus === "verified" && (
            <BadgeCheck className="inline w-3.5 h-3.5 text-rose-300 mt-1" />
          )}
        </div>
      </div>

      {/* Tap hint */}
      <div className="px-4 py-2.5 bg-card text-center">
        <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest">
          Tap to view profile
        </p>
      </div>
    </div>
  );
}
