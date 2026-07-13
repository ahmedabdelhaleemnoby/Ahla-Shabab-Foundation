/**
 * Demo CMS schema — the single typed source of truth for the app's editable
 * structure (settings, sidebar menu, home layout, and pages).
 *
 * This is a DEMO layer: the dashboard edits a copy persisted to the browser's
 * localStorage; the mobile app reads the same schema (defaults on native, or
 * the persisted copy when running on web). No backend is involved.
 *
 * Entity *content* (cases, projects, articles, services…) still lives in the
 * existing `@ahla/shared` data modules; the CMS references them by id. This
 * module owns the *structural* / navigational layer that makes the app feel
 * WordPress-like: what pages exist, what the drawer shows, and how Home is
 * composed.
 */

/** Bump when the shape changes; `cmsMigrations` upgrades older stored blobs. */
export const CMS_SCHEMA_VERSION = 2;
export const CMS_STORAGE_KEY = 'ahla_cms_v1';
/** Media blobs live in their own key so a quota problem can't corrupt the core CMS. */
export const CMS_MEDIA_KEY = 'ahla_cms_media_v1';

/* ------------------------------------------------------------------ */
/* Navigation targets (serializable — shared by dashboard + mobile)   */
/* ------------------------------------------------------------------ */

export type MainTab = 'Home' | 'Discover' | 'Donate' | 'News' | 'Profile';

export type NavTarget =
  | { kind: 'tab'; tab: MainTab }
  | { kind: 'route'; route: string }
  | { kind: 'cmsPage'; slug: string }
  | { kind: 'external'; url: string };

/* ------------------------------------------------------------------ */
/* Sidebar / burger menu                                              */
/* ------------------------------------------------------------------ */

export interface MenuItem {
  id: string;
  label: string;
  /** Feather icon name (kept as string so the schema stays serializable). */
  icon: string;
  target: NavTarget;
  visible: boolean;
  /** Only shown to logged-in users when true. */
  loginRequired: boolean;
  sortOrder: number;
}

export interface MenuGroup {
  id: string;
  /** Optional heading; the first group usually has none. */
  title?: string;
  visible: boolean;
  sortOrder: number;
  items: MenuItem[];
}

/* ------------------------------------------------------------------ */
/* Home page builder                                                  */
/* ------------------------------------------------------------------ */

export type HomeSectionType =
  | 'hero'
  | 'impactStats'
  | 'workAreas'
  | 'quickServices'
  | 'urgentCases'
  | 'sponsorship'
  | 'featuredProjects'
  | 'latestNews'
  | 'consultations'
  | 'donationCta'
  | 'volunteerCta'
  | 'contactCta'
  | 'imageBanner'
  | 'textBlock'
  | 'faqPreview'
  | 'spacer';

export type SectionLayout = 'oneColumn' | 'twoColumn' | 'horizontalScroll';
export type Audience = 'all' | 'guest' | 'registered';

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  title?: string;
  subtitle?: string;
  visible: boolean;
  sortOrder: number;
  audience: Audience;
  /** Per-type knobs; only the relevant ones are read by each renderer. */
  config: {
    itemCount?: number;
    layout?: SectionLayout;
    ctaText?: string;
    ctaTarget?: NavTarget;
    /** Explicit entity ids to feature (empty = auto-pick). */
    entityIds?: string[];
    imageId?: string;
    background?: 'default' | 'navy' | 'green' | 'gold' | 'paper';
    body?: string;
  };
}

/* ------------------------------------------------------------------ */
/* Pages                                                              */
/* ------------------------------------------------------------------ */

export type PageStatus = 'published' | 'draft';

export type PageTemplate =
  | 'native' // backed by an existing hand-built RN screen
  | 'standard'
  | 'cards'
  | 'articles'
  | 'details'
  | 'form'
  | 'faq'
  | 'gallery'
  | 'stats'
  | 'custom';

export type PageSectionType =
  | 'hero'
  | 'text'
  | 'cardGrid'
  | 'list'
  | 'stats'
  | 'image'
  | 'gallery'
  | 'cta'
  | 'faq'
  | 'progress'
  | 'contact'
  | 'formPreview';

export interface PageSection {
  id: string;
  type: PageSectionType;
  title?: string;
  visible: boolean;
  sortOrder: number;
  config: {
    body?: string;
    imageId?: string;
    items?: { id: string; title: string; subtitle?: string; imageId?: string }[];
    ctaText?: string;
    ctaTarget?: NavTarget;
    stats?: { value: string; label: string }[];
    faqs?: { q: string; a: string }[];
  };
}

export interface CmsPage {
  id: string;
  /** URL-ish key. For native pages this matches the RN route name. */
  slug: string;
  title: string;
  /** Label used in the drawer/app bar (may differ from the full title). */
  navTitle: string;
  description?: string;
  icon: string;
  headerImageId?: string;
  status: PageStatus;
  visible: boolean;
  /** Whether it appears as a drawer entry (managed via the Menu manager too). */
  inSidebar: boolean;
  loginRequired: boolean;
  template: PageTemplate;
  /** true = an existing RN screen; false = a generic CMS-rendered page. */
  builtin: boolean;
  /** Sections for generic (non-native) pages. */
  sections: PageSection[];
  emptyStateText?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* App settings (extends the runtime appConfig)                       */
/* ------------------------------------------------------------------ */

export interface CmsSettings {
  appName: string;
  heroTitle: string;
  heroSubtitle: string;
  splashText: string;
  primaryColor: string;
  secondaryColor: string;
  hotline: string;
  email: string;
  address: string;
  workingHours: string;
  website: string;
  socials: { facebook: string; instagram: string; youtube: string; twitter: string };
  zakatNisabEgp: number;
  donationReassurance: string;
  demoLabel: string;
}

/* ------------------------------------------------------------------ */
/* Media library                                                      */
/* ------------------------------------------------------------------ */

export interface MediaItem {
  id: string;
  title: string;
  alt: string;
  caption?: string;
  /** Free-text folder/category, e.g. "شعارات" / "حالات". */
  folder: string;
  /** Data URL (uploaded, compressed) or a remote https URL. */
  src: string;
  type: 'image' | 'svg';
  width?: number;
  height?: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Activity log (demo revision trail)                                 */
/* ------------------------------------------------------------------ */

export interface CmsActivityEntry {
  id: string;
  at: string; // ISO datetime
  actor: string;
  action: string; // e.g. "أخفى قسماً"
  entityType: string; // "قسم رئيسية" | "صفحة" | "عنصر قائمة" | …
  entityName: string;
}

/* ------------------------------------------------------------------ */
/* Root state                                                         */
/* ------------------------------------------------------------------ */

export interface CmsState {
  version: number;
  settings: CmsSettings;
  menu: MenuGroup[];
  home: HomeSection[];
  pages: CmsPage[];
  media: MediaItem[];
  activity: CmsActivityEntry[];
  updatedAt: string;
}
