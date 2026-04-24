import { QueryEngine } from "@/be/engine";
import type { AgentMode } from "@/be/config/settings";
import type { CardType } from "@/be/engine/runners";import { registerAbort, releaseAbort } from "./abortRegistry";


const engine = new QueryEngine();

function createSSEStream(
  uid: string,
  conversationId: string,
  content: string,
  agentMode?: AgentMode,
) {
  const signal = registerAbort(uid, conversationId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        await engine.run(
          { uid, conversationId, content, agentMode },
          {
            onToken: (cardType: CardType, chunk: string) => sendEvent(JSON.stringify({ type: "token", cardType, content: chunk })),
            onDone:  () => sendEvent("[DONE]"),
            onError: (err) => sendEvent(JSON.stringify({ type: "error", content: err.message })),
          },
          signal,
        );
      } finally {
        releaseAbort(uid, conversationId);
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

export function createChatSseResponse(
  uid: string,
  conversationId: string,
  content: string,
  agentMode?: AgentMode,
) {
  return createSSEStream(uid, conversationId, content, agentMode);
}
