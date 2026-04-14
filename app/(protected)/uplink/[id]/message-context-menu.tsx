"use client";

import { Reply, Pencil, Trash2 } from "lucide-react";
import type { Message } from "./types";

interface MessageContextMenuProps {
  message: Message;
  isOwn: boolean;
  onClose: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}

export function MessageContextMenu({
  message,
  isOwn,
  onClose,
  onReply,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
}: MessageContextMenuProps) {
  return (
    <>
      {/* Backdrop — tap anywhere outside to dismiss */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Action sheet */}
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        <div className="p-1.5 space-y-0.5">
          <button
            type="button"
            onClick={onReply}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors text-left"
          >
            <Reply className="w-4 h-4 text-muted-foreground" />
            Reply
          </button>

          {/* Edit — only for own, non-deleted messages */}
          {isOwn && !message.deletedAt && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors text-left"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
              Edit message
            </button>
          )}

          <div className="h-px bg-border mx-2 my-1" />

          <button
            type="button"
            onClick={onDeleteForMe}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
            Delete for me
          </button>

          <button
            type="button"
            onClick={onDeleteForEveryone}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
            Delete for everyone
          </button>
        </div>
      </div>
    </>
  );
}
