# Build and test results — QA pass 2

> **QA pass 2 — 2026-08-01.** Verification of the bottom-navigation / email-OTP /
> governorates / provider-dashboard / guest-identity change set.
>
> **Test surfaces used:** code inspection, and **browser testing** against the
> Expo **web** build (headless Chrome 390×844, 320×700, 430×932) driven by
> puppeteer-core, asserting against React Navigation's own root state.
> **Not performed:** Android emulator testing, and real-device testing. The
> release APK was **built** but never installed or launched, so no claim is made
> about on-device behaviour.
>
> **Backend:** the app runs entirely on `@ahla/shared` mock data. A typed API
> client exists in `shared/src/api`, but **no mobile screen imports it** (0 call
> sites) and **zero external network requests** were observed across the whole
> session. Nothing here is backend-verified.


## Commands run

| Check | Command | Result | Errors / warnings |
|---|---|---|---|
| TypeScript (shared + mobile) | `npm run typecheck` | **PASS** — exit 0 | none |
| Unit tests | `cd shared && npx vitest run` | **PASS** — 32/32 in 2 files | none |
| Lint | — | **NOT APPLICABLE** | No ESLint config exists in the repo (no `.eslintrc*`, no `eslint.config.*`, no lint script). Nothing to run. |
| Mobile web export | `npx expo export --platform web --output-dir dist` | **PASS** | Bundle `index-…js` **1.83 MB**; 47 assets |
| Android release APK | `cd mobile/android && ./gradlew assembleRelease` | **PASS** — exit 0 | `app-release.apk` **60 MB**, written 2026-08-01 18:41 |
| Dashboard build | — | **NOT APPLICABLE** | `dashboard/` was removed from this repo in `9afd39f`; it now lives in `ahla-shabab-dashboard`. The provider-facing surface tested here is the **in-app** `ConsultantDashboard` screen. |


## Android emulator run — 2026-08-01

**This section is emulator evidence.** Physical-device testing still has **not**
happened.

| | |
|---|---|
| AVD | `QA_API36` — Android **16**, 1080×2400, `-gpu auto` |
| APK | `app-release.apk`, 62.7 MB, rebuilt **after** the D2-01 fix |
| Package | `tech.saasfarm.ahlashabab`, versionName 1.4.0, versionCode 8, minSdk 24, targetSdk 36 |
| Install | `adb install -r` → Success |
| Crashes | **0** FATAL exceptions, **0** app ANRs across the whole run |

| Check | Result | Evidence |
|---|---|---|
| Cold launch | **PASS** — `MainActivity` resumed, renders Home | `and-01-launch.png` |
| Launcher icon | **PASS** — foundation logo, not the Android default | `and-inner-card-title.png` (dock) |
| Five tabs, real taps | **PASS** — 5/5 navigate, **5 distinct screens** by checksum, app keeps focus throughout | `and-tab-*.png` |
| Tab bar contents | **PASS** — 5 items, RTL order right→left, raised «تبرع» | `and-02-home.png` |
| **D2-01 fix on device** | **PASS** — the green «اكفل أسرة» CTA clears the raised circle | `and-fix-cases.png` |
| Tab bar hidden on a pushed screen | **PASS** — CaseDetail shows only its own sticky footer, no tab bar | `and-04-inner.png` |
| Android back button | **PASS** — returns to the exact Cases screen (identical checksum); back from a root tab exits to the launcher, which is correct | `and-05-back.png` |
| Bottom safe area / gesture bar | **PASS** — sticky footers and the tab bar clear the gesture pill | `and-04-inner.png` |
| About screen on device | **PASS** — governorate chips render; impact figures (12, 1.2M+) present | `and-tab-about.png` |

### One emulator artifact, not an app defect

The first boot used the software renderer (`-gpu swiftshader_indirect`) and
`com.android.systemui` repeatedly raised **"System UI isn't responding"**. That
dialog stole window focus, so taps went to the dialog instead of the app and
every tab appeared not to respond. The app itself was fine throughout —
`topResumedActivity` stayed on `MainActivity` and no app ANR was ever recorded.
Relaunching with `-gpu auto` removed it entirely. **This is an emulator/host
graphics limitation and says nothing about the app.**

### Also worth recording

The first APK tested was built *before* the D2-01 fix. It was discarded and the
APK rebuilt so that every result above reflects current `main`.

---

## Environment

| | |
|---|---|
| Expo | 54.0.35 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| Navigation | `@react-navigation/native` + `bottom-tabs` + `native-stack` + `stack` |
| State | Hand-rolled `useSyncExternalStore` stores (`appState`, `providerStore`, `demoUsers`, `cms`, `drawer`, `notifications`) |
| Local persistence | **None.** No `AsyncStorage`, `SecureStore` or MMKV dependency. `localStorage` is read on web only, to pick up CMS edits. |
| Screens | 42 |

## Working tree

`git status` — clean, nothing to commit, up to date with `origin/main`.
`git diff --stat` — empty. No uncommitted or unrelated changes were present when
this pass began. Everything added during the pass is QA harness + reports only.
