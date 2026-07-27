import { Platform } from 'react-native';
import {
  makeDefaultCmsState,
  CMS_STORAGE_KEY,
  type CmsState,
  type CmsSettings,
  type MenuGroup,
  type PaymentMethodInfo,
  type HomeSection,
  type ConsultationTypeConfig,
} from '@ahla/shared';

/**
 * Mobile-side CMS reader.
 *
 * The dashboard persists CMS edits to the browser's localStorage under
 * CMS_STORAGE_KEY; this reader loads the same key, falling back to the compiled
 * defaults when nothing is stored (always the case on native).
 *
 * localStorage is partitioned per ORIGIN, so this only sees dashboard edits when
 * both are served from the same origin. The separate dev servers (dashboard
 * :5173, Expo web :8087) are NOT the same origin, so edits do not cross between
 * them — run `npm run demo:build && npm run demo` instead, which serves the app
 * at :4000/ and the dashboard at :4000/admin/ behind one origin (D-18).
 *
 * On native there is no shared storage at all: use the dashboard's Tools page to
 * export CMS JSON and import it on the device.
 */
function readCms(): CmsState {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.menu) && Array.isArray(parsed.home) && Array.isArray(parsed.pages)) {
          return parsed as CmsState;
        }
      }
    } catch {
      /* fall through to defaults */
    }
  }
  return makeDefaultCmsState();
}

/** Snapshot read at call time (cheap; no subscription needed for the drawer). */
export const getCmsState = (): CmsState => readCms();

/**
 * App settings authored in the dashboard. Falls back to the compiled defaults
 * when a stored blob predates a field, so a partial CMS state can't blank the UI.
 */
export function getSettings(): CmsSettings {
  const stored = readCms().settings;
  const fallback = makeDefaultCmsState().settings;
  return {
    ...fallback,
    ...stored,
    stats: { ...fallback.stats, ...(stored?.stats ?? {}) },
    socials: { ...fallback.socials, ...(stored?.socials ?? {}) },
  };
}

/** Donation methods authored in the dashboard; compiled defaults if unset. */
export function getPaymentMethods(): PaymentMethodInfo[] {
  const stored = readCms().paymentMethods;
  return Array.isArray(stored) && stored.length > 0
    ? stored
    : makeDefaultCmsState().paymentMethods;
}

const sorted = <T extends { sortOrder: number }>(a: T[]): T[] => [...a].sort((x, y) => x.sortOrder - y.sortOrder);

/** Visible menu groups (and their visible items) for the current auth state. */
export function getMenu(loggedIn: boolean): MenuGroup[] {
  const state = readCms();
  return sorted(state.menu)
    .filter((g) => g.visible)
    .map((g) => ({
      ...g,
      items: sorted(g.items).filter((i) => i.visible && (!i.loginRequired || loggedIn)),
    }))
    .filter((g) => g.items.length > 0);
}

/** Visible, ordered Home sections for the current auth state. */
export function getHomeSections(loggedIn: boolean): HomeSection[] {
  const state = readCms();
  return sorted(state.home).filter(
    (s) => s.visible && (s.audience === 'all' || (s.audience === 'registered') === loggedIn)
  );
}

export function getCmsPageBySlug(slug: string) {
  return readCms().pages.find((p) => p.slug === slug);
}

/** Resolve a media id to its src (data URL / remote URL) from the CMS library. */
export function getMediaSrc(id?: string): string | undefined {
  if (!id) return undefined;
  return readCms().media?.find((m) => m.id === id)?.src;
}

/** Published + visible consultation types, ordered — for the type picker. */
export function getConsultationTypes(): ConsultationTypeConfig[] {
  const list = readCms().consultations ?? [];
  return sorted(list).filter((c) => c.visible && c.status === 'published');
}

/** A single consultation type by its key (e.g. "نفسية"), or undefined. */
export function getConsultationType(key: string): ConsultationTypeConfig | undefined {
  return (readCms().consultations ?? []).find((c) => c.key === key);
}
