import { useSyncExternalStore } from 'react';
import { notifications as seed, type AppNotification } from '@ahla/shared';

/** Notification-center state — module-level so read/unread persists across screens. */
let items: AppNotification[] = seed.map((n) => ({ ...n }));
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const notificationStore = {
  markRead(id: string) {
    items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    emit();
  },
  markAllRead() {
    items = items.map((n) => ({ ...n, read: true }));
    emit();
  },
};

export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => items
  );
}

export function useUnreadCount(): number {
  return useNotifications().filter((n) => !n.read).length;
}
