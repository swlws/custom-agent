import type OpenAI from "openai";
import { imageGenerateTool } from "./imageGenerate";
import { webSearchTool } from "./webSearch";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>, signal?: AbortSignal): Promise<string>;
}

const registry: Tool[] = [imageGenerateTool, webSearchTool];

export function getToolRegistry(): Tool[] {
  return registry;
}

export function getToolDefinitions(): OpenAI.Chat.ChatCompletionTool[] {
  return registry.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<string> {
  const tool = registry.find((t) => t.name === name);
  if (!tool) return `[未知工具: ${name}]`;

  try {
    return await tool.execute(args, signal);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return `[工具 ${name} 执行失败: ${msg}]`;
  }
}
