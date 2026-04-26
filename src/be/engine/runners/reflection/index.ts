import { ModeRunner } from "../type";
import { CardType } from "../type";
import { runReActLoop } from "../common/react-core";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Reflection 模式：
 * 1️⃣ 先让模型思考（Cot 卡片）
 * 2️⃣ 生成初稿（Markdown 卡片）
 * 3️⃣ 进行自我审查（Cot 卡片）
 * 4️⃣ 若审查结果包含 "需要改进"，再次生成改进稿（Markdown 卡片）
 * 5️⃣ 最终输出答案（Markdown 卡片）
 *
 * 为了避免无限循环，最多只进行一次自我修正。
 */
export const reflectionRunner: ModeRunner = {
  async execute(content, contextMessages, { onToken }, signal) {
    // ---------- 第一步：思考 ----------
    const thinkHeader = "## 🔍 反思：思考阶段\n\n";
    onToken(CardType.Cot, thinkHeader);
    const thinkPrompt = `请就以下需求进行深入思考，列出关键点、可能的实现方案以及需要注意的风险。\n\n需求：${content}`;
    await runReActLoop(
      [{ role: "user", content: thinkPrompt } as ChatCompletionMessageParam],
      (type, token) => onToken(type, token),
      { signal },
    );

    // ---------- 第二步：生成初稿 ----------
    const draftHeader = "## 🔍 反思：生成初稿\n\n";
    onToken(CardType.Cot, draftHeader);
    const draftPrompt = `基于上面的思考，请直接给出完整的答案或实现代码。`;
    await runReActLoop(
      [
        {
          role: "user",
          content: draftPrompt,
        } as OpenAI.Chat.ChatCompletionMessageParam,
      ],
      (type, token) => onToken(type, token),
      { signal },
    );

    // ---------- 第三步：自我审查 ----------
    const checkHeader = "## 🔍 反思：自我审查\n\n";
    onToken(CardType.Cot, checkHeader);
    const checkPrompt = `请审查刚才生成的答案，判断是否完整、准确、易懂。\n如果存在错误或不完善的地方，请在回复中明确指出，并在同一条信息中给出改进建议。\n如果答案已经足够好，请直接回复 “✅ 完成”。`;
    let auditResult = "";
    await runReActLoop(
      [
        {
          role: "user",
          content: checkPrompt,
        } as OpenAI.Chat.ChatCompletionMessageParam,
      ],
      (type, token) => {
        onToken(type, token);
        if (type === CardType.Markdown) auditResult += token;
      },
      { signal },
    );

    // ---------- 第四步：根据审查结果可能进行修正 ----------
    if (!auditResult.includes("✅ 完成")) {
      const reviseHeader = "## 🔍 反思：修正阶段\n\n";
      onToken(CardType.Cot, reviseHeader);
      const revisePrompt = `请依据以下审查意见对答案进行改进。\n审查意见：${auditResult}`;
      await runReActLoop(
        [
          {
            role: "user",
            content: revisePrompt,
          } as OpenAI.Chat.ChatCompletionMessageParam,
        ],
        (type, token) => onToken(type, token),
        { signal },
      );
    }

    // 最终返回空字符串（实际内容已经通过 onToken 推送）
    return "";
  },
};
