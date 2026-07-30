import { makeDefaultCmsState } from '../cms/cmsDefaults';
import { CMS_SCHEMA_VERSION } from '../cms/cmsTypes';
import type {
  CmsSettings,
  CmsState,
  ConsultationTypeConfig,
  FormField,
  MediaItem,
} from '../cms/cmsTypes';
import { mapPaymentMethod } from './mappers';

/**
 * Map the API's `GET /cms` payload onto the app's `CmsState`.
 *
 * Two things make this more than a rename table:
 *
 * 1. **The deployed API is a schema version behind.** It answers
 *    `schemaVersion: 5` with `contactPhone` / `contactEmail` / `contactAddress` /
 *    `socialLinks` / `zakatNisab` / `consultationTypes`, while the app is on v6
 *    (`hotline` / `email` / `address` / `socials` / `zakatNisabEgp` /
 *    `consultations`). Backend PR #1 fixes this but is not deployed, so both
 *    spellings are accepted and will keep working after it ships.
 *
 * 2. **The API's payload is poorer than the bundled defaults.** It has no
 *    `splashText`, `website`, `donationReassurance`, `media`, `milestones`, and
 *    no `initiatives` / `volunteers` impact figures. So this is a per-field merge
 *    OVER the compiled defaults, not a replacement: anything the API does not
 *    send keeps its bundled value instead of becoming blank.
 *
 * The alternative — trusting the payload wholesale — empties the About screen
 * and strips the consultation consent checkbox. See `mergeConsultation` below.
 */

const s = (v: unknown, d: string): string => (typeof v === 'string' && v !== '' ? v : d);
const n = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/* ---------------------------------------------------------------- settings */

function mapSettings(w: Record<string, any> | undefined, d: CmsSettings): CmsSettings {
  const api = w ?? {};
  const socials = api.socials ?? api.socialLinks ?? {};
  const stats = api.stats ?? {};
  return {
    appName: s(api.appName, d.appName),
    heroTitle: s(api.heroTitle, d.heroTitle),
    heroSubtitle: s(api.heroSubtitle, d.heroSubtitle),
    // Not present on the API at any version — always the bundled value.
    splashText: s(api.splashText, d.splashText),
    primaryColor: s(api.primaryColor, d.primaryColor),
    secondaryColor: s(api.secondaryColor, d.secondaryColor),
    // v6 name first, v5 name second.
    hotline: s(api.hotline ?? api.contactPhone, d.hotline),
    email: s(api.email ?? api.contactEmail, d.email),
    address: s(api.address ?? api.contactAddress, d.address),
    workingHours: s(api.workingHours, d.workingHours),
    website: s(api.website, d.website),
    socials: {
      facebook: s(socials.facebook, d.socials.facebook),
      instagram: s(socials.instagram, d.socials.instagram),
      youtube: s(socials.youtube, d.socials.youtube),
      twitter: s(socials.twitter, d.socials.twitter),
    },
    zakatNisabEgp: n(api.zakatNisabEgp ?? api.zakatNisab, d.zakatNisabEgp),
    donationReassurance: s(api.donationReassurance, d.donationReassurance),
    demoLabel: s(api.demoLabel, d.demoLabel),
    stats: {
      governorates: s(stats.governorates, d.stats.governorates),
      beneficiaries: s(stats.beneficiaries, d.stats.beneficiaries),
      yearsOfService: s(stats.yearsOfService, d.stats.yearsOfService),
      // Optional on both sides — keep undefined rather than '' so the About
      // screen's `.filter(v => v.trim() !== '')` still hides an unset figure.
      initiatives: stats.initiatives ?? d.stats.initiatives,
      volunteers: stats.volunteers ?? d.stats.volunteers,
    },
    milestones: Array.isArray(api.milestones) && api.milestones.length
      ? api.milestones.map((m: any) => ({ year: s(m?.year, ''), label: s(m?.label ?? m?.title, '') }))
      : d.milestones,
  };
}

/* ----------------------------------------------------------- consultations */

/**
 * The API today keys consultation types in English (`psychological`, `legal`,
 * `family`) while the app keys them in Arabic (`نفسية`, `دينية`, `طبية`,
 * `أسرية`, `أعمال`) — and the app's keys are route params, so they cannot
 * simply be replaced. This aliases the two so a not-yet-seeded backend still
 * lines up with the bundled forms.
 */
const KEY_ALIASES: Record<string, string> = {
  psychological: 'نفسية',
  religious: 'دينية',
  medical: 'طبية',
  family: 'أسرية',
  business: 'أعمال',
  legal: 'قانونية',
};

const canonicalKey = (key: string): string => KEY_ALIASES[key] ?? key;

/**
 * Is this API type complete enough to render on its own?
 *
 * The bundled forms carry things the current API rows do not: a `disclaimer`, a
 * required `consent` checkbox, and `options` on every choice field. A radio field
 * with no options renders as an unanswerable question, and a missing consent
 * checkbox is a compliance regression (BACKEND.md §18.6) — so a partial API type
 * is used only for its labels, never as the form itself.
 */
function isFullFidelity(t: Record<string, any>): boolean {
  const fields: any[] = Array.isArray(t.fields) ? t.fields : [];
  if (!fields.length) return false;
  if (!t.disclaimer) return false;
  if (!fields.some((f) => f?.type === 'consent')) return false;
  const choice = ['radio', 'checkbox', 'multiselect'];
  return fields.every((f) => !choice.includes(f?.type) || (Array.isArray(f?.options) && f.options.length));
}

function mapField(w: Record<string, any>, i: number): FormField {
  const key = s(w.key, `f${i}`);
  return {
    // The API assigns its own field ids; fall back to the key, which is unique
    // within a type and is what the form actually addresses values by.
    id: s(w.id, key),
    key,
    type: (w.type ?? 'text') as FormField['type'],
    label: s(w.label, ''),
    required: !!w.required,
    hidden: !!w.hidden,
    sortOrder: n(w.sortOrder, i),
    options: Array.isArray(w.options) ? w.options.map(String) : undefined,
    placeholder: w.placeholder || undefined,
    validationMessage: w.validationMessage || undefined,
    help: w.help || undefined,
    showIfKey: w.showIfKey || undefined,
    showIfValue: w.showIfValue || undefined,
  };
}

/**
 * Merge one API type over its bundled counterpart.
 *
 * Scalars the API owns (name, description, icon, visibility) are taken from it;
 * the form itself is taken from the API only when it is complete. That way a
 * dashboard rename shows up immediately, while the form keeps working.
 */
function mergeConsultation(
  api: Record<string, any>,
  base: ConsultationTypeConfig | undefined,
): ConsultationTypeConfig | null {
  const key = canonicalKey(s(api.key, ''));
  if (!key) return null;

  const full = isFullFidelity(api);
  const enabled = api.enabled ?? api.visible ?? true;

  if (!base) {
    // A type the app has no bundled form for — usable only if self-sufficient.
    // `legal` (قانونية) currently lands here and is skipped, which is the
    // documented behaviour: the app has no form schema for it (§18.6).
    if (!full) return null;
    return {
      id: s(api.id, key),
      key,
      name: s(api.name ?? api.label, key),
      icon: s(api.icon, 'help-circle'),
      description: s(api.description, ''),
      disclaimer: s(api.disclaimer, ''),
      status: enabled ? 'published' : 'draft',
      visible: !!enabled,
      homeVisible: api.homeVisible ?? true,
      availableTimes: Array.isArray(api.availableTimes) ? api.availableTimes.map(String) : [],
      sortOrder: n(api.sortOrder, 0),
      fields: (api.fields as any[]).map(mapField),
    };
  }

  return {
    ...base,
    name: s(api.name ?? api.label, base.name),
    icon: s(api.icon, base.icon),
    description: s(api.description, base.description),
    disclaimer: s(api.disclaimer, base.disclaimer),
    status: enabled ? 'published' : 'draft',
    visible: !!enabled,
    homeVisible: api.homeVisible ?? base.homeVisible,
    availableTimes: Array.isArray(api.availableTimes) && api.availableTimes.length
      ? api.availableTimes.map(String)
      : base.availableTimes,
    sortOrder: n(api.sortOrder, base.sortOrder),
    fields: full ? (api.fields as any[]).map(mapField) : base.fields,
  };
}

function mapConsultations(
  raw: unknown,
  defaults: ConsultationTypeConfig[],
): ConsultationTypeConfig[] {
  const list = Array.isArray(raw) ? raw : [];
  if (!list.length) return defaults;

  const byKey = new Map(defaults.map((d) => [d.key, d]));
  const seen = new Set<string>();
  const out: ConsultationTypeConfig[] = [];

  for (const t of list) {
    const key = canonicalKey(s((t as any)?.key, ''));
    const merged = mergeConsultation(t as Record<string, any>, byKey.get(key));
    if (merged) {
      out.push(merged);
      seen.add(merged.key);
    }
  }

  // Keep any bundled type the API did not mention. Dropping them would remove a
  // working, reachable form because the backend has not been seeded yet.
  for (const d of defaults) if (!seen.has(d.key)) out.push(d);

  return out.sort((a, b) => a.sortOrder - b.sortOrder);
}

/* -------------------------------------------------------------------- media */

/** The API column is `srcUrl`; the app reads `src`. */
function mapMedia(raw: unknown, defaults: MediaItem[]): MediaItem[] {
  const list = Array.isArray(raw) ? raw : [];
  if (!list.length) return defaults;
  return list.map((m: any) => ({
    id: s(m?.id, ''),
    title: s(m?.title, ''),
    alt: s(m?.alt, ''),
    caption: s(m?.caption, ''),
    folder: s(m?.folder, ''),
    src: s(m?.src ?? m?.srcUrl, ''),
    type: s(m?.type, 'image'),
    width: m?.width ?? undefined,
    height: m?.height ?? undefined,
    sizeBytes: m?.sizeBytes ?? undefined,
  })) as MediaItem[];
}

/* --------------------------------------------------------------------- root */

export function mapCmsState(raw: unknown): CmsState {
  const d = makeDefaultCmsState();
  const api = (raw ?? {}) as Record<string, any>;

  const methods = Array.isArray(api.paymentMethods)
    ? api.paymentMethods.map(mapPaymentMethod).filter((m): m is NonNullable<typeof m> => m !== null)
    : [];

  const nonEmpty = <T>(v: unknown, fallback: T[]): T[] =>
    Array.isArray(v) && v.length ? (v as T[]) : fallback;

  return {
    // v6 `version`, v5 `schemaVersion`. Report the app's own version, since what
    // this function returns is a v6 state regardless of what came in.
    version: CMS_SCHEMA_VERSION,
    settings: mapSettings(api.settings, d.settings),
    paymentMethods: methods.length ? methods : d.paymentMethods,
    menu: nonEmpty(api.menu, d.menu),
    home: nonEmpty(api.home, d.home),
    pages: nonEmpty(api.pages, d.pages),
    media: mapMedia(api.media, d.media),
    consultations: mapConsultations(api.consultations ?? api.consultationTypes, d.consultations),
    // The public endpoint never returns the audit log — it is admin-only.
    activity: [],
    updatedAt: s(api.updatedAt, new Date().toISOString()),
  };
}

/** The wire version the API reported, for diagnostics. */
export const readWireVersion = (raw: unknown): number | null => {
  const api = (raw ?? {}) as Record<string, any>;
  return typeof api.version === 'number'
    ? api.version
    : typeof api.schemaVersion === 'number'
      ? api.schemaVersion
      : null;
};
