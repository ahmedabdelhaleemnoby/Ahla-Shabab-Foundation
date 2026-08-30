import { paymentMethods } from '../data';
import type {
  Provider as CatalogProvider,
  Service as CatalogService,
  ServiceCategory,
} from '../services';
import type {
  Article,
  ArticleCategory,
  CaseTag,
  Consultant,
  ConsultationType,
  HumanitarianCase,
  PaymentAvailability,
  PaymentMethod,
  PaymentMethodInfo,
  Project,
  ProjectStatus,
} from '../types';

/**
 * Wire -> app mapping.
 *
 * The API is Prisma-shaped and English-keyed; the app's types are Arabic-keyed
 * display models with a few required presentational fields the API has no
 * concept of. Rather than loosen the app types (which would push `undefined`
 * checks into every screen), every value is coerced here, and anything the API
 * cannot supply gets a deterministic default.
 *
 * Rule followed throughout: an unrecognised enum value NEVER reaches the UI as
 * itself. It is coerced to a known member, because these unions drive colour and
 * icon lookups that would otherwise render blank.
 */

/* ------------------------------------------------------------------ helpers */

/** Coerce to a member of `allowed`, or `fallback` when the API sends something new. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const num = (v: unknown, d = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : d;

const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);

/**
 * The approved gradient pairs from the bundled content. `Article.gradient` and
 * `Project.gradient` are required and have no API equivalent, so pick one
 * deterministically from the record id — stable across renders and refetches,
 * which a random pick would not be.
 */
const GRADIENTS: readonly [string, string][] = [
  ['#8aa0bf', '#586f92'],
  ['#8fb4dd', '#5f86b5'],
  ['#93a7c4', '#617699'],
  ['#a7b6d0', '#7186a6'],
  ['#c3a888', '#8f7350'],
  ['#a08768', '#6d543a'],
  ['#b98a5e', '#7d5a3c'],
  ['#9b8a9e', '#6b5a6e'],
];

export function pickGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

/* ------------------------------------------------------------------- unions */

const CASE_TAGS: readonly CaseTag[] = ['عاجل', 'علاج', 'تعليم', 'سكن'];
const PROJECT_STATUSES: readonly ProjectStatus[] = ['مستدام', 'جارٍ', 'مكتمل'];
const ARTICLE_CATEGORIES: readonly ArticleCategory[] = ['خبر', 'نشاط', 'مقال', 'قافلة'];
const CONSULTATION_TYPES: readonly ConsultationType[] = [
  'نفسية', 'دينية', 'أسرية', 'تربوية', 'مهنية', 'قانونية',
];
const AVAILABILITIES: readonly PaymentAvailability[] = ['متاحة', 'قيد التفعيل', 'غير متاحة حالياً'];

/* -------------------------------------------------------------------- cases */

/** `/cases` — the closest match in the whole API; only the image key differs. */
export function mapCase(w: Record<string, any>): HumanitarianCase {
  return {
    id: str(w.id),
    code: str(w.code),
    title: str(w.title),
    location: str(w.location),
    summary: str(w.summary),
    need: str(w.need),
    tag: oneOf(w.tag, CASE_TAGS, 'عاجل'),
    verified: !!w.verified,
    targetAmount: num(w.targetAmount),
    raisedAmount: num(w.raisedAmount),
    supporters: num(w.supporters),
    imageUrl: w.coverUrl || undefined,
    sponsorable: w.sponsorable ?? undefined,
    monthlyAmount: w.monthlyAmount ?? undefined,
    sponsorshipDuration: w.sponsorshipDuration ?? undefined,
    sponsorshipStatus: w.sponsorshipStatus ?? undefined,
    lastUpdate: w.lastUpdate || undefined,
    gradient: pickGradient(str(w.id, w.code)),
  };
}

/* ----------------------------------------------------------------- projects */

/**
 * `/projects` list items carry no `stages`; only `/projects/:id` includes them
 * (ordered by sortOrder). An empty array is correct for the list — the progress
 * checklist simply does not render until the detail is loaded.
 */
export function mapProject(w: Record<string, any>): Project {
  return {
    id: str(w.id),
    title: str(w.title),
    description: str(w.description),
    status: oneOf(w.status, PROJECT_STATUSES, 'جارٍ'),
    category: w.category || undefined,
    timeline: w.timeline || undefined,
    targetAmount: num(w.targetAmount),
    raisedAmount: num(w.raisedAmount),
    supporters: num(w.supporters),
    stages: Array.isArray(w.stages)
      ? w.stages.map((s: any) => ({ label: str(s?.label), done: !!s?.done }))
      : [],
    imageUrl: w.coverUrl || undefined,
    updates: Array.isArray(w.updates)
      ? w.updates.map((u: any) => ({
          id: str(u?.id),
          text: str(u?.text),
          date: str(u?.date ?? u?.createdAt),
          kind: u?.kind || undefined,
        }))
      : undefined,
    gradient: pickGradient(str(w.id, w.title)),
  };
}

/* ----------------------------------------------------------------- articles */

export function mapArticle(w: Record<string, any>): Article {
  return {
    id: str(w.id),
    imageUrl: w.coverUrl || undefined,
    category: oneOf(w.category, ARTICLE_CATEGORIES, 'خبر'),
    title: str(w.title),
    excerpt: str(w.excerpt),
    body: str(w.body),
    date: str(w.date ?? w.createdAt),
    location: w.location || undefined,
    readMinutes: num(w.readMinutes, 3),
    gradient: pickGradient(str(w.id, w.title)),
  };
}

/* -------------------------------------------------------------- consultants */

/**
 * Built from `/providers` rather than `/consultants`: both describe the same
 * rows, but `/consultants` omits `yearsExperience`, `rating`, `reviews` and
 * `acceptingBookings`, which the consultant card renders. `/providers` has all
 * of them.
 *
 * `Consultant.type` has no column on either endpoint — it is inferred from the
 * specialization text where possible, since it drives which consultation flow
 * the card opens. `sessions` and `featured` likewise do not exist server-side.
 */
export function mapConsultant(w: Record<string, any>): Consultant {
  const specialty = str(w.specialization ?? w.specialty);
  return {
    id: str(w.id),
    imageUrl: w.avatarUrl || undefined,
    name: str(w.name),
    specialty,
    type: inferConsultationType(specialty),
    yearsExperience: num(w.yearsExperience),
    // `providers.sessions` is the authored figure; `_count.bookings` is the
    // fallback for a payload that predates it.
    sessions: num(w.sessions ?? w._count?.bookings),
    rating: num(w.rating),
    reviews: num(w.reviews),
    available: w.acceptingBookings ?? w.active ?? true,
    /*
     * `providers.featured` is a real column and the API returns it. This used
     * to be hard-coded `false`, which meant no mapped consultant could ever be
     * featured — and ConsultationsScreen crashed on the `undefined` that its
     * `.find((c) => c.featured)!` then produced, every time the API answered.
     */
    featured: Boolean(w.featured),
  };
}

/** Best-effort: match the specialization against the known consultation types. */
function inferConsultationType(specialty: string): ConsultationType {
  const hit = CONSULTATION_TYPES.find((t) => specialty.includes(t));
  if (hit) return hit;
  // Common wordings that do not contain the bare type noun.
  if (/نفس|قلق|اكتئاب/.test(specialty)) return 'نفسية';
  if (/شرع|ديني|فقه/.test(specialty)) return 'دينية';
  if (/أسر|زواج|طفل/.test(specialty)) return 'أسرية';
  if (/قانون|محام/.test(specialty)) return 'قانونية';
  if (/مهن|عمل|وظيف/.test(specialty)) return 'مهنية';
  return 'نفسية';
}

/* ---------------------------------------------------------- payment methods */

/**
 * The live API uses latin ids and short group labels; the app's `PaymentMethod`
 * is an Arabic union and `group` must be one of three exact display strings.
 * Unmapped ids are dropped by the caller rather than guessed, because a payment
 * method the app cannot label correctly must not appear in the donate flow.
 */
const PAYMENT_ID_MAP: Record<string, PaymentMethod> = {
  fawry: 'فوري',
  vodafone: 'فودافون كاش',
  bank: 'تحويل بنكي',
  // InstaPay is the same CIB account as the bank transfer — fold it in rather
  // than offering it twice. `card` is deliberately absent: card payment is not
  // supported, so a backend still serving it is dropped by the caller.
  instapay: 'تحويل بنكي',
};

const PAYMENT_GROUP_MAP: Record<string, PaymentMethodInfo['group']> = {
  'إلكتروني': 'دفع إلكتروني',
  'دفع إلكتروني': 'دفع إلكتروني',
  'تحويل': 'تحويل بنكي',
  'تحويل بنكي': 'تحويل بنكي',
  'محفظة': 'محفظة إلكترونية',
  'محفظة إلكترونية': 'محفظة إلكترونية',
};

/** Returns null when the id is one the app has no label for. */
export function mapPaymentMethod(w: Record<string, any>): PaymentMethodInfo | null {
  const rawId = str(w.id);
  const id = PAYMENT_ID_MAP[rawId] ?? (PAYMENT_ID_MAP[rawId.toLowerCase()] as PaymentMethod | undefined);
  // Already-Arabic ids (a seeded/updated backend) pass straight through.
  const resolved = id ?? (Object.values(PAYMENT_ID_MAP).includes(rawId as PaymentMethod) ? (rawId as PaymentMethod) : null);
  if (!resolved) return null;
  // Instructions/labels come from the bundled approved set: they are contract
  // detail (account numbers, donation codes) that must not drift with the wire
  // payload, and a backend that predates them would otherwise render an empty card.
  const approved = paymentMethods.find((m: PaymentMethodInfo) => m.id === resolved);
  return {
    id: resolved,
    label: str(w.label) || approved?.label || resolved,
    group: PAYMENT_GROUP_MAP[str(w.group)] ?? approved?.group ?? 'دفع إلكتروني',
    description: str(w.description) || approved?.description || '',
    availability: oneOf(w.availability, AVAILABILITIES, 'متاحة'),
    instructions: Array.isArray(w.instructions) && w.instructions.length
      ? w.instructions.map((line: unknown) => str(line))
      : approved?.instructions ?? [],
    copyables: Array.isArray(w.copyables) && w.copyables.length
      ? w.copyables.map((c: any) => ({ label: str(c.label), value: str(c.value) }))
      : approved?.copyables,
    // Defaults to manual (admin review) when absent: the safer of the two, since
    // it never claims a payment succeeded without confirmation.
    manual: w.manual ?? true,
  };
}

/* ------------------------------------------------- free-services catalog */

/*
 * The booking catalog (categories → services → providers) shipped as mock data
 * in `services.ts` with ids like `sv-psych`, while the server has a real catalog
 * with ids like `svc-1`. Nothing in the app read the server's copy, so the
 * booking screen offered services that do not exist and, had it ever posted,
 * would have been answered with «الخدمة غير موجودة».
 *
 * These map the server's catalog onto the shapes the screens already render, so
 * the ids that reach `POST /bookings` are ids the server knows.
 */

/**
 * The API stores an icon name per category, but it is authored in the dashboard
 * and is not guaranteed to be a Feather glyph — the live data has `people`,
 * which Feather does not define and which renders as nothing. Aliases the ones
 * actually in use and falls back to a glyph that always exists.
 */
const ICON_ALIASES: Record<string, string> = {
  people: 'users',
  person: 'user',
  health: 'activity',
  medical: 'activity',
  law: 'file-text',
  legal: 'file-text',
  education: 'book-open',
  school: 'book-open',
};

const FEATHER_FALLBACK = 'grid';

/** Feather names the catalog is known to use; anything else falls back. */
const KNOWN_ICONS = new Set([
  'activity', 'award', 'book', 'book-open', 'briefcase', 'calendar', 'clipboard',
  'coffee', 'droplet', 'edit-3', 'eye', 'file-text', 'grid', 'heart', 'home',
  'message-circle', 'message-square', 'shopping-bag', 'smile', 'thermometer',
  'user', 'users',
]);

function icon(value: unknown): string {
  if (typeof value !== 'string' || !value) return FEATHER_FALLBACK;
  const aliased = ICON_ALIASES[value] ?? value;
  return KNOWN_ICONS.has(aliased) ? aliased : FEATHER_FALLBACK;
}

export function mapServiceCategory(w: Record<string, any>): ServiceCategory {
  return {
    id: str(w.id),
    name: str(w.name),
    icon: icon(w.icon),
    description: w.description || undefined,
    // `null` means top level. `undefined` from a partial payload must not become
    // `undefined` here: `childCategories(null)` compares with `===`.
    parentId: w.parentId ?? null,
    active: w.active ?? true,
  };
}

/** Deterministic card gradient — the API has no concept of one. */
function gradientFor(id: string): [string, string] {
  const palette: [string, string][] = [
    ['#8296b5', '#4d6386'],
    ['#a7b6d0', '#7186a6'],
    ['#93a8c4', '#5b7396'],
    ['#7d93b4', '#455c80'],
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

/** "09:00" + 45 minutes -> "09:45". Returns null once it passes `end`. */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Expand a provider's weekly schedule into the slot labels shown on their card.
 *
 * This is presentation only. What is actually BOOKABLE comes from
 * `GET /services/:id/availability`, which also excludes slots already taken —
 * this cannot know that, so it must never be used to decide what to offer.
 */
function slotsFromSchedules(schedules: any[]): string[] {
  const out = new Set<string>();
  for (const s of schedules ?? []) {
    const start = str(s.startTime);
    const end = str(s.endTime);
    const step = num(s.slotMinutes, 30);
    if (!start || !end || step <= 0) continue;
    for (let t = start; t < end; t = addMinutes(t, step)) {
      out.add(t);
      if (out.size > 48) break; // a day cannot hold more; guards a bad schedule
    }
  }
  return [...out].sort();
}

export function mapProvider(w: Record<string, any>): CatalogProvider {
  const schedules = Array.isArray(w.schedules) ? w.schedules : [];
  return {
    id: str(w.id),
    name: str(w.name),
    specialization: str(w.specialization ?? w.specialty),
    bio: str(w.bio),
    yearsExperience: num(w.yearsExperience),
    rating: num(w.rating),
    reviews: num(w.reviews),
    availableDays: [...new Set(schedules.map((s: any) => num(s.weekday)))].sort(),
    slots: slotsFromSchedules(schedules),
    unavailableDates: Array.isArray(w.unavailableDates)
      ? w.unavailableDates.map((d: any) => str(d.date ?? d)).map((d: string) => d.slice(0, 10))
      : [],
    gradient: gradientFor(str(w.id)),
  };
}

export function mapCatalogService(w: Record<string, any>): CatalogService {
  return {
    id: str(w.id),
    name: str(w.name),
    description: str(w.description),
    categoryId: str(w.categoryId),
    providerId: str(w.providerId),
    free: w.free ?? true,
    requireNationalId: w.requireNationalId ?? false,
  };
}
