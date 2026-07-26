# Persistence Report

**Method:** perform action → read state → reload the page (equivalent to an app restart for the web build) → read state again. State inspected directly through the app's own dev hooks (`__appState`, `__nav`) plus rendered UI.

**Scope caveat:** verified on **Expo Web** only. The three in-memory stores contain no platform-specific code, so the same reset behaviour is expected on Android — but that was not verified on a device (Android build blocked).

## Headline result

**Nothing persists except CMS content.** Session, consultation history, guest identity, provider availability and provider booking statuses are all held in plain module-level JavaScript variables and are lost on every reload or app restart.

## What persists vs. what resets

| State | Store | Survives reload? | Evidence |
|---|---|---|---|
| Login session (`loggedIn`, `email`) | `appState.ts` | **NO** | before `{"loggedIn":true,"email":"persist@test.com"}` → after `{"loggedIn":false,"email":null}` |
| Consultation requests | `appState.ts` | **NO** | `consultations: []` after reload |
| Donation receipts | `appState.ts` | **NO** | `receipts: []` after reload |
| Returning-guest identity map | `demoUsers.ts` | **NO** | `demoUsersStore` is a module-level `new Map()` |
| Provider availability — added slot | `providerStore.ts` | **NO** | `05:30 م` added → after reload: **LOST** |
| Provider availability — exception date | `providerStore.ts` | **NO** | `2026-09-09` added → after reload: **LOST** |
| Provider availability toggle | `providerStore.ts` | **NO** | toggled OFF → after reload: back to ON |
| Provider booking status | `providerStore.ts` | **NO** | reverts to seed statuses (جديد / مؤكد / مكتمل) |
| Notification read state | `notifications.ts` | **NO** | same in-memory pattern |
| CMS content (menu, home, pages, media, consultation schemas) | `cms.ts` / `cmsPersistence.ts` | **YES, web only** | reads/writes `localStorage`; native builds fall back to compiled defaults |

## Within-session behaviour is correct

Everything the requirements describe works **for the duration of one uninterrupted session**, which is what a live demo actually exercises:

- Consultation submitted → immediately visible, reference number issued.
- Two submissions with `Test@Example.COM` and `test@example.com` → single identity, no duplicate user.
- Login with `"   TEST@EXAMPLE.com   "` → normalised to `test@example.com`, **both** prior requests linked (`AS-455572`, `AS-455586`).
- Provider slot/exception/day/status edits → reflected instantly across the dashboard tabs.

## The claim/behaviour mismatch (D-03) — **resolved by correcting the copy**

**Status: fixed at the wording level. The persistence behaviour above is unchanged — nothing persists.** Three strings previously overstated what the app does; all now describe session-only state.

Originally:

| Screen | Was | Now |
|---|---|---|
| Consultation confirmation | "حُفظ الطلب على جهازك فقط ولم يُرسل لأي جهة." | "الطلب محفوظ **أثناء الجلسة الحالية فقط** ولم يُرسل لأي جهة. **سيُمسح عند إغلاق التطبيق.**" |
| Consultation confirmation | "تم حفظ طلبك … ويمكنك تسجيل الدخول بنفس البريد لمتابعته." | "سُجِّل طلبك … ويمكنك تسجيل الدخول بنفس البريد **أثناء هذه الجلسة** لمتابعته." |
| Provider dashboard banner | "لوحة تحكم مقدم الخدمة (**مُحفوظة محلياً**)" | "لوحة تحكم مقدم الخدمة (**التعديلات تُحفظ أثناء الجلسة الحالية فقط**)" |

Retested: `PASS | provider banner states session-only`, `PASS | disclaimer states session-only`, `PASS | still states not sent anywhere`, `PASS | submission still works`.

`defaultSettings.demoLabel` ("يتم حفظ التعديلات على هذا الجهاز فقط") was left alone — it describes the **dashboard CMS**, which genuinely does persist to `localStorage`.

The "not sent anywhere" half of the consultation sentence — *"ولم يُرسل لأي جهة"* — was **accurate all along and independently verified** (zero non-localhost requests across the whole app), so it was preserved verbatim. Only the "saved" half overstated, and only that half was changed.

## "Clear demo data" flow

There is **no explicit reset/clear-demo-data control** in the mobile app. In practice, reset is implicit and total: restarting the app returns everything to seed state. On web, CMS edits do survive and would need `localStorage.clear()` to reset — the dashboard's `/cms/tools` page is the intended surface for that.

**Assessment:** reset works safely (no partial or corrupt state was observed after any reload), but it is a side-effect of having no persistence rather than a designed feature.

## Recommendation

Pick one and align the copy to it:

1. **Add persistence** — hydrate `appState`, `demoUsers` and `providerStore` from `AsyncStorage` (native) / `localStorage` (web). Makes the "returning guest" story genuinely demonstrable across restarts, which is arguably its whole point.
2. **Keep in-memory, fix the wording** — change "مُحفوظة محلياً" / "حُفظ الطلب على جهازك" to "محفوظة أثناء الجلسة الحالية فقط". Cheap, honest, and sufficient for a single-sitting client demo.

**Option 2 was applied.** Option 1 was rejected for now because `@react-native-async-storage/async-storage` is not a dependency; adding a native module needs a native rebuild, and the Android build is broken in this environment, so the change could not have been verified on the platform that matters. A web-only `localStorage` shim was also rejected — divergent web/native behaviour is worse than honest in-memory behaviour.

**Real persistence remains the recommended follow-up** once the Android toolchain is fixed. It is what makes the "returning guest" story demonstrable across restarts, which is arguably its whole point.
