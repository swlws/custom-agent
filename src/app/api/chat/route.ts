import { NextRequest } from "next/server";
import { createChatSseResponse } from "@/be/services/chatSseService";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { uid, conversationId, content, agentMode } = (await req.json()) as {
    uid?: string;
    conversationId?: string;
    content: string;
    agentMode?: "direct" | "plan-and-solve";
  };

  if (!content?.trim()) {
    return new Response("content is required", { status: 400 });
  }

  return createChatSseResponse(
    uid ?? "anonymous",
    conversationId ?? "default",
    content,
    agentMode,
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const uid = url.searchParams.get("uid") ?? "anonymous";
  const conversationId = url.searchParams.get("conversationId") ?? "default";
  const content = url.searchParams.get("content");
  const agentModeParam = url.searchParams.get("agentMode");
  const agentMode =
    agentModeParam === "direct" || agentModeParam === "plan-and-solve"
      ? agentModeParam
      : undefined;

  if (!content?.trim()) {
    return new Response("content is required", { status: 400 });
  }

  return createChatSseResponse(uid, conversationId, content, agentMode);
}
