import { getApiConfig } from './config';
import { ApiError } from './errors';

/**
 * Run an API read, falling back to bundled data if it fails for any reason.
 *
 * This is deliberately limited to **reads**. A read that quietly serves the
 * compiled defaults is the difference between a demo that works on a hotel wifi
 * and one that shows a spinner in front of the client. A *write* must never do
 * this — telling someone their consultation request was submitted when it was
 * not is worse than any error message — so submissions call `request()` directly
 * and let the ApiError reach the UI.
 *
 * Every fallback is reported through `onError`, so "the API is down" is visible
 * in logs rather than being indistinguishable from "the API returned the
 * defaults".
 */
export async function withFallback<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  const { onError } = getApiConfig();
  try {
    const result = await fetcher();
    // A 200 with an empty body is not a usable result — treat it as a miss so
    // the screen renders the bundled content instead of an empty state.
    if (result === undefined || result === null) {
      onError({ endpoint, message: 'empty response', fellBack: true });
      return fallback();
    }
    return result;
  } catch (e) {
    const err = e as ApiError;
    onError({
      endpoint,
      message: err?.message ?? String(e),
      status: err?.status,
      fellBack: true,
    });
    return fallback();
  }
}

/**
 * Same contract, but reports which source was used so a screen can show a
 * discreet "offline / showing saved content" hint if it wants to.
 */
export async function withFallbackTagged<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  fallback: () => T,
): Promise<{ data: T; source: 'api' | 'bundled'; error?: ApiError }> {
  const { onError } = getApiConfig();
  try {
    const result = await fetcher();
    if (result === undefined || result === null) {
      onError({ endpoint, message: 'empty response', fellBack: true });
      return { data: fallback(), source: 'bundled' };
    }
    return { data: result, source: 'api' };
  } catch (e) {
    const err = e as ApiError;
    onError({ endpoint, message: err?.message ?? String(e), status: err?.status, fellBack: true });
    return { data: fallback(), source: 'bundled', error: err };
  }
}
