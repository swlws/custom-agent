import { NextRequest, NextResponse } from "next/server";
import { mcpManager } from "@/be/engine/tools/mcp";
import type { McpServerConfig } from "@/be/engine/tools/mcp/config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(mcpManager.getServerStatuses());
}

export async function POST(req: NextRequest) {
  const { name, config } = (await req.json()) as {
    name?: string;
    config?: McpServerConfig;
  };
  if (!name || !config) {
    return NextResponse.json(
      { error: "name and config are required" },
      { status: 400 },
    );
  }
  try {
    await mcpManager.addServer(name, config);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { name } = (await req.json()) as { name?: string };
  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 },
    );
  }
  await mcpManager.removeServer(name);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { name, action } = (await req.json()) as {
    name?: string;
    action?: "start" | "stop";
  };
  if (!name || !action) {
    return NextResponse.json(
      { error: "name and action are required" },
      { status: 400 },
    );
  }
  try {
    if (action === "stop") {
      await mcpManager.stopServer(name);
    } else {
      await mcpManager.startServer(name);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
