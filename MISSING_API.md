# Missing from the backend

**Re-checked 2026‑08‑01, after PR #4 merged.** What still stands between the current
backend and a fully API‑backed app + dashboard.

Every item was verified against the live API at
`https://portfolio.27lashabab.com/api/v1`, or against the repo. Where something
could not be verified, it says so explicitly.

Re-run the checks with `npx tsx scripts/verify-api-layer.ts`.
Reasoning and history: `BACKEND.md` §18–§22.

| | meaning |
| --- | --- |
| ✅ | Verified working on the live API |
| 🔴 | Blocks the project |
| 🟠 | Blocks one feature |
| 🟡 | Works, but wrong or fragile |
| ⚪ | Decision needed, not code |
| ❓ | Cannot be verified without a bearer token |

---

## 0. What got fixed — verified live

The deploy landed and most of the list is genuinely done.

| | Item | Evidence |
| --- | --- | --- |
| ✅ | **Deployed.** `GET /cms` reports `version: 7` | was `schemaVersion: 5` |
| ✅ | **CMS contract aligned.** `hotline`, `email`, `address`, `socials`, `zakatNisabEgp`, `splashText`, `website`, `donationReassurance` | all present in `settings` |
| ✅ | **`consultations`, `media`, `activity`, `updatedAt`, `version`** top-level keys | were missing |
| ✅ | **`POST /donations` and `POST /bookings` accept a body again** | invalid payloads now return **per-field** errors, not the root `{"": "Expected object, received null"}` |
| ✅ | **UUID constraint relaxed.** `serviceId: "svc-6"` is accepted | probed with a bad `timeSlot`; only `timeSlot` is rejected |
| ✅ | **`GET /governorates` exists** | 200, returns all 27 |

The two public write paths that were completely dead — donations and bookings —
now work. That was the most serious item.

---

## 0b. Fixed in PR #4 — merged, **awaiting deploy**

| | Item |
| --- | --- |
| 🔴 | **Payment webhook failed open.** HMAC ran only `if (secret)` and no secret is set in production, so it was effectively public. Now fails closed in production, validates the body (400 not 500), and compares signatures in constant time. `WEBHOOK_SECRET` documented in `.env.example` — **it must be set before the next deploy or the route will start rejecting**. |
| 🟡 | **`settings.milestones` was `[]`.** 6 → 7 created the key but left it empty; migrations only run when `current < N` and the deployment was already on 7, so it needed a 7 → 8 step. |
| 🟡 | **`GET /governorates` shipped `createdAt` + nested `workAreas`** on all 27 rows. Now `id` and `name` only. |

Also confirmed already fixed directly on `main` by the backend developer: the
`@UsePipes`/`@CurrentUser` bug, the non-uuid id constraints, `GET /governorates`
itself, and the InstaPay manual-payment correction. **§20 option A was also
implemented** — `ConsultationRequest` now has `providerId`, `date` and `timeSlot`,
and `consultations.service.schedule()` exists.

---

## 0c. ⚠️ PR #3 was lost

`gh` reports PR #3 (Swagger documentation for all 141 routes) as **MERGED**, but
its merge commit `0c03057` is **not an ancestor of current `main`** — it was
discarded by a force-push or reset. `src/common/swagger/zod-to-openapi.ts`,
`api-zod-body.decorator.ts` and `api-pagination-query.decorator.ts` are gone, and
only **2 of 39** controllers still carry `@ApiTags`.

The commits still exist on GitHub, so this is recoverable. Not restored here
because it is unrelated to the fixes in PR #4.

---

## 1. Still outstanding

| | Item | Detail |
| --- | --- | --- |
| 🔴 | **Consultation types still not seeded** | The backend serves `psychological` / `legal` / `family` with **no `disclaimer`, no `consent` field, and no `options`** on choice fields. The app does not break — the mapper merges them onto the bundled forms and keeps those — but the API is not driving the consultation forms, and the consent checkbox exists only because the app supplies it. Compliance point, `BACKEND.md` §18.6. **Needs a bearer token:** `scripts/seed-consultation-types.mjs --apply --prune` |
| 🟡 | **`paymentMethods` still use latin ids** (`card`, `fawry`, `instapay`, `vodafone`, `bank`) | Harmless for the app — the mapper translates them to the Arabic union — but the dashboard will show latin ids. Migration 5→6 renames settings keys and does not touch these. |
| 🟡 | **`PATCH /admin/cms/settings` accepts any key** | Schema is `z.record(z.string(), z.any())`, so a misspelled key is stored and silently ignored — a quiet way to lose an edit. |
| 🟡 | **Five routes take `@Body() any`** | `PUT /admin/cms`, both `admin/cms/pages` writes, both generic `admin/portfolio` writes. |
| 🟡 | `FCM_SERVER_KEY` empty | Push notifications will not send. Config, not code. |

---

## 2. Cannot be verified without a bearer token

| | Item |
| --- | --- |
| ❓ | **Does the admin API actually work now?** `/admin/*` answers 401 with no token and 401 with a garbage token — which is correct but uninformative, because `JwtAuthGuard` rejects before `RolesGuard` ever runs. The only way to tell a working admin API from the old blanket-403 one is a **valid** token. 93 routes ride on this. |
| ❓ | **Do the 18 `/me` routes resolve a user?** Same reason. |

The auth fix is merged and the deploy clearly happened, so both are *likely*
fine — but "likely" is not verified, and this is the whole dashboard.

---

## 3. Endpoints that still do not exist

| | Endpoint | Why |
| --- | --- | --- |
| 🟠 | `PATCH /admin/consultations/{id}/schedule` | To turn a consultation request into an appointment. Needs three nullable columns on `consultation_requests` (`providerId`, `date`, `timeSlot`). `ConsultationRequest.status` already includes `تم تحديد موعد` with nowhere to record the result. **Blocked on the §20 A/B decision.** |
| 🟡 | Columns for `Consultant.type`, `sessions`, `featured` | None exist on `Provider`. The app infers `type` from the specialization text and defaults `featured` to false. |

---

## 4. Decisions needed (not code)

| Question | Recommendation |
| --- | --- |
| Do consultations become bookings? (`BACKEND.md` §20) | **Option A** — one pipeline, three nullable columns |
| `legal` (قانونية): give it a form schema, or drop it? | The app cannot render it today, so it is skipped |
| Impact figures (`+650`, `+10,000`) — approve or blank? | Client's call (QA D‑07) |
| Real social profile URLs | Row stays hidden until supplied |
| Which manual-payment list is right — the app's or the backend's? | Needed to fix the InstaPay case |

---

## 5. Shortest path to done

1. **Get a bearer token** — it closes the two ❓ items *and* unblocks seeding.
2. **Seed the consultation types.** One command once the token exists.
3. **Sign the payment webhook** (and make it 400 rather than 500) before taking
   real money.
4. **Settle the manual-payment list** so InstaPay donations can complete.

Everything else is cosmetic or a product decision.
