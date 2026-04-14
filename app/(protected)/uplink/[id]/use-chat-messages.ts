"use client";

import * as React from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { Message } from "./types";

/**
 * Manages the messages list and Pusher real-time subscription for a conversation.
 * Handles incoming new messages, remote edits, and remote deletes.
 */
export function useChatMessages(
  initialMessages: Message[],
  conversationId: string,
  currentUserId: string,
) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);

  // Subscribe to real-time events for this conversation.
  React.useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(conversationId);

    channel.bind("new-message", (incoming: Message) => {
      // Ignore echoes of own messages (already added optimistically).
      if (incoming.senderId === currentUserId) return;
      setMessages((prev) => {
        if (prev.find((m) => m.id === incoming.id)) return prev;
        return [
          ...prev,
          { ...incoming, createdAt: new Date(incoming.createdAt) },
        ];
      });
    });

    channel.bind(
      "message-deleted",
      ({
        messageId,
        deleteForEveryone,
      }: {
        messageId: string;
        deleteForEveryone: boolean;
        deletedBySender: boolean;
      }) => {
        // Only apply "deleted for everyone" remotely — self-deletes are
        // handled optimistically on the acting client only.
        if (!deleteForEveryone) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, deletedAt: new Date() } : m,
          ),
        );
      },
    );

    channel.bind(
      "message-edited",
      ({
        messageId,
        newContent,
        editedAt,
      }: {
        messageId: string;
        newContent: string;
        editedAt: string;
      }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: newContent, editedAt } : m,
          ),
        );
      },
    );

    return () => {
      pusher.unsubscribe(conversationId);
    };
  }, [conversationId, currentUserId]);

  /** Returns true if this message should be rendered for the current user. */
  const isVisible = React.useCallback(
    (msg: Message): boolean => {
      if (msg.deletedAt) return true; // render the "deleted" placeholder for both parties
      const isMe = msg.senderId === currentUserId;
      if (isMe && msg.deletedForSender) return false;
      if (!isMe && msg.deletedForReceiver) return false;
      return true;
    },
    [currentUserId],
  );

  return { messages, setMessages, isVisible };
}
