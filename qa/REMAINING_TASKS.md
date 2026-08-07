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

### T-07 · Fix consultation-type key mismatch + missing consent field
- Module Consultations · Backend+Data · High · Effort 1d · Files `backend/prisma/seed/**`, `src/cms/**`
- Backend seeds `psychological, legal, family, social, educational`; the app expects the five Arabic keys, and backend types carry **no consent field**. Evidence: `verify-api-layer.log`.
- **Acceptance** `verify-api-layer.ts` reports 47/47 with zero known defects.

### T-08 · Authorization test suite (RBAC 403 + IDOR)
- Module Security · Backend · High · Depends T-06 · Effort 2d
- **Acceptance** Automated tests prove: guest→401 on all `/me/*` and `/admin/*`; User A cannot read B's bookings/receipts/donations/notifications/favorites (404/403, never 200); each role gets 403 on modules outside its matrix.

### T-09 · Booking concurrency proof + DB constraint
- Module Bookings · Backend · High · Depends T-06 · Effort 1d
- Serializable transaction exists; add `@@unique([providerId, date, timeSlot])` as defence in depth and prove the race.
- **Acceptance** Two simultaneous identical bookings → exactly one 201, one 409.

### T-10 · Payment gateway end-to-end (sandbox)
- Module Payments · Backend · High · Depends T-06 · Effort 2.5d
- **Acceptance** Server-created payment, correct amount/currency, signed webhook accepted, **invalid signature rejected**, duplicate webhook idempotent, failed/cancelled handled; status only ever set server-side.

### T-11 · Harden webhook secret handling
- Module Payments · Backend · High · Effort 0.25d · File `src/donations/donations-webhook.controller.ts:87`
- Signature check is **skipped with a warning** when `WEBHOOK_SECRET` is unset. Must hard-fail in production.
- **Acceptance** Boot fails (or endpoint 503s) in `NODE_ENV=production` without the secret.

### T-12 · Fix backend test discovery + raise coverage
- Module Testing · Backend · High · Effort 2d
- `npm test` → *"No tests found (0 matches)"*. Add `testRegex` for `test/`, then cover auth, bookings, donations, RBAC.
- **Acceptance** `npm test` runs all suites in CI and fails the build on regression.

### T-13 · Admin notification broadcast wiring
- Module Notifications · Dashboard→API · High · Effort 1d · File `pages/Notifications.tsx`
- **Acceptance** Broadcast persists, appears in the user's in-app feed, respects preferences.

### T-14 · Manual transfer flow (proof upload → approval)
- Module Donations · Full stack · High · Depends T-03, T-06 · Effort 2d
- **Acceptance** User uploads proof → donation `قيد المراجعة` → only an authorized admin can approve → receipt issued → audit entry written.

### T-15 · Receipts: server-issued + ownership test
- Module Receipts · Backend+Mobile · High · Depends T-05 · Effort 1.5d
- **Acceptance** Receipt exists only after confirmed/approved payment; unique reference; **User A requesting B's receipt id → 403/404**.

### T-16 · Remove silent seed fallback in dashboard reads
- Module Admin · Dashboard · High · Effort 0.75d · File `store/useAdminRows.ts`
- **Acceptance** On API failure the page shows an explicit error/offline state — never mock rows presented as live data.

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
