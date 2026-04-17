import { useState, useRef, useEffect } from "react";
import { connectChatSse, ChatMessage } from "@/fe/lib/chatSseClient";
import { getUid } from "@/fe/lib/uid";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sseRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    return () => {
      sseRef.current?.close();
    };
  }, []);

  async function loadHistory() {
    const res = await fetch(`/api/memory?uid=${encodeURIComponent(getUid())}`);
    const cached: ChatMessage[] = await res.json();
    if (cached.length > 0) setMessages(cached);
  }

  function newChat() {
    sseRef.current?.close();
    sseRef.current = null;
    setMessages([]);
    setInput("");
    setLoading(false);
  }

  function sendText(text: string) {
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const assistantIndex = next.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    sseRef.current?.close();
    sseRef.current = connectChatSse({
      uid: getUid(),
      content: text,
      onToken: (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            ...updated[assistantIndex],
            content: updated[assistantIndex].content + token,
          };
          return updated;
        });
      },
      onDone: () => {
        sseRef.current = null;
        setLoading(false);
      },
      onError: (err) => {
        sseRef.current = null;
        setLoading(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = { role: "assistant", content: `[error]: ${err.message}` };
          return updated;
        });
      },
    });
  }

  function send() {
    sendText(input.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return { messages, input, setInput, loading, send, sendText, newChat, loadHistory, handleKeyDown };
}
