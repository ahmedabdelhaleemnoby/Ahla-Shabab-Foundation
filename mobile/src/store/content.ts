import {
  fetchArticles,
  fetchCases,
  fetchCatalogServices,
  fetchConsultants,
  fetchProjects,
  fetchProviders,
  fetchServiceCategories,
  articles as bundledArticles,
  cases as bundledCases,
  consultants as bundledConsultants,
  projects as bundledProjects,
  providers as bundledProviders,
  serviceCategories as bundledCategories,
  services as bundledServices,
  type Article,
  type Consultant,
  type HumanitarianCase,
  type Project,
  type Provider,
  type Service,
  type ServiceCategory,
} from '@ahla/shared';

/**
 * API-backed content, cached so the screens can stay synchronous.
 *
 * The screens import these getters instead of the arrays from `@ahla/shared`.
 * `hydrateContent()` runs once at boot — before the first frame — so a getter
 * returns API data from the very first render and no screen needs to become
 * async or grow a loading state.
 *
 * The bundled arrays remain, but only as the offline fallback: `fetchCases` and
 * friends already fall back to them internally when the request fails, so what
 * lands in this cache is API data whenever the API is reachable, and the
 * compiled content otherwise. Nothing shows fake data while real data is
 * available.
 */

interface ContentCache {
  cases: HumanitarianCase[];
  projects: Project[];
  articles: Article[];
  consultants: Consultant[];
  /* The bookable catalog. These three exist so the ids the booking screen
     sends are ids the server issued — the bundled catalog's `sv-psych` and
     `pr-tarek` are local fictions that `POST /bookings` rejects. */
  categories: ServiceCategory[];
  services: Service[];
  providers: Provider[];
}

let cache: ContentCache | null = null;
let lastSource: 'api' | 'bundled' | 'unknown' = 'unknown';

/**
 * Fetch every public list in parallel. Never throws: each fetcher degrades to
 * its bundled array on failure, so a partial outage costs only that one list.
 */
export async function hydrateContent(): Promise<void> {
  const [cases, projects, articles, consultants, categories, services, providers] =
    await Promise.all([
      fetchCases({ limit: 100 }),
      fetchProjects({ limit: 100 }),
      fetchArticles({ limit: 100 }),
      fetchConsultants({ limit: 100 }),
      fetchServiceCategories({ limit: 100 }),
      fetchCatalogServices({ limit: 100 }),
      fetchProviders({ limit: 100 }),
    ]);
  cache = { cases, projects, articles, consultants, categories, services, providers };
  // A single row that is not in the bundled set is proof the API answered.
  lastSource = cases.some((c) => !bundledCases.some((b) => b.id === c.id)) ? 'api' : 'bundled';
}

export const isContentHydrated = (): boolean => cache !== null;
export const contentSource = (): typeof lastSource => lastSource;

export const getCases = (): HumanitarianCase[] => cache?.cases ?? bundledCases;
export const getProjects = (): Project[] => cache?.projects ?? bundledProjects;
export const getArticles = (): Article[] => cache?.articles ?? bundledArticles;
export const getConsultants = (): Consultant[] => cache?.consultants ?? bundledConsultants;

export const getServiceCategories = (): ServiceCategory[] => cache?.categories ?? bundledCategories;
export const getServices = (): Service[] => cache?.services ?? bundledServices;
export const getProviders = (): Provider[] => cache?.providers ?? bundledProviders;

/*
 * Catalog lookups, replacing the `serviceById` / `providerById` / `categoryById`
 * imported straight from `@ahla/shared`. Same signatures, but resolved against
 * whatever `hydrateContent()` loaded, so a screen that browses the catalog and
 * the booking it produces are talking about the same rows.
 */
export const getServiceById = (id: string) => getServices().find((s) => s.id === id);
export const getProviderById = (id: string) => getProviders().find((p) => p.id === id);
export const getCategoryById = (id: string) => getServiceCategories().find((c) => c.id === id);
export const getChildCategories = (parentId: string | null) =>
  getServiceCategories().filter((c) => c.parentId === parentId && c.active);
export const getServicesInCategory = (categoryId: string) =>
  getServices().filter((s) => s.categoryId === categoryId);

export const getCaseById = (id: string) => getCases().find((c) => c.id === id);
export const getProjectById = (id: string) => getProjects().find((p) => p.id === id);
export const getArticleById = (id: string) => getArticles().find((a) => a.id === id);
