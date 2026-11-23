import type { NotificationKind } from "@/hooks/use-notifications";

const STORAGE_KEY = "bakery-notification-prefs";
export const PREFS_EVENT = "bakery:notification-prefs";

export type NotificationPrefs = Record<NotificationKind, boolean>;

export const DEFAULT_PREFS: NotificationPrefs = {
  stock: true,
  payment: true,
  due: true,
  ready: true,
};

export function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<NotificationPrefs>;
    return {
      stock: stored.stock !== false,
      payment: stored.payment !== false,
      due: stored.due !== false,
      ready: stored.ready !== false,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage disabled: the in-memory state still applies for this session.
  }
  window.dispatchEvent(new Event(PREFS_EVENT));
}
