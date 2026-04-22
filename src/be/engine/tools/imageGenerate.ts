import { generateImage } from "@/be/lib/image-gen";
import type { Tool } from "./index";

export const imageGenerateTool: Tool = {
  name: "image_generate",
  description: "根据文字描述生成图片，返回 markdown 格式的图片链接",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "图片内容的详细描述",
      },
    },
    required: ["prompt"],
  },
  async execute(args) {
    const prompt = args.prompt as string;
    const url = await generateImage(prompt || "一张精美的图片");
    return `![generated image](${url})`;
  },
};
