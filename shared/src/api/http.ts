import { getApiConfig } from './config';
import { ApiError, GENERIC_ERROR_AR } from './errors';

/** Pagination metadata the list endpoints return alongside `data`. */
export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Loose on purpose so callers can pass typed option objects directly. */
type Query = Record<string, unknown>;

function buildUrl(path: string, query?: Query): string {
  const { baseUrl } = getApiConfig();
  const url = `${baseUrl}/${path.replace(/^\/+/, '')}`;
  if (!query) return url;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
}

/**
 * Every successful response is wrapped by the backend's TransformInterceptor as
 * `{ data: ... }`, and list routes nest once more as `{ data: { data, meta } }`.
 * Callers should never have to know that, so unwrap here.
 */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    return (body as { data: T }).data;
  }
  // Not every route is enveloped — /consultants returns a bare array today.
  return body as T;
}

async function parseError(res: Response, endpoint: string): Promise<ApiError> {
  let code: string | undefined;
  let message = '';
  let fields: Record<string, string> | undefined;
  try {
    const body: any = await res.json();
    const err = body?.error ?? body;
    code = err?.code;
    message = err?.message ?? '';
    fields = err?.fields;
  } catch {
    /* HTML error page, empty body, or a proxy in the way — fall through */
  }
  return new ApiError({
    status: res.status,
    code,
    message: message || `${GENERIC_ERROR_AR} (HTTP ${res.status})`,
    fields,
    endpoint,
  });
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Query;
  body?: unknown;
  /** Send the bearer token. Defaults to true; public GETs work either way. */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Core request. Throws `ApiError` on any failure — including network failure and
 * timeout, which are reported as status 0 so callers have one thing to catch.
 *
 * Reads that should degrade to bundled data go through `withFallback` instead of
 * catching here; writes are expected to let the error reach the UI.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = true, signal } = options;
  const { timeoutMs, getToken } = getApiConfig();
  const url = buildUrl(path, query);

  // AbortSignal.timeout() is not in Hermes on older RN, so drive it manually.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = controller.signal.aborted;
    throw new ApiError({
      status: 0,
      code: aborted ? 'TIMEOUT' : 'NETWORK',
      message: aborted
        ? 'انتهت مهلة الاتصال بالخادم. حاول مرة أخرى.'
        : GENERIC_ERROR_AR,
      endpoint: path,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  if (!res.ok) throw await parseError(res, path);

  // 204, or a body-less 200 from a toggle route.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return unwrap<T>(JSON.parse(text));
  } catch {
    // CSV/PDF exports come back as text — hand them over untouched.
    return text as unknown as T;
  }
}

/** GET a list route, returning items and pagination metadata separately. */
export async function requestList<T>(
  path: string,
  query?: Query,
  options?: Omit<RequestOptions, 'query' | 'method' | 'body'>,
): Promise<Paginated<T>> {
  const data = await request<T[] | { data: T[]; meta: PageMeta }>(path, {
    ...options,
    method: 'GET',
    query,
  });
  if (Array.isArray(data)) {
    // Un-paginated route (e.g. /consultants). Synthesise matching metadata so
    // callers can treat every list the same way.
    return {
      items: data,
      meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 },
    };
  }
  return { items: data?.data ?? [], meta: data?.meta ?? { total: 0, page: 1, limit: 0, totalPages: 0 } };
}
