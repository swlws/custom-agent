import type { Message } from "@/be/lib/text-llm";

const SHALLOW_CONSTRAINT_PROMPT = `你是一个务实的工程助手。当前会话未启用深度思考模式，请严格遵循以下约束：
1) 优先给出结论与可执行步骤，避免冗长铺垫。
2) 默认输出简洁内容；仅在必要时补充关键理由。
3) 不暴露内部推理过程，不输出“思维链”式内容。
4) 未明确需要输出代码时，不要输出代码。
5) 涉及代码时，优先最小改动方案，并明确影响范围与验证方式。
6) 信息不足时先说明缺失信息与假设，避免过度推断。`;

const DEEP_THINK_PROMPT = `当前会话已启用深度思考模式。请在保证结论可执行的前提下，补充：
1) 关键假设与边界条件
2) 风险点与替代方案
3) 验证与回归检查建议`;

export function applyDeepThinkPolicyPrompt(
  contextMessages: Message[],
  deepThink = false,
): Message[] {
  const policyPrompt = deepThink ? DEEP_THINK_PROMPT : SHALLOW_CONSTRAINT_PROMPT;
  const policyMessage: Message = { role: "system", content: policyPrompt };

  const userIndex = contextMessages.findLastIndex((m) => m.role === "user");
  if (userIndex === -1) return [...contextMessages, policyMessage];

  return [
    ...contextMessages.slice(0, userIndex),
    policyMessage,
    ...contextMessages.slice(userIndex),
  ];
}
