import { chatStream } from "@/be/lib/llm";
import { buildContextMessages, updateSession } from "@/be/memory";
import { loadSession, saveSession } from "@/be/session";

function createSSEStream(uid: string, content: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        const session = await loadSession(uid);
        const contextMessages = buildContextMessages(session, content);

        let assistantReply = "";
        for await (const chunk of chatStream(contextMessages)) {
          assistantReply += chunk;
          sendEvent(JSON.stringify({ type: "token", content: chunk }));
        }

        sendEvent("[DONE]");

        // Fire-and-forget: persist session without blocking the SSE response
        updateSession(session, content, assistantReply)
          .then((updated) => saveSession(uid, updated))
          .catch((err) => console.error("[memory] failed to save session:", err));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        sendEvent(JSON.stringify({ type: "error", content: msg }));
      } finally {
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

export function createChatSseResponse(uid: string, content: string) {
  return createSSEStream(uid, content);
}
