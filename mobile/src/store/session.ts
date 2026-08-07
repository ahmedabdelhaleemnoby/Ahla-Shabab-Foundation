import * as SecureStore from 'expo-secure-store';
import { refreshSession, logoutSession, type AuthSession } from '@ahla/shared';

/**
 * The signed-in session: JWT pair + who it belongs to.
 *
 * Tokens live in the OS keystore (`expo-secure-store`), not AsyncStorage —
 * they are bearer credentials, so they should not sit in plain app storage.
 *
 * A synchronous in-memory mirror is kept because the API client's `getToken`
 * is sync; SecureStore is async and can only be read at boot / on change.
 */

const ACCESS_KEY = 'ahla_access_token';
const REFRESH_KEY = 'ahla_refresh_token';
const EMAIL_KEY = 'ahla_session_email';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let email: string | null = null;

/** Sync read used by `configureApi({ getToken })`. */
export const getAccessToken = (): string | null => accessToken;
export const getSessionEmail = (): string | null => email;
export const hasSession = (): boolean => !!accessToken;

async function write(key: string, value: string | null) {
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    /* keystore unavailable (rare) — the in-memory session still works for this run */
  }
}

/** Persists a freshly issued session. */
export async function saveSession(s: AuthSession): Promise<void> {
  accessToken = s.accessToken;
  refreshToken = s.refreshToken;
  email = s.user?.email ?? null;
  await Promise.all([
    write(ACCESS_KEY, accessToken),
    write(REFRESH_KEY, refreshToken),
    write(EMAIL_KEY, email),
  ]);
}

export async function clearSession(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  email = null;
  await Promise.all([write(ACCESS_KEY, null), write(REFRESH_KEY, null), write(EMAIL_KEY, null)]);
}

/**
 * Called once at startup. Loads the stored pair and rotates it, so a returning
 * user stays signed in. If the refresh token was revoked or expired the session
 * is cleared rather than left in a half-valid state.
 */
export async function restoreSession(): Promise<boolean> {
  try {
    const [a, r, e] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(EMAIL_KEY),
    ]);
    if (!a || !r) return false;
    accessToken = a;
    refreshToken = r;
    email = e;

    // The access token is short-lived; rotate on boot so the first real request
    // does not fail with a 401.
    try {
      const next = await refreshSession(r);
      accessToken = next.accessToken;
      refreshToken = next.refreshToken;
      await Promise.all([write(ACCESS_KEY, next.accessToken), write(REFRESH_KEY, next.refreshToken)]);
    } catch {
      await clearSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** The stored refresh token, needed to revoke the session on logout. */
export const getRefreshToken = (): string | null => refreshToken;

/**
 * Sign-out: revoke the refresh token server-side, then clear local state.
 * Never rejects — if the revoke call fails (offline, already expired) the local
 * session is still cleared, because the user asked to sign out.
 */
export async function endSession(): Promise<void> {
  const token = refreshToken;
  await clearSession();
  if (!token) return;
  try {
    await logoutSession(token);
  } catch {
    /* already invalid or unreachable — local session is gone either way */
  }
}
