# Missing from the backend

> ## ⚠️ SUPERSEDED — historical snapshot, 2026-08-01
>
> This file is kept for history. It was written before the full delivery audit and **several of its
> statements are now wrong**, most visibly:
>
> - it lists `بطاقة بنكية` and `إنستاباي` among the payment methods — both were **removed** when the
>   client narrowed the offering to تحويل بنكي / فوري / فودافون كاش;
> - it reports CMS `version: 7` — the schema is now **11**;
> - its "still outstanding" section has largely been closed, and several items it does *not* mention
>   turned out to be more serious than anything it lists (no CI gate at all, deploys overwriting
>   admin content and role permissions, a public route serving unpublished cases, enumerable receipt
>   references).
>
> **For current status use [`qa/`](qa/):**
> [`PROJECT_COMPLETION_MATRIX.md`](qa/PROJECT_COMPLETION_MATRIX.md) (52 requirements, evidence-based),
> [`REMAINING_TASKS.md`](qa/REMAINING_TASKS.md) (what is left and in what order),
> [`FIX_LOG.md`](qa/FIX_LOG.md) (every fix, with retests — and a register of withdrawn findings).

**Re-checked 2026‑08‑01, after PR #4 deployed.** What still stands between the current
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

## 0b. Now verified working live

PR #4 is deployed, and the backend developer has closed most of the rest.

| | Item | Evidence |
| --- | --- | --- |
| ✅ | **Payment webhook is secured** | `POST /webhooks/payment` with a valid body and no signature → **401 "Missing webhook signature"**. `WEBHOOK_SECRET` is set and enforced. This was the 🔴 security item. |
| ✅ | Webhook validates its body | malformed payload → **400**, was 500 |
| ✅ | `GET /governorates` trimmed | 27 rows, keys `id, name` only — no more `createdAt` + nested `workAreas` |
| ✅ | Consultation types carry a `disclaimer` | 5 / 5 |
| ✅ | `paymentMethods` use the Arabic ids | `بطاقة بنكية`, `فوري`, `إنستاباي`, … |
| ✅ | Swagger largely restored after the PR #3 loss | 143 operations, 124 summaries, 45/67 write bodies, 25 tags |
| ✅ | Provider columns added | `type`, `sessions`, `featured` now exist on `/providers` |
| ✅ | §20 option A implemented | `ConsultationRequest` has `providerId` / `date` / `timeSlot` |

---

## 1. Still outstanding

| | Item | Detail |
| --- | --- | --- |
| 🔴 | **Consultation forms are unusable from the API** | 5 types (`psychological`, `legal`, `family`, `social`, `educational`), but **0 / 5 have a consent field** and **5 choice fields have no `options`**. A radio with no options is an unanswerable question, and the missing consent checkbox is the compliance point (`BACKEND.md` §18.6). The app is not broken only because the mapper keeps its bundled forms. Keys are also still English, while the app's are Arabic route params. |
| 🟠 | **Four settings fields are `null`** — `splashText`, `milestones`, `donationReassurance`, `website` | All four have backfill migrations, none of which can reach the row: it sits at `schemaVersion 10`, past every gate. `donationReassurance` is the legal reassurance text on the donation screen. The app falls back to bundled values, so nothing looks broken — but none of it is CMS-controlled. **Diagnosed and fixed in PR #5** (open). |
| 🟡 | **Provider columns are empty** | `type = null`, `sessions = 0`, `featured = false` on every provider. The columns exist; nothing populates them, so the app still infers `type` from the specialization text. |
| 🟡 | **19 operations still have no summary**, 22 write ops no body schema | Swagger came back but not to the 141/141 PR #3 had. |
| 🟠 | **`GET /cms` and `PUT /admin/cms` disagree on three field names** — read returns `version` / `consultations` / `media`, the write schema requires `schemaVersion` / `consultationTypes` / `mediaLibrary` | A naive round trip 400s on the required `schemaVersion`. Worse, `consultationTypes` is `.optional().default([])`, so once a client fixes that 400 the payload still carries `consultations` and the write **silently replaces every consultation type with an empty array**. The 400 is the only thing currently preventing data loss. Reported as backend **issue #7**; the dashboard translates the names on its side, so it is not blocking us. |
| 🟡 | `PATCH /admin/cms/settings` accepts any key | `z.record(z.string(), z.any())` — a misspelled key is stored and silently ignored. Also the enabler for the row above: `PUT /admin/cms` trusts the payload's `schemaVersion`. |
| 🟡 | `FCM_SERVER_KEY` empty | Push notifications will not send. Config, not code. |

---

## 2. Cannot be verified without a bearer token

| | Item |
| --- | --- |
| ❓ | **Does the admin API work?** `/admin/*` answers 401 with no token and 401 with a garbage token — correct but uninformative, since `JwtAuthGuard` rejects before `RolesGuard` runs. Only a **valid** token distinguishes a working admin API from the old blanket-403. 93 routes ride on this. |
| ❓ | **Do the 18 `/me` routes resolve a user?** Same reason. |

---

## 4. Decisions needed (not code)

| Question | Recommendation |
| --- | --- |
| `legal` (قانونية): give it a form schema, or drop it? | The app cannot render it today, so it is skipped |
| Impact figures (`+650`, `+10,000`) — approve or blank? | Client's call (QA D‑07) |
| Real social profile URLs | Row stays hidden until supplied |

---

## 5. Shortest path to done

1. **Get a bearer token.** It closes both ❓ items *and* unblocks seeding — the
   single highest-value thing outstanding.
2. **Seed the consultation types** so the API's forms carry a consent field and
   options. This is the last item with real user impact.
3. **Merge and deploy PR #5** to restore the four `null` settings fields.
4. Populate the new provider `type` / `sessions` / `featured` columns.

Everything else is cosmetic or a product decision.
