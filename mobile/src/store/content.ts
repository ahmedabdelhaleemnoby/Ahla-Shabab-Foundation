import {
  fetchArticles,
  fetchCases,
  fetchConsultants,
  fetchProjects,
  articles as bundledArticles,
  cases as bundledCases,
  consultants as bundledConsultants,
  projects as bundledProjects,
  type Article,
  type Consultant,
  type HumanitarianCase,
  type Project,
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
}

let cache: ContentCache | null = null;
let lastSource: 'api' | 'bundled' | 'unknown' = 'unknown';

/**
 * Fetch every public list in parallel. Never throws: each fetcher degrades to
 * its bundled array on failure, so a partial outage costs only that one list.
 */
export async function hydrateContent(): Promise<void> {
  const [cases, projects, articles, consultants] = await Promise.all([
    fetchCases({ limit: 100 }),
    fetchProjects({ limit: 100 }),
    fetchArticles({ limit: 100 }),
    fetchConsultants({ limit: 100 }),
  ]);
  cache = { cases, projects, articles, consultants };
  // A single row that is not in the bundled set is proof the API answered.
  lastSource = cases.some((c) => !bundledCases.some((b) => b.id === c.id)) ? 'api' : 'bundled';
}

export const isContentHydrated = (): boolean => cache !== null;
export const contentSource = (): typeof lastSource => lastSource;

export const getCases = (): HumanitarianCase[] => cache?.cases ?? bundledCases;
export const getProjects = (): Project[] => cache?.projects ?? bundledProjects;
export const getArticles = (): Article[] => cache?.articles ?? bundledArticles;
export const getConsultants = (): Consultant[] => cache?.consultants ?? bundledConsultants;

export const getCaseById = (id: string) => getCases().find((c) => c.id === id);
export const getProjectById = (id: string) => getProjects().find((p) => p.id === id);
export const getArticleById = (id: string) => getArticles().find((a) => a.id === id);
