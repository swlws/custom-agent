import { CardType, AuditResult } from "../type";
import { issuesSimilarity } from "./audit-parser";
import { runAuditPhase, runRevisePhase } from "./phases";
import { PhaseContext, OnToken, SIMILARITY_THRESHOLD } from "./types";

/** 输出审查通过的摘要（含 minor 附注） */
function emitPassSummary(onToken: OnToken, audit: AuditResult): void {
  onToken(CardType.Cot, "\n\n✅ 审查通过，无 critical 问题。\n");
  const minorNotes = audit.issues
    .filter((i) => i.severity === "minor")
    .map((i) => `- [minor] ${i.description}`)
    .join("\n");
  if (minorNotes) {
    onToken(CardType.Cot, `\n附注（minor 问题）：\n${minorNotes}\n`);
  }
}

/** Audit→Revise 多轮循环（含收敛检测与触顶保护） */
export async function runAuditReviseLoop(
  ctx: PhaseContext,
  maxRounds: number,
): Promise<void> {
  let prevAudit: AuditResult | null = null;

  for (let round = 1; round <= maxRounds; round++) {
    const audit = await runAuditPhase(ctx, round);
    const hasCritical = audit.issues.some((i) => i.severity === "critical");

    if (audit.status === "pass" || !hasCritical) {
      emitPassSummary(ctx.onToken, audit);
      return;
    }

    if (prevAudit && issuesSimilarity(prevAudit, audit) > SIMILARITY_THRESHOLD) {
      ctx.onToken(
        CardType.Cot,
        "\n\n⚠️ 连续两轮审查问题高度重复，提前结束避免无效循环。\n",
      );
      return;
    }
    prevAudit = audit;

    if (round === maxRounds) {
      ctx.onToken(
        CardType.Cot,
        `\n\n⚠️ 已达最大修正轮次（${maxRounds}），输出最后一稿。\n`,
      );
      return;
    }

    await runRevisePhase(ctx, round, audit);
  }
}