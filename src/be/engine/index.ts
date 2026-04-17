import { chatStream } from "@/be/lib/llm";
import { buildContextMessages, updateSession } from "@/be/memory";
import { loadSession, saveSession } from "@/be/session";
import { refreshPersona } from "@/be/persona";
import { refreshMindCards } from "@/be/mindcards";

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

      const { session: afterMemory, memoriesChanged } = await updateSession(
        session,
        content,
        assistantReply,
      );
      const afterPersona = await refreshPersona(afterMemory, memoriesChanged);
      const afterCards = await refreshMindCards(afterPersona);
      await saveSession(uid, afterCards);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      onError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }
}
