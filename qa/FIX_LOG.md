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
