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
  loadUserSettings,
} from "@/be/session";
import { loadDefaultSettings, mergeSettings } from "@/be/config/settings";

export interface QueryParams {
  uid: string;
  conversationId: string;
  content: string;
}

export interface QueryHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export class QueryEngine {
  async run(
    params: QueryParams,
    handlers: QueryHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    const { uid, conversationId, content } = params;
    const { onToken, onDone, onError } = handlers;

    try {
      // 加载合并后的设置
      const [defaults, userOverrides] = await Promise.all([
        loadDefaultSettings(),
        loadUserSettings(uid),
      ]);
      const settings = mergeSettings(defaults, userOverrides);
      const { conversationCacheCount, personaUpdateHours, mindCardsUpdateHours } = settings;

      const conv = await loadConversation(uid, conversationId);
      const contextMessages = buildContextMessages(conv, content);

      let assistantReply = "";
      for await (const chunk of chatStream(contextMessages, {}, signal)) {
        assistantReply += chunk;
        onToken(chunk);
      }

      onDone();

      // 保存当前会话
      const withMessages = appendMessages(conv, content, assistantReply);
      const { conv: withMemory } = await compactMemories(withMessages, conversationCacheCount);
      await saveConversation(uid, conversationId, withMemory);

      // 聚合所有会话，刷新全局 persona / mindcards
      const metas = await listConversations(uid);
      const allConversations = await Promise.all(
        metas.map((m) => loadConv(uid, m.conversationId)),
      );

      const personaData = await loadPersonaData(uid);
      const newPersonaData = await refreshPersona(uid, allConversations, personaData, personaUpdateHours);
      await savePersonaData(uid, newPersonaData);

      const mindCardsData = await loadMindCardsData(uid);
      const newMindCardsData = await refreshMindCards(allConversations, newPersonaData.persona, mindCardsData, mindCardsUpdateHours);
      await saveMindCardsData(uid, newMindCardsData);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      onError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }
}
