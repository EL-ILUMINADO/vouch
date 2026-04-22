"use client";

import * as React from "react";
import {
  sendMessage,
  deleteMessage,
  editMessage,
  fetchOlderMessages,
} from "./actions/message";
import { useChatMessages } from "./use-chat-messages";
import { MessageBubble } from "./message-bubble";
import { MessageContextMenu } from "./message-context-menu";
import { ComposeBar } from "./compose-bar";
import type { Message } from "./types";

interface ChatInterfaceProps {
  initialMessages: Message[];
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
  hasMore?: boolean;
}

export function ChatInterface({
  initialMessages,
  conversationId,
  currentUserId,
  otherUserName,
  hasMore: initialHasMore = false,
}: ChatInterfaceProps) {
  const { messages, setMessages, isVisible } = useChatMessages(
    initialMessages,
    conversationId,
    currentUserId,
  );

  const [replyingTo, setReplyingTo] = React.useState<{
    id: string;
    content: string;
    senderId: string;
  } | null>(null);

  const [editingMessage, setEditingMessage] = React.useState<{
    id: string;
    content: string;
  } | null>(null);

  const [contextMenuMsgId, setContextMenuMsgId] = React.useState<string | null>(
    null,
  );

  // ── Pagination
  const [hasMore, setHasMore] = React.useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // IntersectionObserver: fires when the sentinel at the top enters the viewport.
  React.useEffect(() => {
    if (!hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingOlder) {
          loadOlderMessages();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingOlder, messages]);

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    const oldestId = messages[0].id;
    if (oldestId.startsWith("temp-")) return;

    setLoadingOlder(true);

    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const older = await fetchOlderMessages(conversationId, oldestId);

    setMessages((prev) => [...older, ...prev]);
    setHasMore(older.length === 20);
    setLoadingOlder(false);

    // Restore scroll position so the view doesn't jump.
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      });
    }
  };

  // Scroll to bottom when messages change (new incoming / sent).
  // We only auto-scroll if the user is already near the bottom.
  const prevMessageCount = React.useRef(messages.length);
  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      120;

    const newMessageArrived = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;

    if (newMessageArrived && isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Initial scroll to bottom on first mount.
  React.useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, []);

  // Best-effort screenshot / print prevention.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") e.preventDefault();
      if (e.key === "PrintScreen")
        navigator.clipboard?.writeText("").catch(() => {});
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Send / Edit

  const handleSend = async (content: string) => {
    if (editingMessage) {
      const { id } = editingMessage;
      setEditingMessage(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, content, editedAt: new Date() } : m,
        ),
      );
      await editMessage(id, content);
      return;
    }

    const replyId = replyingTo?.id ?? null;
    const replyContent = replyingTo?.content ?? null;
    const replySenderId = replyingTo?.senderId ?? null;

    // Optimistic insert with a temporary id.
    const temp: Message = {
      id: `temp-${Math.random()}`,
      content,
      senderId: currentUserId,
      createdAt: new Date(),
      replyToId: replyId,
      replyToContent: replyContent,
      replyToSenderId: replySenderId,
    };

    setMessages((prev) => [...prev, temp]);
    setReplyingTo(null);

    // Scroll to bottom on send.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    await sendMessage(
      conversationId,
      content,
      replyId,
      replyContent,
      replySenderId,
    );
  };

  // ── Delete

  const handleDelete = async (messageId: string, forEveryone: boolean) => {
    setContextMenuMsgId(null);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const isSender = msg.senderId === currentUserId;

    if (forEveryone) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deletedAt: new Date() } : m,
        ),
      );
    } else if (isSender) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deletedForSender: true } : m,
        ),
      );
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deletedForReceiver: true } : m,
        ),
      );
    }

    await deleteMessage(messageId, forEveryone);
  };

  // ── Context-menu helpers

  const contextMenuMsg =
    contextMenuMsgId != null
      ? (messages.find((m) => m.id === contextMenuMsgId) ?? null)
      : null;

  const openReply = (msg: Message) => {
    setReplyingTo({ id: msg.id, content: msg.content, senderId: msg.senderId });
    setContextMenuMsgId(null);
  };

  const openEdit = (msg: Message) => {
    setEditingMessage({ id: msg.id, content: msg.content });
    setContextMenuMsgId(null);
  };

  // ── Render

  return (
    <div
      className="flex-1 flex flex-col bg-background overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 select-none"
        style={{ WebkitUserSelect: "none" }}
      >
        {/* Sentinel — observed to trigger loading older messages */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-2">
            {loadingOlder ? (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                Loading…
              </span>
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Scroll up for older messages
              </span>
            )}
          </div>
        )}

        {messages.filter(isVisible).map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={msg.senderId === currentUserId}
            currentUserId={currentUserId}
            otherUserName={otherUserName}
            onLongPress={() => setContextMenuMsgId(msg.id)}
            onContextMenu={() => setContextMenuMsgId(msg.id)}
          />
        ))}
      </div>

      {/* Compose footer */}
      <ComposeBar
        replyingTo={replyingTo}
        editInitialContent={editingMessage?.content}
        currentUserId={currentUserId}
        otherUserName={otherUserName}
        onSend={handleSend}
        onCancelReply={() => setReplyingTo(null)}
        onCancelEdit={() => setEditingMessage(null)}
      />

      {/* Context menu action sheet */}
      {contextMenuMsg && (
        <MessageContextMenu
          message={contextMenuMsg}
          isOwn={contextMenuMsg.senderId === currentUserId}
          onClose={() => setContextMenuMsgId(null)}
          onReply={() => openReply(contextMenuMsg)}
          onEdit={() => openEdit(contextMenuMsg)}
          onDeleteForMe={() => handleDelete(contextMenuMsg.id, false)}
          onDeleteForEveryone={() => handleDelete(contextMenuMsg.id, true)}
        />
      )}
    </div>
  );
}
