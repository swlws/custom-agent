import { chatStream } from "@/be/lib/llm";
import { buildContextMessages, appendMessages, compactMemories, refreshPersona, refreshMindCards } from "@/be/memory";
import { loadSession, saveSession } from "@/be/session";

export interface QueryHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export class QueryEngine {
  async run(
    uid: string,
    content: string,
    handlers: QueryHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    const { onToken, onDone, onError } = handlers;

    try {
      const session = await loadSession(uid);
      const contextMessages = buildContextMessages(session, content);

      let assistantReply = "";
      for await (const chunk of chatStream(contextMessages, {}, signal)) {
        assistantReply += chunk;
        onToken(chunk);
      }

      onDone();

      const withMessages = appendMessages(session, content, assistantReply);
      const { session: withMemory, memoriesChanged } = await compactMemories(withMessages);
      const withPersona = await refreshPersona(withMemory, memoriesChanged);
      const withCards = await refreshMindCards(withPersona);
      await saveSession(uid, withCards);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      onError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }
}
