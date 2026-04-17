import { NextRequest, NextResponse } from "next/server";
import { loadMindCardsData, loadUserSettings } from "@/be/session";
import { loadDefaultSettings, mergeSettings } from "@/be/config/settings";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const [defaults, userOverrides] = await Promise.all([
    loadDefaultSettings(),
    loadUserSettings(uid),
  ]);
  const { mindCardsDisplayCount } = mergeSettings(defaults, userOverrides);

  const data = await loadMindCardsData(uid);
  const all = data.cards;
  if (all.length <= mindCardsDisplayCount) return NextResponse.json(all);

  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return NextResponse.json(shuffled.slice(0, mindCardsDisplayCount));
}
