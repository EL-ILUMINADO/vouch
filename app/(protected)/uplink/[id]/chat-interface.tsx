"use client";

import * as React from "react";
import { sendMessage, deleteMessage, editMessage } from "./actions";
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
}

export function ChatInterface({
  initialMessages,
  conversationId,
  currentUserId,
  otherUserName,
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

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
