import { NextRequest, NextResponse } from "next/server";
import { abortByUid } from "@/be/services/abortRegistry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { uid } = (await req.json()) as { uid?: string };
  abortByUid(uid ?? "anonymous");
  return NextResponse.json({ ok: true });
}
