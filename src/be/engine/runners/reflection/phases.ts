import { CardType, AuditResult } from "../type";
import { runReActLoop } from "../common/react-core";
import { parseAuditResult } from "./audit-parser";
import {
  PhaseContext,
  DRAFT_TEMPERATURE,
  AUDIT_TEMPERATURE,
  AUDIT_INSTRUCTION,
} from "./types";

export async function runThinkPhase(
  ctx: PhaseContext,
  content: string,
): Promise<void> {
  ctx.onToken(CardType.Cot, "## 🔍 反思：思考阶段\n\n");
  ctx.messages.push({
    role: "user",
    content: `请就以下需求进行深入思考，列出关键点、可能的实现方案以及需要注意的风险。\n\n需求：${content}`,
  });
  await runReActLoop(ctx.messages, ctx.onToken, {
    signal: ctx.signal,
    temperature: DRAFT_TEMPERATURE,
    mutable: true,
  });
}

export async function runDraftPhase(ctx: PhaseContext): Promise<void> {
  ctx.onToken(CardType.Divider, "");
  ctx.onToken(CardType.Markdown, "");
  ctx.messages.push({
    role: "user",
    content: "基于上述思考，请给出完整的答案或实现代码。",
  });
  await runReActLoop(ctx.messages, ctx.onToken, {
    signal: ctx.signal,
    temperature: DRAFT_TEMPERATURE,
    mutable: true,
  });
}

export async function runAuditPhase(
  ctx: PhaseContext,
  round: number,
): Promise<AuditResult> {
  ctx.onToken(CardType.Divider, "");
  ctx.onToken(CardType.Cot, `## 🔍 反思：自我审查（第 ${round} 轮）\n\n`);
  ctx.messages.push({
    role: "user",
    content: `请审查你上面给出的答案。\n\n${AUDIT_INSTRUCTION}`,
  });

  let auditRaw = "";
  await runReActLoop(
    ctx.messages,
    (_type, token) => {
      ctx.onToken(CardType.Cot, token);
      auditRaw += token;
    },
    { signal: ctx.signal, temperature: AUDIT_TEMPERATURE, mutable: true },
  );

  return parseAuditResult(auditRaw);
}

export async function runRevisePhase(
  ctx: PhaseContext,
  round: number,
  audit: AuditResult,
): Promise<void> {
  ctx.onToken(CardType.Divider, "");
  ctx.onToken(CardType.Markdown, "");
  ctx.onToken(CardType.Cot, `## 🔍 反思：修正阶段（第 ${round} 轮）\n\n`);

  const issuesList = audit.issues
    .filter((i) => i.severity === "critical")
    .map((i) => `- ${i.description}\n  建议：${i.suggestion}`)
    .join("\n");

  ctx.messages.push({
    role: "user",
    content: `审查发现以下 critical 问题，请针对性修正你的答案：\n\n${issuesList}`,
  });

  await runReActLoop(ctx.messages, ctx.onToken, {
    signal: ctx.signal,
    temperature: DRAFT_TEMPERATURE,
    mutable: true,
  });
}