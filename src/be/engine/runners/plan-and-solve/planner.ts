import { chat, Message } from "@/be/lib/text-llm";
import { CardType } from "@/be/engine/runners";

export interface PlanStep {
  index: number;
  title: string;
  description: string;
}

const PLANNER_SYSTEM_PROMPT =
  "你是一个任务规划专家。用户会给你一个问题或任务，你需要将其拆解为 2~5 个清晰的执行步骤。\n\n" +
  "规则：\n" +
  "- 步骤数量：2~5 个，根据任务复杂度决定，简单问题 2 步，复杂问题 4~5 步\n" +
  "- 每个步骤有简短标题（10 字以内）和一句话描述（不超过 30 字）\n" +
  "- 只输出 JSON，不要有任何其他文字\n\n" +
  '输出格式（严格 JSON）：\n{"steps":[{"title":"步骤标题","description":"步骤描述"},...]}';

/**
 * 调用 LLM 生成执行计划，将计划格式化为 markdown 流式推送，并返回结构化步骤列表
 */
export async function generatePlan(
  content: string,
  contextMessages: Message[],
  onToken: (cardType: CardType, token: string) => void,
  signal?: AbortSignal,
): Promise<PlanStep[]> {
  const planMessages: Message[] = [
    { role: "system", content: PLANNER_SYSTEM_PROMPT },
    // 保留 memory 上下文中除原 system 以外的消息
    ...contextMessages.slice(1),
    { role: "user", content: "请为以下任务制定执行计划：\n\n" + content },
  ];

  const raw = await chat(planMessages, { temperature: 0.3 });

  let steps: Array<{ title: string; description: string }> = [];
  try {
    // 提取 JSON（兼容 LLM 在 JSON 外多输出文字的情况）
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        steps?: Array<{ title: string; description: string }>;
      };
      steps = parsed.steps ?? [];
    }
  } catch {
    steps = [{ title: "直接回答", description: "根据问题直接生成回答" }];
  }

  if (steps.length === 0) {
    steps = [{ title: "直接回答", description: "根据问题直接生成回答" }];
  }

  const planSteps: PlanStep[] = steps.map((s, i) => ({
    index: i,
    title: s.title,
    description: s.description,
  }));

  const planMarkdown = formatPlanMarkdown(planSteps);
  await streamText(
    planMarkdown,
    (token) => onToken(CardType.Cot, token),
    signal,
  );

  return planSteps;
}

function formatPlanMarkdown(steps: PlanStep[]): string {
  const lines: string[] = [];
  for (const step of steps) {
    lines.push("**" + (step.index + 1) + ". " + step.title + "**\n");
    lines.push("   " + step.description + "\n\n");
  }
  return lines.join("");
}

/** 以小块方式推送文本，模拟流式体验 */
async function streamText(
  text: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const chunkSize = 4;
  for (let i = 0; i < text.length; i += chunkSize) {
    if (signal?.aborted) break;
    onToken(text.slice(i, i + chunkSize));
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}
