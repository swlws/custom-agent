import fs from "fs/promises";
import { MCP_CONFIG_PATH } from "@/be/config/paths";

export interface McpStdioServerConfig {
  transport: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpSseServerConfig {
  transport: "sse";
  url: string;
  headers?: Record<string, string>;
}

export type McpServerConfig = McpStdioServerConfig | McpSseServerConfig;

/** 原始配置：兼容未显式声明 transport 的写法 */
type RawServerConfig =
  | (Partial<McpStdioServerConfig> & { command: string })
  | (Partial<McpSseServerConfig> & { url: string });

interface RawMcpConfig {
  mcpServers: Record<string, RawServerConfig>;
}

/** 根据字段推断 transport，兼容 Claude Desktop 风格的简化配置 */
function normalizeServerConfig(raw: RawServerConfig): McpServerConfig {
  if (raw.transport === "sse" || ("url" in raw && raw.url)) {
    return {
      transport: "sse",
      url: (raw as { url: string }).url,
      headers: (raw as { headers?: Record<string, string> }).headers,
    };
  }
  return {
    transport: "stdio",
    command: (raw as { command: string }).command,
    args: (raw as { args?: string[] }).args,
    env: (raw as { env?: Record<string, string> }).env,
  };
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export async function loadMcpConfig(): Promise<McpConfig> {
  try {
    const raw = await fs.readFile(MCP_CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as RawMcpConfig;
    const mcpServers: Record<string, McpServerConfig> = {};
    for (const [name, rawConfig] of Object.entries(parsed.mcpServers)) {
      mcpServers[name] = normalizeServerConfig(rawConfig);
    }
    return { mcpServers };
  } catch {
    return { mcpServers: {} };
  }
}

export async function saveMcpConfig(config: McpConfig): Promise<void> {
  await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
