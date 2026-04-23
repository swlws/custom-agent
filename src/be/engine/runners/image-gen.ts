import { generateImage } from "@/be/lib/image-gen";
import type { ModeRunner } from "./index";

export const imageGenRunner: ModeRunner = {
  async execute(content, _contextMessages, { onToken }) {
    onToken("正在生成图片…\n\n");

    const url = await generateImage(content);

    if (!url) {
      const msg = "图片生成失败：未返回有效地址";
      onToken(msg);
      return msg;
    }

    const result = `![generated](${url})`;
    onToken(result);
    return result;
  },
};
