export type { AppSettings } from "@/be/config/settings";
import type { AppSettings } from "@/be/config/settings";
import { getUid } from "@/fe/lib/uid";

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`/api/settings?uid=${encodeURIComponent(getUid())}`);
  return res.json() as Promise<AppSettings>;
}

export async function persistSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: getUid(), settings }),
  });
  return res.json() as Promise<AppSettings>;
}
