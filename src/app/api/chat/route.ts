import { NextRequest } from "next/server";
import { createChatSseResponse } from "@/be/services/chatSseService";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { uid, conversationId, content, cacheCount, personaHours, mindCardsHours } = (await req.json()) as {
    uid?: string;
    conversationId?: string;
    content: string;
    cacheCount?: number;
    personaHours?: number;
    mindCardsHours?: number;
  };

  if (!content?.trim()) {
    return new Response("content is required", { status: 400 });
  }

  return createChatSseResponse(uid ?? "anonymous", conversationId ?? "default", content, {
    cacheCount: cacheCount ?? 4,
    personaHours: personaHours ?? 4,
    mindCardsHours: mindCardsHours ?? 4,
  });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const uid = url.searchParams.get("uid") ?? "anonymous";
  const conversationId = url.searchParams.get("conversationId") ?? "default";
  const content = url.searchParams.get("content");
  const cacheCount = Number(url.searchParams.get("cacheCount") ?? "4");
  const personaHours = Number(url.searchParams.get("personaHours") ?? "4");
  const mindCardsHours = Number(url.searchParams.get("mindCardsHours") ?? "4");

  if (!content?.trim()) {
    return new Response("content is required", { status: 400 });
  }

  return createChatSseResponse(uid, conversationId, content, { cacheCount, personaHours, mindCardsHours });
}
