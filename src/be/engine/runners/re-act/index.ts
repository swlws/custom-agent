import OpenAI from "openai";
import { getToolDefinitions, executeTool } from "@/be/engine/tools";
import { CardType, type ModeRunner } from "@/be/engine/runners/type";

/** Token 预算：累计消耗超过此值时，完成当前迭代后优雅退出（软约束） */
const TOKEN_BUDGET = 32_000;

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
 * ReAct 模式：Thought → Action → Observation 循环，直到 LLM 不再调用工具
 *
 * 优化项：
 * 1. Token 预算（软约束）：累计 token 超过 TOKEN_BUDGET 后不再发起新迭代
 * 2. 并行工具调用：同一轮 tool_calls 并发执行，全部完成后按序推流
 * 3. 错误透传：工具失败时将错误内容回传给 LLM，由模型决策是否重试
 */
export const reactRunner: ModeRunner = {
  async execute(_content, contextMessages, { onToken }, signal) {
    const client = createClient();
    const model = resolveModel();
    const toolDefinitions = getToolDefinitions();

    let fullReply = "";
    let usedTokens = 0;
    let messages: OpenAI.Chat.ChatCompletionMessageParam[] =
      contextMessages as OpenAI.Chat.ChatCompletionMessageParam[];

    while (usedTokens < TOKEN_BUDGET) {
      const response = await client.chat.completions.create(
        {
          model,
          messages,
          tools: toolDefinitions,
          tool_choice: "auto",
          stream: true,
          stream_options: { include_usage: true },
          temperature: 0.7,
        },
        { signal },
      );

      let stepText = "";
      const toolCallChunks: Record<
        number,
        { id: string; name: string; arguments: string }
      > = {};

      for await (const chunk of response) {
        // 记录 token 用量（出现在流的末尾 chunk）
        if (chunk.usage) {
          usedTokens += chunk.usage.total_tokens;
        }

        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          stepText += delta.content;
          fullReply += delta.content;
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallChunks[idx]) {
              toolCallChunks[idx] = {
                id: tc.id ?? "",
                name: "",
                arguments: "",
              };
            }
            if (tc.function?.name) toolCallChunks[idx].name += tc.function.name;
            if (tc.function?.arguments)
              toolCallChunks[idx].arguments += tc.function.arguments;
            if (tc.id) toolCallChunks[idx].id = tc.id;
          }
        }
      }

      const toolCalls = Object.values(toolCallChunks).map((chunk) => ({
        id: chunk.id,
        type: "function" as const,
        function: { name: chunk.name, arguments: chunk.arguments },
      }));

      onToken(CardType.Markdown, stepText);

      // 无工具调用 → LLM 已给出最终答案
      if (toolCalls.length === 0) {
        break;
      }

      // 将 assistant 消息（含 tool_calls）加入历史
      messages = [
        ...messages,
        {
          role: "assistant",
          content: stepText || null,
          tool_calls: toolCalls,
        },
      ];

      // 并行执行所有工具调用
      const toolResults = await Promise.all(
        toolCalls.map(async (tc) => {
          const args = (() => {
            try {
              return JSON.parse(tc.function.arguments) as Record<
                string,
                unknown
              >;
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
          const observationBlock =
            "\n\n> **Observation（" +
            tc.function.name +
            "）**\n> " +
            result.content.split("\n").join("\n> ") +
            "\n\n";

          fullReply += observationBlock;
          onToken(CardType.Cot, observationBlock);
        }

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result.content,
        });
      }
    }

    return fullReply;
  },
};
