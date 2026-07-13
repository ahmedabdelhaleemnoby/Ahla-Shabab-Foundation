import { useSyncExternalStore } from 'react';
import {
  makeDefaultCmsState,
  CMS_SCHEMA_VERSION,
  type CmsState,
  type CmsActivityEntry,
  type MediaItem,
} from '@ahla/shared';
import { loadCms, saveCms, backupCms, restoreBackup, isValidCmsState, migrate, storageSizeBytes } from './cmsPersistence';

/**
 * The one typed CMS source of truth for the dashboard. Hand-rolled
 * `useSyncExternalStore` store (no extra deps) with localStorage persistence,
 * a bounded undo history, and an activity log written on every mutation.
 */

let state: CmsState = loadCms();
const past: CmsState[] = []; // undo stack (bounded)
const MAX_UNDO = 20;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

const uid = (p: string) =>
  `${p}-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).slice(0, 8)}`;

const clone = <T>(x: T): T =>
  typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x));

function commit(next: CmsState, activity?: Omit<CmsActivityEntry, 'id' | 'at' | 'actor'>) {
  past.push(state);
  if (past.length > MAX_UNDO) past.shift();
  const stamped: CmsState = {
    ...next,
    version: CMS_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    activity: activity
      ? [
          { id: uid('a'), at: new Date().toISOString(), actor: 'مدير العرض', ...activity },
          ...next.activity,
        ].slice(0, 200)
      : next.activity,
  };
  state = stamped;
  saveCms(state);
  emit();
}

/** Apply an immutable recipe over a draft copy and log the change. */
export function mutate(
  activity: Omit<CmsActivityEntry, 'id' | 'at' | 'actor'> | null,
  recipe: (draft: CmsState) => void
) {
  const draft = clone(state);
  recipe(draft);
  commit(draft, activity ?? undefined);
}

export const cms = {
  get: () => state,
  canUndo: () => past.length > 0,
  undo() {
    const prev = past.pop();
    if (!prev) return;
    state = prev;
    saveCms(state);
    emit();
  },

  /* ---- Tools ---- */
  exportJson: () => JSON.stringify(state, null, 2),
  importJson(raw: string): { ok: boolean; error?: string } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'الملف ليس JSON صالحاً' };
    }
    if (!isValidCmsState(parsed)) return { ok: false, error: 'بنية البيانات غير مطابقة لمخطط النظام' };
    backupCms();
    commit(migrate(parsed), { action: 'استورد إعدادات', entityType: 'النظام', entityName: 'ملف JSON' });
    return { ok: true };
  },
  resetAll() {
    backupCms();
    commit(makeDefaultCmsState(), { action: 'أعاد الضبط الكامل', entityType: 'النظام', entityName: 'كل الوحدات' });
  },
  resetModule(key: 'settings' | 'menu' | 'home' | 'pages') {
    backupCms();
    const def = makeDefaultCmsState();
    mutate({ action: 'أعاد ضبط وحدة', entityType: 'النظام', entityName: key }, (d) => {
      (d as unknown as Record<string, unknown>)[key] = clone((def as unknown as Record<string, unknown>)[key]);
    });
  },
  restoreBackup() {
    const b = restoreBackup();
    if (b) commit(b, { action: 'استعاد نسخة احتياطية', entityType: 'النظام', entityName: 'آخر نسخة' });
    return !!b;
  },
  sizeBytes: storageSizeBytes,
  newId: uid,

  /* ---- Media library ---- */
  addMedia(item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): MediaItem {
    const now = new Date().toISOString();
    const media: MediaItem = { ...item, id: uid('md'), createdAt: now, updatedAt: now };
    mutate({ action: 'أضاف وسائط', entityType: 'وسائط', entityName: media.title }, (d) => {
      d.media.unshift(media);
    });
    return media;
  },
  updateMedia(id: string, fields: Partial<MediaItem>) {
    mutate({ action: 'عدّل وسائط', entityType: 'وسائط', entityName: fields.title ?? id }, (d) => {
      const i = d.media.findIndex((m) => m.id === id);
      if (i >= 0) d.media[i] = { ...d.media[i], ...fields, updatedAt: new Date().toISOString() };
    });
  },
  replaceMedia(id: string, src: string, sizeBytes: number, type: MediaItem['type'], width?: number, height?: number) {
    mutate({ action: 'استبدل صورة', entityType: 'وسائط', entityName: id }, (d) => {
      const m = d.media.find((x) => x.id === id);
      if (m) Object.assign(m, { src, sizeBytes, type, width, height, updatedAt: new Date().toISOString() });
    });
  },
  removeMedia(id: string, title: string) {
    mutate({ action: 'حذف وسائط', entityType: 'وسائط', entityName: title }, (d) => {
      d.media = d.media.filter((m) => m.id !== id);
    });
  },
};

/** Resolve a media id to its src (data/URL), or undefined. */
export function mediaSrc(id?: string): string | undefined {
  if (!id) return undefined;
  return state.media.find((m) => m.id === id)?.src;
}

export function useCms(): CmsState {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state,
    () => state
  );
}
