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

/* ---- Rich page content ops ---- */
export const pageContent = {
  get(id: string): import('@ahla/shared').ContentBlock[] {
    return state.pages.find((p) => p.id === id)?.content ?? [];
  },
  set(id: string, blocks: import('@ahla/shared').ContentBlock[], title: string) {
    mutate({ action: 'حرّر محتوى صفحة', entityType: 'محتوى صفحة', entityName: title }, (d) => {
      const p = d.pages.find((x) => x.id === id);
      if (p) {
        p.content = blocks;
        p.updatedAt = new Date().toISOString();
      }
    });
  },
};

/* ---- Consultation form builder ops ---- */
export const forms = {
  updateType(id: string, fields: Partial<import('@ahla/shared').ConsultationTypeConfig>, name: string) {
    mutate({ action: 'عدّل نوع استشارة', entityType: 'استشارة', entityName: name }, (d) => {
      const i = d.consultations.findIndex((c) => c.id === id);
      if (i >= 0) d.consultations[i] = { ...d.consultations[i], ...fields };
    });
  },
  addType() {
    mutate({ action: 'أضاف نوع استشارة', entityType: 'استشارة', entityName: 'نوع جديد' }, (d) => {
      d.consultations.push({
        id: uid('ct'), key: 'جديدة', name: 'استشارة جديدة', icon: 'message-circle', description: '', disclaimer: 'استشارة استرشادية.',
        status: 'draft', visible: true, homeVisible: false, availableTimes: ['أي وقت'],
        sortOrder: Math.max(0, ...d.consultations.map((c) => c.sortOrder)) + 1, fields: [],
      });
    });
  },
  removeType(id: string, name: string) {
    mutate({ action: 'حذف نوع استشارة', entityType: 'استشارة', entityName: name }, (d) => {
      d.consultations = d.consultations.filter((c) => c.id !== id);
    });
  },
  addField(typeId: string, field: import('@ahla/shared').FormField) {
    mutate({ action: 'أضاف حقلاً', entityType: 'حقل نموذج', entityName: field.label }, (d) => {
      const c = d.consultations.find((x) => x.id === typeId);
      if (c) c.fields.push({ ...field, sortOrder: Math.max(0, ...c.fields.map((f) => f.sortOrder)) + 1 });
    });
  },
  updateField(typeId: string, field: import('@ahla/shared').FormField) {
    mutate({ action: 'عدّل حقلاً', entityType: 'حقل نموذج', entityName: field.label }, (d) => {
      const c = d.consultations.find((x) => x.id === typeId);
      const i = c?.fields.findIndex((f) => f.id === field.id) ?? -1;
      if (c && i >= 0) c.fields[i] = field;
    });
  },
  removeField(typeId: string, fieldId: string, label: string) {
    mutate({ action: 'حذف حقلاً', entityType: 'حقل نموذج', entityName: label }, (d) => {
      const c = d.consultations.find((x) => x.id === typeId);
      if (c) c.fields = c.fields.filter((f) => f.id !== fieldId);
    });
  },
  moveField(typeId: string, fieldId: string, dir: -1 | 1) {
    mutate(null, (d) => {
      const c = d.consultations.find((x) => x.id === typeId);
      if (!c) return;
      const sorted = [...c.fields].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex((f) => f.id === fieldId);
      const swap = idx + dir;
      if (swap < 0 || swap >= sorted.length) return;
      const a = c.fields.find((f) => f.id === sorted[idx].id)!;
      const b = c.fields.find((f) => f.id === sorted[swap].id)!;
      [a.sortOrder, b.sortOrder] = [b.sortOrder, a.sortOrder];
    });
  },
};

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
