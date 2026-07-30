import type {
  Article,
  Consultant,
  HumanitarianCase,
  PaymentMethod,
  Project,
} from '../types';
import type { CmsState } from '../cms/cmsTypes';
import { makeDefaultCmsState } from '../cms/cmsDefaults';
import { articles, cases, consultants, projects } from '../data';
import { mapCmsState } from './cmsMapper';
import { mapArticle, mapCase, mapConsultant, mapProject } from './mappers';
import { withFallback, withFallbackTagged } from './fallback';
import { request, requestList, type Paginated } from './http';

/**
 * Typed access to the endpoints the app uses.
 *
 * READS go through `withFallback`, so a screen always renders: if the API is
 * unreachable the compiled `@ahla/shared` content is served instead, and the
 * failure is reported through `configureApi({ onError })`.
 *
 * WRITES do not fall back. A submission that silently pretends to succeed is
 * worse than an error, so these throw `ApiError` and the form is expected to
 * show `error.message` (already Arabic) and `error.fields` per input.
 *
 * Everything here is on the PUBLIC surface, which is the only part of the API
 * that works today: every `/admin` route and all 18 `/me` routes are broken
 * until backend PR #2 ships (BACKEND.md §21).
 */

/**
 * A `type` alias rather than an `interface` on purpose: TypeScript will not
 * assign an interface to the `Record<string, unknown>` the query builder takes,
 * but it will assign an object type alias.
 */
type ListQuery = {
  page?: number;
  limit?: number;
  q?: string;
};

/* --------------------------------------------------------------------- CMS */

/** The whole CMS blob, merged over the bundled defaults. See `mapCmsState`. */
export const fetchCms = (): Promise<CmsState> =>
  withFallback('GET /cms', async () => mapCmsState(await request<unknown>('cms', { auth: false })), makeDefaultCmsState);

/** Same, but reports whether the API or the bundled copy was used. */
export const fetchCmsTagged = () =>
  withFallbackTagged('GET /cms', async () => mapCmsState(await request<unknown>('cms', { auth: false })), makeDefaultCmsState);

/* ------------------------------------------------------------------- cases */

export const fetchCases = (query: ListQuery & { tag?: string } = {}): Promise<HumanitarianCase[]> =>
  withFallback(
    'GET /cases',
    async () => (await requestList<Record<string, any>>('cases', query, { auth: false })).items.map(mapCase),
    () => cases,
  );

export const fetchCasesPaged = (
  query: ListQuery & { tag?: string } = {},
): Promise<Paginated<HumanitarianCase>> =>
  withFallback(
    'GET /cases',
    async () => {
      const { items, meta } = await requestList<Record<string, any>>('cases', query, { auth: false });
      return { items: items.map(mapCase), meta };
    },
    () => ({ items: cases, meta: { total: cases.length, page: 1, limit: cases.length, totalPages: 1 } }),
  );

export const fetchCase = (id: string): Promise<HumanitarianCase | undefined> =>
  withFallback(
    `GET /cases/${id}`,
    async () => mapCase(await request<Record<string, any>>(`cases/${id}`, { auth: false })),
    () => cases.find((c) => c.id === id),
  );

/* ---------------------------------------------------------------- projects */

export const fetchProjects = (query: ListQuery & { category?: string } = {}): Promise<Project[]> =>
  withFallback(
    'GET /projects',
    async () => (await requestList<Record<string, any>>('projects', query, { auth: false })).items.map(mapProject),
    () => projects,
  );

/** The detail route is the only one that includes `stages`. */
export const fetchProject = (id: string): Promise<Project | undefined> =>
  withFallback(
    `GET /projects/${id}`,
    async () => mapProject(await request<Record<string, any>>(`projects/${id}`, { auth: false })),
    () => projects.find((p) => p.id === id),
  );

/* ---------------------------------------------------------------- articles */

export const fetchArticles = (query: ListQuery & { category?: string } = {}): Promise<Article[]> =>
  withFallback(
    'GET /articles',
    async () => (await requestList<Record<string, any>>('articles', query, { auth: false })).items.map(mapArticle),
    () => articles,
  );

export const fetchArticle = (id: string): Promise<Article | undefined> =>
  withFallback(
    `GET /articles/${id}`,
    async () => mapArticle(await request<Record<string, any>>(`articles/${id}`, { auth: false })),
    () => articles.find((a) => a.id === id),
  );

/* ------------------------------------------------------------- consultants */

/**
 * Sourced from `/providers`, not `/consultants`: the latter omits
 * `yearsExperience`, `rating` and `reviews`, which the consultant card shows.
 */
export const fetchConsultants = (query: ListQuery = {}): Promise<Consultant[]> =>
  withFallback(
    'GET /providers',
    async () => (await requestList<Record<string, any>>('providers', query, { auth: false })).items.map(mapConsultant),
    () => consultants,
  );

/* ---------------------------------------------------- services & aggregates */

export interface ApiService {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  providerId: string | null;
  free: boolean;
  requireNationalId: boolean;
  active: boolean;
}

export const fetchServices = (query: ListQuery & { categoryId?: string } = {}) =>
  requestList<ApiService>('services', query, { auth: false });

/** The booking form is data-driven — render whatever this returns. */
export const fetchServiceForm = (serviceId: string) =>
  request<unknown>(`services/${serviceId}/form`, { auth: false });

/** Free slots for a service. These are the only values `timeSlot` accepts. */
export const fetchAvailability = (serviceId: string, from: string, to: string) =>
  request<unknown>(`services/${serviceId}/availability`, { auth: false, query: { from, to } });

/** One call for the whole home screen. */
export const fetchHomeAggregate = () => request<Record<string, any>>('home', { auth: false });

/** One call for the About screen. */
export const fetchFoundationAggregate = () => request<Record<string, any>>('foundation', { auth: false });

/**
 * `/home` and `/foundation` return `stats` as a LIST of `{ key, value, label }`,
 * whereas the app's `settings.stats` is an object. Flatten by key.
 */
export const statsListToObject = (list: unknown): Record<string, string> => {
  if (!Array.isArray(list)) return {};
  const out: Record<string, string> = {};
  for (const row of list) {
    const key = typeof row?.key === 'string' ? row.key : null;
    if (key) out[key] = String(row?.value ?? '');
  }
  return out;
};

/* ------------------------------------------------------------------- writes */

export interface CreateConsultationInput {
  /** Must match a consultation type key from GET /cms. */
  type: string;
  name: string;
  phone: string;
  email: string;
  whatsapp?: string;
  age?: number;
  governorate?: string;
  preferredChannel?: string;
  preferredTime?: string;
  summary?: string;
  /** Per-type answers the base schema has no column for. */
  extraFields?: Record<string, unknown>;
}

/** Rate limited to 3/minute per IP. Throws ApiError — never falls back. */
export const submitConsultation = (input: CreateConsultationInput) =>
  request<{ id: string }>('consultations', { method: 'POST', body: input, auth: false });

export interface CreateContactInput {
  name: string;
  phone: string;
  message: string;
}

export const submitContact = (input: CreateContactInput) =>
  request<{ id: string }>('contact', { method: 'POST', body: input, auth: false });

export interface CreateVolunteerInput {
  name: string;
  phone: string;
  /** At least one is required by the server. */
  interests: string[];
  age?: number;
  /** NOTE: a numeric id, not a governorate name. */
  governorateId?: number;
  availability?: string;
}

export const submitVolunteer = (input: CreateVolunteerInput) =>
  request<{ id: string }>('volunteers', { method: 'POST', body: input, auth: false });

export interface CreateDonationInput {
  donorName: string;
  cause: string;
  /** Whole EGP — the server requires a positive integer. */
  amount: number;
  method: PaymentMethod;
  recurring?: boolean;
}

/**
 * Auth is optional: with a token the donation is attached to the account,
 * without one it is a guest donation. Never returns a completed donation —
 * manual methods start at `قيد المراجعة`, gateway methods at `قيد التأكيد`.
 */
export const submitDonation = (input: CreateDonationInput) =>
  request<{ id: string; reference: string; status: string }>('donations', {
    method: 'POST',
    body: input,
  });

export const fetchDonationByReference = (reference: string) =>
  request<Record<string, any>>(`donations/${encodeURIComponent(reference)}`, { auth: false });

export interface CreateBookingInput {
  /** Must be a UUID from GET /services. */
  serviceId: string;
  applicantName: string;
  phone: string;
  /** YYYY-MM-DD. */
  date: string;
  /** HH:MM, and must be one of the slots GET availability returned. */
  timeSlot: string;
  age?: number;
  gender?: 'ذكر' | 'أنثى';
  governorateId?: number;
  city?: string;
  /** Exactly 14 digits when supplied. */
  nationalId?: string;
  notes?: string;
  extraFields?: Record<string, unknown>;
}

export const submitBooking = (input: CreateBookingInput) =>
  request<{ id: string; reference: string }>('bookings', { method: 'POST', body: input });

export const fetchBookingByReference = (reference: string) =>
  request<Record<string, any>>(`bookings/${encodeURIComponent(reference)}`, { auth: false });
