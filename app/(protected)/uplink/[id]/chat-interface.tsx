"use client";

import * as React from "react";
import { sendMessage } from "./actions";
import { Input } from "@/components/ui/input";
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue("");

    const tempMessage = {
      id: Math.random().toString(),
      content,
      senderId: currentUserId,
      createdAt: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, tempMessage]);
    await sendMessage(conversationId, content);
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
                  "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                  isMe
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-card text-card-foreground border border-border rounded-bl-none",
                )}
              >
                {msg.content}
                <div
                  className={cn(
                    "text-[9px] mt-1 opacity-60",
                    isMe ? "text-indigo-100" : "text-muted-foreground",
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

      <footer className="p-4 bg-background border-t border-border">
        <form
          onSubmit={handleSend}
          className="flex gap-2 items-center max-w-4xl mx-auto"
        >
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="h-12 pl-4 pr-10 rounded-full border-border bg-muted focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
            />
            <Heart className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 cursor-pointer hover:scale-110 transition-transform" />
          </div>
          <Button
            type="submit"
            className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none shrink-0 active:scale-95"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
