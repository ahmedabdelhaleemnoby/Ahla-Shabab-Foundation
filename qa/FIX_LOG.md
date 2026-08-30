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
  *(Correction: that was **false when written**. Nothing derived it, so this change
  removed the only way to set it. It became true only with T-20, which implemented
  the derivation.)*
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

**~~ACTION FOR OPS~~ — VOID, and a correction.** This entry claimed production donations by فوري or
فودافون كاش were sitting stranded and "invisible to the review queue". **Both halves were wrong.**
A read-only count on 2026-08-08 returned **zero donations in production, in any status** — nothing was
stranded. And they were never invisible: the dashboard lists every donation under «الكل» and counts
these in a KPI; what it lacks is an approve/reject control for them, so they would be *unactionable*.
The code defect was real and is fixed; the claim about production **data** was inferred from the code
rather than checked, which the T-20 finding (the app never called the API before v1.6.0) should have
flagged immediately.

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

## T-10 — Payment confirmation path ✅ RE-SCOPED & DONE

**The task as written conflicts with the client's own instruction.** T-10 says *"payment gateway
end-to-end (sandbox)"*. The client said: *"There is currently NO online payment gateway and the app
must NOT simulate instant payment success."* All three approved methods are completed outside the app
and approved by an admin. **Integrating a sandbox would build the thing that was explicitly ruled
out** — the wrong work, whether or not credentials existed. So the task is re-scoped rather than
executed as written.

**What was done instead.** `handleWebhook` exists and would run the moment any gateway is connected,
so its behaviour is pinned by **11 tests**, three of them over real HTTP with a genuine HMAC. This
closes a loop `webhook-security.e2e-spec.ts` left open: that suite stubs the service, so it proved
the signature check but never that a callback actually moves money. Now proven: a signed callback
moves the donation to «مكتمل» and records the gateway id; an unsigned one returns 401 and changes
nothing; a **tampered amount** returns 401 because the signature covers the body; **redelivery is
idempotent** — two callbacks with the same `gatewayTxId`, with two same-amount donations pending,
complete exactly one; `failed` marks «فشل»; a late `failed` cannot undo a completion.

**⚠️ Finding 1 — the webhook matches by AMOUNT, not by reference.** The lookup is
`{ status: PENDING_CONFIRMATION, amount, gatewayTxId: null }`, oldest first. No donation reference is
carried through the payment, so two donors giving the same amount are indistinguishable and the
**oldest** is confirmed — a real payment attached to the wrong person's receipt, with the actual
payer left pending. Latent today, but a trap for whoever connects a gateway. Recorded as a test that
documents the behaviour rather than endorsing it; the fix is to match on the donation reference.

**Finding 2 — the `FINAL_STATES` "never regress" guard is dead code.** The query already excludes
final rows, so that branch has never run. The protection holds by a different route (404), but anyone
changing the query later would be relying on something untested.

**Interaction with T-15.** Every donation is now created «قيد المراجعة», and the webhook only matches
«قيد التأكيد», so the confirmation path is unreachable in practice. That is the correct posture for a
system with no gateway — it was previously *worse*, with two of three methods stranded in
«قيد التأكيد» awaiting a callback that could never arrive. **Connecting a gateway later requires
re-populating `GATEWAY_METHODS`, and Finding 1 becomes live at that moment.**

**Retest.** 11 in the new suite; **62 integration / 5 suites**; **101 unit / 10 suites**; build clean;
**CI green** (`31217277934`). `WEBHOOK_SECRET` added to the CI env — without it the three HTTP tests
fail, because the endpoint correctly fails closed (T-11). Throwaway CI value, not the production one.

**Result.** Row 48 moves **BLOCKED → NOT APPLICABLE**: it is not work waiting on the client, it is
work that should not be done. The score stays at **71%** — both statuses are excluded from the
denominator — so nothing was gained numerically; what changed is that one item left the "waiting"
pile permanently.

---

## CMS + Portfolio integration coverage ✅ DONE — one defect fixed, one gap recorded

**Before.** Both services sat at **0% coverage** — `cms.service.ts` (128 statements) is the document
the whole mobile app renders from; `portfolio.service.ts` (87) owns the published cases and projects.

**⚠️ Defect found: the public detail route served unpublished items.**
`GET /portfolio/cases/:id` and `/projects/:id` are `@Public()`. The **list** routes pass
`published: true`; the **detail** routes passed nothing, so an unpublished case or project was fully
readable by anyone holding its id — **including one that had been published and then taken down**.
Ids are UUIDs so it was not enumerable, but unpublishing is how a case comes down when a family
withdraws consent or a detail proves wrong, and it did not remove access at the old link. This client
treats beneficiary privacy as a design constraint — images are labelled "privacy-vetted" and only a
governorate is stored, «بدون عنوان تفصيلي — خصوصية المستفيد» — so "unpublish" must be a takedown,
not a label. Fixed with `findPublishedCaseById` / `findPublishedProjectById`; admin routes keep the
unscoped finders so drafts stay editable.

**Second finding — and it corrects one of my own earlier decisions.** Nothing derives `raisedAmount`
from donations: `donation.completed` feeds only notifications, and a `Donation` carries a free-text
`cause` with no `caseId`. A completed donation leaves the case total at 0, now proven by a test.
**In T-02 I stopped the dashboard sending `raisedAmount`, reasoning it was "derived server-side".
That was false, and the change removed the only way to set it** — the dashboard currently cannot
update a fundraising total at all. Two ways forward (restore manual editing, or link donations to
cases with a schema change and backfill); it changes how the charity reports its numbers, so it is
recorded as a decision rather than chosen unilaterally.

**Retest — 19 tests.** Portfolio: drafts absent from public lists, **not readable via the public
detail path**, admin still able to read them, and unpublishing removing access from both paths. CMS:
draft pages absent from the snapshot, unpublishing removing a page, **a document stored at v9 coming
back at `CMS_SCHEMA_VERSION`** with T-07's Arabic consultation keys and consent fields (the
backfill-on-read contract verified, not assumed), only the three approved payment methods offered,
and a settings edit persisting **without silently dropping** menu or consultations.

**Mutation-checked**: removing either draft filter failed **4 tests**, and nothing else.

**Result.** **81 integration / 7 suites** (was 62 / 5) and 101 unit; CI green (`31218275272`).
Coverage of the two services **0% → ~37–40%** statements.

**An honest note on the headline number.** `npm run test:cov` now reports **20.67%**, marginally
*below* the 20.71% before this work. That is not a regression: the new published-scoped finders are
source lines covered by *integration* tests, which the unit coverage run does not measure. The two
numbers count different things, and the ratchet governs the unit run only. A merged coverage report
would fix the confusion — noted as a follow-up rather than papered over.

---

## T-20 — Approved donations move the fundraising total ✅ DONE (needs an APK to take effect)

**You chose derivation over restoring manual entry.** Implementing it showed the chain was broken in
**three** places, not one. For a progress bar to move, a donation must reach the server, carry the
case, and credit it — none of those worked.

1. **The app never recorded donations at all.** `confirm()` built a receipt with a locally invented
   reference, pushed it into local state and navigated to the success screen. No API call. **A donor
   saw a confirmation, with a reference, for a donation recorded nowhere** — the admin never saw it
   and support could not look the code up. This is the audit's row 26, still open.
2. **The case was dropped.** `CaseDetailScreen` and `ProjectDetailScreen` navigated to Donate with no
   params, so tapping «تبرع» on a specific case lost the case.
3. **Nothing credited the case.** `donation.completed` fed only notifications; a Donation had a
   free-text `cause` and no `caseId`.

**Fix.** `Donation.caseId`/`projectId` (nullable, `onDelete: SetNull`, additive migration). The credit
runs in the **same transaction** as the status change — approved-but-uncounted is worse than either
failure alone. It is an **increment, not a recompute**: hand-entered totals survive as the starting
point, so **no backfill is needed and no historical figure is destroyed**, where a recompute would
have zeroed every total the charity entered by hand. Mobile now calls `submitDonation` with the id and
uses the **server's** reference, showing an error rather than a fake success — telling a donor their
gift is recorded when the server never received it is the one outcome to avoid.

**Retest.** 10 integration tests: amount and supporter added; a hand-entered 1000 becomes 1500 rather
than being wiped; projects identical; several donors accumulate; pending, rejected and unlinked
donations move nothing; re-approval refused so nothing double-counts; a deleted case detaches rather
than orphans; the public detail shows the new total. **Mutation-checked** — removing the credit fails
6 of the 10. 91 integration / 101 unit / 43 shared; CI green; the **deployed Swagger confirms the live
API accepts `caseId`/`projectId`**.

**Deliberately not done:** no test donation was created in production to watch a real total move —
that would write junk into the charity's live records.

**Result.** Row 26 gains PASS across every layer column but the final verdict **stays PARTIAL**,
because the mobile half only reaches donors in a **new APK**. Calling it PASS today would overstate
what users actually have. Tally unchanged at **71%**.

**Known limits.** Historical donations have no `caseId` and cannot be retro-attributed (`cause` is
free text) — their money is already inside the hand-entered totals, so nothing is lost or
double-counted. And there is no decrement path, because reversing an approved donation is currently
impossible; if reversal is ever allowed, the credit must be reversed with it.

---

## T-21 — One coverage number across both suites ✅ DONE

**Before.** Coverage was measured over the **unit run only**. Anything covered by an integration test
read as uncovered, so adding 19 integration tests made the headline figure go **down** — 20.71% to
20.67%. A number that moves the wrong way when the thing it measures improves is worse than no
number: it teaches people to ignore it.

**Fix.** `jest.config.js` now uses `projects`. Both suites run under one invocation and coverage
aggregates across them, while staying separable — the integration project needs PostgreSQL and the
unit one must not:

| Command | Runs | Database |
|---|---|---|
| `npm test` | unit + e2e | **not required** (verified with `DATABASE_URL` unset) |
| `npm run test:int` | integration | required |
| `npm run test:cov` / `test:ci` | **both** | required |

`test/jest-int.json` is deleted — `package.json` was its only reference, and two ways to run one
suite is exactly the confusion T-12 set out to end. CI drops from two test steps to one, with the
database prepared first because the single invocation now includes the integration project.

**The real number.** **54.45% statements, 52.83% lines** — not the 20.67% previously reported.
Thresholds re-baselined to the merged measurement (54/29/28/52) and verified as a ratchet: `test:ci`
passes, a one-point raise fails.

**Retest.** 192 tests across 18 suites in a single run; unit-only still 101/10 with no database;
build clean; **CI green** (`31235412133`) reporting **54.48%**.

**Note.** The thresholds now only bite where a database is available — that is CI, which is where the
gate matters. A developer running `npm test` locally gets the fast unit suite with no coverage gate,
which is the right trade.

---

## T-14 — Manual transfer flow, re-scoped: the audit trail had a hole ✅ DONE

**"Proof upload" contradicts the client's own choice.** They specified **WhatsApp proof submission**
(+20 105 090 0710, `https://wa.me/201050900710`), and the app already ships it —
`donationSupport.proofCta` = «إرسال إثبات التحويل عبر واتساب», with a note to keep the transfer
screenshot. Building an in-app uploader would repeat T-10's mistake: work the client ruled out. So the
task is re-scoped to the rest of its acceptance.

**Three clauses were already met** — the donation lands «قيد المراجعة» (T-15, and it was wrong before:
فوري and فودافون كاش went to «قيد التأكيد»), only an authorised admin can approve (T-08, mutation-
checked), and the receipt exists and is unguessable (T-15).

**The fourth was broken.** `ActivityLogInterceptor` is applied **per controller**, and it sat on 16
admin controllers but **not on `bookings-admin` or `provider-portal`**. Every content, CMS, donation
and user mutation was audited; **every change to a booking was not.** Confirming, cancelling or
marking a booking no-show left no record of who did it — the operational core, and the single most
obvious thing an operations audit log exists to capture. Both are now intercepted.

**Retest.** 5 integration tests over real HTTP: a booking status change and a donation approval each
write an entry naming the acting admin; a GET writes nothing; and a **structural guard** asserts every
mutating `*-admin` controller carries the interceptor — the test that matters most, because the next
controller added without it would otherwise silently stop being audited. **Mutation-checked**:
removing it fails 3 of 5, including the guard. **197 tests / 19 suites**, merged coverage **55.8%**;
three consecutive integration runs stable; **CI green** (`31244405565`).

**⚠️ Finding, recorded not fixed: the audit write is fire-and-forget.** The interceptor writes inside
`tap(async …)`, which RxJS does not await — so the response can return before the row commits (this
surfaced as a **real race** in the first version of the suite, not a hypothetical), and the `catch`
that stops logging breaking the response **swallows a failed write silently**, leaving no trace
anywhere. The trail is best-effort, not guaranteed. Awaiting it adds latency to every admin mutation,
so it is a product/ops decision rather than a unilateral change — but for a log whose purpose is
accountability it should be decided deliberately, not inherited.

**Result.** Row 35 **PARTIAL → PASS**; recounted tally **PASS 24 · PARTIAL 20 · FAIL 0 · MISSING 3 ·
BLOCKED 4 · N/A 1 = 72%**.

---

## Corrections to the baseline audit

Six findings are wrong and are withdrawn/corrected — four from the first report, two of my own:

1. **G-15 "dead code" — WITHDRAWN.** `dashboard/src/shared/` is aliased as `@ahla/shared` by
   both `vite.config.ts` and `tsconfig.json`. It is the live shared package, not a stray copy.
2. **"4 mutations" — CORRECTED to 6 wirable row actions.** The sweep regex missed
   `toggleUserBlock`, and `/admin/messages/:id` accepts a status. All are now wired.
3. **"No requirement is FAIL any more" (published after T-05) — WRONG when written.**
   Row 43 (admin broadcast) was still FAIL at that point. The correct post-T-05 tally was
   PASS 18 · PARTIAL 25 · **FAIL 1** · MISSING 3 · BLOCKED 5 → **65%**, not 66%. The claim
   was stated to the client one task early; it became true only with T-13.
4. **"Production donations are stranded in «قيد التأكيد»" — WRONG, and repeated.** Asserted in the
   T-15 entry and in several summaries. A read-only count on 2026-08-08 found **zero donations in
   production, in any status**. The *code* defect was real; the conclusion about production **data**
   was inferred from it and never checked. The T-20 finding — the app never called the API before
   v1.6.0 — should have surfaced this immediately. The companion claim that such rows were
   "invisible to the review queue" was also wrong: the dashboard lists them under «الكل» and counts
   them in a KPI; it simply offers no approve/reject control, making them *unactionable*, not unseen.
5. **T-02's "`raisedAmount` is derived server-side" — FALSE when written.** Nothing derived it, so
   removing it from the dashboard payload removed the only way to set it. Made true retroactively by
   T-20.
6. **T-11 "signature check is skipped with a warning" — WRONG.** The production hard-fail already
   existed at the baseline (`d420546`); the cited line 87 was the warning inside the non-production
   branch. The companion claim that production had no `WEBHOOK_SECRET` was disproved by a live 401.
   Real defects did exist nearby (fail-open when `NODE_ENV` is unset; boot allowed without a secret)
   and are fixed under T-11 — but the finding as written was not accurate.

## T-06 — Credentials & a safe test environment ✅ DONE

**Before.** Filed as the last P0, "1.5d, mostly waiting" on the client, and treated throughout this
log as procurement rather than code.

**Root cause of the mis-scoping.** Provisioning credentials was read as *obtaining* them. Nobody
looked at the ones already in the tree.

### 🔴 The production super-admin password was published on GitHub

`prisma/seed/admin-users.ts` hashed a hardcoded `admin123` and printed it. The repository is **public**;
`deploy.yml` runs `prisma db seed` on every push to main; the account holds «مدير عام» — every
permission over donations, beneficiaries, bookings and national IDs.

Verified once against production, non-destructively: `POST /admin/auth/login` → **200 with tokens**.
The session was rotated and revoked immediately (`/auth/logout` → 200). Nothing was read or written.

Worse, it could not be rotated: there is **no admin password-change endpoint, no dashboard screen and
no admin account management of any kind**. `AdminUser` rows come from the seed or from psql.

**Fix.** The seed never touches an existing admin (no password reset, no reactivation of a disabled
account) and never creates one without `SEED_ADMIN_PASSWORD` — in production a missing value creates
nothing, loudly, because creating none is recoverable and creating one with a published password is
not. New `POST /api/v1/admin/auth/change-password` verifies the current password, rotates it, and
**revokes every refresh token for that admin** so sessions opened with a leaked password die rather
than surviving the 30-day refresh TTL. The audit entry is written in the service, not by
`ActivityLogInterceptor` — the interceptor stores `newValue: request.body`, which would have put both
passwords in the activity log in plain text.

### 🔴 Every rate limit was a single global bucket

`request.ip` keys the rate limiter and the activity log's `ip` column. Express derives it from
`X-Forwarded-For` only when the proxy chain is trusted, and nothing set `trust proxy` — while the API
answers through Cloudflare and an nginx. Proven live: `x-ratelimit-remaining` keeps falling whatever
`X-Forwarded-For` says.

So: 100 requests a minute **for the whole platform**; five admin login attempts per ten minutes shared
by every administrator (any stranger could lock out the foundation, indefinitely, with five wrong
guesses every ten minutes); five OTP requests per ten minutes for the entire mobile user base; and an
audit log recording the proxy's address for every action ever taken.

**Fix.** `TRUST_PROXY`, applied in `main.ts` and **announced at boot** — a silent default is how this
stayed invisible. Left at `false`: trusting a hop that does not exist lets a caller write their own
header and skip the limits entirely, and the correct count depends on the nginx config on the server.

### 🟠 The OTP endpoint reported success when nothing was sent

`EmailService.sendOtp` caught every error and returned normally, so `POST /auth/otp/request` answered
200 with «تم إرسال رمز التحقق» whether or not a byte left the server — which, with no SMTP configured,
was every request. The dev fallback that printed the code was gated on `NODE_ENV === 'development'`, so
staging and test logged nothing and had no way in at all. Production now returns 503; non-production
logs the code.

### 🟡 The merged test run passed by luck

`maxWorkers: 1` and `testTimeout: 30000` sat inside the `projects[]` entry, where Jest's project schema
does not define them — `testTimeout` produced an "Unknown option" warning and both were dropped. The
merged run held together on CI only because a GitHub runner has few enough cores to serialise by
accident: on a 10-core machine, **53 of 227 tests failed**. Serialised at the CLI, timeout moved to a
setup file.

**Files changed** (`ahlashabab_backend_app`)
- `prisma/seed/admin-users.ts`, `src/auth/auth.service.ts`, `src/auth/admin-auth.controller.ts`,
  `src/auth/dto/admin-change-password.dto.ts` *(new)*
- `src/common/utils/trust-proxy.util.ts` *(new)*, `src/main.ts`, `src/config/app.config.ts`
- `src/email/email.service.ts`
- `scripts/qa-env.ts`, `scripts/disposable-postgres.ts`, `scripts/with-db.ts` *(all new)*
- `test/seed-admin-credentials.e2e-spec.ts`, `test/otp-delivery-failure.e2e-spec.ts`,
  `test/trust-proxy.e2e-spec.ts`, `test/integration/admin-password.int-spec.ts`,
  `test/integration/jest.setup.ts` *(all new)*
- `jest.config.js`, `package.json`, `.env.example`

**Retest.** 227 tests / 23 suites green; coverage **57.36%** (was 55.83), thresholds ratcheted.
`npm run qa:env -- --smoke` passes every check. Five mutation checks, including setting
`TRUST_PROXY=false` — production's actual state — which fails **7 of 10** tests in the new suite.

**Result.** Row 17 (admin login) PARTIAL → **PASS**, proven live. Row 3 (security headers + rate
limiting) **PASS → PARTIAL**, a deliberate downgrade. They cancel: **73%, unchanged** — which is the
point worth reporting. The two most serious defects found in this engagement moved the score by zero.

## Deploy schema step — `db push` removed ✅ DONE (with a failure of mine on the way)

**Before.** T-01 baselined the migrations. `deploy.yml` went on running
`npx prisma db push --skip-generate` on every push to main, so production's schema was still being
forced into shape with no history, no plan and no review step — on a live database holding donations
and beneficiary records. `db push` drops and rewrites columns to make the database match the schema.

**Root cause.** Documented and deliberate: T-01's runbook says the switch needs a one-time baseline
that requires production database access. It was deferred and then not revisited.

**Fix.** `scripts/apply-schema.js` reads the database and picks — deploy when migrations have been
applied or the database is empty, stop with instructions otherwise. `deploy.yml` calls it.

**What I got wrong.** The first version decided on whether `_prisma_migrations` **exists**. Production
had that table with **no rows** — a state I had not considered and had not tested — so the script took
the deploy path and Prisma tried to `CREATE TABLE governorates` on top of the live schema.

Nothing was lost: PostgreSQL runs each migration in a transaction and it failed on the first
statement. But it recorded `0_init` as **failed**, and Prisma blocks every later migration until that
is cleared (P3018). Production is in that state now and needs one command from someone with database
access. It is the exact trap I had described in writing two hours earlier, having tested the
no-table case and never the empty-table case.

A second defect surfaced with it: the deploy script had no `set -e`, so after the schema step exited
non-zero the workflow **carried on to seed and restart the app, and reported success**. My commit
message had claimed a deploy that cannot apply its schema does not restart the app. That was not true
when I wrote it.

**Also fixed.** The runbook named `0_init` alone — correct when written, stale since T-20 added a
second migration. Following it verbatim half-baselines the database and wedges it. The script prints
the live list instead.

**Retest.** 6 tests, each on its own throwaway cluster: fresh database, `db push` state, empty
migrations table, the failed-migration state, and recovery through `resolve --rolled-back`. The
second deploy behaved correctly — red, stopped before the seed and restart, recovery commands in the
log.

**Result.** Deploys are blocked until the baseline is run, which is the intended state. Production
runs `8c92e66` and is serving normally; the undeployed commits touch deploy tooling, not runtime.

## Administrator accounts ✅ DONE

**Before.** `AdminUser` rows came from the seed or from psql. No create, no list, no disable, no
password reset for anyone but yourself. The foundation ran on exactly one administrator account —
whose password was published in a public repository until this morning — and somebody who left could
not be locked out without database access.

**Fix.** `admin/admin-users` — list, read, create, update, reset another admin's password. Guarded by
`roles:write`, so only «مدير عام» reaches it by default.

The two refusals are the point. You cannot deactivate your own account, and you cannot leave nobody
holding `roles:write` — by deactivating the last holder or by moving them to a role without it. An
account screen that permits either has relocated the lockout, not removed it.

No DELETE: an administrator who has done anything is referenced by the activity log, and an audit
trail that can be erased by deleting its subject is not an audit trail. Resetting a password revokes
every refresh token for that account.

Audit rows are written in the service. `ActivityLogInterceptor` stores `newValue: request.body`, and
these bodies carry plaintext passwords — the same trap as T-06's change-password.

**Found while doing it.** T-14's structural guard selected controllers by **filename**
(`*-admin.controller.ts`), which is a naming convention rather than a rule. Re-pointed at the route
prefix, it immediately caught `POST /admin/uploads` — writing files to disk with **no record of who
uploaded them**. For this client those files are photographs of beneficiaries and their documents.
Now audited. `src/admin/roles.controller.ts` was never covered by the old guard either; it happened to
carry the interceptor.

**Retest.** 19 tests over real HTTP. Mutation-checked: allowing self-deactivation, dropping the
last-manager guard, un-auditing uploads, and selecting `passwordHash` into responses each fail
exactly one test. **246 tests / 25 suites, coverage 58.28%.**

## Push notifications — row 49 ✅ BACKEND DONE (mobile half does not exist)

**Before.** Row 49: **BLOCKED, "FCM key"**. Two things were wrong with that.

There was **no send path** for a key to unblock. `firebase-admin` sat in `package.json` and was never
imported anywhere in `src/`; `FCM_SERVER_KEY` was read by no code; `POST /me/device-tokens` filed
tokens that nothing ever read.

And **the key would not have worked.** An FCM *server key* authenticates the legacy FCM HTTP API,
which Google deprecated in June 2023 and **shut down on 20 June 2024**. The credential the audit was
waiting for has not authenticated anything for two years. The modern path is a **service account**
through the v1 API.

**Fix.** `PushService` on firebase-admin, wired into `NotificationsService.create` — the single funnel
every notification passes through, so bookings, donations, event listeners and the admin broadcast are
covered in one place rather than per call site, where a miss is invisible.

Three properties it treats as load-bearing:

- **dead tokens are deleted.** `registration-token-not-registered` means the app was uninstalled or
  the token rotated; left in place they accumulate for the life of the product. Transient codes are
  kept, so an FCM outage does not silently unsubscribe everyone.
- **500 tokens per call**, FCM's limit — exceeding it rejects the whole call rather than truncating.
- **a failure never escapes.** The in-app row is written before this runs; an unreachable Google must
  not turn a confirmed booking into a 500. Logged at error level, because the silent catch is what hid
  the OTP failure for the whole project.

A disabled preference silences the row *and* the push. The broadcast sends **one multicast** for its
whole audience. With no credential, push is disabled and says so once at boot rather than being a
silent no-op — which is the state that let this go unnoticed.

**Retest.** 14 tests. Mutation-checked: dropping the create hook, pushing per-user in the broadcast,
keeping dead tokens, and raising the batch limit each fail exactly one test. **260 tests / 27 suites,
coverage 59.41%.**

**⚠️ Not deliverable end to end.** The mobile app has **no push dependency of any kind** and never
calls `/me/device-tokens`. There are no tokens to send to, so a service account alone will not produce
a notification on anyone's phone — the app has to register first. Row 49 is **PARTIAL**, not PASS.

**A claim of mine to correct.** Reporting this I wrote that "the app asks users for notification
permission and files a token that can never be used". It does not ask. I inferred the mobile behaviour
from the endpoint existing instead of reading the app — the same mistake this audit keeps finding in
other people's work.

## Push — the mobile half ✅ DONE (needs two files from the client to deliver)

**Before.** `POST /me/device-tokens` shipped in the first backend commit and **no client ever called
it**. `mobile/` had no push dependency of any kind. The table was empty, so the backend half built
earlier had nothing to send to — each missing half hid the other.

**Fix.** `expo-notifications`, and `mobile/src/store/push.ts`:

- **the native token, not the Expo one.** `getExpoPushTokenAsync()` returns `ExponentPushToken[…]`,
  which only works through Expo's own push service; the server delivers through `firebase-admin`, so
  it needs `getDevicePushTokenAsync()` — the raw FCM registration token. Sending the wrong one fails
  in the worst way: the API accepts it, the row is stored, and every send is rejected by FCM. A
  feature that looks wired from every angle except the phone.
- registered **after sign-in** (the endpoint is authenticated and the token belongs to a user) and on
  a **restored session**, since a returning user never passes the OTP screen and would otherwise go
  quietly unreachable as FCM rotates the token.
- a token-rotation listener, so a refreshed token is re-sent rather than waiting for a restart.
- cleared on sign-out, so the next person to use the phone does not inherit the previous
  registration.
- never throws. A device that cannot register misses notifications; it does not fail to open the app.

**Found while wiring it.** The OTP screen still carried a demo banner: «نسخة عرض — لم يُرسل أي بريد
إلكتروني. أدخل أي رمز مكوّن من 6 أرقام للمتابعة» — *"demo build, enter any six digits"*. True before
T-04, false ever since: the code is verified server-side and a wrong one is rejected. It told every
user to do the one thing guaranteed not to work, then showed them the error. Removed.

**A packaging defect, caught by building rather than reasoning.** npm hoists `expo-notifications` to
the workspace root while `expo` and `expo-modules-core` stay in `mobile/node_modules`, so from the
hoisted copy neither resolves. `npx expo export` **failed outright** — not a type nit, a broken build.
Metro is unaffected (its `nodeModulesPaths` covers both roots), so the fix was to stop loading the
config plugin and map the peer for `tsc`. Bundle verified: **3.61 MB Hermes bundle exported clean.**
The cost is cosmetic — the Android notification icon stays the app default. Recorded as decision 17.

**Retest.** 6 shared tests on the endpoint contract (path, bearer token, the three platform values the
backend's Zod schema accepts, and that a failure rejects rather than resolving). Shared suite **49
passed**. `npm run typecheck` clean. Android bundle exported.

**⚠️ Still not deliverable.** Two files from the client, neither of which is code: a **Firebase service
account** for the server, and **`google-services.json`** for the app — from the same project. Decision
16. The `googleServicesFile` line is deliberately *not* in `app.json`: pointing it at a missing file
fails every APK build, not just push.

## Release signing ✅ DONE (keystore still the foundation's to supply)

**Before.** `buildTypes.release` pointed at `signingConfigs.debug`, under a stock comment telling you
not to do that. Every release build was signed with the Android SDK's throwaway debug key and looked
completely ordinary coming out.

**Verified, not assumed.** `apksigner verify --print-certs` on the shipped artefacts:

    ahla-shabab-v1.5.0-demo.apk → CN=Android Debug, OU=Android, O=Unknown
    ahla-shabab-v1.4.1-demo.apk → CN=Android Debug, OU=Android, O=Unknown

Google Play rejects those at upload. v1.6.0, published as a GitHub release, came off the same
unchanged config.

**Fix.** Signing credentials are read from `android/keystore.properties`, Gradle properties or the
environment — the last two so CI can supply them without a file on disk. A path that points at nothing
counts as absent, because a typo silently falling back to the debug key is the exact failure being
fixed.

The refusal is checked against the **task graph**, not at configuration time, so `assembleDebug`,
tests and IDE syncs keep working with no keystore and only a release build stops. It prints the
`keytool` line and the four properties needed.

**Retest — both paths, for real.**

| | |
|---|---|
| `assembleRelease` with no keystore | **BUILD FAILED**, with the instructions |
| `assembleRelease -PAHLA_RELEASE_*` | **BUILD SUCCESSFUL in 2m 55s** |
| Signature of the produced APK | `CN=AhlaShababSigningTest` — the supplied key, not the debug one |

The test keystore was generated in `/tmp` for the check and deleted afterwards. `keystore.properties`,
`*.jks` and `*.keystore` are now git-ignored so a real one cannot be committed by accident.

**Still the foundation's to do.** Generate the keystore and store it somewhere it cannot be lost —
losing it means the app can never be updated on Play again, and there is no recovery. Decision 12 now
carries the exact commands. Row 8 **PASS → PARTIAL**: "release APK produced" was scored on a file
existing, and what existed was never publishable.

## Consultant portal, phase 1 — consultations are visible ✅ DONE

**Before.** A beneficiary submits the consultation form, gets a reference, and the request lands
somewhere **nobody at the foundation can open**. `POST /consultations` works (T-07 verified it live at
47/47). `GET /admin/consultations` and `PATCH :id/status` are routed and working.
`fetchAdminConsultations` and `updateConsultationStatus` were already written in the dashboard's
`adminApi.ts` — and **nothing imported them**. `Inbox.tsx` had two tabs: volunteers and messages.

Row 23 scored the **admin column PASS** for this.

**Fix.** A third Inbox tab: the requester's contact details, preferred channel and time, the summary
they wrote, and the five statuses from the client's own workflow (decision 7). Only the next step
forward is offered, so the trail through a request reads in order.

«تم تحديد موعد» records that a time was agreed and deliberately claims no more:
`consultationsService.schedule()` exists and **no route exposes it**, so assignment is unreachable.
That is phase 2 — not something to paper over with a button that pretends to book.

**Also removed:** the banner on every dashboard page reading «نسخة عرض — يتم حفظ التعديلات على هذا
الجهاز فقط» — *"demo build, changes are saved on this device only"*. True before T-02/T-03, false ever
since. Telling staff their work is not being saved invites them to redo it or distrust what they are
looking at, on screens holding real beneficiaries' requests.

**A gap in my own QA environment, found by using it.** `scripts/qa-env.ts` booted `AppModule` and set
only the global prefix, while `main.ts` configured helmet, CORS and TRUST_PROXY inline. The first
browser to try it got a **404 on the CORS preflight** and `net::ERR_FAILED` on every request: the
environment served curl and not a browser, which is half of what QA needs it for. Extracted to
`src/bootstrap.ts`; both entry points now call it.

**Retest — end to end against a disposable API, not asserted from the code.**

| # | Step | Result |
|---|---|---|
| 1 | Two requests submitted through the public endpoint | **201, 201** |
| 2 | CORS preflight that previously 404'd | **204** |
| 3 | Dashboard login against the QA API | 200, admin session |
| 4 | Both requests visible in the new tab, badge counting them | **2** |
| 5 | Status changed from the UI | `PATCH … /status` → **200** |
| 6 | Database read back | «قيد المراجعة» on one, «جديد» on the other |
| 7 | Badge after the change | **1** |

Dashboard typecheck and production build clean.

**Row 23's admin column is now true rather than merely scored.** The Final column stays PARTIAL —
the mobile app still submits locally — so the tally does not move: **70%**.

## Consultant portal, phase 2 — scheduling ✅ DONE

**Before.** `consultationsService.schedule()` set `providerId`, `date` and `timeSlot`, and **no
controller route exposed it**. Meanwhile `PATCH :id/status` took `@Body('status') status: string` with
no validation and wrote whatever it was handed. Two consequences:

- a request could be marked **«تم تحديد موعد» with `providerId`, `date` and `timeSlot` all null** — a
  status announcing an appointment that recorded nothing about who with or when. Exactly the
  half-truth the phase 1 button could produce;
- `{"status":"anything"}` **stored "anything"**, so every list, filter and badge downstream could hold
  a value nobody had defined.

**Fix.** The status route validates against the five statuses from decision 7 and **refuses
«تم تحديد موعد»**, pointing at `PATCH :id/schedule`, which takes all three fields. `schedule()` also
checks the provider exists — an unknown id was a foreign-key error and a 500 when it is the caller's
mistake — and refuses a cancelled request.

The dashboard button became a form: a real provider dropdown (active only), a date, a time, confirm
disabled until all three are present. If no provider is active it says so rather than offering an
empty select.

**Retest.** 13 integration tests over real HTTP, plus the whole loop driven through the browser
against a disposable API:

| Step | Result |
|---|---|
| Request submitted through the public endpoint | 201 |
| Moved to review, then scheduled from the UI | `PATCH …/schedule` → **200** |
| Database read back | status «تم تحديد موعد», provider **set**, date **2026-11-20**, slot **15:45** |

Those last three fields were previously impossible to set through the API at all.

**273 tests / 28 suites, coverage 59.76%.**

**Phases 3–5 remain blocked on Q1–Q4** of `CONSULTANT_PORTAL_SCOPE.md`, and Q4 (what a consultant may
read of a beneficiary's written summary, and whether they see requests assigned to others) should be
answered in writing before any consultant-facing surface is built.

## Monitoring — row 46 ✅ THE VENDOR-INDEPENDENT HALF

**Before.** `GET /health` returned `{ message: 'ok' }` **unconditionally**. It checked nothing.
Confirmed against production: `{"data":{"message":"ok"}}`.

An uptime monitor pointed at that reports the platform healthy while PostgreSQL is down and every
request is failing. It is worse than having no monitor, because it converts an outage into silence,
and it is the first endpoint anyone wires an alert to.

And a 500 could not be traced. The unhandled-exception filter logged `Unhandled exception:` and a
stack — no method, no path, no actor, no id — into a pm2 log shared with three other applications on
the same box. A user reporting a failure gave you "sometime around lunchtime".

**Fix.**

- `/health` probes the database and answers **503** when it cannot be reached. The reason is
  deliberately **not** the driver's message: a Prisma connection error contains the datasource URL, and
  this endpoint is `@Public()` — reporting it verbatim would publish the database host, user and
  password to anyone who curls it during an outage.
- Every request carries an id: returned in `X-Request-Id`, honoured from an inbound header so a trace
  survives the proxy, and length-capped because it lands in log lines.
- The 500 body carries that id for the user to quote, and the log line is a single JSON object with
  method, path, actor id and type — identifiers only, never a name, phone or email.

**A second `PrismaClient`, found by testing rather than reading.** `bookings.module.ts` listed
`PrismaService` in its own `providers` while `PrismaModule` is `@Global()` and already exports it. So
there were **two clients with two connection pools** — Prisma sizes one at `cpus × 2 + 1` — roughly
double the connections for no benefit, against a PostgreSQL whose `max_connections` is shared with
three other applications. The symptom that exposed it: the health check reported the database *up*
while the instance the test had stubbed was rejecting, because they were not the same object.

**Retest.** 10 tests. Mutation-checked — a health check that cannot fail, reporting the raw driver
error, dropping request ids, and restoring the duplicate `PrismaClient` each fail exactly the tests
covering them, the last reproducing the original symptom. **283 tests / 29 suites, coverage 60.2%.**

**What is still the foundation's.** The vendor — Sentry, Datadog, Better Stack — is a purchasing and
privacy decision, not an engineering one, and nothing here presumes it. What was missing was the
groundwork any of them needs, which is useful without one: a health endpoint that tells the truth and
errors that can be found. Row 46 MISSING → **PARTIAL**; tally **71%**.

## T-09's last piece — the database enforces one live booking per slot ✅ DONE

**Before.** T-09 proved the *application* refuses a concurrent double-booking: two simultaneous
identical requests leave exactly one row, a five-way burst also leaves one. That guarantee lives in a
Serializable transaction inside `BookingsService`, which protects the one path that runs through it.
A duplicate arriving any other way — a future endpoint, a repair script, a hand-written `UPDATE` —
met nothing at all.

It was left unapplied for exactly one reason, recorded at the time: creating the index fails if the
table already holds duplicate non-cancelled rows, **and production could not be queried**. That
constraint disappeared the moment the read-only server check existed. Production holds **zero
bookings and zero duplicates**, so the index applies cleanly.

**Partial, not plain.** A cancelled booking keeps its row, so the `@@unique([providerId, date,
timeSlot])` originally recommended — and the only form Prisma can express — rejects every legitimate
rebooking after a cancellation. Removing the `WHERE` clause fails **three of seven tests**, which is
how that stays a fact rather than a claim in a comment.

**Not `CONCURRENTLY`:** it cannot run inside a transaction and Prisma wraps every migration in one.
The right call on a large live table; this one holds zero rows.

**Applied to production** in the deploy of `760d0f3` — `Applying migration
20260820103000_booking_slot_unique`. Known drift documented: Prisma cannot describe a partial index,
so `migrate diff` reports it as extra and would offer to drop it. It stays.

## A change made directly on production, and what it took with it

`0551560`, written on the server and in no repository, titled *"add TRUST_PROXY support"*. Its intent
was right and is live. But it was written against a checkout older than main, so the diff read as a
revert and removed three things unrelated to it:

1. `main.ts`'s call to `configureApp()`, re-inlining helmet, the prefix and CORS — the shared
   bootstrap that exists *because* main.ts and the QA environment had already drifted apart once.
2. `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_SERVICE_ACCOUNT_PATH` from the env schema, in the week
   push is being switched on.
3. **The T-11 production boot guard** — the `superRefine` that stops the app starting without a
   `WEBHOOK_SECRET` of at least 16 characters.

I read that diff twice and catalogued the first two. **Two tests caught the third.** A security guard
disappeared inside a commit titled "add TRUST_PROXY support", and the only thing that noticed was an
assertion that production refuses to boot without it.

Resolved as the client chose: the commit was merged to main through PR #9 with its authorship intact,
then the collateral restored in `2b95ed9`. The deploy now **mirrors origin** rather than pulling into
it — `git pull` refuses outright on divergent branches, which is what blocked every deploy behind this
— and prints what it discards rather than dropping it silently.

## 30 August — what taking the store screenshots found

Producing the Google Play assets meant running v1.7.0 end to end on a real device against
the live API. That had not been done before. Two things came out of it.

### The الاستشارات tab crashed on open — 100% of the time, for every real user

`mapConsultant` in `shared/src/api/mappers.ts` hard-coded `featured: false` for every
provider it mapped, discarding a `featured` column the API genuinely returns.
`ConsultationsScreen` then did:

```ts
const featured = getConsultants().find((c) => c.featured)!   // always undefined
```

and dereferenced `featured.name`. The `!` silenced the one compiler error that would have
caught it.

The reason nobody saw it: the bundled offline data in `shared/src/data.ts` **does** mark a
consultant featured, so the screen worked in every local run and every offline launch. It
only failed once the API answered — which is to say, always, in the hands of a user. The
tab rendered a full-screen error and the tab bar stopped responding.

Fixed in three places, all verified on the device afterwards:

- the mapper now carries `featured` through (and prefers the real `providers.sessions`
  column over `_count.bookings`);
- `ConsultationsScreen` falls back to the first consultant, and omits the featured card
  entirely when the API returns none;
- `BookingScreen` had the same shape (`?? getConsultants()[1]`, itself `undefined` for a
  list shorter than two) and was hardened too — it is registered as `Booking` but nothing
  navigates to it, so it was never a live crash.

Six tests in `shared/src/__tests__/consultantMapper.test.ts` cover it. Both were
mutation-checked: restoring `featured: false` fails one, restoring the `_count.bookings`
session count fails another.

### Nine screens still told the user the app was a demo — and most were lying

The donation summary carried «نسخة عرض — لا يتم تنفيذ أي عملية دفع فعلية» and the confirm
button read **«تأكيد التبرع (عرض)»**, on a flow that has been recording donations on the
server since T-13. A green panel underneath promised that «في النسخة التشغيلية يكون الدفع
آمناً ومشفّراً بالكامل … بعد تأكيد بوابة الدفع» — the same non-existent payment gateway that
had to be removed from the privacy policy.

Each claim was checked against what the screen actually does before being touched:

| Screen | Claim | Verdict |
|---|---|---|
| `DonateScreen` | demo, no payment, «(عرض)» button | **false** — `submitDonation()` posts, server assigns «قيد المراجعة» |
| `DonationSuccessScreen` | «إيصال تجريبي لغرض العرض فقط» | **false** — the reference comes from the server |
| `ReceiptsScreen` | «إيصالات تجريبية … لا تمثل عمليات دفع حقيقية» | **false** — `fetchMyDonations()` returns real records |
| `EmailAuthScreen` | «لا يُرسل أي بريد … ويُقبل أي رمز» | **false** — `requestOtp()` hits the server |
| `ConsultationRequestScreen` | «لم يُرسل لأي جهة … سيُمسح عند إغلاق التطبيق» | **false** — `submitConsultation()` posts to the dashboard inbox |
| `PaymentInfoScreen` | «لا يوجد اتصال بخادم أو بوابة دفع» | **half false** — no gateway is true, no server is not |
| `BookAppointmentScreen` | «لا يتم إرسال حجز فعلي» | **TRUE — kept** (see below) |
| `ConsultantDashboardScreen` | «التعديلات تُحفظ أثناء الجلسة الحالية فقط» | **TRUE — kept**, the portal is unbuilt |

All the false ones were corrected to describe what actually happens, keeping the client's
donation rules intact: no in-app payment, transfer externally, send the receipt on
WhatsApp, status stays «قيد المراجعة» until an admin approves. The two true notices were
left exactly where they are.

A dead **«تحميل الإيصال PDF»** button was also removed from the receipt screen. It set a
boolean and wrote nothing — no file, no PDF — then reported «تم حفظ الإيصال». The footer's
«مشاركة الإيصال» already shares the receipt for real, so nothing was lost.

### Still open: booking from the app never reaches the server

`BookAppointmentScreen.next()` ends the flow by generating a reference **locally** with
`makeBookingRef(Math.floor(Date.now() / 1000))` and navigating to a confirmation screen
that posts nothing. Its own comment says "Booking is created PENDING — the admin team
confirms it (dashboard)". Nothing is created anywhere.

This is the donation bug of T-13 — an invented reference and a confirmation for a record
that does not exist — still present in the **booking** flow. The backend has the endpoints,
the availability query and the `booking_slot_unique` constraint; the app simply never calls
them. The «لا يتم إرسال حجز فعلي» notice on that screen is accurate, and stays until the
flow is wired up.

### Booking from the app now reaches the server

Wiring only the POST would not have worked. `BookAppointmentScreen` read its service,
provider and category from `shared/src/services.ts` — a module whose own header says "All
mock data for now" — so the ids it held were `sv-psych` and `pr-tarek`, which the server
has never issued. A booking built from them is answered «الخدمة غير موجودة». The catalog
had to become real before the submit could be.

What changed:

- **`mapServiceCategory` / `mapProvider` / `mapCatalogService`** map the server's catalog
  onto the shapes the screens already render. The provider's working weekdays and slot
  labels are derived from its `schedules`, and a category icon the dashboard authored but
  Feather does not define (the live data has `people`) is aliased or falls back, rather
  than rendering as nothing.
- **`fetchServiceCategories` / `fetchProviders` / `fetchCatalogServices`** join the other
  hydrators in `mobile/src/store/content.ts`, with the bundled catalog kept as the offline
  fallback. `ServicesBrowse`, `ServiceDetail`, `ProviderDetail` and `BookingConfirmation`
  now resolve through the store instead of importing the mock arrays.
- **`fetchAvailability` is now typed and deliberately does NOT fall back.** Every other
  read in the package degrades to bundled data so a screen always renders; availability
  must not, because invented availability means either a booking the server refuses or one
  that collides with somebody's real appointment.
- **The date/time step is driven entirely by `GET /services/:id/availability`.** The old
  step derived days from the provider's weekly pattern and marked slots booked with
  `provider.slots.filter((_, i) => i % 3 === 1)` — literally every third slot struck through
  as «محجوز» whether or not anyone had booked it, while genuinely booked slots looked free.
- **The wizard's last step calls `submitBooking`.** The reference on the confirmation screen
  is the server's. A `SLOT_TAKEN` refusal reloads availability, clears the chosen time and
  returns the applicant to the picker; every other failure shows the server's Arabic
  message. There is no local fallback.
- `ConsultationsScreen`'s two buttons pointed at the literal id `'sv-psych'`; they now
  resolve one of the featured consultant's own services.
- `Button` grew a `disabled` prop so the confirm button cannot be pressed twice mid-flight.

Verified against a disposable, seeded QA environment (`npm run qa:env`) rather than
production — the environment binds to loopback and dies with its process, so no test row
was written to the live database. From the app on an emulator: the catalog loaded from the
API (real provider `أ. فاطمة حسن`), availability rendered the provider's real weekdays and
slots, and confirming produced booking **AS-6JN0SSZGTF20** — read back from the server as
`svc-3` / `provider-2`, `2026-08-30` `11:00`, status «قيد الانتظار», with
`extraFieldsJson: {preferredContact: واتساب}` and `userId: null` for a guest. The slot then
disappeared from the picker on re-entry, which is the availability query reflecting it.

Both 409s were exercised against the same server: a second booking of one slot returns
`SLOT_TAKEN` «هذا الموعد محجوز بالفعل، يرجى اختيار موعد آخر», and the same phone booking the
same service twice in a day returns `DUPLICATE_BOOKING`. Eight tests in
`shared/src/__tests__/bookingContract.test.ts` pin the payload shapes and that both codes
reach the caller; mutating `submitBooking` to swallow errors and invent a reference fails
three of them, and giving `fetchAvailability` a fallback fails another.

**One thing was not confirmed visually**: the rendering of the `SLOT_TAKEN` branch in the
app — the error banner and the bounce back to the picker. The emulator (software GPU, debug
build) began throwing input-dispatch ANRs under scripted typing before that walk could be
completed. The branch is four lines keyed on `api.code`, and both the server response and
`submitBooking`'s surfacing of it are covered; it is still worth one manual pass on a real
device.

Still not addressed: an admin is not notified when a booking arrives. `booking.created`
creates an in-app notification **only for a signed-in applicant** and nothing for staff, so
the confirmation screen's old claim «وصلك إشعار بالطلب، وتم إخطار فريق الإدارة» was corrected
to say the booking is registered and visible to the team for review.

## Status of the delivery decision

**NOT READY — REMAINING CORE TASKS**, but **every P0 is now closed**, including T-06, which was filed
as procurement and was not. What remains genuinely external is narrower than the audit stated:
production SMTP (delivery only — QA can complete an OTP login without it), the FCM key, and a host for
the staging environment.

Two things need the client before launch and neither is engineering work: **change the live admin
password** (done — the published credential now returns 401) and **set `TRUST_PROXY`** to the hop
count the nginx config implies. A third is now on the server list: **clear the failed `0_init`
migration** so deploys resume.

The headline figure is **71%**, down from a published 73% — see the two corrections at the top of
`PROJECT_COMPLETION_MATRIX.md`. Neither is a regression. One is arithmetic I got wrong; the other is
push notifications being counted as blocked on a credential when the feature was never built.
