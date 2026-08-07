# 01 — Code Gaps (Mock / Hardcoded / Incomplete)

> **Updated after fixes — 2026-08-07.**
> **G-01 → RESOLVED** (dashboard `a797361`), **G-05 → RESOLVED** (backend `a1cd48a`).
> **Two corrections to the original baseline** (both were my errors, corrected after reading
> the module resolution and route table):
> - **G-15 was WRONG.** `dashboard/src/shared/` is *not* dead code — `vite.config.ts` and
>   `tsconfig.json` alias `@ahla/shared` → `src/shared/index.ts`. It is the live shared
>   package. Withdrawn.
> - **Mutation count was 4, actually 5** — the sweep's regex missed `toggleUserBlock`. Also
>   `/admin/messages/:id` accepts a status, so **6** row actions were wirable, not 4.

Automated sweep over `src/` of all three repos (excluding `node_modules`, `dist`).
Counts are line hits, then each cluster is classified and verified by reading the code.

## Raw sweep

| Pattern | Backend | Dashboard | Mobile |
|---|---:|---:|---:|
| TODO / FIXME | 0 | 10 | 7 |
| MOCK / STUB / FAKE / DUMMY | 0 | 0 | 0 |
| DEMO / «نسخة عرض» | 0 | 4 | 10 |
| console.log | 2 | 0 | 0 |
| @ts-ignore / @ts-expect-error | 0 | 0 | 0 |
| eslint-disable | 0 | 1 | 0 |
| `: any` | 67 | 16 | 1 |
| localhost / 127.0.0.1 | 9 | 0 | 0 |
| localStorage / AsyncStorage | 0 | 24 | 4 |
| setTimeout | 0 | 2 | 0 |

No `debugger`, no `HARDCODED`, no `Promise.resolve` stubs, no fake-ID generators found in
backend source. The codebases are unusually clean of dead scaffolding — the gaps are
**architectural (unwired writes)**, not litter.

## Classified findings

### MUST FIX BEFORE DELIVERY

| ID | Finding | Where | Evidence |
|---|---|---|---|
| **G-01** ✅ **RESOLVED** | **Dashboard write path is not wired.** `adminApi.ts` exports 19 functions, of which only 4 are mutations (`updateBookingStatus`, `updateDonationStatus`, `updateVolunteerStatus`, `updateConsultationStatus`) — and **grep proves none of the 4 is imported by any page**. Every admin action (approve donation, confirm booking, publish content, block user) mutates React state only and is lost on refresh. | `dashboard/src/store/adminApi.ts`, all `src/pages/*.tsx` | `grep -rl updateDonationStatus src/pages` → *empty* |
| **G-02** | **Content CRUD never persists.** `Content.tsx` reads cases/projects/articles from the API, but `save()` calls `setRows(...)` only. No POST/PUT/DELETE exists for `/admin/portfolio/*` in the dashboard client, although the backend exposes 19 such routes. | `dashboard/src/pages/Content.tsx:93,205` | code read |
| **G-03** ✅ **RESOLVED (T-13)** — wired to `POST /admin/notifications/broadcast`; the fabricated `kind`/audience controls and the seeded history were removed. The authenticated *send* is still unverified (would be a production broadcast to all real users). | **Notifications page is entirely local.** `useState(seed)` with no API import at all; backend `POST /admin/notifications` is never called. Nothing is ever sent or stored. | `dashboard/src/pages/Notifications.tsx:31` | code read |
| **G-04** | **Mobile login is simulated.** `OtpScreen.verify()` accepts any 6-digit code and calls `loginDemoUserByEmail(email)` locally. The backend's real `/auth/otp/request` + `/auth/otp/verify` are never called, so no JWT is ever obtained and no `/me/*` endpoint can work from the app. | `mobile/src/screens/OtpScreen.tsx:35`, `EmailAuthScreen.tsx:20`, `store/demoUsers.ts:97` | code read |
| **G-05** ✅ **RESOLVED** | **No Prisma migrations exist.** `prisma/migrations/` is absent; 38 models are reproducible only via `db push`. There is no reviewable, replayable schema history for production. | `backend/prisma/` | `ls prisma/` → `schema.prisma`, `seed/` only |
| **G-06** ✅ **RESOLVED (T-12)** — root `jest.config.js` added (the repo had none); `npm test` now runs 57 tests across 6 suites, and a new `ci.yml` runs build+tests on push/PR. Understated at the time: there was **no test gate anywhere**, and `nest build` first ran on the production server. | **Backend test suite is not discoverable by the default runner.** `npm test` (`jest`) reports *"No tests found — 496 files checked, 0 matches"*. The 5 spec files live in `test/` and only run under `jest-e2e.json`. CI or a developer running `npm test` gets a false green/red signal. | `backend/package.json`, `test/*.e2e-spec.ts` | `qa/final-delivery-audit/logs/backend-jest-default.log` |

### TECHNICAL DEBT

| ID | Finding | Where |
|---|---|---|
| G-07 | `: any` appears 67× in backend (mostly mapper/query shims) and 16× in dashboard. Weakens the type guarantees the stack otherwise provides. | both |
| G-08 | Dashboard reads fall back to bundled seed arrays when the API errors (`useAdminRows(fetch…, seed…)`). Good for demos, but an admin can be looking at **mock rows believing they are live** with no visible warning. Needs an explicit "offline / showing sample data" banner. | `dashboard/src/store/useAdminRows.ts` |
| G-09 | 2 × `console.log` in backend source. | backend |
| G-10 | 9 × `localhost`/`127.0.0.1` in backend — verify none are runtime defaults that could leak into production config. | backend |

### DEMO ONLY (intended, correctly labelled)

| ID | Finding | Where |
|---|---|---|
| G-11 | «نسخة عرض» demo watermarks on donation/receipt/consultation surfaces. Correct and deliberate for the presentation build. | mobile (10 hits) |
| G-12 | CMS editor state persists to `localStorage` **and** syncs to `PUT /admin/cms` — the local copy is a cache/offline buffer, not a substitute. Verified: `cmsPersistence.ts` imports `fetchCms` / `request` from `@ahla/shared`. | dashboard (24 localStorage hits) |
| G-13 | Mobile `providerStore.ts` (consultant portal state) is local-only; backend `/me/provider` (4 routes) is not consumed. | mobile |

### STALE COMMENTS (misleading, cheap to fix)

| ID | Finding |
|---|---|
| G-14 | Several `TODO(backend): …` comments describe endpoints that **now exist** (e.g. `Inbox.tsx` "TODO: GET /admin/volunteers" — that route exists and the page already reads it; `Donations.tsx` "TODO: PATCH /admin/donations/:id/status" — the function exists, it is simply never called). These comments will mislead the next engineer about what is actually missing. |

### DEAD CODE

| ID | Finding |
|---|---|
| G-15 | `dashboard/src/shared/api/` (8 files: `http.ts`, `endpoints.ts`, `mappers.ts`, …) is a **vendored copy that nothing imports** — the app uses the identical client from the `@ahla/shared` package instead. Two copies of the API client will drift. |

## Direct-data-import check (the important one)

| Surface | Reads from API? | Writes to API? |
|---|---|---|
| Mobile content (cases/projects/articles/consultants) | ✅ yes — `mobile/src/store/content.ts` uses `fetchCases`/`fetchProjects`/… with bundled arrays as *offline fallback only* | n/a (read-only surface) |
| Mobile CMS (menu/home/pages/forms) | ✅ yes — `store/cms.ts` → `fetchCmsTagged()`, reports `source=api|bundled` | n/a |
| Mobile auth, bookings, donations, favorites, notifications | ❌ no | ❌ no — all local stores |
| Dashboard lists (bookings, donations, users, volunteers, messages, services, providers, roles, activity, cases, projects, articles, consultations) | ✅ yes — `adminApi.ts` + `useAdminRows` | ❌ **no** (G-01/G-02/G-03) |
| Dashboard CMS (home/menu/pages/media/forms/tools) | ✅ yes | ✅ **yes** — `PUT /admin/cms` |
| Dashboard admin login | ✅ `POST /admin/auth/login` | ✅ |
