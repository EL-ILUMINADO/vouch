"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Send, Heart, X, CornerUpLeft, Pencil } from "lucide-react";

interface ReplyInfo {
  id: string;
  content: string;
  senderId: string;
}

interface ComposeBarProps {
  replyingTo: ReplyInfo | null;
  /** Set to the message's current content when entering edit mode; undefined = not editing. */
  editInitialContent: string | undefined;
  currentUserId: string;
  otherUserName: string;
  onSend: (content: string) => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}

export function ComposeBar({
  replyingTo,
  editInitialContent,
  currentUserId,
  otherUserName,
  onSend,
  onCancelReply,
  onCancelEdit,
}: ComposeBarProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isEditing = editInitialContent !== undefined;

  // Pre-fill the textarea when edit mode is entered; clear when it ends.
  React.useEffect(() => {
    setValue(editInitialContent ?? "");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (editInitialContent !== undefined) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [editInitialContent]);

  // Focus when the user starts a reply.
  React.useEffect(() => {
    if (replyingTo) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [replyingTo]);

  const resetTextarea = () => {
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    resetTextarea();
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      if (isEditing) {
        resetTextarea();
        onCancelEdit();
      } else if (replyingTo) {
        onCancelReply();
      }
    }
  };

  const replyLabel =
    replyingTo?.senderId === currentUserId ? "You" : otherUserName;

  return (
    <footer className="px-4 py-3 bg-background border-t border-border shrink-0">
      {/* Reply preview bar */}
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted rounded-xl">
          <CornerUpLeft className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <p className="text-xs text-muted-foreground truncate flex-1">
            <span className="font-semibold text-foreground">{replyLabel}</span>
            {" · "}
            {replyingTo.content}
          </p>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 p-0.5"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Edit mode banner */}
      {isEditing && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
          <Pencil className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <p className="text-xs text-rose-600 dark:text-rose-400 flex-1 font-medium">
            Editing message
          </p>
          <button
            type="button"
            onClick={() => {
              resetTextarea();
              onCancelEdit();
            }}
            className="shrink-0 p-0.5"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2 items-end max-w-4xl mx-auto"
      >
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isEditing ? "Edit your message..." : "Type a message..."
            }
            rows={1}
            className="w-full resize-none overflow-hidden min-h-[44px] max-h-40 pl-4 pr-10 py-2.5 rounded-2xl border border-border bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-rose-400/20 text-sm leading-relaxed"
          />
          <Heart className="absolute right-3 bottom-3 w-4 h-4 text-rose-400 cursor-pointer hover:scale-110 transition-transform" />
        </div>
        <Button
          type="submit"
          className="h-11 w-11 rounded-full bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none shrink-0 active:scale-95 mb-0.5"
        >
          <Send className="w-4 h-4 text-white" />
        </Button>
      </form>
    </footer>
  );
}
