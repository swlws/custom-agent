import { useState, useRef, useEffect, useCallback } from "react";
import { connectChatSse, ChatMessage } from "@/fe/lib/chatSseClient";
import {
  getUid,
  getConversationId,
  createNewConversationId,
  setConversationId,
} from "@/fe/lib/uid";
import { getConversations, getMemory, type ConversationMeta } from "@/fe/apis/conversations";
import { abortChat } from "@/fe/apis/chat";

export type { ConversationMeta };

type AgentMode = "direct" | "plan-and-solve";

const AGENT_MODE_KEY = "agent_mode";

function loadAgentMode(): AgentMode {
  if (typeof window === "undefined") return "direct";
  const stored = localStorage.getItem(AGENT_MODE_KEY);
  return stored === "plan-and-solve" ? "plan-and-solve" : "direct";
}

function saveAgentMode(mode: AgentMode) {
  if (typeof window !== "undefined") localStorage.setItem(AGENT_MODE_KEY, mode);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationIdState] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [agentMode, setAgentModeState] = useState<AgentMode>("direct");
  const sseRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    setConversationIdState(getConversationId());
    setAgentModeState(loadAgentMode());
    return () => {
      sseRef.current?.close();
    };
  }, []);

  const setAgentMode = useCallback((mode: AgentMode) => {
    setAgentModeState(mode);
    saveAgentMode(mode);
  }, []);

  const loadConversationList = useCallback(async () => {
    const list = await getConversations();
    setConversations(list);
  }, []);

  const switchConversation = useCallback(async (cid: string) => {
    sseRef.current?.close();
    sseRef.current = null;
    setLoading(false);
    setConversationId(cid);
    setConversationIdState(cid);

    const cached = await getMemory(cid);
    setMessages(cached);
  }, []);

  const newChat = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
    const cid = createNewConversationId();
    setConversationIdState(cid);
    setMessages([]);
    setLoading(false);
  }, []);

  const abort = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
    setLoading(false);
    abortChat();
  }, []);

  const sendText = useCallback(
    (text: string) => {
      if (!text || loading) return;

      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);

      const assistantIndex = messages.length + 1; // current messages + new user message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const cid = conversationId;
      sseRef.current?.close();
      sseRef.current = connectChatSse({
        uid: getUid(),
        conversationId: cid,
        content: text,
        agentMode,
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const assistantMsg = updated[assistantIndex];
            if (assistantMsg) {
              updated[assistantIndex] = {
                ...assistantMsg,
                content: assistantMsg.content + token,
              };
            }
            return updated;
          });
        },
        onDone: () => {
          sseRef.current = null;
          setLoading(false);
          loadConversationList();
        },
        onError: (err) => {
          sseRef.current = null;
          setLoading(false);
          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantIndex] = {
              role: "assistant",
              content: `[error]: ${err.message}`,
            };
            return updated;
          });
        },
      });
    },
    [messages, loading, conversationId, agentMode, loadConversationList],
  );

  return {
    messages,
    loading,
    agentMode,
    setAgentMode,
    sendText,
    abort,
    newChat,
    conversations,
    loadConversationList,
    switchConversation,
    conversationId,
  };
}
