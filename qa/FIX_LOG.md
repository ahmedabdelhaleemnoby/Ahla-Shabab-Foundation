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

## Corrections to the baseline audit

Two findings in the first report were wrong and are withdrawn/corrected:

1. **G-15 "dead code" — WITHDRAWN.** `dashboard/src/shared/` is aliased as `@ahla/shared` by
   both `vite.config.ts` and `tsconfig.json`. It is the live shared package, not a stray copy.
2. **"4 mutations" — CORRECTED to 6 wirable row actions.** The sweep regex missed
   `toggleUserBlock`, and `/admin/messages/:id` accepts a status. All are now wired.

## Status of the delivery decision

Unchanged: **NOT READY — REMAINING CORE TASKS.** Four P0 items are closed (T-01, T-02, T-03,
T-04); two remain — **T-05** (`/me/*` wiring) and **T-06** (credentials, which gates the
remaining verification).
