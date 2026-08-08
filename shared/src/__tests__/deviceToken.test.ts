import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureApi, registerDeviceToken } from '../index';

/**
 * Registering a device for push — the call nobody was making.
 *
 * `POST /me/device-tokens` shipped in the first backend commit and **no client
 * ever called it**. The table stayed empty, so the server had nothing to deliver
 * to and the delivery matrix recorded row 49 as blocked on an FCM key. Both
 * halves were missing at once, and each one hid the other.
 *
 * What these pin is the contract: the right path, an authenticated request, and
 * the platform values the backend's Zod schema will actually accept — a typo
 * there fails at runtime on a real phone and nowhere else.
 */

const captured: { url: string; init: RequestInit }[] = [];

beforeEach(() => {
  captured.length = 0;
  configureApi({ baseUrl: 'https://api.test/api/v1', getToken: () => 'test-token' });

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      captured.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: { id: 'dt-1' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registerDeviceToken', () => {
  it('posts the token to /me/device-tokens', async () => {
    await registerDeviceToken('fcm-token-abc', 'android');

    expect(captured).toHaveLength(1);
    expect(captured[0].url).toContain('/me/device-tokens');
    expect(captured[0].init.method).toBe('POST');
    expect(JSON.parse(String(captured[0].init.body))).toEqual({
      token: 'fcm-token-abc',
      platform: 'android',
    });
  });

  it('sends the bearer token — the endpoint is per-user, not anonymous', async () => {
    // Without auth the server has no idea whose device this is, and the call
    // 401s. This is why registration happens after sign-in, not at app start.
    await registerDeviceToken('fcm-token-abc', 'android');

    const headers = new Headers(captured[0].init.headers as HeadersInit);
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it.each(['ios', 'android', 'web'] as const)(
    'accepts the platform value "%s" that the backend schema allows',
    async (platform) => {
      await registerDeviceToken('t', platform);
      expect(JSON.parse(String(captured[0].init.body)).platform).toBe(platform);
    },
  );

  it('lets a failure surface rather than reporting success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'يجب تسجيل الدخول' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );

    // The caller logs it and carries on — but it must not resolve as if the
    // device were registered, or the app would believe it is reachable.
    await expect(registerDeviceToken('t', 'android')).rejects.toBeTruthy();
  });
});
