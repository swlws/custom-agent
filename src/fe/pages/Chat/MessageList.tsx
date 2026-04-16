import { useEffect, useRef } from "react";
import { ChatMessage } from "@/fe/lib/chatSseClient";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
}

export function MessageList({ messages, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
      {messages.length === 0 && (
        <div className="mt-24 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-800 dark:text-gray-200">
            Hello World
          </h1>
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {messages.map((msg, i) => (
          <MessageItem
            key={i}
            message={msg}
            isLast={i === messages.length - 1}
            loading={loading}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
