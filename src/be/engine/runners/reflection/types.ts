import { CardType } from "../type";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type OnToken = (cardType: CardType, token: string) => void;

export interface PhaseContext {
  messages: ChatCompletionMessageParam[];
  onToken: OnToken;
  signal?: AbortSignal;
}

export const DEFAULT_MAX_ROUNDS = 3;
export const DRAFT_TEMPERATURE = 0.7;
export const AUDIT_TEMPERATURE = 0.2;
export const SIMILARITY_THRESHOLD = 0.8;

export const AUDIT_INSTRUCTION = `你是一个严格的审查员。请对照用户的原始需求和 assistant 给出的答案进行审查。
你必须且只能输出一个 JSON 对象，格式如下（不要输出任何其他文字）：
{ "status": "pass" | "fail", "confidence": 0-1 之间的数字, "issues": [{ "severity": "critical" | "minor", "description": "问题描述", "suggestion": "改进建议" }] }
- status 为 "pass" 表示答案已足够好，"fail" 表示存在问题。
- 仅当存在 critical 级别问题时才设为 "fail"。minor 问题可以记录但不影响 status。`;