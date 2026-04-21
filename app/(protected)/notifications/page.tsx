"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Heart, Zap, Map, Megaphone } from "lucide-react";
import {
  useNotifications,
  type NotificationRow,
} from "@/components/notification-provider";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

const typeConfig = {
  match: { icon: Zap, color: "text-rose-500", bg: "bg-rose-500/10" },
  like_received: { icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" },
  radar_request: {
    icon: Map,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  radar_accepted: {
    icon: Map,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  admin: { icon: Megaphone, color: "text-rose-500", bg: "bg-rose-500/10" },
} as const;

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function NotificationItem({ n }: { n: NotificationRow }) {
  const cfg = typeConfig[n.type];
  const Icon = cfg.icon;
  const [pending, startTransition] = React.useTransition();

  const avatar = n.actorImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={n.actorImage}
      alt={n.actorName ?? ""}
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : n.actorName ? (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${cfg.bg} ${cfg.color}`}
    >
      {n.actorName[0].toUpperCase()}
    </div>
  ) : (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}
    >
      <Icon className={`w-5 h-5 ${cfg.color}`} />
    </div>
  );

  const textBlock = (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-foreground leading-snug">
        {n.title}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
        {n.body}
      </p>
      <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
        {timeAgo(new Date(n.createdAt))}
      </p>
    </div>
  );

  const cls = `flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
    n.isRead ? "bg-card border-border" : "bg-rose-500/5 border-rose-500/20"
  }`;

  const content = n.actionUrl ? (
    <Link href={n.actionUrl} className="flex items-start gap-3 flex-1 min-w-0">
      <div className="shrink-0 mt-0.5">{avatar}</div>
      {textBlock}
    </Link>
  ) : (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className="shrink-0 mt-0.5">{avatar}</div>
      {textBlock}
    </div>
  );

  return (
    <div className={cls}>
      {content}
      {!n.isRead && (
        <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <button
            disabled={pending}
            onClick={() => startTransition(() => markNotificationRead(n.id))}
            className="text-[10px] font-bold text-rose-500 uppercase tracking-widest whitespace-nowrap disabled:opacity-40"
          >
            {pending ? "..." : "Mark read"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount } = useNotifications();
  const [pending, startTransition] = React.useTransition();

  const handleMarkAll = () => startTransition(() => markAllNotificationsRead());

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="px-6 py-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter italic">
            ACTIVITY.
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} new`
              : notifications.length === 0
                ? "Nothing yet"
                : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={pending}
            className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mt-2 disabled:opacity-40"
          >
            {pending ? "..." : "Mark all read"}
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 text-muted-foreground/40">
          <Bell className="w-12 h-12 stroke-1" />
          <p className="text-sm font-medium">No notifications yet.</p>
          <p className="text-xs">
            Likes, matches, and radar pings show up here.
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </div>
      )}
    </main>
  );
}
