/**
 * API configuration.
 *
 * The base URL is *injected* rather than read from the environment here on
 * purpose: this package is consumed as raw TypeScript by both Metro (which
 * exposes `process.env.EXPO_PUBLIC_*`) and Vite (which exposes
 * `import.meta.env.VITE_*`). Referencing either directly in shared code breaks
 * the other bundler — `import.meta` is a syntax error under Metro's CommonJS
 * transform. So each app calls `configureApi()` once at startup with whatever
 * its own bundler gives it.
 *
 *   // mobile/App.tsx
 *   configureApi({ baseUrl: process.env.EXPO_PUBLIC_API_BASE });
 *
 *   // dashboard/src/main.tsx
 *   configureApi({ baseUrl: import.meta.env.VITE_API_BASE });
 */

export interface ApiConfig {
  /** e.g. https://portfolio.27lashabab.com/api/v1 — no trailing slash. */
  baseUrl: string;
  /** Per-request timeout. The deployed box can be slow to wake. */
  timeoutMs: number;
  /**
   * Bearer token for authenticated routes, or null for anonymous.
   * A getter rather than a value so a token refresh is picked up without
   * reconfiguring, and so the token is never captured in a closure at boot.
   */
  getToken: () => string | null;
  /**
   * Called whenever a request fails, including when a fallback rescues it.
   * Wire this to your logger; it is how a silent fallback stays visible.
   */
  onError: (info: { endpoint: string; message: string; status?: number; fellBack: boolean }) => void;
}

const DEFAULT_BASE_URL = 'https://portfolio.27lashabab.com/api/v1';

let config: ApiConfig = {
  baseUrl: DEFAULT_BASE_URL,
  timeoutMs: 15000,
  getToken: () => null,
  onError: () => {},
};

export function configureApi(next: Partial<ApiConfig> & { baseUrl?: string }): void {
  config = {
    ...config,
    ...next,
    // An empty or undefined env var must not produce a request to "undefined/cms".
    baseUrl: (next.baseUrl || config.baseUrl).replace(/\/+$/, ''),
  };
}

export const getApiConfig = (): ApiConfig => config;
