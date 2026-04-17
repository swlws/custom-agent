import { QueryEngine } from "@/be/engine";
import { registerAbort, releaseAbort } from "./abortRegistry";

export interface ChatSettings {
  cacheCount: number;
  personaHours: number;
  mindCardsHours: number;
}

const engine = new QueryEngine();

function createSSEStream(uid: string, conversationId: string, content: string, settings: ChatSettings) {
  const signal = registerAbort(uid);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        await engine.run(
          uid,
          conversationId,
          content,
          {
            onToken: (chunk) => sendEvent(JSON.stringify({ type: "token", content: chunk })),
            onDone:  () => sendEvent("[DONE]"),
            onError: (err) => sendEvent(JSON.stringify({ type: "error", content: err.message })),
          },
          settings,
          signal,
        );
      } finally {
        releaseAbort(uid);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function createChatSseResponse(uid: string, conversationId: string, content: string, settings: ChatSettings) {
  return createSSEStream(uid, conversationId, content, settings);
}
