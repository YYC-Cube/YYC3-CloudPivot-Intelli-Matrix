/**
 * @file constants/storage-keys.ts
 * @description 面板管理器 localStorage 键名与工具函数
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

/** 面板布局持久化键 */
export const SK_PANEL_LAYOUT = "yyc3_panel_layout";

/** 安全读取 JSON，解析失败时返回 fallback */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** 安全写入 JSON */
export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
