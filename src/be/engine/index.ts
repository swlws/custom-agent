import { chatStream } from "@/be/lib/llm";
import { buildContextMessages, appendMessages, compactMemories, refreshPersona, refreshMindCards } from "@/be/memory";
import {
  loadConversation,
  saveConversation,
  listConversations,
  loadConversation as loadConv,
  loadPersonaData,
  savePersonaData,
  loadMindCardsData,
  saveMindCardsData,
} from "@/be/session";
import type { ChatSettings } from "@/be/services/chatSseService";

export interface QueryHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export class QueryEngine {
  async run(
    uid: string,
    conversationId: string,
    content: string,
    handlers: QueryHandlers,
    settings: ChatSettings,
    signal?: AbortSignal,
  ): Promise<void> {
    const { onToken, onDone, onError } = handlers;
    const { cacheCount, personaHours, mindCardsHours } = settings;

    try {
      const conv = await loadConversation(uid, conversationId);
      const contextMessages = buildContextMessages(conv, content);

      let assistantReply = "";
      for await (const chunk of chatStream(contextMessages, {}, signal)) {
        assistantReply += chunk;
        onToken(chunk);
      }

      onDone();

      // 保存当前会话（按设置的缓存数量压缩）
      const withMessages = appendMessages(conv, content, assistantReply);
      const { conv: withMemory } = await compactMemories(withMessages, cacheCount);
      await saveConversation(uid, conversationId, withMemory);

      // 聚合所有会话，按设置的 TTL 刷新全局 persona / mindcards
      const metas = await listConversations(uid);
      const allConversations = await Promise.all(
        metas.map((m) => loadConv(uid, m.conversationId)),
      );

      const personaData = await loadPersonaData(uid);
      const newPersonaData = await refreshPersona(uid, allConversations, personaData, personaHours);
      await savePersonaData(uid, newPersonaData);

      const mindCardsData = await loadMindCardsData(uid);
      const newMindCardsData = await refreshMindCards(allConversations, newPersonaData.persona, mindCardsData, mindCardsHours);
      await saveMindCardsData(uid, newMindCardsData);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      onError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }
}
