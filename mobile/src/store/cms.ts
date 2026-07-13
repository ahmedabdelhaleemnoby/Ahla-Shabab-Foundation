import { Platform } from 'react-native';
import {
  makeDefaultCmsState,
  CMS_STORAGE_KEY,
  type CmsState,
  type MenuGroup,
  type HomeSection,
} from '@ahla/shared';

/**
 * Mobile-side CMS reader.
 *
 * The dashboard persists CMS edits to the browser's localStorage. Native builds
 * cannot see that storage, so they use the shared defaults. When the app runs
 * on WEB (Expo web / mobile-web preview) it shares the exact same localStorage
 * key as the dashboard, so edits made in the dashboard are reflected live in the
 * preview — the honest "both read the same CMS state wherever technically
 * possible" path. To sync a real device, export JSON from the dashboard.
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
