# T-06 — Credentials & a safe test environment

Date 2026-08-08 · Backend `~/ahlashabab_backend_app`

T-06 was the last P0 and the one filed as "mostly waiting" on the client. It was not. Provisioning
credentials meant *looking at* the credentials, and the first thing that turned up is the most serious
defect found in this engagement.

---

## 🔴 The production super-admin password was published on GitHub

`prisma/seed/admin-users.ts` hashed a hardcoded password:

```ts
const passwordHash = await argon2.hash('admin123');
…
console.log('  ✓ 1 admin user (admin@ahlashabab.com / admin123)');
```

Three facts compound:

1. **`AbdelrahmanSaad10/ahlashabab_backend_app` is a PUBLIC repository.** Anyone could read that line.
2. **`deploy.yml` runs `npx prisma db seed` on every push to main**, so the account is created on the
   live database.
3. The role it is given is **«مدير عام» — every permission**: donations, beneficiaries, bookings,
   national IDs, roles, CMS.

**Verified against production**, once, non-destructively:

```
POST https://portfolio.27lashabab.com/api/v1/admin/auth/login
{"email":"admin@ahlashabab.com","password":"admin123"}
→ HTTP 200, access + refresh token for «مدير النظام»
```

The session that check created was rotated and revoked immediately (`POST /auth/logout` → 200); the
access token expired 15 minutes later. No data was read, written or deleted.

### And there was no way to change it

There is no admin password-change endpoint, no dashboard screen, and no admin account management of
any kind. `AdminUser` rows can only be created by the seed or by direct database access — `/admin/users`
manages *app* users. So the published credential could not be rotated through the product at all.

### What changed

| | |
|---|---|
| `prisma/seed/admin-users.ts` | An existing admin is **never touched** — no password reset, no reactivation of a disabled account. No admin is created unless `SEED_ADMIN_PASSWORD` is supplied; in production a missing value creates **nothing**, loudly. Outside production a random password is generated and printed once. |
| `POST /api/v1/admin/auth/change-password` | New. Verifies the current password, rotates it, and **revokes every refresh token for that admin** — so sessions opened with a leaked password die with it, instead of surviving for the 30-day refresh TTL. |
| Audit | The entry is written **in the service, not by `ActivityLogInterceptor`** — the interceptor stores `newValue: request.body`, so wiring it to this route would have put both passwords in the activity log in plain text. A test asserts neither password appears in the row. |

**Still yours to do:** the live password is still the published one. Change it — the endpoint now
exists:

```bash
curl -X POST https://portfolio.27lashabab.com/api/v1/admin/auth/change-password \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"currentPassword":"…","newPassword":"…"}'
```

The seed will not undo it: an existing admin is left alone.

---

## 🔴 Every rate limit was one global bucket

`request.ip` decides the rate limiter's bucket and the `ip` column of the admin activity log. Express
only derives it from `X-Forwarded-For` when the proxy chain is trusted, and **nothing set
`trust proxy`** — while the API answers through Cloudflare and an nginx.

So `request.ip` was the proxy's address, identically, for every caller on earth.

**Verified against production:**

```
GET /api/v1/health              → x-ratelimit-remaining: 98, 97, 96
GET /api/v1/health  (spoofed X-Forwarded-For) → 95, 94
```

The counter keeps falling regardless of the forwarded address: the app is not reading it, and behind a
proxy it therefore cannot tell one caller from another.

What that meant in practice:

- **100 requests/minute for the entire platform.** Not per user — in total.
- **5 admin login attempts per 10 minutes, shared by every administrator.** One person mistyping their
  password five times locked the whole foundation out of the dashboard for ten minutes. Anyone on the
  internet could do it deliberately, indefinitely, with five wrong guesses every ten minutes.
- **5 OTP requests per 10 minutes for the whole mobile user base** — the app's only way in.
- The activity log recorded **the proxy's IP for every administrative action ever taken**.

### What changed

A `TRUST_PROXY` setting (`src/common/utils/trust-proxy.util.ts`), applied in `main.ts` and **announced
at boot** — a silent default is exactly how this stayed invisible. It accepts a hop count, a list of
addresses/CIDRs, or `false`.

**Left at `false` deliberately.** The wrong value is its own bug: trusting a hop that does not exist
lets a caller write their own `X-Forwarded-For` and get a private bucket per request, removing the
limits entirely. The correct number depends on the nginx config on the server, which cannot be read
from here. Cloudflare → nginx → node is `TRUST_PROXY=2` if nginx rewrites the header; `1` if it passes
Cloudflare's through untouched. **Check the nginx config, then set it.**

---

## 🟠 `POST /auth/otp/request` claimed success when nothing was sent

`EmailService.sendOtp` caught every error and returned normally, so the endpoint answered **200** with
«تم إرسال رمز التحقق إلى بريدك الإلكتروني» whether or not a byte left the server. With no SMTP
credentials configured — the project's state throughout — that was **every request**. A user was told
to check an inbox nothing was coming to, and no error surfaced anywhere a client could see.

The dev fallback that printed the code was gated on `NODE_ENV === 'development'`, so *staging* and
*test* — the two environments QA actually uses — logged nothing and had no way in at all.

**Now:** production throws `503` with an Arabic message; non-production logs the code (the log *is* the
delivery channel locally). The 503 depends only on the mail transport, so the endpoint's
anti-enumeration property is unchanged.

---

## The environment T-06 actually asked for

> *"A staging environment with seeded data and issued tokens that QA can hit without touching
> production."*

`npm run qa:env` — one command, no Docker, no SMTP account:

```
🧪 QA environment — disposable, seeded, and never production

  ✓ PostgreSQL up — the cluster and its data directory die with this process
  · applying migrations… · seeding…
  ✓ SMTP sink — OTP mail is captured, not sent
  ✓ API listening on http://127.0.0.1:PORT/api/v1

  Issuing tokens through the shipped login endpoints:
    ✓ admin  — POST /admin/auth/login
    ✓ user A — POST /auth/otp/request → mail captured → /auth/otp/verify
    ✓ user B — POST /auth/otp/request → mail captured → /auth/otp/verify

  Smoke checks:
    ✓ admin token reaches an /admin route
    ✓ a guest is refused (401)
    ✓ a user token is refused on /admin (401/403)
    ✓ user A token reaches GET /me
    ✓ the two user tokens are different identities
    ✓ seeded public data is served
```

The tokens are obtained **through the shipped login routes** — the admin password flow and the full
email-OTP exchange, code read back from a ~60-line SMTP sink. Nothing is hand-signed, so a regression
in a login route fails this. `--smoke` runs it and tears down; without the flag it stays up for QA.

Two supporting pieces came out of it:

- `scripts/disposable-postgres.ts` — the throwaway cluster, previously re-derived by hand every time.
- `npm run test:int:local` — the integration suites against a migrated, seeded, disposable database in
  one command.

**This is the part of T-06 that was blocking QA, and it needed nothing from the client.** An OTP login
can now be completed end to end with no mail provider; only *production delivery* still needs SMTP.

---

## 🟡 The merged test run passed by luck

Running `test:ci` on this machine: **53 of 227 tests failed.** On GitHub's runner: green.

`jest.config.js` set `maxWorkers: 1` and `testTimeout: 30000` inside the `projects[]` entry. Neither is
part of Jest's *project* config schema — `testTimeout` produced an "Unknown option" warning and both
were dropped. The integration suites had no serialisation and no extended timeout; the merged run only
held together on CI because a GitHub runner has few enough cores to serialise by accident.

Fixed where Jest honours it: `--maxWorkers=1` on `test:cov`/`test:ci`/`test:int`, and the timeout moved
to `test/integration/jest.setup.ts`.

---

## Verification

| # | Check | Result |
|---|---|---|
| 1 | New suites — seed credentials, OTP delivery, trust proxy | **26 passed** |
| 2 | `admin-password.int-spec.ts` over real HTTP | **10 passed** |
| 3 | Unit + e2e | **121 passed / 13 suites** |
| 4 | Integration | **106 passed / 10 suites** |
| 5 | Merged (`test:ci`) | **227 passed / 23 suites** |
| 6 | Coverage | **57.36%** statements (was 55.83) — thresholds ratcheted to 57/33/32/55 |
| 7 | `npm run qa:env -- --smoke` | all checks pass, environment torn down |

### Mutation checks

| Mutation | Expected | Result |
|---|---|---|
| Put a password constant back in the seed | structural guard + randomness test fail | **2 failed** ✓ |
| Drop the production refusal | production-refusal test fails | **1 failed** ✓ |
| Swallow the OTP send failure again | both production tests fail | **2 failed** ✓ |
| Stop revoking refresh tokens on password change | session-revocation test fails | **1 failed** ✓ |
| **Set `TRUST_PROXY=false`** — production's actual state | the suite collapses into one bucket | **7 of 10 failed** ✓ |

That last row is the defect reproduced: with production's setting, seven tests fail because every
request in the suite is treated as the same caller.

---

## What is left of T-06, and it is genuinely external

| Item | State |
|---|---|
| SMTP + test inbox | **Still needed for production delivery only.** QA no longer depends on it. |
| `WEBHOOK_SECRET` | Enforced at boot in production since T-11. Generate with `openssl rand -base64 32`. |
| Payment sandbox | **Moot** — the client ruled out a gateway (T-10). |
| FCM key | **Still blocked.** Push notifications cannot be tested without it. |
| One admin + two user tokens | **Done** — issued on demand by `npm run qa:env`. |
| A hosted staging URL | Needs a server. The environment above is complete apart from where it runs. |

## Findings recorded, not fixed

- **The `ip` column of every existing activity-log row is the proxy's address**, not the
  administrator's. Rows written before `TRUST_PROXY` is set cannot be attributed to a location.
- **There is no admin account management**: one account exists, a second cannot be created through the
  product, and an administrator who leaves cannot be disabled except in the database. The
  change-password endpoint closes the credential hole, not this.
- The audit write remains fire-and-forget (T-14).
