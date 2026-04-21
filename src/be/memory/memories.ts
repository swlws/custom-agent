import { chat } from "@/be/lib/text-llm";
import type { ConversationData, Memory, ChatMessage } from "@/be/session";

const EXTRACT_PROMPT = `你是一个对话记忆提取助手。请从新增对话中提取关键信息，与现有记忆合并更新后输出完整记忆列表。

类型说明：
- context：对话背景、主题、用户目标
- preference：用户偏好、风格要求
- decision：已达成的结论或决策
- fact：重要的客观事实

规则：
- 同类型的记忆合并为一条，不重复
- description 为一句话索引，content 为详细内容
- 无新信息时原样保留现有记忆
- 仅输出 JSON 数组，不添加任何其他文字

输出格式：
[{"type":"context|preference|decision|fact","description":"一句话索引","content":"详细内容"}]`;

async function extractMemories(
  existing: Memory[],
  newMessages: ChatMessage[],
): Promise<Memory[]> {
  const transcript = newMessages
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");

  const parts: string[] = [];
  if (existing.length > 0) {
    parts.push(`现有记忆：\n${JSON.stringify(existing, null, 2)}`);
  }
  parts.push(`新增对话：\n${transcript}`);

  const raw = await chat([
    { role: "system", content: EXTRACT_PROMPT },
    { role: "user", content: parts.join("\n\n") },
  ]);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as Memory[]) : existing;
  } catch {
    return existing;
  }
}

/**
 * 截断消息列表至 maxCount 条，纯内存操作，不调用 LLM。
 * 截断时同步修正 summarizedUpTo 游标。
 */
export function trimMessages(
  conv: ConversationData,
  maxCount = 100,
): ConversationData {
  if (conv.messages.length <= maxCount) return conv;
  const dropped = conv.messages.length - maxCount;
  return {
    ...conv,
    messages: conv.messages.slice(dropped),
    summarizedUpTo: Math.max(0, conv.summarizedUpTo - dropped),
  };
}

/**
 * 按游标判断是否需要重新生成历史摘要。
 * 每新增 triggerCount 条消息（默认 8，即 4 次对话）触发一次 LLM 提炼。
 * 未达到阈值时直接返回，不消耗 LLM。
 */
export async function maybeUpdateSummary(
  conv: ConversationData,
  triggerCount = 8,
): Promise<ConversationData> {
  const newCount = conv.messages.length - conv.summarizedUpTo;
  if (newCount < triggerCount) return conv;

  const newMessages = conv.messages.slice(conv.summarizedUpTo);
  const memories = await extractMemories(conv.memories, newMessages);

  return {
    ...conv,
    memories,
    summarizedUpTo: conv.messages.length,
  };
}
