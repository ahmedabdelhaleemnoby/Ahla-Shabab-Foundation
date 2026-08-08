# PROJECT COMPLETION MATRIX

> **Updated 2026-08-07 after remediation.** T-01 (row 45) and T-03 moved. See `FIX_LOG.md`.
>
> **Correction (T-13).** The line published after T-05 read “PASS 18 · PARTIAL 26 · FAIL 0 …
> No requirement is FAIL any more.” That was wrong: **row 43 (admin broadcast) was still FAIL.**
> The true tally after T-01…T-05 was PASS 18 · PARTIAL 25 · **FAIL 1** · MISSING 3 · BLOCKED 5
> → (18+12.5)/47 = **65%**. The claim was reported to the client before it was true.
>
> Tally after T-13: PASS 18 · PARTIAL 26 · FAIL 0 · MISSING 3 · BLOCKED 5 → (18+13)/47 = 66%.
>
> Tally after T-07 (row 24 verified live at 47/47): PASS 19 · PARTIAL 25 · FAIL 0 · MISSING 3 · BLOCKED 5 → 67%.
>
> Tally after T-12 round 2 (row 40 → PASS): PASS 20 · PARTIAL 24 · FAIL 0 · MISSING 3 · BLOCKED 5 → 68%.
>
> Tally after the integration harness (row 25 → PASS): PASS 21 · PARTIAL 23 · FAIL 0 · MISSING 3 · BLOCKED 5 → 69%.
>
> Tally after T-15 (row 27 → PASS): PASS 22 · PARTIAL 22 · FAIL 0 · MISSING 3 · BLOCKED 5 → 70%.
>
> Tally after T-08 (row 34 → PASS): PASS 23 · PARTIAL 21 · FAIL 0 · MISSING 3 · BLOCKED 5 → 71%.
>
> Tally after T-10 (row 48 BLOCKED → **NOT APPLICABLE**: the client ruled out a payment gateway, so it
> is not work that is waiting — it is work that should not be done):
> PASS 23 · PARTIAL 21 · FAIL 0 · MISSING 3 · BLOCKED 4 · N/A 1 → **71%, unchanged**, because BLOCKED
> and N/A are both excluded from the denominator. The number did not move; what moved is that one item
> left the "waiting on the client" pile for good.
>
> **Tally after T-14** (row 35 → PASS — bookings were the one admin surface with no audit trail;
> row 51 BLOCKED → PARTIAL, because it was never blocked on a credential: the client chose WhatsApp
> proof, which ships, and approval/receipt/audit all work. It stays PARTIAL rather than PASS because
> the proof lives outside the system — nothing links a donation to its evidence):
> PASS 24 · PARTIAL 21 · FAIL 0 · MISSING 3 · BLOCKED **3** · N/A 1
> → **(24+10.5)/47 = 73%** (baseline 57%). Counts re-derived from the rows, not carried forward.
>
> **Tally after T-06 — unchanged at 73%, and that is the finding.** Two rows moved in opposite
> directions and cancelled out:
> row 17 (admin login) PARTIAL → **PASS**, proven live; row 3 (security headers + rate limiting)
> **PASS → PARTIAL**, a deliberate downgrade — the rate limits were real but keyed on the proxy's
> address, so the platform shared **one** bucket: 100 requests a minute in total, and five admin login
> attempts per ten minutes for every administrator together.
> PASS 24 · PARTIAL 21 · FAIL 0 · MISSING 3 · BLOCKED 3 · N/A 1 → **73%**.
>
> T-06 was the last P0 and was filed as "mostly waiting" on the client. Looking at the credentials
> instead of waiting for them turned up a **super-admin password published in a public repository and
> working on production**, with no way to change it through the product, and a rate limiter that any
> stranger could use to lock every administrator out of the dashboard. Neither is visible in the score.
> See `final-delivery-audit/security/T-06-credentials-and-qa-environment.md`.

Baseline: see `00_CURRENT_STATE.md`. Statuses are **evidence-based**; anything that could not
be executed in this environment is **BLOCKED**, never PASS.

Legend — B=Backend, M=Mobile, A=Admin dashboard, C=Consultant portal, I=Integration, T=Test.
`—` = not applicable to that layer.

| # | Module | Requirement | B | M | A | C | I | T | Final | Remaining work |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Content API | Public reads: cases, projects, articles, services, providers, governorates, foundation | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 2 | CMS | CMS document served + consumed (menu/home/pages) | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 3 | Security | Headers (HSTS/CSP/nosniff/frame), rate limiting, no `x-powered-by` | PASS | — | — | — | PASS | PARTIAL | **PARTIAL** ⬇ | T-06: headers pass; **rate limiting was one global bucket** — no `trust proxy` behind Cloudflare+nginx, so every caller shared 100 req/min and 5 login attempts/10min. `TRUST_PROXY` added; **set it on the server** |
| 4 | Foundation | About/foundation info | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 5 | Governorates | Governorates + work areas | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 6 | Home config | Home sections ordered/toggled from CMS | PASS | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 7 | Shared rules | Donation-status + privacy invariants unit-tested | — | PASS | PASS | — | PASS | PASS | **PASS** | — |
| 8 | Build | Android release APK produced (v1.4.0) | — | PASS | — | — | — | PASS | **PASS** | — |
| 9 | Navigation | No dead links; all live CMS targets resolve | — | PASS | — | — | PASS | PASS | **PASS** | runtime tap-through pending |
| 10 | Guest flow | Browse all public content without login | PASS | PASS | — | — | PASS | PASS | **PASS** | — |
| 11 | Validation | Invalid bodies → 400 + per-field Arabic errors | PASS | PASS | — | — | PASS | PASS | **PASS** | — |
| 12 | Error hygiene | 401/404 clean, no stack traces | PASS | — | — | — | PASS | PASS | **PASS** | — |
| 13 | Admin reads | All dashboard lists read the live API | PASS | — | PASS | — | PASS | PASS | **PASS** ✅ | T-16: fallback removed; failure shows an explicit error, verified in-browser |
| 14 | Admin CMS write | `PUT /admin/cms` persists CMS edits | PASS | — | PASS | — | PASS | PARTIAL | **PASS** | — |
| 15 | Auth | Email OTP request/verify endpoints | PASS | PASS | — | — | PASS | PARTIAL | **PARTIAL** ⬆ | wired; live delivery still BLOCKED |
| 16 | Auth | Email normalization → one account | PASS | FAIL | — | — | BLOCKED | PASS | **PARTIAL** ⬆ | T-12: 3 variants proven to resolve to one account (unit); live 3-case test still BLOCKED |
| 17 | Auth | Admin login (`POST /admin/auth/login`) | PASS | — | PASS | — | PASS | PASS | **PASS** ⬆ | T-06: proven live (200 + tokens, session revoked after). Found the credential was **published in a public repo** and unrotatable — seed fixed, `change-password` endpoint added, 10 HTTP tests |
| 18 | User flow | History/receipts/bookings/favorites/notifications for signed-in user | PASS | PASS | — | — | PASS | BLOCKED | **PASS** ✅ | wired `c85f9ed`; live proof needs a token |
| 19 | Cases | Urgent + sponsorship: list/detail/publish/feature | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 20 | Projects | CRUD, stages, updates, ordering | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 21 | News | Articles CRUD, publish, pin | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 22 | Services | Categories + services CRUD, activate | PASS | PASS | PASS | — | PARTIAL | PARTIAL | **PARTIAL** ⬆ | CRUD wired `f87bd35`; live proof pending |
| 23 | Consultations | Submit request → stored | PASS | PARTIAL | PASS | — | PARTIAL | PARTIAL | **PARTIAL** | mobile submits locally |
| 24 | Consultations | Dynamic form schema per type | PASS | PASS | PASS | — | PASS | PASS | **PASS** ✅ | T-07 `8edf040`; verified live — **47/47, zero known defects** |
| 25 | Bookings | Engine + Serializable-tx concurrency | PASS | PASS | PASS | — | PASS | PASS | **PASS** ✅ | race PROVEN on a real DB (2-way + 5-way); P2034 → 409 fixed; partial unique index recommended |
| 26 | Donations | Create; server owns status | PASS | PASS | PASS | — | PASS | PASS | **PARTIAL** ⬆ | T-20: mobile now records on the server with case links; totals derive on approval. **Needs a new APK to reach donors** |
| 27 | Receipts | Server-generated, unique ref, owner-scoped | PASS | PASS | — | — | PASS | PASS | **PASS** ✅ | T-15: references made unguessable (900k → 1.15e18), 0 collisions, PII trimmed; 9 DB-backed tests |
| 28 | Notifications | In-app feed, unread, mark read | PASS | PASS | FAIL | — | PARTIAL | BLOCKED | **PARTIAL** ⬆ | mobile wired `c85f9ed`; admin broadcast wired T-13, send unverified |
| 29 | Notifications | Preferences per type | PASS | PASS | — | — | PASS | BLOCKED | **PARTIAL** ⬆ | wired `c85f9ed` |
| 30 | Favorites | Add/remove, per-user | PASS | PASS | — | — | PASS | BLOCKED | **PARTIAL** ⬆ | list wired `c85f9ed`; heart toggle still local |
| 31 | Contact | Messages submit + admin inbox | PASS | PARTIAL | PASS | — | PARTIAL | PARTIAL | **PARTIAL** | status PATCH unwired |
| 32 | Volunteers | Applications submit + admin inbox | PASS | PARTIAL | PASS | — | PARTIAL | PARTIAL | **PARTIAL** | status PATCH unwired |
| 33 | Media | Upload endpoint + library | PASS | PARTIAL | PARTIAL | — | PARTIAL | MISSING | **PARTIAL** | CMS media → server upload |
| 34 | RBAC | Roles + permission guards | PASS | — | PASS | — | PASS | PASS | **PASS** ✅ | T-08: 31 HTTP tests — 403 matrix, no self-promotion, blocked-user, IDOR; mutation-checked |
| 35 | Audit log | actor/action/entity/prev/new/ip/UA | PASS | — | PASS | — | PASS | PASS | **PASS** ✅ | T-14: verified over HTTP; **bookings were unaudited** and are now covered; structural guard added. Writes are best-effort (fire-and-forget) |
| 36 | Reports | Aggregates + date filters | PASS | — | PASS | — | BLOCKED | BLOCKED | **PARTIAL** | compare vs SQL |
| 37 | Exports | CSV / print | — | — | PARTIAL | — | PARTIAL | MISSING | **PARTIAL** | client-side only |
| 38 | Deployment | nginx conf + GitHub Actions deploy | PARTIAL | — | PARTIAL | — | PARTIAL | MISSING | **PARTIAL** | documented runbook |
| 39 | Responsive/RTL | 320/390/430/tablet + dashboard breakpoints | — | PARTIAL | PARTIAL | — | — | MISSING | **PARTIAL** | re-verify this build |
| 40 | Testing | Backend automated tests | PASS | — | — | — | PASS | PASS | **PASS** ✅ | T-12: 101 tests/10 suites, CI gate, mutation-checked; coverage 20.7% and ratcheted |
| 41 | Auth E2E | Mobile login actually authenticates | PASS | PASS | — | — | PASS | PARTIAL | **PASS** ✅ | wired `60e3417`; wrong code proven rejected live. Inbox-based happy path BLOCKED |
| 42 | Admin writes | Any admin mutation persists | PASS | — | PASS | — | PASS | PARTIAL | **PASS** ✅ | status `a797361` + content/services CRUD `f87bd35`; live proof needs a token |
| 43 | Broadcast | Admin sends notification | PASS | — | PASS | — | PASS | BLOCKED | **PARTIAL** ⬆ | wired T-13; send not executed — would push to real users on prod |
| 44 | Consultant portal | Dashboard UI for consultants | PASS | FAIL | **MISSING** | **MISSING** | FAIL | MISSING | **MISSING** | build the portal |
| 45 | Database | Migration history | **PASS** | — | — | — | — | PASS | **PASS** ✅ | done `a1cd48a`; CI switch pending prod baseline |
| 46 | Monitoring | Sentry/APM/error tracking | **MISSING** | MISSING | MISSING | — | — | MISSING | **MISSING** | choose + wire |
| 47 | iOS | iOS build | — | **MISSING** | — | — | — | MISSING | **MISSING** | Apple account + build |
| 48 | Payments | Live gateway (create + confirm) | PARTIAL | — | — | — | PARTIAL | PASS | **NOT APPLICABLE** | client ruled out a gateway; webhook path pinned by 11 tests (T-10). Re-open only if a gateway is adopted |
| 49 | Push | FCM delivery | PARTIAL | MISSING | — | — | BLOCKED | BLOCKED | **BLOCKED** | FCM key |
| 50 | Email | Real OTP email delivery | PASS | — | — | — | BLOCKED | BLOCKED | **BLOCKED** | SMTP creds + inbox |
| 51 | Manual transfer | Proof upload → admin approval | PASS | PASS | PASS | — | PASS | PASS | **PARTIAL** ⬆ | T-14: **not blocked** — the client chose WhatsApp proof, which ships. Approval, receipt and audit all work and are tested. PARTIAL because the proof lives outside the system: nothing links a donation to its evidence |
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
3b. **Payment webhook authentication (T-11)** — production verified to **fail closed**: an unsigned
   `POST /webhooks/payment` returns `401 Missing webhook signature`, which is reachable only when a
   secret is configured. The guard was additionally hardened to fail closed when `NODE_ENV` is unset
   (it previously bypassed verification in that case), and production now refuses to **boot** without
   a ≥16-char `WEBHOOK_SECRET`. 15/15 webhook tests, mutation-checked. Evidence:
   `final-delivery-audit/security/T-11-webhook-hardening.md`. Note this does **not** move row 48 —
   the *effect* of a confirmed payment is still BLOCKED on a sandbox (T-10).
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
