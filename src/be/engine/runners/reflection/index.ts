import { ModeRunner } from "../type";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { PhaseContext, DEFAULT_MAX_ROUNDS } from "./types";
import { runThinkPhase, runDraftPhase } from "./phases";
import { runAuditReviseLoop } from "./audit-loop";

/**
 * Reflection 模式（环境驱动）：所有阶段共享同一 messages[]
 *
 * Think → Draft → Audit ⇄ Revise（最多 MAX_ROUNDS 轮）
 */
export const reflectionRunner: ModeRunner = {
  async execute(content, contextMessages, { onToken }, signal) {
    const ctx: PhaseContext = {
      messages: [
        ...(contextMessages as ChatCompletionMessageParam[]),
        { role: "user", content },
      ],
      onToken,
      signal,
    };

    await runThinkPhase(ctx, content);
    await runDraftPhase(ctx);
    await runAuditReviseLoop(ctx, DEFAULT_MAX_ROUNDS);

    return "";
  },
};