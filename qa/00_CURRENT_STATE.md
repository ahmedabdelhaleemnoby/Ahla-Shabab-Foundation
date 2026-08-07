# 00 — Current State (Frozen Baseline)

Audit executed **2026-08-07**. This file records the exact revisions tested. No code was
modified before this baseline was written.

> This is a **three-repository platform**. The audit covers all three plus the live API.

## Revisions under test

| Repo | Path | Branch | Commit | Working tree |
|---|---|---|---|---|
| Mobile + shared (monorepo) | `~/Ahla-Shabab-Foundation` | `main` | `0285d7d` docs: record the GET/PUT /cms field-name mismatch (backend issue #7) | clean |
| Backend API | `~/ahlashabab_backend_app` | `main` | `20958b3` Merge PR #8 from fix/cms-import-field-names | clean |
| Admin dashboard | `~/ahla-shabab-dashboard` | `main` | `2fd9f1d` fix(cms): translate wire names on write — PUT /admin/cms always 400'd | clean |

`git status --short` returned **no modified and no untracked files** in all three repos.
`git diff --stat` was therefore empty. Nothing was stashed or reverted to produce this state.

> **Note on a second monorepo clone.** A divergent clone exists at
> `/Volumes/PortableSSD/Ahla Shabab Foundation` (last commit `0279300`, v1.3.0 APK). The
> local `~/Ahla-Shabab-Foundation` clone is the canonical one for this audit: it is the
> configured working directory, it is further ahead functionally (API layer, `MISSING_API.md`,
> v1.4.0 APK), and it is the clone whose `shared/` package the dashboard consumes.
> **Finding D-01:** two divergent clones of the same project is a delivery hazard — see
> `REMAINING_TASKS.md` P1.

## Environments tested

| Environment | Value | Reachable |
|---|---|---|
| Live API base | `https://portfolio.27lashabab.com/api/v1` | ✅ yes (verified, see §evidence) |
| API docs | Swagger mounted by `main.ts` (`@nestjs/swagger`) | not probed |
| Dashboard URL | not deployed to a public URL during this audit; built + run locally (Vite) | local only |
| Mobile environment | Expo / React Native, Android release APKs in repo root (latest `ahla-shabab-v1.4.0-demo.apk`) | build artifacts only |
| Database (local) | Postgres via `docker-compose` on port **55432** | ❌ **not running** — TCP closed |
| Database (production) | Postgres behind the live API; **no direct access** from this environment | ❌ no direct access |
| Redis / queue | `docker-compose` defines redis:7-alpine | ❌ not running |

**No secrets are recorded in this file.** `.env` and `.env.example` were read for *key names only*;
all values were redacted before any output was captured. `.env` carries a comment stating its
values are local-throwaway, not deployed credentials.

## What this baseline means for the audit

Because the **local database is down** and **no authenticated bearer token is available**
(login requires reading a real OTP email inbox, which this environment cannot access), the
following classes of verification are recorded as **BLOCKED**, not PASS and not FAIL:

- Authenticated endpoint behaviour (`/me/*`, all `/admin/*` writes).
- Cross-account IDOR tests (User A vs User B).
- Role/permission 403 matrix.
- Booking concurrency executed against a real database.
- Report numbers compared against direct SQL.
- Live payment webhook replay/idempotency.

Everything that *could* be verified without those was verified for real, and is cited with
evidence in the reports below.

## Evidence captured

```
qa/final-delivery-audit/
├── api/verify-api-layer.log          45/47 integration checks (project's own harness)
├── builds/backend-build.log          nest build → exit 0
├── builds/dashboard-build.log        tsc --noEmit && vite build → exit 0
├── builds/mobile-typecheck.log       tsc -p tsconfig.typecheck.json → exit 0
├── logs/backend-jest-default.log     jest → "No tests found" (exit 1)
└── logs/shared-vitest.log            32/32 passed
```

Related reports: `01_CODE_GAPS.md`, `02_NAVIGATION_MATRIX.md`,
`PROJECT_COMPLETION_MATRIX.md`, `REMAINING_TASKS.md`, `FINAL_PROJECT_DELIVERY_AUDIT.md`.
