import { useSyncExternalStore } from 'react';

/** Open/close state for the app sidebar (drawer). Same pattern as appState. */
let open = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const openDrawer = () => {
  open = true;
  emit();
};

export const closeDrawer = () => {
  open = false;
  emit();
};

export function useDrawerOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => open
  );
}
