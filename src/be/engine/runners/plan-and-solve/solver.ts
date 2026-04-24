import OpenAI from "openai";
import { Message } from "@/be/lib/text-llm";
import { getToolDefinitions, executeTool } from "@/be/engine/tools";
import type { PlanStep } from "./planner";
import { CardType } from "@/be/engine/runners";

const MAX_TOOL_ITERATIONS = 3;

function createClient(): OpenAI {
  const apiKey = process.env.SWLWS_TEXT_LLM_API_KEY;
  if (!apiKey) throw new Error("SWLWS_TEXT_LLM_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: process.env.SWLWS_TEXT_LLM_BASE_URL });
}

function resolveModel(): string {
  const model = process.env.SWLWS_TEXT_LLM_MODEL;
  if (!model) throw new Error("SWLWS_TEXT_LLM_MODEL is not set");
  return model;
}

/**
 * 执行单个计划步骤，支持工具调用循环，流式推送 token
 * 返回本步骤完整输出文本
 */
export async function solveStep(
  step: PlanStep,
  allSteps: PlanStep[],
  originalQuery: string,
  contextMessages: Message[],
  previousResults: string[],
  onToken: (cardType: CardType, token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const stepHeader = `## 🔍 步骤 ${step.index + 1}：${step.title}\n\n`;
  onToken(CardType.Markdown, stepHeader);

  const messages = buildStepMessages(
    step,
    allSteps,
    originalQuery,
    contextMessages,
    previousResults,
  );

  const client = createClient();
  const model = resolveModel();
  const toolDefinitions = getToolDefinitions();

  let fullOutput = stepHeader;
  let iterations = 0;
  let currentMessages = [...messages];

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const response = await client.chat.completions.create(
      {
        model,
        messages: currentMessages,
        tools: toolDefinitions,
        tool_choice: "auto",
        stream: true,
        temperature: 0.7,
      },
      { signal },
    );

    let stepText = "";
    const toolCalls: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> = [];
    const toolCallChunks: Record<number, { id: string; name: string; arguments: string }> = {};

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        stepText += delta.content;
        fullOutput += delta.content;
        onToken(CardType.Markdown, delta.content);
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallChunks[idx]) {
            toolCallChunks[idx] = { id: tc.id ?? "", name: "", arguments: "" };
          }
          if (tc.function?.name) toolCallChunks[idx].name += tc.function.name;
          if (tc.function?.arguments) toolCallChunks[idx].arguments += tc.function.arguments;
          if (tc.id) toolCallChunks[idx].id = tc.id;
        }
      }
    }

    for (const chunk of Object.values(toolCallChunks)) {
      toolCalls.push({
        id: chunk.id,
        type: "function",
        function: { name: chunk.name, arguments: chunk.arguments },
      });
    }

    if (toolCalls.length === 0) break;

    const assistantMessage: OpenAI.Chat.ChatCompletionMessageParam = {
      role: "assistant",
      content: stepText || null,
      tool_calls: toolCalls,
    };
    currentMessages = [...currentMessages, assistantMessage];

    // 并行执行所有工具调用
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        const args = (() => {
          try {
            return JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            return {};
          }
        })();

        const result = await executeTool(tc.function.name, args, signal);

        return { tc, result };
      }),
    );

    // 按顺序推流 Observation 并追加消息历史
    for (const { tc, result } of toolResults) {
      if (result.isImage) {
        onToken(CardType.Image, result.content);
      } else {
        const resultBlock = `\n\n> **工具：${tc.function.name}**\n> ${result.content.split("\n").join("\n> ")}\n\n`;
        fullOutput += resultBlock;
        onToken(CardType.Markdown, resultBlock);
      }

      currentMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result.content,
      });
    }
  }

  onToken(CardType.Markdown, "\n\n");
  fullOutput += "\n\n";

  return fullOutput;
}

function buildStepMessages(
  step: PlanStep,
  allSteps: PlanStep[],
  originalQuery: string,
  contextMessages: Message[],
  previousResults: string[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const systemContent = contextMessages[0]?.role === "system"
    ? (contextMessages[0].content as string)
    : "";

  const planSummary = allSteps
    .map((s) => `${s.index + 1}. ${s.title}：${s.description}`)
    .join("\n");

  const previousContext =
    previousResults.length > 0
      ? `\n\n### 已完成步骤的输出：\n${previousResults
          .map((r, i) => `**步骤 ${i + 1} 输出：**\n${r}`)
          .join("\n\n")}`
      : "";

  const stepInstruction = `你正在执行多步骤任务的第 ${step.index + 1} 步。

原始问题：${originalQuery}

完整执行计划：
${planSummary}
${previousContext}

当前步骤（第 ${step.index + 1} 步）：${step.title}
任务说明：${step.description}

请专注完成当前步骤，可使用工具辅助。输出应简洁有针对性。`;

  return [
    { role: "system", content: systemContent ? `${systemContent}\n\n${stepInstruction}` : stepInstruction },
    ...contextMessages.slice(1, -1).slice(-4) as OpenAI.Chat.ChatCompletionMessageParam[],
    { role: "user", content: stepInstruction },
  ];
}
