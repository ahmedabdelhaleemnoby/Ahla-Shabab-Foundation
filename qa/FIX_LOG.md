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

## Corrections to the baseline audit

Two findings in the first report were wrong and are withdrawn/corrected:

1. **G-15 "dead code" — WITHDRAWN.** `dashboard/src/shared/` is aliased as `@ahla/shared` by
   both `vite.config.ts` and `tsconfig.json`. It is the live shared package, not a stray copy.
2. **"4 mutations" — CORRECTED to 6 wirable row actions.** The sweep regex missed
   `toggleUserBlock`, and `/admin/messages/:id` accepts a status. All are now wired.

## Status of the delivery decision

Unchanged: **NOT READY — REMAINING CORE TASKS.** Two P0 items are closed (T-01, T-03); four
remain (T-02 content CRUD, T-04 real mobile auth, T-05 `/me/*` wiring, T-06 credentials).
