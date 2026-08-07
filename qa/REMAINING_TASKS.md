# REMAINING TASKS

Ordered in the exact sequence they should be executed. Effort is engineer-days for one
mid/senior full-stack engineer familiar with this codebase.

**Totals — 24 tasks: P0 ×6 (11.5d) · P1 ×9 (16d) · P2 ×6 (8d) · P3 ×3 (3d) → ≈ 38.5 engineer-days.**

---

## P0 — blocks delivery (6 tasks, ≈11.5d)

### T-01 · Generate the Prisma baseline migration
- **Module** Database · **Layer** Backend · **Severity** Critical · **Depends on** none · **Effort** 0.5d
- **Files** `backend/prisma/migrations/**`, `package.json`
- **Why** `prisma/migrations/` does not exist. Production schema is only reproducible by `db push`; there is no reviewable history and no safe forward path.
- **Acceptance** `prisma migrate deploy` builds the schema from empty on a clean DB; `migrate status` clean; CI runs it.

### T-02 · Wire the dashboard write path (content + services)
- **Module** Admin · **Layer** Dashboard→API · **Severity** Critical · **Depends on** none · **Effort** 3d
- **Files** `dashboard/src/store/adminApi.ts`, `pages/Content.tsx`, `pages/Services.tsx`, `pages/Settings.tsx`
- **Why** G-01/G-02 — admin edits never persist. Backend already exposes 19 `/admin/portfolio/*` + services/categories routes.
- **Acceptance** Create/edit/delete/publish a case, project, article, service and category → row persists after refresh; failures surface a toast, not a silent local write.

### T-03 · Call the 4 existing status mutations
- **Module** Admin · **Layer** Dashboard→API · **Severity** Critical · **Depends on** T-02 · **Effort** 0.5d
- **Files** `pages/Bookings.tsx`, `pages/Donations.tsx`, `pages/Inbox.tsx`
- **Why** `updateBookingStatus`, `updateDonationStatus`, `updateVolunteerStatus`, `updateConsultationStatus` exist but **no page imports them**.
- **Acceptance** Approving a donation / confirming a booking / changing a volunteer status persists and appears in the audit log.

### T-04 · Replace simulated mobile login with real email OTP
- **Module** Auth · **Layer** Mobile→API · **Severity** Critical · **Depends on** T-06 · **Effort** 3d
- **Files** `mobile/src/screens/EmailAuthScreen.tsx`, `OtpScreen.tsx`, `store/appState.ts`, `store/demoUsers.ts`
- **Why** G-04 — any 6-digit code logs in; no JWT ⇒ no `/me/*` feature can work.
- **Acceptance** Request OTP → receive email → wrong code rejected → correct code returns access+refresh → token stored → `GET /me` returns the profile → logout revokes.

### T-05 · Wire mobile account features to `/me/*`
- **Module** User flows · **Layer** Mobile→API · **Severity** Critical · **Depends on** T-04 · **Effort** 3d
- **Files** `mobile/src/screens/{MyBookings,DonationHistory,Receipts,Favorites,Notifications,NotificationPreferences}.tsx`, `store/appState.ts`
- **Why** Seven screens show believable local demo data instead of the user's real records (N-02).
- **Acceptance** Each screen renders server data with loading/empty/error states; no local fallback for user-scoped data.

### T-06 · Provision credentials & a safe test environment
- **Module** Ops · **Layer** External · **Severity** Critical · **Depends on** none · **Effort** 1.5d (mostly waiting)
- **Why** Unblocks E-01…E-05: SMTP + test inbox, `WEBHOOK_SECRET`, payment sandbox, FCM key, and one admin + two user tokens on staging.
- **Acceptance** A staging environment with seeded data and issued tokens that QA can hit without touching production.

---

## P1 — must complete before production (9 tasks, ≈16d)

### T-07 · Fix consultation-type key mismatch + missing consent field — ✅ DONE & VERIFIED LIVE
- Module Consultations · Backend+Data · High · Effort 1d · Files `backend/prisma/seed/**`, `src/cms/**`
- Backend seeds `psychological, legal, family, social, educational`; the app expects the five Arabic keys, and backend types carry **no consent field**. Evidence: `verify-api-layer.log`.
- **Third defect, not in the original finding:** the consent box was typed `checkbox`, and the app
  renders `checkbox` from `options` — which the consent field has none of. An API-driven form would
  have shown a **required agreement with nothing to tick and no way to submit**. Nothing broke only
  because `cmsMapper.isFullFidelity()` rejects such a type; the silent cost was that **no
  consultation form edited in the dashboard could ever reach the app**.
- **Done** canonical `src/cms/default-consultation-types.ts` generated from the shared defaults;
  seed imports it; **new CMS migration 10 → 11** repairs already-deployed rows (8 → 9 left intact
  on purpose); `CMS_SCHEMA_VERSION` → 11; seed stops hardcoding the version; Swagger example fixed.
  Backend 63 tests / shared 43 tests pass. Evidence `final-delivery-audit/api/T-07-consultation-contract.md`.
- **Acceptance** `verify-api-layer.ts` reports 47/47 with zero known defects — **MET**. Deployed
  (run `31205490644`) and re-run against live: **45/47 → 47/47**, the known-defects block is gone.
  The live API serves the five Arabic keys with `consent`-typed required fields, disclaimers, and
  options on every choice field. CI on the same commit: 63 tests / 6 suites. Row 24 → **PASS**.

### T-17 · Every deploy overwrites admin-authored data — ✅ DONE & PROVEN ON A REAL DATABASE
- Module CMS · Backend/Deploy · **High** · Effort 0.25d · Files `prisma/seed/**`
- `deploy.yml` runs `prisma db seed` on **every** push to `main`, and Prisma's `upsert` applies its
  `update:` branch to existing rows. **Seven** seeds carried a populated one — wider than the CMS:
  the whole CMS document, **`Role.permissionsJson`** (a role an admin had *tightened* was widened
  back to defaults — a security regression, not merely lost content), category/service/provider/FAQ/
  foundation-stat text, and provider **rating/reviews**, which are derived values.
- **Done** `prisma/seed/seed-mode.ts` adds `preserve()`: the seed now creates what is missing and
  leaves what exists alone, unless `SEED_OVERWRITE_CONTENT=true` is explicitly set. `logSeedMode()`
  states which mode ran. Structural changes still reach production via the CMS migrations
  (backfill-on-read) — *seeds initialise, migrations repair*. 67 tests / 7 suites pass.
- **Acceptance** A CMS edit made in the dashboard survives a deploy — **MET**, verified on a
  throwaway PostgreSQL 15 cluster: four admin edits (CMS `appName`, role permissions, an FAQ, the
  consultation list) survived a re-seed, while the same re-seed **with the flag set destroyed all
  four** — proving both the fix and the original data loss. A fresh database still seeds completely
  (27 governorates, 4 roles with permissions, 15 categories, 5 canonical consultation types, v11).
  Evidence `final-delivery-audit/database/T-17-seed-preserves-admin-edits.md`.
- **Note** deploys no longer refresh bundled content on existing rows. To push updated defaults
  deliberately, run one deploy with `SEED_OVERWRITE_CONTENT=true` (it resets admin edits), or make
  the change in the dashboard — now the durable path.

### T-08 · Authorization test suite (RBAC 403 + IDOR)
- Module Security · Backend · High · Depends T-06 · Effort 2d
- **Acceptance** Automated tests prove: guest→401 on all `/me/*` and `/admin/*`; User A cannot read B's bookings/receipts/donations/notifications/favorites (404/403, never 200); each role gets 403 on modules outside its matrix.

### T-09 · Booking concurrency proof + DB constraint — ✅ PROVEN (constraint recommended, not applied)
- Module Bookings · Backend · High · ~~Depends T-06~~ · Effort 1d
- **"Depends T-06" was a misreading** — proving a race needs a *database*, not credentials. Done via
  the disposable-Postgres harness.
- **Acceptance** two simultaneous identical bookings → exactly one 201, one 409 — **MET**: two
  concurrent requests leave exactly **1 row** with the loser receiving `SLOT_TAKEN`; a **five-way
  burst** also leaves 1. Cancel-then-rebook still works.
- **Defect found by running it for real** a Postgres serialization failure (Prisma **P2034**) was
  unmapped, so under heavier concurrency the loser got a **500** instead of a 409. Now converted to
  `SLOT_TAKEN`; deliberately not retried.
- **⚠️ The recommended `@@unique([providerId, date, timeSlot])` would BREAK a working feature.**
  Cancelled bookings keep their rows, so cancel-and-rebook legitimately produces two rows for one
  slot. A plain unique constraint rejects the rebooking. The correct form is a **partial** index
  (`WHERE status <> 'ملغي'`), which Prisma cannot express natively — SQL is in the evidence file.
  Not applied: it needs raw SQL and will fail if production holds duplicate non-cancelled rows,
  which cannot be checked without database access. **Recommended, after that check.**
- Evidence `final-delivery-audit/database/T-09-and-integration-harness.md`.

### T-10 · Payment gateway end-to-end (sandbox)
- Module Payments · Backend · High · Depends T-06 · Effort 2.5d
- **Acceptance** Server-created payment, correct amount/currency, signed webhook accepted, **invalid signature rejected**, duplicate webhook idempotent, failed/cancelled handled; status only ever set server-side.

### T-11 · Harden webhook secret handling — ✅ DONE
- Module Payments · Backend · High · Effort 0.25d · File `src/donations/donations-webhook.controller.ts`
- ~~Signature check is **skipped with a warning** when `WEBHOOK_SECRET` is unset.~~
  **This finding was wrong.** Line 87 is the warning; a production branch throwing 503 already sat
  three lines above it, added in `d420546` *before* the audit baseline. A live probe also disproved
  the related claim that production had no secret — an unsigned call returns **401**.
- **Real gaps found and fixed instead:** the bypass keyed on `NODE_ENV !== 'production'` while
  `NODE_ENV` **defaults to `'development'` when unset**, so a deploy that forgot it left the route
  public; and production could boot with no secret at all.
- **Acceptance** Boot fails (or endpoint 503s) in `NODE_ENV=production` without the secret — **met**:
  boot now fails, and the endpoint fails closed in every configuration except an explicit
  `ALLOW_UNSIGNED_WEBHOOKS=true` outside production. 15/15 tests, mutation-checked.
  Evidence `final-delivery-audit/security/T-11-webhook-hardening.md`.
- **⚠️ Before the next deploy** confirm the live `WEBHOOK_SECRET` is ≥16 chars, or production will
  refuse to start. Its length could not be verified from outside.
- **Not covered** the *effect* of a signed callback (donation → paid → receipt) — that is T-10, still
  BLOCKED on a payment sandbox.

### T-12 · Fix backend test discovery + raise coverage — ✅ DONE (further coverage needs a test DB)
- Module Testing · Backend · High · Effort 2d · ~1.5d remaining
- `npm test` → *"No tests found (0 matches)"*. Add `testRegex` for `test/`, then cover auth, bookings, donations, RBAC.
- **Root cause was worse than stated:** the repo had **no Jest configuration at all**, and
  **no automated test gate anywhere** — `deploy.yml` is the only workflow, it fires on push to
  `main`, and it runs `nest build` over SSH **on the production server**. Tests ran nowhere; a
  compile error's first audience was production.
- **Done** `jest.config.js` discovering `src/**/*.spec.ts` + `test/**/*.e2e-spec.ts`; script split
  (`test`, `test:unit`, `test:cov`, `test:ci`, `test:e2e`); new `.github/workflows/ci.yml`
  (install → prisma generate → build → test, on push and PR); coverage ratchet at the measured
  baseline; **11-case unit spec for `RolesGuard`**, previously untested.
  **57 tests / 6 suites pass.** Evidence `final-delivery-audit/logs/T-12-test-discovery.md`.
- **Acceptance** `npm test` runs all suites in CI and fails the build on regression — **met**:
  verified that a coverage drop exits 1 and an empty suite exits 1 rather than passing quietly.
- **Second half done** coverage aimed at risk, not file size: `auth.service` (17 cases — OTP wrong/
  expired/locked-out never issues tokens, the code is consumed on success but **not** on a typo,
  refresh rotation is single-use, a **disabled admin cannot refresh back in**, and
  `Test@Example.COM` / `  test@example.com  ` prove **one account** — matrix row 16) and
  `users.service` (8 cases — every `/me/*` read carries `userId`, so the one-line IDOR mistake is
  caught). **Mutation-checked**: deleting each guard fails exactly its own test.
  **101 tests / 10 suites**; statements 16.34% → **20.71%**, functions 8.73% → **13.22%**; ratchet
  raised to 20/19/13/20. Evidence `final-delivery-audit/logs/T-12-coverage-round-2.md`.
- **Toolchain defect found** `uuid@14` is ESM-only, so Jest's CJS runtime could not load any service
  importing it. Nothing caught it because no test had ever reached that code. Fixed by transforming
  the package rather than stubbing it.
- **Still open (~1d, not blocked)** coverage is 20.71%, which is not healthy. The remainder
  (`reports.service` 205 stmts, `cms`, `portfolio`, `donations`, `bookings`) needs a **disposable
  Postgres in CI** — the pattern already proven twice here in T-01 and T-17 — not more mocks. For
  reports especially, the audit rule is *"never mark reports completed until values are compared
  against database data"*, which mocks cannot satisfy.
- **Decision left to the maintainers** `ci.yml` does not gate the deploy. Adding `needs: [test]`
  to `deploy.yml` is one line, but it would block releases on a red suite — a release-policy call,
  not something to impose as a side effect of adding CI. Recommended.

### T-13 · Admin notification broadcast wiring — ✅ CLIENT DONE, verification BLOCKED
- Module Notifications · Dashboard→API · High · Effort 1d · File `pages/Notifications.tsx`
- **Acceptance** Broadcast persists, appears in the user's in-app feed, respects preferences.
- **Done** Composer rewritten against `POST /admin/notifications/broadcast` (3 segments,
  governorate picker, real `{sent,total}`, error banner). See `FIX_LOG.md` + evidence
  `final-delivery-audit/api/T-13-broadcast-verification.md`.
- **Still open (needs T-06 staging)** the acceptance clause itself — delivery to the feed,
  FCM fan-out, preference filtering. The send was **not executed on production**: `segment:'all'`
  would notify every real user. Remaining effort ≈ 0.25d once staging exists.

### T-14 · Manual transfer flow (proof upload → approval)
- Module Donations · Full stack · High · Depends T-03, T-06 · Effort 2d
- **Acceptance** User uploads proof → donation `قيد المراجعة` → only an authorized admin can approve → receipt issued → audit entry written.

### T-15 · Receipts: server-issued + ownership test
- Module Receipts · Backend+Mobile · High · Depends T-05 · Effort 1.5d
- **Acceptance** Receipt exists only after confirmed/approved payment; unique reference; **User A requesting B's receipt id → 403/404**.

### T-16 · Remove silent seed fallback in dashboard reads — ✅ DONE & VERIFIED IN A BROWSER
- Module Admin · Dashboard · High · Effort 0.75d · File `store/useAdminRows.ts`
- `useAdminData` **discarded `error` entirely**, so Overview/Reports/Roles computed totals from
  fabricated rows and presented them as live figures on a failed load.
- **Removing the fallback exposed worse fabrications that lied even on a SUCCESSFUL load:** a
  hardcoded weekly chart (`[4,7,5,9,6,8]`), invented ▲12%/▲8% trend arrows, a provider count read
  from the bundled seed (reported **10** on an empty database), and a sidebar showing
  `donorProfile.name` ("أحمد محمد") as the signed-in admin. All four are fixed.
- **Done** seed parameter **removed** from the hook (not ignored) across all 20 call sites;
  `useAdminData` returns state so `error` cannot be dropped; banners added to Overview/Reports/Roles;
  weekly chart derived from real bookings; provider data from `fetchAdminProviders`; sidebar uses
  `auth.getAdmin()`; failure copy reworded from «تُعرض بيانات تجريبية» to «لم تُعرض أي بيانات»;
  10 dead seed imports pruned. Bundle 419.27 → **405.95 kB**.
- **Acceptance** On API failure the page shows an explicit error/offline state — never mock rows
  presented as live data — **MET**, verified in a browser with a failing API: banner shown, all
  counts 0, «لا توجد حجوزات مطابقة», and **0 bundle hits** for every fabricated row id/name.
  Evidence `final-delivery-audit/reports/T-16-no-silent-seed-fallback.md`.

### T-18 · Reference data (and one whole page) off bundled seeds — ✅ DONE & VERIFIED
- Module Admin · Dashboard · **P2** · Effort 0.5d · Files `pages/*`, `store/useReference.ts`
- **Scope grew twice on inspection.** Beyond the filters: (1) `Reports.tsx` rendered
  **«نسب تمويل الحالات والمشروعات المنشورة»** from the **bundled `cases`/`projects` arrays** —
  invented raised/target fundraising totals shown as live figures, the most damaging number a
  charity dashboard can fake — and counted providers from the seed; (2) **`Providers.tsx` never
  called the API at all**: rows came from the seed and create/edit/toggle produced
  `pr-${Date.now()}` ids that vanished on refresh (the same G-01/G-02 defect T-02/T-03 fixed
  elsewhere, missed by the audit); (3) `blankService()` defaulted `providerId` to a **bundled seed
  id that was then POSTed to the server**.
- **Done** new `useGovernorateNames()` (public `GET /governorates`, empty rather than bundled on
  failure); filters + the case-editor governorate select from the API; Reports on live
  cases/projects/providers with a divide-by-zero guard; Providers wired to `/admin/providers` with
  create/update/toggle persisting and rolling back; typed `AdminProviderRow`; Donations' payment KPI
  from the CMS document. `rating`/`reviews` deliberately never sent — derived server-side.
- **Acceptance** Filter options are sourced from the API — **MET**, verified in a browser: with
  reads failing all three Bookings filters collapse to their "all" option (were 5/11/28 bundled),
  and Providers reads **مقدمو الخدمة (0)** with an error (was 4 fabricated providers). The public
  governorates endpoint was confirmed through a temporary proxy to return 27 rows of `{id,name}` —
  exactly what the hook maps. Bundle 419.27 → **399.66 kB** across T-16+T-18.
  Evidence `final-delivery-audit/reports/T-18-reference-data-from-api.md`.

### T-19 · Provider scheduling — ✅ DONE (round-trip proof BLOCKED on T-06)
- Module Admin · Dashboard→API · **P2** · Effort 1d · Files `pages/Providers.tsx`, `store/adminApi.ts`
- The editor spoke a model the API cannot express: day indexes plus Arabic slot labels, against a
  server that keeps **one range per weekday** (`@@unique([providerId, weekday])`) and steps it by
  `slotMinutes`. Picking 9 ص and 6 م would have collapsed to `09:00 → 18:00`, silently opening every
  hour between — slots the admin never chose. That is why T-18 disclosed it instead of half-wiring.
- **Done** editor rebuilt on ranges (day toggle + start + end + slot length) with a live «N موعد»
  count; blocked dates add/remove via the detail route; `updateProviderSchedule`,
  `addUnavailableDate`, `removeUnavailableDate`, `fetchAdminProvider` added; provider cards show the
  real schedule. Save order: identity → schedule → blocked-date diffs.
- **Backend gap closed in passing** `UpdateScheduleSchema` validated each field but never the pair,
  so `17:00 → 09:00` stored fine and yielded zero bookable slots — a provider that looks scheduled
  and can never be booked. Now rejected server-side as well as in the editor.
- **Acceptance** *persists and drives real booking availability* — **half met, half BLOCKED.** The
  editor writes exactly the shape the booking engine consumes: 9 contract tests against the real DTO,
  and the UI's slot count matches `generateTimeSlots` across 7 cases (remainder, zero-span,
  inverted). Live: enabling الإثنين gives `09:00–17:00`/60m → «8 موعد»; an inverted range shows
  «0 موعد» and **blocks the save**. Not executable here: the round trip (save as a signed-in admin,
  then read `GET /providers/:id/availability`) — no admin token exists (**T-06**). A five-minute
  check once staging exists. Backend suite **76 / 8 suites**.
  Evidence `final-delivery-audit/reports/T-19-provider-scheduling.md`.

---

## P2 — important (6 tasks, ≈8d)

- **T-17 · Consultant/provider dashboard UI** (Module Consultant · 3d) — backend `/me/provider` exists; build schedule, unavailable dates, assigned bookings, form answers, status actions. **Acceptance:** Consultant A cannot see Consultant B's data.
- **T-18 · Audit-log verification** (Backend · 1d) — prove an entry with actor/action/entity/prev/new/ip/UA is written for content update, booking change, donation approval, role and settings updates.
- **T-19 · Runtime navigation tap-through** (Mobile QA · 1d) — every button on all 40 routes at 320/390/430/tablet; zero dead buttons; fill `02_NAVIGATION_MATRIX.md` actual column.
- **T-20 · Reports vs SQL reconciliation** (Backend · 1d) — dashboard totals must equal direct queries; verify date filters and exports.
- **T-21 · Media upload hardening** (Backend · 1d) — reject fake extensions/executables, sanitize SVG, strip EXIF, enforce size/dimensions; CMS media must upload to the server, not localStorage.
- **T-22 · Monitoring + structured logging** (Ops · 1d) — Sentry (or equivalent) in backend + both clients; alert on 5xx.

## P3 — polish (3 tasks, ≈3d)

- **T-23 · Repo hygiene** (0.5d) — resolve the two divergent monorepo clones (D-01); delete the vendored dead `dashboard/src/shared/api/` (G-15); refresh stale `TODO(backend)` comments that describe endpoints which now exist (G-14).
- **T-24 · Type debt** (1.5d) — reduce 67 backend / 16 dashboard `: any`; remove 2 `console.log`.
- **T-25 · Responsive/RTL re-verification** (1d) — re-run the 320/390/430/tablet + dashboard breakpoint sweep against this build and attach screenshots.
