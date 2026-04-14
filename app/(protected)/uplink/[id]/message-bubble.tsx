"use client";

import * as React from "react";
import { CornerUpLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./types";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  otherUserName: string;
  onLongPress: () => void;
  onContextMenu: () => void;
}

export function MessageBubble({
  msg,
  isMe,
  currentUserId,
  otherUserName,
  onLongPress,
  onContextMenu,
}: MessageBubbleProps) {
  const isDeleted = !!msg.deletedAt;
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleTouchStart = () => {
    if (isDeleted) return;
    longPressTimer.current = setTimeout(onLongPress, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const replyLabel =
    msg.replyToSenderId === currentUserId ? "You" : otherUserName;

  return (
    <div
      className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={(e) => {
        if (isDeleted) return;
        e.preventDefault();
        e.stopPropagation();
        onContextMenu();
      }}
    >
      <div
        className={cn(
          "max-w-[75%] flex flex-col gap-1",
          isMe ? "items-end" : "items-start",
        )}
      >
        {/* Reply thread preview */}
        {msg.replyToContent && !isDeleted && (
          <div
            className={cn(
              "flex items-start gap-1.5 text-[10px] px-3 py-1.5 rounded-xl max-w-full border-l-2",
              isMe
                ? "bg-rose-400/20 border-rose-300 text-rose-100"
                : "bg-muted border-rose-400 text-muted-foreground",
            )}
          >
            <CornerUpLeft className="w-3 h-3 shrink-0 mt-px" />
            <div className="min-w-0">
              <span className="font-semibold">{replyLabel}: </span>
              <span className="truncate">{msg.replyToContent}</span>
            </div>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm shadow-sm wrap-break-word",
            isDeleted
              ? "bg-muted text-muted-foreground italic border border-border"
              : isMe
                ? "bg-rose-500 text-white rounded-br-none"
                : "bg-card text-card-foreground border border-border rounded-bl-none",
          )}
        >
          {isDeleted ? (
            <span className="flex items-center gap-1.5 text-xs">
              <Trash2 className="w-3 h-3" />
              This message was deleted
            </span>
          ) : (
            <>
              {msg.content}
              <div
                className={cn(
                  "text-[9px] mt-1 opacity-60 flex items-center gap-1",
                  isMe ? "text-rose-100 justify-end" : "text-muted-foreground",
                )}
              >
                {msg.editedAt && <span className="italic">edited ·</span>}
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
