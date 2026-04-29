import { httpRequest } from "@/fe/lib/http";
import type {
  McpServerConfig,
  McpStdioServerConfig,
  McpSseServerConfig,
} from "@/be/engine/tools/mcp/config";
import type { McpServerStatus } from "@/be/engine/tools/mcp";

export type {
  McpServerConfig,
  McpStdioServerConfig,
  McpSseServerConfig,
  McpServerStatus,
};

export function getMcpServers(): Promise<McpServerStatus[]> {
  return httpRequest("/api/mcp");
}

export function addMcpServer(
  name: string,
  config: McpServerConfig,
): Promise<{ ok: boolean; error?: string }> {
  return httpRequest("/api/mcp", {
    method: "POST",
    body: { name, config },
  });
}

export function deleteMcpServer(
  name: string,
): Promise<{ ok: boolean }> {
  return httpRequest("/api/mcp", {
    method: "DELETE",
    body: { name },
  });
}

export function stopMcpServer(
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  return httpRequest("/api/mcp", {
    method: "PATCH",
    body: { name, action: "stop" },
  });
}

export function startMcpServer(
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  return httpRequest("/api/mcp", {
    method: "PATCH",
    body: { name, action: "start" },
  });
}
