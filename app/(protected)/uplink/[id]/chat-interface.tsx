"use client";

import * as React from "react";
import { sendMessage } from "./actions";
import { Button } from "@/components/ui/button";
import { Send, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/pusher-client";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
}

interface ChatInterfaceProps {
  initialMessages: Message[];
  conversationId: string;
  currentUserId: string;
}

export function ChatInterface({
  initialMessages,
  conversationId,
  currentUserId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  React.useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(conversationId);

    channel.bind("new-message", (incomingMsg: Message) => {
      if (incomingMsg.senderId === currentUserId) return;

      setMessages((prev: Message[]) => {
        if (prev.find((m: Message) => m.id === incomingMsg.id)) return prev;
        return [
          ...prev,
          { ...incomingMsg, createdAt: new Date(incomingMsg.createdAt) },
        ];
      });
    });

    return () => {
      pusher.unsubscribe(conversationId);
    };
  }, [conversationId, currentUserId]);

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tempMessage = {
      id: Math.random().toString(),
      content,
      senderId: currentUserId,
      createdAt: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, tempMessage]);
    await sendMessage(conversationId, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: Message) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                isMe ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm wrap-break-word",
                  isMe
                    ? "bg-rose-500 text-white rounded-br-none"
                    : "bg-card text-card-foreground border border-border rounded-bl-none",
                )}
              >
                {msg.content}
                <div
                  className={cn(
                    "text-[9px] mt-1 opacity-60",
                    isMe ? "text-rose-100" : "text-muted-foreground",
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="px-4 py-3 bg-background border-t border-border shrink-0">
        <form
          onSubmit={handleSend}
          className="flex gap-2 items-end max-w-4xl mx-auto"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
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
    </div>
  );
}
