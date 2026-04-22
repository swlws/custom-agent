import type OpenAI from "openai";
import { imageGenerateTool } from "./imageGenerate";
import { webSearchTool } from "./webSearch";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>, signal?: AbortSignal): Promise<string>;
}

export interface ToolResult {
  content: string;
  isError: boolean;
}

// const registry: Tool[] = [imageGenerateTool, webSearchTool];
const registry: Tool[] = [imageGenerateTool];

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
): Promise<ToolResult> {
  const tool = registry.find((t) => t.name === name);
  if (!tool) {
    return { content: `[未知工具: ${name}]`, isError: true };
  }

  try {
    const content = await tool.execute(args, signal);
    return { content, isError: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { content: `[工具 ${name} 执行失败: ${msg}]`, isError: true };
  }
}
