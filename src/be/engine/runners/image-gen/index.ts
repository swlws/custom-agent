import { generateImage } from "@/be/lib/image-gen";
import { CardType, type ModeRunner } from "../type";

export const imageGenRunner: ModeRunner = {
  async execute(content, _contextMessages, { onToken }) {
    onToken(CardType.Markdown, "正在生成图片…\n\n");

    const url = await generateImage(content);

    if (!url) {
      const msg = "图片生成失败：未返回有效地址";
      onToken(CardType.Markdown, msg);
      return msg;
    }

    onToken(CardType.Image, url);
    return url;
  },
};
