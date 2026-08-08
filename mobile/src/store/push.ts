import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerDeviceToken, type DevicePlatform } from '@ahla/shared';
import { hasSession } from './session';

/**
 * Registering this device for push notifications.
 *
 * `POST /me/device-tokens` has existed since the first backend commit and **no
 * client ever called it**. The table was empty, so even a fully configured
 * Firebase project would have had nothing to deliver to. Row 49 of the delivery
 * matrix was filed as blocked on an FCM key; both halves of the feature were
 * simply absent.
 *
 * ## The token has to be the native one
 *
 * `expo-notifications` can hand back two different things and they are not
 * interchangeable:
 *
 *   - `getExpoPushTokenAsync()` → `ExponentPushToken[…]`, which only works when
 *     you deliver through **Expo's** push service;
 *   - `getDevicePushTokenAsync()` → the raw **FCM** registration token on
 *     Android, the **APNs** token on iOS.
 *
 * The server sends through `firebase-admin` directly, so it needs the second.
 * Sending the first would fail silently in the worst way: the API accepts it, the
 * row is stored, and every send is rejected by FCM — a feature that looks wired
 * from every angle except the phone.
 *
 * ## What it needs to actually work
 *
 * Android requires `google-services.json` from the **same Firebase project** as
 * the server's service account, referenced by `android.googleServicesFile` in
 * `app.json`. Without it `getDevicePushTokenAsync()` throws, and this module logs
 * that rather than failing quietly. It also needs a real build — remote push does
 * not work in Expo Go on Android since SDK 53.
 */

/** Foreground behaviour: a notification arriving while the app is open still shows. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const devicePlatform = (): DevicePlatform =>
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

/** The last token sent, so a re-register with no change is a no-op. */
let lastRegistered: string | null = null;
let tokenSubscription: { remove: () => void } | null = null;

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  // Asking again after a hard denial does nothing on either platform, so don't.
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function sendToken(token: string): Promise<void> {
  if (token === lastRegistered) return;
  await registerDeviceToken(token, devicePlatform());
  lastRegistered = token;
}

/**
 * Ask for permission, get the device token, and send it to the server.
 *
 * Safe to call more than once — on sign-in and on app start with a restored
 * session — and never throws. A phone that cannot register push is a phone that
 * misses notifications, not one that fails to open the app.
 */
export async function registerForPush(): Promise<
  'registered' | 'no-session' | 'denied' | 'unsupported' | 'failed'
> {
  // The endpoint is authenticated. Registering before sign-in would 401, and the
  // token belongs to a user anyway — that is how the server knows who to reach.
  if (!hasSession()) return 'no-session';

  if (Platform.OS === 'web') return 'unsupported';

  try {
    if (!(await ensurePermission())) return 'denied';

    // Native FCM/APNs token — deliberately NOT getExpoPushTokenAsync(). See above.
    const device = await Notifications.getDevicePushTokenAsync();
    await sendToken(String(device.data));

    // FCM rotates tokens; a stale one is dropped by the server's cleanup, and
    // without this listener the device would then be unreachable until restart.
    if (!tokenSubscription) {
      tokenSubscription = Notifications.addPushTokenListener((next) => {
        void sendToken(String(next.data)).catch((err) => {
          console.warn('[push] failed to register a rotated token', err);
        });
      });
    }

    return 'registered';
  } catch (err) {
    // The usual cause on Android is a missing google-services.json, which is a
    // build-time asset the foundation supplies from its Firebase project.
    console.warn(
      '[push] device registration failed — notifications will not arrive on this device',
      err,
    );
    return 'failed';
  }
}

/**
 * Forget the device on sign-out.
 *
 * Only clears the local memo: the server row is left alone on purpose, because
 * deleting it would need a route that does not exist, and a stale token is
 * cleaned up on the next failed send. What must not happen is the next user of
 * this phone silently inheriting the previous one's registration — which is why
 * the memo is cleared and the next sign-in re-registers under the new account.
 */
export function forgetPushRegistration(): void {
  lastRegistered = null;
  tokenSubscription?.remove();
  tokenSubscription = null;
}

/** Test seam — resets module state between cases. */
export const __resetPushStateForTests = forgetPushRegistration;
