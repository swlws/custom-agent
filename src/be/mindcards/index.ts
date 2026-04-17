import { chat } from "@/be/lib/llm";
import type { Persona, MindCard } from "@/be/session";

const MINDCARDS_PROMPT = `你是一个对话引导专家。根据用户的人物画像，生成 4 张心智卡片，帮助用户快速开始有价值的对话。

每张卡片要求：
- title：2-5 字的主题标题，精准概括
- desc：一句话说明这张卡片能带来什么价值，15 字以内
- prompt：用户点击后直接发送的具体问题，要有深度、贴合画像，20-40 字

要求：
- 4 张卡片覆盖不同维度，避免重复
- 贴合用户的知识领域、关注点和价值取向
- prompt 要具体，不要泛泛而谈
- 仅输出 JSON 数组，不添加任何其他文字

输出格式：
[{"title":"...","desc":"...","prompt":"..."}]`;

export async function generateMindCards(persona: Persona): Promise<MindCard[]> {
  const personaText = [
    `总结：${persona.summary}`,
    ...persona.traits.map((t) => `${t.dimension}：${t.value}`),
  ].join("\n");

  const raw = await chat([
    { role: "system", content: MINDCARDS_PROMPT },
    { role: "user", content: `人物画像：\n${personaText}` },
  ]);

  console.log(raw);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as MindCard[]) : [];
  } catch {
    return [];
  }
}
