import { NextRequest, NextResponse } from "next/server";
import { loadDefaultSettings, mergeSettings, type AppSettings } from "@/be/config/settings";
import { loadUserSettings, saveUserSettings } from "@/be/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const defaults = await loadDefaultSettings();
  const user = await loadUserSettings(uid);
  return NextResponse.json(mergeSettings(defaults, user));
}

export async function POST(req: NextRequest) {
  const { uid, settings } = (await req.json()) as { uid?: string; settings: Partial<AppSettings> };
  const resolvedUid = uid ?? "anonymous";
  await saveUserSettings(resolvedUid, settings);
  const defaults = await loadDefaultSettings();
  const user = await loadUserSettings(resolvedUid);
  return NextResponse.json(mergeSettings(defaults, user));
}
