"use client";

import * as React from "react";
import { ShieldAlert, Megaphone, Gift } from "lucide-react";
import { getPusherClient } from "@/lib/pusher-client";

type MessageType = "warning" | "promotion" | "announcement";

interface PlatformMessage {
  id: string;
  content: string;
  type: MessageType;
  createdAt: Date | string;
  isRead: boolean;
}

const TYPE_CONFIG = {
  warning: {
    icon: ShieldAlert,
    label: "Warning",
    bubble: "bg-red-500/10 border border-red-500/20 text-foreground",
    icon_class: "text-red-500",
  },
  promotion: {
    icon: Gift,
    label: "Promotion",
    bubble: "bg-blue-500/10 border border-blue-500/20 text-foreground",
    icon_class: "text-blue-400",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    bubble: "bg-card border border-border text-foreground",
    icon_class: "text-rose-500",
  },
};

function MessageBubble({ msg }: { msg: PlatformMessage }) {
  const cfg = TYPE_CONFIG[msg.type] ?? TYPE_CONFIG.announcement;
  const Icon = cfg.icon;
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-[85%] space-y-1">
        <div className="flex items-center gap-1.5 px-1">
          <Icon className={`w-3 h-3 ${cfg.icon_class}`} />
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${cfg.icon_class}`}
          >
            {cfg.label}
          </span>
        </div>
        <div
          className={`px-4 py-3 rounded-2xl rounded-tl-none text-sm whitespace-pre-line wrap-break-word shadow-sm ${cfg.bubble}`}
        >
          {msg.content}
        </div>
        <p className="text-[9px] text-muted-foreground px-1">
          {new Date(msg.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export function InboxRealtime({
  initialMessages,
  currentUserId,
}: {
  initialMessages: PlatformMessage[];
  currentUserId: string;
}) {
  const [messages, setMessages] =
    React.useState<PlatformMessage[]>(initialMessages);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    // Personal channel for direct admin messages
    const personalChannel = pusher.subscribe(`user-${currentUserId}`);
    // Shared channel for broadcast announcements
    const broadcastChannel = pusher.subscribe("vouch-announcements");

    const onMessage = (incoming: Omit<PlatformMessage, "isRead">) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === incoming.id)) return prev;
        return [...prev, { ...incoming, isRead: false }];
      });
    };

    personalChannel.bind("platform-message", onMessage);
    broadcastChannel.bind("platform-message", onMessage);

    return () => {
      pusher.unsubscribe(`user-${currentUserId}`);
      pusher.unsubscribe("vouch-announcements");
    };
  }, [currentUserId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-3">
        <Megaphone className="w-12 h-12 stroke-1" />
        <p className="text-sm font-medium">No messages from Vouch yet.</p>
      </div>
    );
  }

  return (
    <>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      <div ref={bottomRef} />
    </>
  );
}
