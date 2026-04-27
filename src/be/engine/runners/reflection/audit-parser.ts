import type { AuditResult } from "../type";

/** 从 Audit 阶段的 LLM 输出中解析 AuditResult JSON */
export function parseAuditResult(raw: string): AuditResult {
  const jsonMatch =
    raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return { status: "pass", confidence: 0, issues: [] };
  try {
    const parsed = JSON.parse(jsonMatch[1]) as AuditResult;
    if (parsed.status !== "pass" && parsed.status !== "fail") {
      parsed.status = "pass";
    }
    if (!Array.isArray(parsed.issues)) parsed.issues = [];
    return parsed;
  } catch {
    return { status: "pass", confidence: 0, issues: [] };
  }
}

/** 基于 Jaccard 相似度的收敛检测 */
export function issuesSimilarity(a: AuditResult, b: AuditResult): number {
  const setA = new Set(a.issues.map((i) => i.description));
  const setB = new Set(b.issues.map((i) => i.description));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 1 : intersection / union;
}