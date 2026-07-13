import {
  CMS_SCHEMA_VERSION,
  CMS_STORAGE_KEY,
  makeDefaultCmsState,
  type CmsState,
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
  // Future migrations: `if (s.version < 2) { … s = { ...s, version: 2 }; }`
  if (s.version !== CMS_SCHEMA_VERSION) {
    s = { ...s, version: CMS_SCHEMA_VERSION };
  }
  // Backfill any arrays a partial import might have omitted.
  return {
    ...s,
    activity: Array.isArray(s.activity) ? s.activity : [],
  };
}

export function loadCms(): CmsState {
  if (typeof localStorage === 'undefined') return makeDefaultCmsState();
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) return makeDefaultCmsState();
    const parsed = JSON.parse(raw);
    if (!isValidCmsState(parsed)) return makeDefaultCmsState();
    return migrate(parsed);
  } catch {
    return makeDefaultCmsState();
  }
}

export function saveCms(state: CmsState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — ignore in the demo */
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
  return (localStorage.getItem(CMS_STORAGE_KEY) ?? '').length;
}
