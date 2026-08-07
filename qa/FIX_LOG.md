# Fix Log — post-baseline remediation

Every entry: Before → Root cause → Files → Fix → Retest → Result.
Baseline that these are measured against: `00_CURRENT_STATE.md`.

---

## T-01 — Prisma baseline migration ✅ DONE

**Before.** `prisma/migrations/` did not exist. 38 models existed only in `schema.prisma`;
CI deployed with `npx prisma db push --skip-generate`. No reviewable history, no replayable
schema, and `db push` can silently drop or rewrite columns to force a match.

**Root cause.** The schema was authored with `db push` from the start and never baselined.

**Files changed** (`ahlashabab_backend_app`, commit `a1cd48a`)
- `prisma/migrations/0_init/migration.sql` *(new, 741 lines)*
- `prisma/migrations/README.md` *(new — baselining runbook; force-added because `.gitignore` line 8 is a blanket `*.md`)*

**Fix.** Generated the baseline offline with
`prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`.

**Retest** — executed against a **throwaway PostgreSQL 15 cluster** created in `/tmp` on port
55432 and destroyed afterwards (no change to the machine's services):

| Check | Result |
|---|---|
| `prisma migrate deploy` on an empty DB | ✅ "All migrations have been successfully applied." |
| `prisma migrate status` | ✅ "Database schema is up to date!" |
| Tables created | ✅ **39** (38 models + `_prisma_migrations`) |
| Foreign keys | ✅ 28 |
| Indexes | ✅ 75 |
| Drift (`migrate diff --from-url <db> --to-schema-datamodel`) | ✅ **"This is an empty migration."** — zero drift |

Evidence: `qa/final-delivery-audit/database/T-01-migration-verification.md`

**Result.** ✅ **RESOLVED.** The schema is now reproducible from empty and provably identical
to `schema.prisma`.

**Deliberately NOT done (and why).** CI still runs `db push`. Switching it to `migrate deploy`
would **break the next deploy**: production already has the tables but no `_prisma_migrations`
row, so `migrate deploy` would try to re-create them and fail. It requires a one-time
`npx prisma migrate resolve --applied 0_init` against the production database, which this
environment has no access to. The runbook documents the exact sequence. → follow-up task.

---

## T-03 — Dashboard row actions persist to the API ✅ DONE

**Before.** `adminApi.ts` exported status mutations, but **grep proved no page imported any of
them**. Approving a donation, confirming a booking, changing a volunteer's status or blocking a
user mutated React state only — the change looked successful and was lost on refresh. The
`error`/`loading` flags that `useAdminRows` already returned were destructured and **never
rendered**, so a failed load silently showed bundled sample rows as if they were live.

**Root cause.** The read layer was migrated to the API; the write layer was never connected.
Pages kept their original local `setRows(...)` handlers.

**Files changed** (`ahla-shabab-dashboard`, commit `a797361`)
- `src/store/useRowAction.ts` *(new)* — optimistic update + rollback + error
- `src/store/adminApi.ts` — added `updateMessageStatus` (`PATCH /admin/messages/:id`)
- `src/store/adminMappers.ts` — `mapAdminBooking` now keeps `id`
- `src/shared/admin.ts` — `AdminBooking.id` + ids on the 12 seed rows
- `src/components/ui.tsx` — new `Banner`
- `src/pages/{Bookings,Donations,Inbox,Users}.tsx` — wired + banners

**Fix.** Each action now applies optimistically, calls the endpoint, and **rolls back with a
visible Arabic error if the server refuses** — important here because the backend validates
booking transitions with a state machine and rejects illegal moves.

**Retest**

| Check | Before | After |
|---|---|---|
| Pages calling `updateBookingStatus` | 0 | `Bookings.tsx` |
| Pages calling `updateDonationStatus` | 0 | `Donations.tsx` |
| Pages calling `updateVolunteerStatus` | 0 | `Inbox.tsx` |
| Pages calling `updateMessageStatus` | n/a (didn't exist) | `Inbox.tsx` |
| Pages calling `toggleUserBlock` | 0 | `Users.tsx` |
| Calls routed through `run()` w/ rollback | — | 5/5 |
| `npm run build` (tsc --noEmit && vite build) | pass | ✅ pass (414 kB / 118 kB gz) |

**Result.** ✅ **RESOLVED** at the client layer. Status changes are now sent to the server and
reverted on failure.

**Remaining for full PASS (honest).** Not yet executed against a live authenticated session —
no admin bearer token is available in this environment (**BLOCKED**, see T-06). The wiring and
the failure path are verified by build + static proof; end-to-end persistence must still be
confirmed once a token exists. Content/services CRUD (**G-02**) and the notifications broadcast
(**G-03**) remain unwired — those are T-02 and T-13.

---

## T-02 — Content & services CRUD persists ✅ DONE

**Before.** `Content.tsx` (cases/projects/articles) and `Services.tsx`
(categories/services) read live rows from the API, but every `save()` and delete
mutated React state only. A newly created case got a locally invented id
(`c-${Date.now()}`) and disappeared on refresh. The backend had the full CRUD
surface all along — 19 `/admin/portfolio/*` routes plus services/categories.

**Root cause.** Same as G-01: the read layer was migrated, the write layer never was.

**Files changed** (`ahla-shabab-dashboard`, commit `f87bd35`)
- `src/store/adminApi.ts` — `post`/`del` helpers + 14 CRUD functions
- `src/store/adminMappers.ts` — `caseToWire` / `projectToWire` / `articleToWire`
- `src/store/useRowAction.ts` — `submit()` returning the server row
- `src/pages/Content.tsx`, `src/pages/Services.tsx`

**Fix.** Each editor now calls the endpoint and only touches local state on
success, **adopting the id the server returned**. Failures keep the modal open
with the reason on screen. Two deliberate decisions:
- `raisedAmount` is **not** sent — it is derived from approved donations
  server-side, so the dashboard cannot inflate a fundraising total.
- Optional fields are omitted rather than sent as `''`, because the Zod DTOs
  reject an empty string where they expect a URL.

**Retest**

| Check | Before | After |
|---|---|---|
| CRUD functions called from a page | 0 / 14 | **14 / 14** |
| Locally-invented ids (`x-${Date.now()}`) | 5 | **0** |
| `npm run build` | pass | ✅ pass |

**Result.** ✅ **RESOLVED** at the client layer. Still **BLOCKED** for end-to-end
proof: no admin bearer token exists in this environment (T-06). Creating a
service/category also requires real UUIDs, so those writes will correctly fail
with a visible error while the tables are showing bundled seed rows.

---

## T-04 — Real mobile email-OTP login ✅ DONE (client), delivery BLOCKED

**Before.** `OtpScreen.verify()` accepted **any** 6-digit code and called
`loginDemoUserByEmail(email)` locally. No JWT was ever obtained, so every
`/me/*` feature was unreachable and seven account screens showed convincing
local demo data (finding N-02).

**Root cause.** The auth UI was built for the demo before the backend existed
and was never reconnected once `/auth/otp/*` shipped.

**Files changed** (`Ahla-Shabab-Foundation`, commit `60e3417`)
- `shared/src/api/endpoints.ts` — `requestOtp`, `verifyOtp`, `refreshSession`,
  `logoutSession`, `fetchMe` *(no fallback: an auth call must never "succeed" offline)*
- `mobile/src/store/session.ts` *(new)* — token pair in the OS keystore via
  `expo-secure-store`, with a sync in-memory mirror
- `mobile/App.tsx` — `getToken` wired into `configureApi`; `restoreSession()` at boot
- `mobile/src/screens/EmailAuthScreen.tsx`, `OtpScreen.tsx`
- `mobile/src/components/AppDrawer.tsx` — logout revokes server-side

**Design decisions.** Tokens go to the **keystore, not AsyncStorage** — they are
bearer credentials. `restoreSession()` *rotates* the stored pair at boot so the
first real request cannot 401, and self-clears if the token was revoked. Logout
revokes server-side but still clears locally if that call fails — the user asked
to sign out.

**Retest — executed against the LIVE API**

| Test | Result |
|---|---|
| Wrong code `000000` | `400` «رمز التحقق غير صالح أو منتهي الصلاحية» — **no session issued** |
| `GET /me` with no token | `401` |
| `POST /auth/refresh` with bogus token | `401` «رمز التحديث غير صالح» |
| `POST /auth/otp/request` invalid email | `400` + field error |
| `POST /auth/otp/request` valid address | `200` «تم إرسال رمز التحقق» |
| Mobile typecheck | ✅ clean |

Evidence: `qa/final-delivery-audit/api/T-04-auth-live-tests.md`

**Result.** ✅ **RESOLVED** — a wrong code can no longer produce a session, which
was the whole defect.

**Still BLOCKED (T-06).** Completing a *successful* verify needs a readable
inbox, so the issued-token happy path, refresh rotation against a genuine token,
and the "three casings resolve to one account" assertion remain unproven. The
account screens also still read local stores — that is T-05, not this task.

---

## T-05 — Account screens read `/me/*` ✅ DONE (client), live proof BLOCKED

**Before.** Bookings, donations, receipts, favorites, notifications and
preferences all rendered bundled or local rows — `const mine = donations`,
`appointments.slice(0, 5)`, "Mock favorites". A reviewer clicking through saw
convincing records that belonged to no one (finding N-02).

**Root cause.** Same shape as G-01/G-02: these screens predate the API and were
never reconnected once `/me/*` shipped.

**Files changed** (`Ahla-Shabab-Foundation`, commit `c85f9ed`)
- `shared/src/api/endpoints.ts` — the `/me` surface (12 functions)
- `mobile/src/hooks/useMyData.ts` *(new)* — loading / error / empty / guest + retry
- `mobile/src/components/AccountState.tsx` *(new)* — one consistent rendering of those states
- The six account screens, plus an `App.tsx` session/appState sync fix

**Notable decisions.**
- **No fallback for account data.** Every other read in the app degrades to
  bundled content; these deliberately do not. An empty list with a reason is
  honest; someone else's sample bookings are not.
- **Receipts derive from donations** — there is no `/me/receipts` endpoint; a
  receipt *is* a donation.
- **Favorites resolve locally.** The server returns `{entityType, entityId}`
  pairs, matched against the already-loaded content stores — no N+1 round-trip.
- **Preferences toggle optimistically and revert on failure**, because a
  preference that silently failed to save is worse than one that visibly did not.
- **Bug found and fixed while wiring:** `restoreSession()` (added in T-04)
  restored the token but never told `appState`, so a returning user would hold a
  valid session while every `LoginGate` still treated them as a guest.

**Retest**

| Check | Before | After |
|---|---|---|
| Screens calling their `/me` endpoint | 0 / 6 | **6 / 6** |
| Bundled arrays used as "my" data | 3 | **0** |
| Mobile typecheck | pass | ✅ pass |
| `expo export` bundle | pass | ✅ pass |

**Result.** ✅ **RESOLVED** at the client layer.

**Still BLOCKED (T-06).** No bearer token exists here, so the authenticated happy
path — real rows rendering, cross-account isolation (User A must not see User B's
bookings/receipts) — remains unproven. The wiring, the guest path and the failure
path are verified.

---

## T-13 — Admin notification broadcast wired ✅ DONE (client), send BLOCKED

**Before.** `pages/Notifications.tsx` was pure `useState`. It offered 5 notification "kinds"
and 4 audiences; the API has no `kind` field and only 3 segments, and two of the four
audiences (`أصحاب الحجوزات`, `المتطوعون`) did not exist server-side. The history table was
seeded from bundled demo rows, so it showed a populated broadcast log for messages that were
never sent, and the button showed «تم الإرسال ✓» unconditionally. This was the last unwired
dashboard write (G-03).

**Root cause.** The page was built during the demo phase against an imagined contract and
never reconciled with `POST /admin/notifications/broadcast` once the backend existed.

**Files.**
- `src/store/adminApi.ts` — added `broadcastNotification()` (through `authed()`, like every
  other write) and `fetchGovernorates()`; the broadcast takes a numeric governorate id, so
  the names must come from the API rather than the bundled name list.
- `src/pages/Notifications.tsx` — rewritten against the real DTO: 3 segments, conditional
  governorate picker, `maxLength` matching `max(200)`/`max(2000)`, in-flight state, error
  `Banner`, and the server's real `{sent, total}` reported back to the operator.

**Fix decisions worth recording.**
- The `kind` selector was **removed rather than kept as decoration**. A control the API
  silently ignores is worse than an absent one.
- The seeded history was **deleted, not relabelled**. There is no GET route for past
  broadcasts, so the table now holds only sends made since the page was opened and says so:
  «الخادم لا يوفّر سجلًّا للبثوث السابقة».
- On failure the operator is told **nothing was sent**, instead of the old silent success.

**Retest.** `qa/final-delivery-audit/api/T-13-broadcast-verification.md` — 8 checks executed,
1 deliberately not executed. `tsc --noEmit` clean; `npm run build` clean; `GET /governorates`
live 200; unauthenticated broadcast → **401**; the shipped bundle contains
`admin/notifications/broadcast`; the two fabricated audiences appear **0** times in `dist/`.

**Result.** Row 43 **FAIL → PARTIAL**. Not PASS: the authenticated send was **not executed**,
because `segment:'all'` fans out to every real user and production is the only environment
available — that is a destructive test on production, which is out of bounds. Delivery,
FCM fan-out and preference filtering stay unverified until T-06 provides staging.

---

## T-11 — Payment webhook fails closed by default ✅ DONE

**The finding was wrong; the fix is real.** T-11 claimed the signature check was "skipped with a
warning" when `WEBHOOK_SECRET` is unset, citing `donations-webhook.controller.ts:87`. Line 87 is the
warning — a production branch throwing `ServiceUnavailableException` already sat three lines above it,
added in `d420546`, *before* the audit baseline. A live probe also disproved the companion claim that
production had no secret: an unsigned `POST /webhooks/payment` returns **401 Missing webhook
signature**, which only the `secret` branch can produce. Two code comments asserting the opposite were
corrected in place.

**Before (the genuine defects, found while checking the claim).**
1. The bypass keyed on `NODE_ENV !== 'production'`, and `envSchema` declares
   `NODE_ENV: …default('development')`. A deployment that forgets `NODE_ENV` — routine under Docker,
   PM2, systemd — silently resolves to `'development'`, leaving a route that can **mark donations
   paid** completely unauthenticated with only a log line. The security posture defaulted to open.
2. Production could **boot** with no secret. The 503 was correct but late: the operator learns of the
   misconfiguration only once real gateway callbacks are already failing.

**Files.**
- `src/config/app.config.ts` — `superRefine` requires `WEBHOOK_SECRET` (≥16 chars) in production, so
  `validateEnv` throws and the app does not start; added `ALLOW_UNSIGNED_WEBHOOKS` (default `false`).
- `src/donations/donations-webhook.controller.ts` — inverted to fail closed: a missing secret is a 503
  **unless** `ALLOW_UNSIGNED_WEBHOOKS=true` is explicitly set, and production ignores that flag.
- `.env.example` — both variables documented with their consequences.

**Retest.** `webhook-security.e2e-spec.ts` 15/15; full e2e suite **46/46 across 5 suites**;
`nest build` clean; the **compiled** `dist/config/app.config` refuses a production boot with an empty
secret. **Mutation-checked**: re-running the new tests against the old fail-open logic fails exactly
the two cases that matter (`NODE_ENV` unset, and `development`), so the tests are not vacuous.

**Regression found and fixed in passing.** The full suite surfaced a failure that pre-dated this task
and was **caused by my own earlier donation-methods change**: `body-validation.e2e-spec.ts` posted
`method: 'إنستاباي'`, which `CreateDonationSchema` no longer accepts, so a "valid body" case had been
silently asserting a 400. It went unnoticed because bare `npm test` discovers 0 tests (T-12) and the
e2e config was not re-run after that change. Fixture updated to `تحويل بنكي`. **T-12 is now clearly
higher priority than its P1 ranking suggests** — it is what let this sit unnoticed.

**⚠️ Deployment risk introduced.** Production will now refuse to start unless `WEBHOOK_SECRET` is at
least 16 characters. The live secret is known to exist but its length **cannot be checked from
outside**. Verify it before the next deploy.

**Result.** No requirement row changes status: row 48 (payments) stays **BLOCKED**, because this
proves the endpoint's *authentication*, not the *effect* of a confirmed payment (T-10, needs a sandbox).

---

## T-11 follow-up — the deployment risk resolved itself, and was verified

The T-11 entry warned that production would refuse to boot if `WEBHOOK_SECRET` were shorter than
16 characters, and that its length could not be checked from outside. Pushing that commit answered
the question: `deploy.yml` fires on push to `main`, so run `31202890048` deployed it and restarted
the API.

Verified after the fact: `/foundation`, `/governorates`, `/cases` all return **200**, and the live
Swagger at `/api/docs-json` carries the **new** description
(*"Fails closed whenever WEBHOOK_SECRET is not set, unless ALLOW_UNSIGNED_WEBHOOKS=true…"*),
which proves the new build is the one running. A booted app means `validateEnv` passed, so
**production's `WEBHOOK_SECRET` exists and is ≥16 characters.** The warning is closed, empirically.

Worth stating anyway: this was luck, not process. The push went straight to production with no
gate in front of it — which is precisely what T-12 addresses.

---

## T-12 — Backend tests actually run, and now run in CI ⬆ MOSTLY DONE

**Before.** `npm test` reported *"499 files checked … 0 matches"*. The stated cause (specs live in
`test/` and only run under `jest-e2e.json`) understated it: **the repo had no Jest configuration at
all** — no `jest` key, no `jest.config.*`. Bare `jest` fell back to its default `?(*.)+(spec|test).ts`
pattern, which cannot match `*.e2e-spec.ts` because the character before `spec` is `-`, not `.`.

**The bigger finding.** There was **no automated test gate anywhere**. `deploy.yml` is the only
workflow; it fires on push to `main` and runs `git pull → npm install → nest build → prisma db push
→ prisma db seed → pm2 restart` **over SSH on the production server**. Tests ran nowhere, and the
typecheck's first execution was on the production box. That is the mechanism that let the stale
donation fixture survive until T-11 tripped over it.

**Files.**
- `jest.config.js` (new) — discovers `src/**/*.spec.ts` **and** `test/**/*.e2e-spec.ts`; coverage
  collection; thresholds set at today's measured numbers as a ratchet.
- `package.json` — `test`, `test:unit`, `test:cov`, `test:ci`, `test:e2e`.
- `.github/workflows/ci.yml` (new) — install → prisma generate → build → test, on push **and PR**.
- `src/common/guards/roles.guard.spec.ts` (new) — 11 cases on the authorization guard.

**Retest.** `npx jest --listTests` finds 5 suites (was 0); `npm test` **57 passed / 6 suites**;
`test:unit` 11; `test:e2e` 46; `test:ci` exit 0; build exit 0. The gate was checked for teeth, not
assumed: raising the threshold 1pt fails with *"not met: 16.34%"* (**exit 1**), and a suite matching
nothing **exits 1** rather than passing quietly.

**Coverage, stated plainly.** 16.31% → **16.34%** statements; functions unchanged at 8.73%. The
percentage barely moved because the guard is ~40 lines against 2,808 statements. **The "raise
coverage" half of T-12 is only partially met** and about 1.5d remains; the core (booking engine,
donations/receipts, `/me/*` ownership, OTP) is still untested and needs a test database or T-06.
The 11 new cases were chosen for risk rather than percentage: `RolesGuard` had no tests at all,
against the audit's own rule *"never mark security completed without authorization tests."* They pin,
among others, that a permission must be literally `true` and not merely truthy, and that there is
**no implicit superadmin bypass**.

**Deliberately not done.** `ci.yml` does not gate the deploy. Adding `needs: [test]` to `deploy.yml`
is one line, but it would block production releases on a red suite — a release-policy decision for
the maintainers, not a side effect of adding CI. Recommended, not imposed.

---

## T-07 — Consultation types speak the app's contract ✅ DONE, VERIFIED LIVE

**Before.** The backend seeded `psychological, legal, family, social, educational`; the app routes
consultations by five **Arabic** keys (`نفسية، دينية، طبية، أسرية، أعمال`), which are route
parameters rather than labels. Only two of the five corresponded at all.

**The defect the finding missed.** The consent box was typed `checkbox`. In the app, `checkbox`
shares a branch with `multiselect` and renders one tappable chip **per option** — and the consent
field has **no options**. An API-driven form would therefore have shown a **required agreement with
nothing to tick**, with validation blocking submission and no control able to satisfy it. The
consultation form would have been unsubmittable.

**Why nothing visibly broke.** `cmsMapper.isFullFidelity()` rejects an API type missing a
disclaimer, a `consent`-typed field, or options on a choice field, and falls back to the bundled
form. Users saw a working screen throughout. The cost was silent: **no consultation form edited in
the dashboard could ever reach the app** — the CMS form builder was writing to nothing.

**Files.** `src/cms/default-consultation-types.ts` (new, canonical, **generated from the shared
`defaultConsultations` rather than transcribed** so the two cannot drift); `prisma/seed/cms-state.ts`
imports it and stops hardcoding `schemaVersion: 10`; `src/cms/cms-migration.service.ts` gains
**migration 10 → 11**; `CMS_SCHEMA_VERSION` → 11; Swagger example `psychological` → `نفسية`;
`cmsMapper.ts` comment corrected in both copies.

Migration 8 → 9 — which wrote the bad rows — is deliberately untouched: an applied migration is
history and editing it cannot repair what it already produced, which is why step 11 exists. Step 11
replaces types only when they are not already canonical, so a deliberate dashboard edit survives.

**Retest.** Backend **63 passed / 6 suites** (was 57); shared **43 passed / 3 files** (was 35);
`nest build` and the dashboard build clean. The decisive case: with the new seed the mapper **takes
the form from the API** — a server-side label edit survives into the rendered form — while the old
shape is still rejected into fallback, so the safety net stays.

**Acceptance MET.** Committed, pushed, deployed (run `31205490644`), then `verify-api-layer.ts`
re-run against live: **45/47 → 47/47, zero known defects** — the known-backend-defects block is gone.
The live API now serves the five Arabic keys with `consent`-typed required fields, disclaimers and
options on every choice field. CI on the same commit: 63 tests / 6 suites. **Row 24 → PASS**, moving
the project to **67%**. Because every API type is now full-fidelity, the mapper takes the form from
the API instead of the bundled fallback — so a dashboard edit to a consultation form finally reaches
the app, which was the silent breakage all along.

**⚠️ Separate finding — recorded as T-17.** `seedCmsState` upserts with a populated `update:` branch,
and `deploy.yml` runs `prisma db seed` on **every** push to `main`. **Every deploy therefore
overwrites the whole CMS document** — settings, menu, home, pages, payment methods, consultation
types — with the bundled defaults, destroying anything an administrator authored in the dashboard.
Not caused by T-07 and out of its scope, but it undermines the CMS work delivered in T-02. Left as a
decision rather than a silent change, because it alters how the team ships content updates.

---

## T-17 — Deploys stop overwriting admin-authored data ✅ DONE, proven on a real database

**Before.** `deploy.yml` runs `npx prisma db seed` on **every** push to `main`, and Prisma's
`upsert` applies its `update:` branch when the row already exists. **Seven** seeds carried a
populated one, so every deploy silently reset live data. This was wider than the CMS finding that
opened T-17:

- **`roles.ts` → `permissionsJson`** — a role an administrator had *tightened* was widened back to
  the bundled defaults. That is a **security regression**, not merely lost content.
- **`cms-state.ts`** — the entire CMS document: settings, menu, home, pages, payment methods,
  consultation types.
- `categories.ts` (×2), `services.ts`, `providers.ts` (×2, including **rating** and **reviews**,
  which are derived values the seed has no business asserting), `faqs.ts`, `foundation.ts`.

Left authoritative on purpose: `governorates.ts` ordering (reference data no admin edits) and the
seeds already using `update: {}`.

**Files.** `prisma/seed/seed-mode.ts` *(new)* — `preserve()` empties the `update:` branch unless
`SEED_OVERWRITE_CONTENT=true`; `logSeedMode()` announces the mode. Applied across the seven seeds;
`prisma/seed/index.ts` prints the banner; `.env.example` documents the flag.

**Design note.** The escape hatch stays because the team does sometimes want to push bundled content
over live rows — but it is now opt-in and loud rather than the silent default. Structural changes
still reach production through the CMS migrations (backfill-on-read), which is what they are for;
T-07's migration 10 → 11 is the worked example. **Seeds initialise, migrations repair.**

**Retest — on a throwaway PostgreSQL 15 cluster** (port 55433, own data directory, destroyed
afterwards; the machine's own services untouched):

| Check | Result |
|---|---|
| Fresh database still fully seeded | 27 governorates · 4 roles **with permissions** · 15 categories · 6 services · 4 cases · 3 projects · 4 articles · 8 FAQs · CMS v11 with the 5 canonical consultation types |
| Four admin edits survive a re-seed (CMS `appName`, role permissions, an FAQ, the consultation list) | **all 4 preserved** ✅ |
| Same re-seed with `SEED_OVERWRITE_CONTENT=true` — i.e. the OLD behaviour | **all 4 destroyed** — the mutation check; the data loss was real and reproducible |
| `test/seed-mode.e2e-spec.ts` (4 cases) | PASS |
| Full backend suite | **67 passed / 7 suites** (was 63 / 6) |
| Seeds still carrying an unguarded populated `update:` | **0** |

**Result.** Acceptance *"a CMS edit made in the dashboard survives a deploy"* is **MET**, and
demonstrated for role permissions, FAQs and consultation types too — not only the CMS document.

**Note for the next deploy.** Deploys will no longer refresh bundled content on rows that already
exist. To push updated defaults deliberately, run one deploy with `SEED_OVERWRITE_CONTENT=true`
(accepting that it resets admin edits), or make the change in the dashboard — now the durable path.

---

## T-16 — Dashboard reads stop falling back to demo rows ✅ DONE, verified in a browser

**Before.** `useAdminRows(fetcher, seed)` kept a bundled demo array on screen when the request
failed. The read-only variant was worse — `useAdminData` returned only `rows`, **discarding
`error`** — and Overview, Reports and Roles used it. A failed load therefore left them computing
totals from fabricated rows and presenting them as live figures. An operator could have made
decisions on numbers that were never real. 20 call sites across 9 pages passed a seed.

**Removing the fallback exposed three worse fabrications** — ones that lied even on a *successful*
load, which is a stronger failure than the fallback ever was:

- a hardcoded weekly bookings chart, `value: [4, 7, 5, 9, 6, 8][i]`, showing the same invented week
  no matter what the server returned;
- invented trend arrows, `delta={{ text: '12%', up: true }}` and `'8%'`, never computed from anything;
- «مقدمو الخدمة» read from the bundled `providers` seed, reporting **10** on an empty database;
- and in the sidebar, `donorProfile.name` — "أحمد محمد" — displayed as the **signed-in admin**,
  with a hardcoded «مدير عام», for whoever was actually logged in.

**Files.** `store/useAdminRows.ts` (seed parameter **removed**, not ignored, so no page can pass one;
`useAdminData` now returns state so `error` cannot be dropped; added `reload()`); all 9 pages;
`components/Layout.tsx` (real admin from `auth.getAdmin()`); failure copy reworded from
«تُعرض بيانات تجريبية» to «لم تُعرض أي بيانات», tone warning → error; 10 dead seed imports pruned.

**Retest.** `tsc` and build clean. **0 of 20** call sites still pass a seed. Bundle **419.27 →
405.95 kB** (gzip 120.25 → 116.02) — demo rows leaving the build. Every fabricated row marker
(`d-1`, `a-1`, `AS-482910`, `أحمد محمد`, `منى إبراهيم`, `كفالة أسرة محتاجة`, `أكّد حجزاً`) returns
**0 hits** in `dist`.

Verified **in a browser**, not by inspection: with an invalid token so every admin read fails,
Bookings shows the error banner with all counts `0` and «لا توجد حجوزات مطابقة»; Overview shows its
banner with مقدمو الخدمة **10 → 0**, the weekly chart **4·7·5·9·6·8 → 0 across all seven days**, and
the ▲12%/▲8% arrows gone. The test session was cleared from `localStorage` afterwards.

**Result.** Acceptance met. Row 13 keeps its **PASS** and now has evidence behind the T column
rather than a caveat, so the tally is unchanged at 67% — this hardened existing work rather than
adding surface.

**Honest remainder → T-18 (P2).** Filter dropdowns (providers, categories, governorates) are still
populated from bundled reference lists, so a filter can offer an option that does not exist
server-side. They are options rather than rows presented as live records, so they fall outside this
acceptance — but they are the last bundled data visible in an admin view.

---

## T-18 — Reference data (and one whole page) off bundled seeds ✅ DONE, verified in a browser

**Filed as** "filter dropdowns are populated from bundled lists". Two larger problems sat behind it,
both of the family T-16 addressed.

**1. Report figures computed from demo data.** `Reports.tsx` rendered a section headed
**«نسب تمويل الحالات والمشروعات المنشورة»** — *funding progress of published cases and projects* —
from the **bundled `cases` and `projects` arrays**, presenting invented `raisedAmount / targetAmount`
pairs as live fundraising totals. On a charity dashboard that is the most damaging figure it is
possible to fake. «إجمالي مقدمي الخدمة» and «متوسط الحجوزات لكل مقدم» likewise counted the seed.

**2. `Providers.tsx` never called the API at all.** Rows came from
`useState(seed.map(...))`, and create/edit/toggle produced `pr-${Date.now()}` ids that vanished on
refresh — the same G-01/G-02 defect T-02 and T-03 fixed elsewhere. **The audit missed this page
entirely**; `/admin/providers` has had full CRUD throughout.

**3. A bundled id was written to the server.** `blankService()` defaulted `providerId` to
`providers[0].id` from the seed, so creating a service posted a provider id that need not exist.

**Files.** `store/useReference.ts` *(new)* — `useGovernorateNames()` from the public
`GET /governorates`, empty rather than bundled on failure; `Bookings`, `Users`, `Content` (the
governorate **form** select, which *writes*), `Reports` (live cases/projects/providers, plus a
divide-by-zero guard), `Providers` (API rows, persisted create/update/toggle with rollback),
`Services` (`blankService(categoryId, providerId)`), `Donations` (payment KPI from the CMS
document), `store/adminApi.ts` (typed `AdminProviderRow`, provider CRUD). `rating`/`reviews` are
deliberately never sent — they are derived server-side.

**Retest.** `tsc` and build clean. Provider seed markers return **0 hits** in `dist`; pages now
import only formatters, types and constants from the shared package. Bundle **419.27 → 399.66 kB**
across T-16 and T-18.

Verified **in a browser** with reads failing: all three Bookings filters collapse to their "all"
option — `[{كل الفئات,1},{كل المقدمين,1},{كل المحافظات,1}]`, previously 5 / 11 / 28 bundled entries
— and Providers reads **مقدمو الخدمة (0)** with an explicit error, where it previously showed four
fabricated providers. For the success path, CORS blocks `localhost:5173` against production (an
environment limit, not a defect — and the error log itself proves the app now *requests*
`/api/v1/governorates`); through a temporary Vite proxy the endpoint returned
`{"count":27,"first":"أسوان","shapeKeys":["id","name"]}`, exactly what the hook maps. The proxy and
`.env.local` were reverted, leaving only the intended source files changed.

**Result.** Acceptance met and exceeded. No requirement row changes status — this hardened rows 13,
36 and 42 rather than adding surface, so the tally holds at 67%.

**Not done → T-19 (P2).** Provider **scheduling** (days, slots, unavailable dates) is still local:
the server models it as `{weekday, startTime, endTime, slotMinutes}` while the editor uses day
indexes and Arabic slot labels, so it needs a real translation layer rather than a half-wire. The
editor now **discloses** it: «مواعيد العمل والأيام لا تُحفظ على الخادم بعد».

---

## T-19 — Provider scheduling persists ✅ DONE (round-trip proof BLOCKED on T-06)

**Before.** The editor collected **day indexes plus Arabic slot labels** (`'10:00 ص'`) against a
server that keeps **one range per weekday** — `@@unique([providerId, weekday])` — and steps
`startTime → endTime` by `slotMinutes` into the `"HH:mm"` times the booking engine keys on. The two
models are not translatable in that direction: with one row per weekday, picking 9 ص and 6 م would
have had to collapse into `09:00 → 18:00`, **silently opening every hour between** as bookable slots
the admin never chose. That is why T-18 disclosed the gap rather than half-wiring it.

**Fix.** The editor now speaks the server's model: per weekday, enable/disable plus a start, an end
and a slot length, with a live «N موعد» count computed the way the server computes it. Blocked dates
are managed through the detail route (the only one returning `unavailableDates`) with add/remove
diffs. `store/adminApi.ts` gained `ProviderSchedule`, `schedules` on `AdminProviderRow`,
`fetchAdminProvider`, `updateProviderSchedule`, `addUnavailableDate`, `removeUnavailableDate`. The
page's row type no longer extends the shared `Provider`, which carries slot labels and a gradient the
admin API has no concept of.

Save order is deliberate — identity first (a new provider has no id until `create` returns), then
the schedule, then blocked-date diffs. On failure the error surfaces and the modal stays open; the
identity save is **not** rolled back, because a partial save the admin can retry beats discarding the
name they just typed.

**Backend gap found and closed in passing.** `UpdateScheduleSchema` validated every field but
**never the pair**, so `17:00 → 09:00` stored happily and produced zero bookable slots — a provider
that looks scheduled and can never be booked. Now refused server-side too, so any client is covered
rather than just this dashboard.

**Retest.** New `provider-schedule-contract.e2e-spec.ts` — **9 cases** pinning the contract from the
client's side: the editor's payload validates against the real DTO; the old 12-hour label is
**rejected**, proving the previous shape was genuinely unsendable; an empty `<input type="time">`
is rejected; and the UI's slot count equals `generateTimeSlots(...).length` across remainder,
zero-span and inverted ranges. Full backend suite **76 passed / 8 suites** (was 67 / 7); both builds
clean.

Live in the browser: the modal shows 7 weekday toggles and a blocked-date picker, **no Arabic slot
chips**, and the T-18 disclosure is gone because it now saves. Enabling الإثنين gives
`09:00–17:00` at 60 minutes → **«8 موعد»**, matching `generateTimeSlots`. Setting the end before the
start drops it to **«0 موعد»** and **blocks the save** with «المدة لا تكفي لموعد واحد» — the invalid
schedule never reaches the server.

**Result.** Half the acceptance is proven, half is **BLOCKED, not skipped**: the round trip — save as
a signed-in admin, then read `GET /providers/:id/availability` — needs an admin token (T-06). It is a
five-minute check once staging exists, not more work. No requirement row changes status.

---

## T-12 round 2 — coverage on the code that decides who you are ✅ DONE

**Before.** The first half of T-12 fixed discovery and added a CI gate but left coverage at
**16.34%**, with the "raise coverage" clause explicitly open at ~1.5d.

**Chosen by risk, not by size.** The largest untested files are `reports.service` (205 statements),
`cms.service` (128) and `portfolio.service` (87). None was chosen. The tests went to
`auth.service` — which decides who is signed in and had **no tests at all** — and to
`users.service`, whose `userId` filter is the only thing standing between each user and everyone
else's data.

**What is pinned.** Wrong OTP → no tokens, attempt counted, **code not consumed** (consuming on a
typo locks out a real user; not counting makes brute force free — it must do exactly one). Expired
code → rejected *and burned*. Five attempts → locked out **even when the code is finally right**.
Success consumes the code, so it cannot be replayed. Refresh rotation is single-use, a revoked token
stays dead, and **a disabled admin cannot refresh back into a session**. `Test@Example.COM`,
`  test@example.com  ` and `TEST@EXAMPLE.com` are proven to be **one account** — matrix row 16, which
the audit left PARTIAL. On the `/me/*` side, every read carries `userId` into the `where` clause.

**Mutation-checked.** Deleting the OTP expiry check, the 5-attempt lockout, the `revoked` check and
the `userId` filter on `getUserDonations` each failed exactly its own test — and for the last one,
also the "never queries without a userId filter — the IDOR shape" case. Sources restored after.

**Toolchain defect found.** The auth spec would not compile: `uuid@14` ships **ESM only**, so Jest's
CommonJS runtime cannot load any service importing it. Nothing had caught this because **no test had
ever reached that code** — a fair summary of where coverage stood. Fixed by transforming the package
rather than stubbing the module.

**Result.** **101 tests / 10 suites** (was 57 / 6). Statements 16.34% → **20.71%**, branches 15.88% →
**19.24%**, functions 8.73% → **13.22%**. Ratchet raised to 20/19/13/20 and re-verified: `test:ci`
passes, a one-point raise fails. Row 40 → **PASS**; recounted tally **PASS 20 · PARTIAL 24 · FAIL 0 ·
MISSING 3 · BLOCKED 5 = 68%**.

**Still open, stated plainly.** 20.71% is not a healthy number. The remainder needs a **disposable
Postgres in CI** — the pattern already proven twice here (T-01, T-17) — not more mocks. For
`reports.service` especially, the audit's own rule is *"never mark reports completed until values are
compared against database data"*, which mocked assertions cannot satisfy: they would prove the
arithmetic, not the answer. Roughly a day, and not blocked on T-06.

---

## Integration harness + T-09 booking race ✅ DONE

**Before.** Coverage plateaued at 20.71% because the rest is service-layer Prisma work that mocks
cannot honestly verify — decisively so for reports, where the audit rule requires values be compared
against **database** data.

**Fix.** CI now runs a `postgres:15` service container, applies the T-01 baseline migrations to an
empty database, seeds it, and runs an integration suite. Applying those migrations on every push also
re-proves continuously that they build the schema from scratch. Unit and integration suites stay
separate — `npm test` (101, no DB) and `npm run test:int` (11, DB required, **fails loudly** rather
than skipping).

**T-09 was never actually blocked.** It was filed as *"Depends T-06"*, but proving a race needs a
database, not credentials. With the harness: two simultaneous bookings for one slot leave **exactly
one row**, the loser gets `SLOT_TAKEN`, and a **five-way burst** also leaves one. Cancel-then-rebook
still works. Acceptance met.

**Defect found by running it for real.** A Postgres serialization failure (Prisma **P2034**) was
unmapped, so under heavier concurrency the loser received a **500** — "the server broke" — when the
slot had simply been taken a moment earlier. Now converted to the same 409, with a test simulating
the abort. Deliberately not retried: if the loser lost, the slot is gone.

**The audit's own recommendation would have broken a working feature.** T-09 proposed
`@@unique([providerId, date, timeSlot])`. Cancelled bookings keep their rows, so cancel-and-rebook
legitimately yields two rows for one slot — a plain unique constraint rejects the rebooking, which
the new suite proves currently works. The correct form is a **partial** index
(`WHERE status <> 'ملغي'`), which Prisma cannot express natively. Not applied: it needs raw SQL and
would fail if production holds duplicate non-cancelled rows, which cannot be checked without database
access. Recommended, with that check first; SQL is in the evidence file.

**Safety is an allowlist, not a blocklist.** These suites delete rows, so `test/integration/db.ts`
requires the database *name* to look disposable (`*_test`, `*_int`). A blocklist was written first
and is the wrong shape — it passes by default, so any production database nobody thought to name
would be accepted and wiped. This matters concretely because `@prisma/client` loads `.env` on import,
so a developer's local URL is in effect even when the shell exports none.

**A self-inflicted flake, fixed.** Cleanup was keyed on phone number and missed the burst test's
rows, so the suite passed once and then failed on every rerun — looking exactly like a regression in
the booking guard. Now cleaned by slot, and run twice consecutively to prove idempotence.

**Result.** CI green on GitHub's runner (`31214313676`): migrations applied from empty, seed ran,
**101 unit + 11 integration** passed. Row 25 → **PASS**; recounted tally **PASS 21 · PARTIAL 23 ·
FAIL 0 · MISSING 3 · BLOCKED 5 = 69%**.

**What it unlocks.** The harness is the reusable part: remaining service coverage is now ordinary
work, and **T-15 (receipt ownership)** can be proven the same way, without T-06. Only genuinely
external things still need it — T-08's live 403 matrix over HTTP, T-10's payment sandbox, OTP
delivery.

---

## T-15 — Receipts: unguessable references, and money that was stuck ✅ DONE

**The task's framing did not match the system.** T-15 asks for "User A requesting B's receipt →
403/404", which assumes an owner-scoped receipt resource. There is no Receipt model: the donation
**reference** is the receipt, and `GET /donations/:reference` is `@Public()` by design so a guest
donor — who has no account — can check it. The reference is the credential; guessability is the whole
story. Asserting a 403 would have asserted the wrong thing.

**Three defects, all measured.**

1. **Enumerable.** `AS-` + six `Math.random()` digits = **900,000 values**, shared by donations,
   bookings *and* consultations — two with public lookups. Walking that space harvests every donor's
   name and amount, and every booking's phone, age, gender and **national id**.
2. **Collisions.** 10,000 old references produced **51 duplicates**. `reference` is `@unique`, so
   each is a *failed* donation or booking; ~50% odds of a first collision by the ~1,100th record.
   200,000 new references: **zero**.
3. **Real money stuck — the worst of the three.** `MANUAL_METHODS` listed
   `[BANK_TRANSFER, INSTAPAY]` and was never updated when the methods were narrowed to the client's
   three. INSTAPAY is deprecated and uncreatable; **فوري and فودافون كاش were missing**, so those
   donations were created «قيد التأكيد» — *awaiting a gateway callback that can never arrive, because
   there is no gateway* — and **never entered the admin's review queue**. The file's own comment
   already said all three methods are admin-approved: the code and its documentation disagreed, and
   the code won.

**Fix.** 60 bits of `crypto.randomBytes` in Crockford base32 (no I/L/O/U, so a code survives being
read aloud) → ~1.15e18. `MANUAL_METHODS` inverted to an empty `GATEWAY_METHODS` allowlist, so any
method added later defaults to admin review rather than to silent limbo. The public receipt drops
`userId`/`gatewayTxId`/`id`; the public booking lookup drops `nationalId`. Existing short references
keep working — lookups are exact-match.

**Retest.** 9 integration tests against a real PostgreSQL, **mutation-checked**: restoring the old
generator and the old method list fails exactly four tests and nothing else. **101 unit + 20
integration + 43 shared** all pass.

**Result.** Row 27 → **PASS**; recounted tally **PASS 22 · PARTIAL 22 · FAIL 0 · MISSING 3 · BLOCKED
5 = 70%**.

**⚠️ ACTION FOR OPS.** Existing production donations by فوري or فودافون كاش are likely sitting in
«قيد التأكيد», invisible to the review queue. The fix corrects new donations only. The query to find
them is in the evidence file; running it needs database access (T-06).

---

## T-08 — Authorization suite over real HTTP ✅ DONE

**"Blocked on T-06" was wrong — the third time.** T-08 was filed as needing "one admin + two user
tokens" from T-06. T-06 is about **external** services: SMTP, a payment sandbox, an FCM key. Tokens
are not external. This suite owns the test database and the JWT secret, so it creates its own users
and admins and signs its own tokens with the same `JWT_ACCESS_SECRET` the strategy verifies against.
**T-09, T-15 and T-08** were all mis-filed the same way — "needs a database or a token" was treated
as the same category as "needs a third-party account".

**How real it is.** The entire `AppModule` is booted and listens on a port. `common.module.ts`
registers `JwtAuthGuard` and `RolesGuard` as `APP_GUARD`, so every request travels the production
authorization stack behind the real `api/v1` prefix, and every assertion is on an HTTP status code.

**What is proven — 31 tests.** Guest → 401 on 7 `/me/*` and 7 `/admin/*` routes. Wrong-secret and
expired tokens → 401. A user token never reaches an admin route, and **cannot self-promote**: a token
signed with the *real* secret claiming `type: 'admin'` is still refused, because `sub` is a user id
and the `adminUser` lookup finds nothing — a valid signature does not confer a role. An admin holding
only `portfolio:read` reaches portfolio (200) and gets **403** on users, roles, donations and
bookings, plus **403 on a WRITE** to the very module it may read, so read access does not leak write
access. A blocked user is refused per-request despite an unexpired token. For IDOR, A's `/me/bookings`
and `/me/donations` contain neither B's ids nor B's phone — **and B's own requests do return them**,
without which the first two assertions would pass on an empty list and prove nothing.

**Mutation-checked.** Three guards broken independently — `RolesGuard` always-allow, blocked-user
check removed, `userId` filter dropped — failed **11 tests, exactly the ones covering each**, while
20 unrelated tests still passed.

**Retest.** 31 in the new suite; **51 integration / 4 suites**; **101 unit / 10 suites**; integration
re-run consecutively with no leakage; build clean; **CI green on GitHub's runner** (`31216558201`).

**Result.** Row 34 → **PASS**; recounted tally **PASS 23 · PARTIAL 21 · FAIL 0 · MISSING 3 · BLOCKED
5 = 71%**.

**Honest limits.** Fourteen routes are asserted, not every route — the guard is global so the
mechanism is proven, but a per-route sweep is mechanical and worth doing before launch. "A cannot
read B's" is proven at list level because `/me/*` takes no id; the one id-addressable receipt path is
deliberately public and is covered by T-15's unguessable reference instead.

---

## Corrections to the baseline audit

Four findings in the first report were wrong and are withdrawn/corrected:

1. **G-15 "dead code" — WITHDRAWN.** `dashboard/src/shared/` is aliased as `@ahla/shared` by
   both `vite.config.ts` and `tsconfig.json`. It is the live shared package, not a stray copy.
2. **"4 mutations" — CORRECTED to 6 wirable row actions.** The sweep regex missed
   `toggleUserBlock`, and `/admin/messages/:id` accepts a status. All are now wired.
3. **"No requirement is FAIL any more" (published after T-05) — WRONG when written.**
   Row 43 (admin broadcast) was still FAIL at that point. The correct post-T-05 tally was
   PASS 18 · PARTIAL 25 · **FAIL 1** · MISSING 3 · BLOCKED 5 → **65%**, not 66%. The claim
   was stated to the client one task early; it became true only with T-13.
4. **T-11 "signature check is skipped with a warning" — WRONG.** The production hard-fail already
   existed at the baseline (`d420546`); the cited line 87 was the warning inside the non-production
   branch. The companion claim that production had no `WEBHOOK_SECRET` was disproved by a live 401.
   Real defects did exist nearby (fail-open when `NODE_ENV` is unset; boot allowed without a secret)
   and are fixed under T-11 — but the finding as written was not accurate.

## Status of the delivery decision

**NOT READY — REMAINING CORE TASKS**, but every P0 that engineering can close is now closed:
T-01, T-02, T-03, T-04 and T-05. The single remaining P0 is **T-06 — credentials and a
staging environment** — which is procurement, not code, and gates all remaining verification
(IDOR, RBAC 403, booking race, payment webhook, OTP delivery, reports vs SQL).
