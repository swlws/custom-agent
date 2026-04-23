import { NextRequest, NextResponse } from "next/server";
import { listConversations, deleteConversation } from "@/be/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const metas = await listConversations(uid);
  return NextResponse.json(metas);
}

export async function DELETE(req: NextRequest) {
  const { uid, conversationId } = (await req.json()) as {
    uid?: string;
    conversationId?: string;
  };
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }
  await deleteConversation(uid ?? "anonymous", conversationId);
  return NextResponse.json({ ok: true });
}
