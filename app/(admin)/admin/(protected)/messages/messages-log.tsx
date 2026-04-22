"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type MessageRow = {
  id: string;
  type: "warning" | "promotion" | "announcement";
  content: string;
  createdAt: string;
  recipientName: string | null;
  recipientEmail: string | null;
};

type Page = {
  messages: MessageRow[];
  nextCursor: string | null;
};

const TYPE_BADGE: Record<string, string> = {
  warning: "bg-red-900/50 text-red-400 border-red-800",
  promotion: "bg-blue-900/50 text-blue-400 border-blue-800",
  announcement: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
};

function MessageCard({ msg }: { msg: MessageRow }) {
  return (
    <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4 space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${TYPE_BADGE[msg.type] ?? ""}`}
          >
            {msg.type}
          </span>
          <span className="text-xs text-zinc-400">
            →{" "}
            {msg.recipientName ?? (
              <span className="text-zinc-600">All Users</span>
            )}
          </span>
          {msg.recipientEmail && (
            <span className="text-[10px] text-zinc-600 hidden sm:inline">
              {msg.recipientEmail}
            </span>
          )}
        </div>
        <span className="text-zinc-600 text-xs shrink-0">
          {new Date(msg.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          ·{" "}
          {new Date(msg.createdAt).toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="text-sm text-zinc-300 whitespace-pre-line line-clamp-4">
        {msg.content}
      </p>
    </div>
  );
}

export function MessagesLog() {
  // All fetched messages, stored in a flat list for memory efficiency
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs so the IntersectionObserver callback is always stable
  const cursorRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const seenIds = useRef(new Set<string>());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "20" });
      if (cursorRef.current) params.set("cursor", cursorRef.current);

      const res = await fetch(`/api/admin/messages?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load messages.");

      const data: Page = await res.json();

      // Deduplicate — cursor collisions can cause duplicates on rapid scroll
      const fresh = data.messages.filter((m) => !seenIds.current.has(m.id));
      fresh.forEach((m) => seenIds.current.add(m.id));

      setMessages((prev) => [...prev, ...fresh]);
      cursorRef.current = data.nextCursor;
      hasMoreRef.current = !!data.nextCursor;
      setHasMore(!!data.nextCursor);
    } catch {
      setError("Could not load messages. Scroll down to retry.");
      hasMoreRef.current = true; // Allow retry
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []); // Stable — reads state via refs only

  // Load first page on mount
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // IntersectionObserver — fires fetchPage when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchPage();
      },
      { rootMargin: "200px" }, // Start loading 200px before the sentinel is visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPage]);

  return (
    <div className="space-y-3">
      {messages.length === 0 && !isLoading && !error && (
        <p className="text-zinc-500 text-sm">No messages sent yet.</p>
      )}

      {messages.map((msg) => (
        <MessageCard key={msg.id} msg={msg} />
      ))}

      {/* Sentinel — sits just below the last message */}
      <div ref={sentinelRef} className="h-1" aria-hidden />

      {isLoading && (
        <div className="flex justify-center py-4">
          <span className="w-5 h-5 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
        </div>
      )}

      {error && (
        <button
          onClick={fetchPage}
          className="w-full text-center text-sm text-red-400 hover:text-red-300 py-3 transition-colors"
        >
          {error} Tap to retry.
        </button>
      )}

      {!hasMore && messages.length > 0 && (
        <p className="text-center text-xs text-zinc-700 py-4 font-medium uppercase tracking-widest">
          All {messages.length} messages loaded
        </p>
      )}
    </div>
  );
}
