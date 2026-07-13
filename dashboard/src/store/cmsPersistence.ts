import {
  CMS_SCHEMA_VERSION,
  CMS_STORAGE_KEY,
  CMS_MEDIA_KEY,
  makeDefaultCmsState,
  defaultMedia,
  defaultConsultations,
  type CmsState,
  type MediaItem,
} from '@ahla/shared';

const BACKUP_KEY = `${CMS_STORAGE_KEY}_backup`;

/** Structural validation of an unknown blob before we trust it as CmsState. */
export function isValidCmsState(x: unknown): x is CmsState {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  return (
    typeof s.version === 'number' &&
    !!s.settings &&
    typeof s.settings === 'object' &&
    Array.isArray(s.menu) &&
    Array.isArray(s.home) &&
    Array.isArray(s.pages)
  );
}

/** Upgrade an older stored blob to the current schema version. */
export function migrate(state: CmsState): CmsState {
  let s = state;
  // v1 → v2: introduced the media library. Seed it if missing.
  if (!Array.isArray(s.media)) {
    s = { ...s, media: defaultMedia.map((m) => ({ ...m })) };
  }
  // v2 → v3: introduced the consultation form builder. Seed it if missing.
  if (!Array.isArray(s.consultations)) {
    s = { ...s, consultations: defaultConsultations.map((c) => ({ ...c, fields: c.fields.map((f) => ({ ...f })) })) };
  }
  if (s.version !== CMS_SCHEMA_VERSION) {
    s = { ...s, version: CMS_SCHEMA_VERSION };
  }
  // Backfill any arrays a partial import might have omitted.
  return {
    ...s,
    activity: Array.isArray(s.activity) ? s.activity : [],
  };
}

function loadMedia(): MediaItem[] {
  if (typeof localStorage === 'undefined') return defaultMedia.map((m) => ({ ...m }));
  try {
    const raw = localStorage.getItem(CMS_MEDIA_KEY);
    if (!raw) return defaultMedia.map((m) => ({ ...m }));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultMedia.map((m) => ({ ...m }));
  } catch {
    return defaultMedia.map((m) => ({ ...m }));
  }
}

export function loadCms(): CmsState {
  if (typeof localStorage === 'undefined') return makeDefaultCmsState();
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    const base = raw ? JSON.parse(raw) : null;
    const state = base && isValidCmsState(base) ? migrate(base) : makeDefaultCmsState();
    // Media is stored separately (large blobs) — merge it back in.
    return { ...state, media: loadMedia() };
  } catch {
    return makeDefaultCmsState();
  }
}

/**
 * Persist structural CMS to the main key and media to its own key, so a media
 * quota failure never blocks saving menu/home/page edits.
 */
export function saveCms(state: CmsState): void {
  if (typeof localStorage === 'undefined') return;
  const { media, ...structural } = state;
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(structural));
  } catch {
    /* quota exceeded — ignore in the demo */
  }
  try {
    localStorage.setItem(CMS_MEDIA_KEY, JSON.stringify(media ?? []));
  } catch {
    /* media quota exceeded — core CMS is still saved above */
  }
}

/** Snapshot the current stored state before a destructive op (import/reset). */
export function backupCms(): void {
  if (typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(CMS_STORAGE_KEY);
  if (raw) localStorage.setItem(BACKUP_KEY, raw);
}

export function restoreBackup(): CmsState | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(BACKUP_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isValidCmsState(parsed) ? migrate(parsed) : null;
  } catch {
    return null;
  }
}

export function storageSizeBytes(): number {
  if (typeof localStorage === 'undefined') return 0;
  return (localStorage.getItem(CMS_STORAGE_KEY) ?? '').length + (localStorage.getItem(CMS_MEDIA_KEY) ?? '').length;
}
