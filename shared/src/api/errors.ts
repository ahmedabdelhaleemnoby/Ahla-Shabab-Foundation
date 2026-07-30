/**
 * Normalised API error.
 *
 * The backend answers failures as
 *   { error: { code, message, fields? } }
 * with `message` already in Arabic (see ZodValidationPipe), so it is safe to
 * show to the user directly. `fields` maps a form field path to its Arabic
 * message, which is what the consultation and booking forms need to highlight
 * the offending input rather than showing one generic banner.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Field path -> Arabic validation message, when the failure was a 400. */
  readonly fields: Record<string, string>;
  readonly endpoint: string;

  constructor(opts: {
    status: number;
    code?: string;
    message: string;
    fields?: Record<string, string>;
    endpoint: string;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code ?? 'UNKNOWN';
    this.fields = opts.fields ?? {};
    this.endpoint = opts.endpoint;
  }

  /** True when retrying could plausibly succeed (network blip, server asleep). */
  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }

  /** True when the caller needs to re-authenticate. */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * True when authenticated but not permitted.
   *
   * Worth special-casing in the UI: until backend PR #2 ships, EVERY /admin
   * route answers 403 regardless of the role's configured permissions, so a
   * blanket "insufficient permissions" message would be actively misleading.
   */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/** Fallback copy for the cases where the server gave us nothing usable. */
export const GENERIC_ERROR_AR = 'تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.';
