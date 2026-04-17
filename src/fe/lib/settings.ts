export interface AppSettings {
  /** 对话缓存消息条数（压缩前保留的最近消息数），4-12 */
  conversationCacheCount: number;
  /** 人物画像更新间隔（小时） */
  personaUpdateHours: number;
  /** 默认展示的心智卡片数量，2 的倍数，最多 16 */
  mindCardsDisplayCount: number;
  /** 心智卡片更新间隔（小时） */
  mindCardsUpdateHours: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  conversationCacheCount: 4,
  personaUpdateHours: 4,
  mindCardsDisplayCount: 4,
  mindCardsUpdateHours: 4,
};

const SETTINGS_KEY = "app_settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
