# PERSISTENCE REPORT

**Date:** 2026-07-26 · **Commit:** `ec46501` · **Method:** code inspection + dependency check + live browser.

## Headline
- **Mobile app: NO cross-restart persistence anywhere.** `@react-native-async-storage/async-storage` is **not a dependency** and is **never imported** (`rg AsyncStorage|SecureStore|MMKV mobile/src` → 0 hits). Every store is a plain in-memory module variable. All mobile state is lost on app reload/restart.
- **Web dashboard: real persistence** of CMS content + media via `localStorage` (`dashboard/src/store/cmsPersistence.ts`), surviving browser refresh.
- **Mismatch to fix:** mobile UI banners claim local persistence that does not exist (see D-04).

## Mobile stores (all in-memory, reset on restart)
| Store | File | Backing | Survives in-session? | Survives restart? |
|---|---|---|---|---|
| Auth/session (`loggedIn`, email, receipts, consultations) | `mobile/src/store/appState.ts` | module var + `useSyncExternalStore` | ✅ | ❌ |
| Demo users / identity / dedup | `mobile/src/store/demoUsers.ts` | `new Map()` | ✅ | ❌ |
| Provider availability & bookings | `mobile/src/store/providerStore.ts:135-138` | module var | ✅ | ❌ |
| CMS (mobile render) | `mobile/src/store/cms.ts` | defaults (no backend) | ✅ | ❌ (always defaults) |
| Notifications read-state | `mobile/src/store/notifications.ts` | module var | ✅ | ❌ |

## Web dashboard (persisted)
| Data | File | Backing | Survives refresh? |
|---|---|---|---|
| CMS structural state | `dashboard/src/store/cmsPersistence.ts:82` | `localStorage['...']` | ✅ |
| CMS media library | `:87` | `localStorage['...']` | ✅ |
| CMS backup snapshot | `:96-97` | `localStorage` | ✅ |
| Bookings / donations / provider records | `dashboard/src/*` seed data | in-memory (seeded) | ❌ (reset on refresh) |

## Test procedure & results
Persistence was assessed by (a) checking installed dependencies, (b) inspecting every store's backing, and (c) confirming behavior live where possible. Full app-restart persistence on a device was **not** executed (no emulator/device).

| # | Item | Expected | Result | Notes |
|---|---|---|---|---|
| 1 | Login session persistence | survive restart | **FAIL (restart)** / PASS (in-session) | `appState` in-memory; no AsyncStorage |
| 2 | Consultation request persistence | survive restart | **FAIL (restart)** / PASS (in-session) | `demoUsers` Map; copy says "حُفظ على جهازك" (overstated) |
| 3 | Returning-guest identity persistence | survive restart | **FAIL (restart)** / PASS (in-session) | dedup Map lost on reload |
| 4 | Provider availability persistence | survive refresh | **FAIL** | `providerStore` in-memory; banner says "مُحفوظة محلياً" (false) |
| 5 | Provider booking status persistence | survive refresh | **FAIL** | same store |
| 6 | Notification read-state | survive restart | **FAIL (restart)** / PASS (in-session) | in-memory |
| 7 | Dashboard CMS edits | survive refresh | **PASS** | `localStorage` via `cmsPersistence.ts` |
| 8 | Clear demo data / reset | safe reset | **PASS (implicit)** | mobile: restart clears everything; dashboard: clearing `localStorage` resets to defaults; no destructive prompts |

## Demo impact
For a **single-session client walkthrough** (app stays open), the in-memory model is adequate: dedup, history-linking after login, provider actions, and consultation submission all work live. The problems are (1) the **false "saved locally / on your device" claims** on mobile, and (2) any demo that involves closing/reopening the app will silently lose state. Both are addressed by D-04 — either wire AsyncStorage or correct the copy before the client demo.
