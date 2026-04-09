/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  MessageCircle,
  RotateCcw,
  X,
  Heart,
  ChevronDown,
  BadgeCheck,
} from "lucide-react";
import { pingUser, recordLike } from "./actions";
import { useRouter } from "next/navigation";

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
  const [selectedPeer, setSelectedPeer] = useState<DiscoverPeer | null>(null);
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

  const handleSwipe = (dir: "left" | "right") => {
    if (!current || flyDir) return;
    if (dir === "right") {
      // Fire-and-forget, but redirect if a mutual match is created
      recordLike(current.id)
        .then((result) => {
          if (result.matched && result.conversationId) {
            router.push(`/uplink/${result.conversationId}`);
          }
        })
        .catch(() => {});
    }
    popCard(current, dir);
  };

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
      const { conversationId } = await pingUser(peerId);
      router.push(`/uplink/${conversationId}`);
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
      // It was a tap — open profile sheet
      setSelectedPeer(current);
      setOffset({ x: 0, y: 0 });
      return;
    }

    if (Math.abs(offset.x) > SWIPE_THRESHOLD && current) {
      popCard(current, offset.x > 0 ? "right" : "left");
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

      {/* Profile sheet */}
      {selectedPeer && (
        <ProfileSheet
          peer={selectedPeer}
          myInterests={myInterests}
          onClose={() => setSelectedPeer(null)}
          onPing={() => handlePing(selectedPeer.id)}
          pinging={pinging}
        />
      )}
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

// ---------------------------------------------------------------------------
// Profile sheet (bottom drawer)
// ---------------------------------------------------------------------------

function ProfileSheet({
  peer,
  myInterests,
  onClose,
  onPing,
  pinging,
}: {
  peer: DiscoverPeer;
  myInterests: string[];
  onClose: () => void;
  onPing: () => void;
  pinging: boolean;
}) {
  const sharedInterests = peer.interests.filter((i) => myInterests.includes(i));
  const matchPct = calcMatch(myInterests, peer.interests);
  const imgSrc = peer.profileImage ?? peer.images?.[0] ?? null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — mobile: 90%+ height bottom sheet | desktop: 70% width centered */}
      <div className="relative bg-background rounded-t-[2rem] md:rounded-[2rem] min-h-[90svh] md:min-h-0 md:max-h-[85vh] w-full md:w-[70%] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {/* Handle bar + close */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm pt-3 pb-3 flex flex-col items-center border-b border-border z-10">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mb-2 md:hidden" />
          <button
            onClick={onClose}
            className="absolute right-4 top-3 p-1.5 rounded-full hover:bg-accent transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6 pb-10">
          {/* Header */}
          <div className="flex items-center gap-4">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={peer.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-rose-400/30 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-rose-400 to-pink-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
                {peer.name[0]}
              </div>
            )}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xl font-black text-foreground">
                  {peer.name}
                </h3>
                {peer.verificationStatus === "verified" && (
                  <BadgeCheck className="w-4 h-4 text-rose-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {peer.department}
                {!peer.hideLevel && ` · ${peer.level}`}
              </p>
              {matchPct > 0 && (
                <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {matchPct}% match
                </span>
              )}
            </div>
          </div>

          {/* Bio headline */}
          {peer.bio_headline && (
            <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-rose-500/40 pl-3">
              &ldquo;{peer.bio_headline}&rdquo;
            </p>
          )}

          {/* Interests */}
          {peer.interests.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {peer.interests.map((tag) => {
                  const isShared = sharedInterests.includes(tag);
                  return (
                    <span
                      key={tag}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                        isShared
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted/50 border-border text-muted-foreground"
                      }`}
                    >
                      {isShared ? "✓ " : ""}
                      {tag}
                    </span>
                  );
                })}
              </div>
              {sharedInterests.length > 0 && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {sharedInterests.length} shared interest
                  {sharedInterests.length !== 1 ? "s" : ""} with you
                </p>
              )}
            </div>
          )}

          {/* Vibe tags */}
          {(peer.intent || peer.social_energy || peer.energy_vibe) && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Vibe
              </p>
              <div className="flex flex-wrap gap-2">
                {peer.intent && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full">
                    {peer.intent}
                  </span>
                )}
                {peer.social_energy && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                    {peer.social_energy}
                  </span>
                )}
                {peer.energy_vibe && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-full text-muted-foreground">
                    {peer.energy_vibe}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Prompt */}
          {peer.prompt_question && peer.prompt_answer && (
            <div className="bg-muted/40 rounded-2xl p-4 space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                {peer.prompt_question}
              </p>
              <p className="text-sm text-foreground font-medium leading-relaxed">
                {peer.prompt_answer}
              </p>
            </div>
          )}

          {/* Ping CTA */}
          <button
            onClick={onPing}
            disabled={pinging}
            className="w-full h-14 rounded-2xl bg-rose-500 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            <MessageCircle className="w-4 h-4" />
            {pinging ? "Opening chat..." : "Ping"}
          </button>
        </div>
      </div>
    </div>
  );
}
