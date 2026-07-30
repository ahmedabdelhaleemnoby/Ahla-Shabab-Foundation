# Missing from the backend

**As of 2026‑07‑30.** What still stands between the current backend and a fully
API‑backed app + dashboard.

Every item here was verified — against the live API at
`https://portfolio.27lashabab.com/api/v1`, against the repo at
`AbdelrahmanSaad10/ahlashabab_backend_app`, or against a locally seeded copy of
the database. Where something could not be verified, it says so.

Companion documents: `BACKEND.md` §18–§22 for the reasoning, and
`scripts/verify-api-layer.ts` to re‑run the checks.

| | meaning |
| --- | --- |
| 🔴 | Blocks the project |
| 🟠 | Blocks one feature |
| 🟡 | Works, but wrong or fragile |
| ⚪ | Decision needed, not code |

---

## 0. The one thing that matters most

🔴 **Nothing is deployed.** PRs #1, #2 and #3 are all merged into `main`
(`56d9c53`) and the live API is still running the old code — it answers
`schemaVersion: 5` with `contactPhone` and `consultationTypes`.

**Deploying unblocks 111 of the 141 routes.** Until then:

| Surface | Routes | What happens |
| --- | ---: | --- |
| `/admin/*` — the entire dashboard | 93 | **403** on every route, whatever the role says |
| `/me/*` — profile, favourites, donations, notifications | 18 | Answers **200** while querying with an `undefined` user id |

Cause and fix are in `BACKEND.md` §21. Everything below is secondary to this.

---

## 1. Fixed and awaiting review — PR #4

Not missing any more, but not merged either. Listed so nobody fixes them twice.

| | Was broken | Detail |
| --- | --- | --- |
| 🔴 | `POST /donations`, `POST /bookings`, `PATCH /me` **rejected every request** | A method‑level `@UsePipes` applies the Zod schema to *every* parameter, so it also validated `@CurrentUser()` — `null` for a guest, the user entity with a token. Both fail the body schema. The two main public write paths were dead for everyone. |
| 🔴 | Booking any service was impossible | `serviceId` required `.uuid()`, but seeded ids are `svc-1`…`svc-6`. Same for the admin filters `categoryId` / `providerId`. |
| 🟠 | `GET /governorates` did not exist | Added. |
| 🟡 | `settings.milestones` never populated | Added via a 6 → 7 migration. |

---

## 2. Endpoints that do not exist

| | Endpoint | Why it is needed |
| --- | --- | --- |
| 🟠 | `PATCH /admin/consultations/{id}/schedule` | To turn a consultation request into a booked appointment. Needs three nullable columns on `consultation_requests` (`providerId`, `date`, `timeSlot`) and a union in `/me/provider/bookings`. `ConsultationRequest.status` already includes `تم تحديد موعد` but has nowhere to record the result. See `BACKEND.md` §20 — **needs the option A/B decision first**. |
| 🟡 | Anything exposing `Consultant.type`, `sessions`, `featured` | No column exists on `Provider` for any of them. The app currently infers `type` from the specialization text and defaults `featured` to `false`. Cosmetic today; a schema addition to do properly. |

---

## 3. Data and seeding

| | Problem | Effect |
| --- | --- | --- |
| 🔴 | **Consultation types not seeded.** Live has `psychological` / `legal` / `family`, with **no `disclaimer`, no `consent` field, and no `options`** on choice fields. | The app cannot use the API's forms and falls back to its bundled ones. A radio with no options is unanswerable, and the missing consent checkbox is a compliance regression (`BACKEND.md` §18.6). Run `scripts/seed-consultation-types.mjs --apply --prune` — **needs a bearer token**. |
| 🟡 | **`paymentMethods` rows still use latin ids** (`card`, `instapay`). Migration 5 → 6 renames settings keys but does not touch payment ids, so they will survive the deploy. | Harmless today — the app's mapper translates them — but the dashboard will show latin ids. |
| ⚪ | `legal` (قانونية) has no app‑side form schema. | The app cannot render it, so it is skipped. Either seed it a form or drop the type. |

---

## 4. Contract mismatches

| | Mismatch | Effect |
| --- | --- | --- |
| 🟠 | **Manual‑payment rules disagree.** Backend hardcodes `MANUAL_METHODS = [تحويل بنكي, فوري]`; the app drives it off the `manual` flag per method. They disagree on two, in opposite directions: | |
| | • `إنستاباي` — app: manual → `قيد المراجعة`. Backend: gateway → `قيد التأكيد`. | **An InstaPay donation waits for a gateway callback that never arrives** and is never confirmed. |
| | • `فوري` — app: gateway. Backend: manual. | A Fawry donation waits on admin review instead of the gateway. |
| 🟡 | `POST /volunteers` and `POST /bookings` take a numeric `governorateId`, but the app collects a governorate **name**. | Solved by `GET /governorates` (PR #4) — the client must map name → id before submitting. |
| 🟡 | `/home` and `/foundation` return `stats` as a **list** of `{key,value,label}`, while `settings.stats` is an **object**. | Two shapes for the same idea. The app flattens by key; worth unifying. |
| 🟡 | `settings.stats` has no `initiatives` / `volunteers`, though the `/home` stats list does. | The About screen's impact figures cannot be edited from the CMS. |

---

## 5. Security — before real money moves

| | Issue |
| --- | --- |
| 🔴 | **`POST /webhooks/payment` is `@Public()` with no signature verification.** Anything that can reach the URL can mark any donation **paid**. Needs a shared secret or provider signature check before taking live payments. |
| 🟡 | **`PATCH /admin/cms/settings` accepts any key** — its schema is `z.record(z.string(), z.any())`. A misspelled key is stored and then ignored rather than rejected, which is a silent way to lose an edit. |
| 🟡 | **Five routes take `@Body() any`** with no validation: `PUT /admin/cms`, both `admin/cms/pages` writes, and both generic `admin/portfolio` writes. |
| 🟡 | `FCM_SERVER_KEY` is empty, so push notifications will not send. Config, not code. |

---

## 6. Decisions needed (not code)

| | Question | Recommendation |
| --- | --- | --- |
| ⚪ | Do consultations become bookings? (`BACKEND.md` §20) | **Option A** — one pipeline. Three nullable columns on `consultation_requests`. |
| ⚪ | `legal` consultation type: give it a form, or drop it? | — |
| ⚪ | Impact figures (`+650` initiatives, `+10,000` volunteers) — approve or blank? | Client's call (QA D‑07). |
| ⚪ | Real social profile URLs | The row stays hidden until supplied. |

---

## 7. Route inventory

141 routes across 39 controllers, all tagged and documented (PR #3).

| Area | Routes | Status |
| --- | ---: | --- |
| Public reads — `/cms` `/home` `/foundation` `/cases` `/projects` `/articles` `/categories` `/services` `/providers` `/consultants` | 20 | ✅ Live, verified, mapped |
| Public writes — consultation, contact, volunteer | 3 | ✅ Live, validation verified |
| Public writes — donation, booking | 3 | 🔴 Dead → fixed in PR #4 |
| `GET /governorates` | 1 | 🟠 New in PR #4 |
| Auth — `/auth/*`, `/admin/auth/login` | 5 | ⚠️ Live, untested (needs a real OTP / password) |
| `/me/*` | 18 | 🔴 Blocked on deploy |
| `/admin/*` | 93 | 🔴 Blocked on deploy |
| `POST /webhooks/payment` | 1 | 🟡 Live, unauthenticated |

**24 of 141 usable today.**

---

## 8. Shortest path to done

1. **Deploy `main`.** Unblocks 111 routes — the whole dashboard and all of `/me`.
2. **Merge and deploy PR #4.** Unblocks donations, bookings and `PATCH /me`.
3. **Seed the consultation types** (needs a bearer token). Restores the consent
   checkbox and the five Arabic‑keyed types.
4. **Fix the manual‑payment list** so InstaPay donations can complete.
5. **Sign the payment webhook** before taking real money.

Items 1–3 are what stand between this and a fully API‑backed app.
