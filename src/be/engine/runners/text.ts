import { chatStream } from "@/be/lib/text-llm";
import { CardType, type ModeRunner } from "./index";

export const textRunner: ModeRunner = {
  async execute(_content, contextMessages, { onToken }, signal) {
    let reply = "";
    for await (const chunk of chatStream(contextMessages, {}, signal)) {
      reply += chunk;
      onToken(CardType.Markdown, chunk);
    }
    return reply;
  },
};
