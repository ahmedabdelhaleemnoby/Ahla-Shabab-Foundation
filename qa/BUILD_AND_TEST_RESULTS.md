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
