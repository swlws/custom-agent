import type { Message } from "@/be/lib/text-llm";
import { textRunner } from "./text";
import { planAndSolveRunner } from "./plan-and-solve";
import { reactRunner } from "./react";
import { imageGenRunner } from "./image-gen";

export const enum CardType {
  Markdown = 1,
  Cot = 2,
  Error = 3,
  Image = 4,
}

export interface RunnerHandlers {
  onToken: (cardType: CardType, token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

/** 每种模式实现此接口，返回完整的 assistant 输出文本 */
export interface ModeRunner {
  execute(
    content: string,
    contextMessages: Message[],
    handlers: RunnerHandlers,
    signal?: AbortSignal,
  ): Promise<string>;
}

export const modeRunners = new Map<string, ModeRunner>([
  ["text", textRunner],
  ["image-gen", imageGenRunner],
  ["plan-and-solve", planAndSolveRunner],
  ["react", reactRunner],
]);
