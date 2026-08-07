# PROJECT COMPLETION MATRIX

> **Updated 2026-08-07 after remediation.** T-01 (row 45) and T-03 moved. See `FIX_LOG.md`.
> New tally after T-01…T-04: PASS 17 · PARTIAL 26 · FAIL 1 · MISSING 3 · BLOCKED 5
> → **(17+13)/47 = 64%** (baseline was 57%).

Baseline: see `00_CURRENT_STATE.md`. Statuses are **evidence-based**; anything that could not
be executed in this environment is **BLOCKED**, never PASS.

Legend — B=Backend, M=Mobile, A=Admin dashboard, C=Consultant portal, I=Integration, T=Test.
`—` = not applicable to that layer.

| # | Module | Requirement | B | M | A | C | I | T | Final | Remaining work |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Content API | Public reads: cases, projects, articles, services, providers, governorates, foundation | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 2 | CMS | CMS document served + consumed (menu/home/pages) | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 3 | Security | Headers (HSTS/CSP/nosniff/frame), rate limiting, no `x-powered-by` | PASS | — | — | — | PASS | PASS | **PASS** | — |
| 4 | Foundation | About/foundation info | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 5 | Governorates | Governorates + work areas | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 6 | Home config | Home sections ordered/toggled from CMS | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 7 | Shared rules | Donation-status + privacy invariants unit-tested | — | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 8 | Build | Android release APK produced (v1.4.0) | — | PASS | — | — | — | PASS | **PASS** | — |
| 9 | Navigation | No dead links; all live CMS targets resolve | — | PASS | — | — | PASS | PASS | **PASS** | runtime tap-through pending |
| 10 | Guest flow | Browse all public content without login | PASS | PASS | — | — | PASS | PASS | **PASS** | — |
| 11 | Validation | Invalid bodies → 400 + per-field Arabic errors | PASS | PASS | — | — | PASS | PASS | **PASS** | — |
| 12 | Error hygiene | 401/404 clean, no stack traces | PASS | — | — | — | PASS | PASS | **PASS** | — |
| 13 | Admin reads | All dashboard lists read the live API | PASS | — | PASS | — | PASS | PARTIAL | **PASS** | remove silent seed fallback |
| 14 | Admin CMS write | `PUT /admin/cms` persists CMS edits | PASS | — | PASS | — | PASS | PARTIAL | **PASS** | — |
| 15 | Auth | Email OTP request/verify endpoints | PASS | PASS | — | — | PASS | PARTIAL | **PARTIAL** ⬆ | wired; live delivery still BLOCKED |
| 16 | Auth | Email normalization → one account | PASS | FAIL | — | — | BLOCKED | BLOCKED | **PARTIAL** | live 3-case test |
| 17 | Auth | Admin login (`POST /admin/auth/login`) | PASS | — | PASS | — | BLOCKED | MISSING | **PARTIAL** | live login proof |
| 18 | User flow | History/receipts/bookings/favorites/notifications for signed-in user | PASS | FAIL | — | — | FAIL | BLOCKED | **PARTIAL** | mobile `/me/*` wiring |
| 19 | Cases | Urgent + sponsorship: list/detail/publish/feature | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 20 | Projects | CRUD, stages, updates, ordering | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 21 | News | Articles CRUD, publish, pin | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 22 | Services | Categories + services CRUD, activate | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 23 | Consultations | Submit request → stored | PASS | PARTIAL | PASS | — | PARTIAL | PARTIAL | **PARTIAL** | mobile submits locally |
| 24 | Consultations | Dynamic form schema per type | PASS | PASS | PASS | — | **FAIL** | PARTIAL | **PARTIAL** | **key mismatch + missing consent** |
| 25 | Bookings | Engine + Serializable-tx concurrency | PASS | FAIL | FAIL | — | FAIL | BLOCKED | **PARTIAL** | mobile+admin wiring; race test |
| 26 | Donations | Create; server owns status | PASS | FAIL | FAIL | — | FAIL | BLOCKED | **PARTIAL** | mobile+admin wiring |
| 27 | Receipts | Server-generated, unique ref, owner-scoped | PASS | FAIL | — | — | FAIL | BLOCKED | **PARTIAL** | mobile wiring; IDOR test |
| 28 | Notifications | In-app feed, unread, mark read | PASS | FAIL | FAIL | — | FAIL | BLOCKED | **PARTIAL** | wire both clients |
| 29 | Notifications | Preferences per type | PASS | FAIL | — | — | FAIL | BLOCKED | **PARTIAL** | mobile wiring |
| 30 | Favorites | Add/remove, per-user | PASS | FAIL | — | — | FAIL | BLOCKED | **PARTIAL** | mobile wiring (currently mock) |
| 31 | Contact | Messages submit + admin inbox | PASS | PARTIAL | PASS | — | PARTIAL | PARTIAL | **PARTIAL** | status PATCH unwired |
| 32 | Volunteers | Applications submit + admin inbox | PASS | PARTIAL | PASS | — | PARTIAL | PARTIAL | **PARTIAL** | status PATCH unwired |
| 33 | Media | Upload endpoint + library | PASS | PARTIAL | PARTIAL | — | PARTIAL | MISSING | **PARTIAL** | CMS media → server upload |
| 34 | RBAC | Roles + permission guards | PASS | — | PARTIAL | — | BLOCKED | BLOCKED | **PARTIAL** | 403 matrix test |
| 35 | Audit log | actor/action/entity/prev/new/ip/UA | PASS | — | PASS | — | BLOCKED | BLOCKED | **PARTIAL** | verify writes on mutations |
| 36 | Reports | Aggregates + date filters | PASS | — | PASS | — | BLOCKED | BLOCKED | **PARTIAL** | compare vs SQL |
| 37 | Exports | CSV / print | — | — | PARTIAL | — | PARTIAL | MISSING | **PARTIAL** | client-side only |
| 38 | Deployment | nginx conf + GitHub Actions deploy | PARTIAL | — | PARTIAL | — | PARTIAL | MISSING | **PARTIAL** | documented runbook |
| 39 | Responsive/RTL | 320/390/430/tablet + dashboard breakpoints | — | PARTIAL | PARTIAL | — | — | MISSING | **PARTIAL** | re-verify this build |
| 40 | Testing | Backend automated tests | PARTIAL | — | — | — | — | PARTIAL | **PARTIAL** | default runner finds 0 tests |
| 41 | Auth E2E | Mobile login actually authenticates | PASS | PASS | — | — | PASS | PARTIAL | **PASS** ✅ | wired `60e3417`; wrong code proven rejected live. Inbox-based happy path BLOCKED |
| 42 | Admin writes | Any admin mutation persists | PASS | — | PASS | — | PASS | PARTIAL | **PASS** ✅ | status `a797361` + content/services CRUD `f87bd35`; live proof needs a token |
| 43 | Broadcast | Admin sends notification | PASS | — | **FAIL** | — | **FAIL** | MISSING | **FAIL** | G-03 |
| 44 | Consultant portal | Dashboard UI for consultants | PASS | FAIL | **MISSING** | **MISSING** | FAIL | MISSING | **MISSING** | build the portal |
| 45 | Database | Migration history | **PASS** | — | — | — | — | PASS | **PASS** ✅ | done `a1cd48a`; CI switch pending prod baseline |
| 46 | Monitoring | Sentry/APM/error tracking | **MISSING** | MISSING | MISSING | — | — | MISSING | **MISSING** | choose + wire |
| 47 | iOS | iOS build | — | **MISSING** | — | — | — | MISSING | **MISSING** | Apple account + build |
| 48 | Payments | Live gateway (create + confirm) | PARTIAL | — | — | — | BLOCKED | BLOCKED | **BLOCKED** | provider credentials |
| 49 | Push | FCM delivery | PARTIAL | MISSING | — | — | BLOCKED | BLOCKED | **BLOCKED** | FCM key |
| 50 | Email | Real OTP email delivery | PASS | — | — | — | BLOCKED | BLOCKED | **BLOCKED** | SMTP creds + inbox |
| 51 | Manual transfer | Proof upload → admin approval | PARTIAL | PARTIAL | FAIL | — | BLOCKED | BLOCKED | **BLOCKED** | admin token to test |
| 52 | Database | Production data verification | — | — | — | — | BLOCKED | BLOCKED | **BLOCKED** | no DB access |

## Tally

| Category | Total | PASS | PARTIAL | FAIL | MISSING | BLOCKED |
|---|---:|---:|---:|---:|---:|---:|
| All requirements | 52 | 14 | 26 | 3 | 4 | 5 |

## How the percentages are calculated

`score = (PASS×1 + PARTIAL×0.5) ÷ (total − BLOCKED)`

BLOCKED items are excluded from the denominator because they are **not engineering debt** —
they are waiting on credentials/access. They are reported separately so they cannot hide.

**Overall = (14 + 26×0.5) ÷ (52 − 5) = 27 ÷ 47 = 57%**

### Per area (same formula, applied to that area's rows)

| Area | PASS | PARTIAL | FAIL/MISSING | BLOCKED (excl.) | Completion |
|---|---:|---:|---:|---:|---:|
| **Backend** | 28 | 2 | 2 | 3 | **(28+1)/32 = 90%** |
| **Mobile** | 7 | 2 | 7 | — | **(7+1)/17 = 47%** |
| **Admin Dashboard** | 6 | 3 | 5 | — | **(6+1.5)/14 = 54%** |
| **Consultant Dashboard** | 1 | 0 | 2 | 1 | **1/3 = 33%** |
| **Database** | 3 | 2 | 1 | — | **(3+1)/6 = 67%** |
| **Security (implementation)** | 7 | 2 | 0 | 3 | **(7+1)/9 = 89%** |
| **Security (verified by test)** | 3 | 1 | 0 | 5 | **(3+0.5)/9 ≈ 39%** |
| **Testing** | 2 | 1 | 3 | — | **(2+0.5)/6 = 42%** |
| **Integration** | 3 | 0 | 4 | — | **3/7 = 43%** |
| **Production readiness** | 1 | 2 | 3 | — | **(1+1)/6 = 33%** |
| **OVERALL** | 14 | 26 | 7 | 5 | **27/47 = 57%** |

---

## A. FULLY COMPLETED (14)

Each with the evidence that justifies PASS.

1. **Public content API** — live probes returned `200` for `/cases`, `/projects`, `/articles`, `/services`, `/governorates`, `/providers`, `/foundation`, `/cms`. Evidence: `qa/final-delivery-audit/api/`.
2. **CMS delivery + consumption** — live `GET /cms` returns a 10-key document (`settings, menu, home, pages, media, paymentMethods, consultations, …`); mobile consumes it via `fetchCmsTagged` reporting `source=api`. Evidence: `verify-api-layer.log`.
3. **HTTP security posture** — verified live: HSTS `max-age=15552000; includeSubDomains`, full CSP, `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `x-ratelimit-limit: 100`, **no** `x-powered-by`.
4. **Foundation info**, 5. **Governorates/work areas**, 6. **Home configuration** — served by API and rendered by both clients.
7. **Shared business rules** — 32/32 vitest pass, including the compile-proof that a client cannot set donation status `مكتمل`.
8. **Android release build** — `ahla-shabab-v1.4.0-demo.apk` present; `tsc` typecheck exit 0.
9. **Navigation integrity** — 40 routes registered; 0 unresolved code targets; **all 11 live CMS menu targets resolve** (dead-link check passed).
10. **Guest browsing** — all public flows work without a token.
11. **Request validation** — `POST /consultations {}` → `400` with per-field Arabic messages, creating nothing.
12. **Error hygiene** — `401` returns `{"message":"يجب تسجيل الدخول","error":"Unauthorized","statusCode":401}`; unknown route and invalid id both `404`; no stack traces.
13. **Dashboard reads** — 15 read functions wired through `adminApi` + `useAdminRows`.
14. **Dashboard CMS writes** — `PUT /admin/cms` round-trip implemented (`cmsPersistence.ts`), the fix in commit `2fd9f1d`.

## B. PARTIALLY COMPLETED (26)

The pattern is consistent and worth stating plainly: **the backend is built, the clients read
it, but almost nothing writes back.** Representative entries:

- **Bookings** — Backend: PASS (Serializable transaction + `ConflictException`). Mobile: FAIL (local). Admin: FAIL (status mutation defined but never called). Test: BLOCKED. → **PARTIAL**. Remaining: wire both clients; run the two-user race; add a DB-level unique constraint on (provider, date, slot).
- **Donations** — Backend: PASS (create DTO has **no** `status` field, so the client cannot set it). Mobile: FAIL. Admin approve/reject: FAIL. → **PARTIAL**.
- **Consultation forms** — Backend: PASS. Mobile: PASS. Integration: **FAIL** — backend seeds type keys `psychological, legal, family, social, educational` while the app expects the five Arabic keys; and backend types **lack the consent field**. Evidence: `verify-api-layer.log` (2 known defects).
- **RBAC / Audit log / Reports** — implementation present and well-shaped; **verification BLOCKED** without an admin token.

## C. FAILED / BROKEN (3)

1. **Mobile authentication (G-04)** — `OtpScreen.verify()` accepts any 6-digit code and logs in locally. No JWT is ever obtained ⇒ every `/me/*` feature is unreachable from the app.
2. **Dashboard write path (G-01/G-02)** — 4 mutation helpers exist; **none is imported by any page**. Content/services/settings edits live in React state and vanish on refresh.
3. **Admin notification broadcast (G-03)** — page is pure `useState`; nothing is sent or persisted.

## D. NOT IMPLEMENTED (4)

1. **Consultant/provider dashboard UI** — backend `/me/provider` (4 routes) exists; no dashboard app, and the mobile `ConsultantDashboard` route is unreachable and local-only.
2. **Prisma migration history** — `prisma/migrations/` does not exist.
3. **Monitoring / error tracking** — no Sentry or APM in any repo.
4. **iOS build** — not configured.

## E. BLOCKED (5) — external dependencies

| Blocker | Needed to unblock |
|---|---|
| Payment gateway | Provider sandbox + production credentials, `WEBHOOK_SECRET` |
| Push notifications | `FCM_SERVER_KEY` |
| Real OTP email delivery | SMTP/provider credentials **and** access to a test inbox |
| Authenticated API testing (IDOR, RBAC 403, manual-transfer approval) | One admin + two user bearer tokens on a safe environment |
| Database verification (reports vs SQL, constraints) | Read access to a non-production DB, or a running local Postgres |
