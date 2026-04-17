import { NextRequest, NextResponse } from "next/server";
import { loadSession } from "@/be/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const session = await loadSession(uid);
  const all = session.mindCards ?? [];
  if (all.length <= 4) return NextResponse.json(all);

  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return NextResponse.json(shuffled.slice(0, 4));
}
