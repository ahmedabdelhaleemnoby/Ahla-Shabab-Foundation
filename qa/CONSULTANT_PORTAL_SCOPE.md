# Consultant portal — scope

Date 2026-08-08 · Row 44 of the delivery matrix · Written from the code, not the spec

---

## The headline: the portal is the second problem

Row 44 records the backend as **PASS** with "build the portal" as the remaining work, implying only a
UI is missing. Reading the code says otherwise, and turned up something more urgent than the portal:

> **A consultation request submitted from the app cannot be seen by anyone at the foundation.**

`POST /consultations` works — T-07 verified it live at 47/47. The request is stored. And then:

| Piece | State |
|---|---|
| `GET /admin/consultations` | routed and working |
| `PATCH /admin/consultations/:id/status` | routed and working |
| `fetchAdminConsultations` in the dashboard | written — **no page calls it** |
| `updateConsultationStatus` in the dashboard | written — **no page calls it** |
| A dashboard page showing consultations | **does not exist.** `Inbox.tsx` has two tabs: volunteers and messages |

So a beneficiary fills in a consultation form, gets a reference, and the request lands in a table
nobody at the foundation has a way to open. This is the same shape as the donation defects found
earlier: the API is fine and the last mile was never connected.

**A second dead end:** `consultationsService.schedule()` exists and sets `providerId`, `date` and
`timeSlot` — and **no controller route exposes it**. Even an admin with database access to the
dashboard cannot assign a consultation to anybody. Assignment is not "missing UI"; it is unreachable.

---

## What actually exists

**Data.** `ConsultationRequest` already carries `providerId` (a **Provider**, not a `Consultant`),
`date`, `timeSlot`, `status`, the requester's contact details, and a free-text `summary`.

**The five statuses are already defined** and match decision 7:
`جديد → قيد المراجعة → تم تحديد موعد → مكتمل / ملغي`.

**`Consultant` is a content model**, not an identity: `name`, `specialization`, `bio`, `avatarUrl`,
`active`, `sortOrder`. No email, no password, no link to a consultation. Its only route is the public
`GET /consultants`, which feeds the marketing list.

**There is already a working portal to copy.** `AdminUser.providerId` is a unique nullable link to a
`Provider`, and `/me/provider` serves a provider their own bookings with `getProviderId()` refusing
any account without the binding. That pattern is proven, audited (T-14), and covered by tests.

---

## The decision that shapes everything (client's — decision 6)

**Are "consultants" the same people as service providers?**

- **Option A — consultants are providers.** Bind their `AdminUser` to a `Provider`, extend
  `/me/provider` with consultations. `ConsultationRequest.providerId` already points at a Provider, so
  **the schema already assumes this**. `Consultant` stays a marketing bio list.
- **Option B — consultants are a separate identity.** Give `Consultant` an email and a link to
  `AdminUser`, and build a parallel ownership mechanism.

**Recommendation: A.** It matches the schema as written, reuses a portal that already exists and is
tested, and adds no second way of saying "this account belongs to that person". B duplicates the
provider mechanism for no gain unless the foundation genuinely treats the two groups as separate
populations — which is a fact about the organisation, not about the code.

---

## Phases

Sized for one engineer. **Phase 1 needs no decision from anyone and is worth doing on its own.**

### Phase 1 — Make consultations visible · ~1 day · no blockers
A `Consultations` page in the dashboard (or a third Inbox tab) wired to the endpoints that already
exist: list, filter by status and type, open a request, change status through the five states.
Includes the integration coverage the other admin surfaces have.

*Without this, everything below is invisible too.*

### Phase 2 — Assignment · ~0.5 day · no blockers
Route the orphaned `schedule()` as `PATCH /admin/consultations/:id/schedule`, with the transition
guard (`تم تحديد موعد` requires a provider, a date and a slot) and an audit entry. Dashboard control
to pick a provider and time.

### Phase 3 — Consultant-facing API · ~1.5 days · **blocked on Q1, Q3, Q4**
`GET /me/provider/consultations` and `PATCH /me/provider/consultations/:id/status`, scoped by the
same `getProviderId()` guard as bookings. Plus a place to record what happened after a session
(Q3), and the privacy rules in Q4. Ownership tests in the shape of T-08: consultant A's list never
contains consultant B's requests, **and B's own does** — so the check is not passing vacuously on an
empty list.

### Phase 4 — Consultant portal UI · ~1.5 days · **blocked on Q2**
If consultants use the same dashboard, this is nav filtered by permission plus two screens. If they
need something separate, it is a new surface and the estimate roughly doubles.

### Phase 5 — Notifications & docs · ~0.5 day
"Your consultation is scheduled" through the notification funnel built earlier (in-app now, push once
the Firebase credentials arrive), plus BACKEND.md and the matrix.

**Total: ~5 days** with decisions in hand. **1.5 days of it (phases 1–2) is unblocked today.**

---

## Open questions

| # | Question | Blocks | My recommendation |
|---|---|---|---|
| **Q1** | Are consultants the same entities as service providers? | 3, 4 | **Yes** — the schema already says so |
| **Q2** | Do consultants use the same dashboard, or a separate surface? | 4 | Same dashboard, nav filtered by role |
| **Q3** | What does a consultant record after a session — free-text notes, an outcome, a follow-up date? Is any of it visible to the beneficiary? | 3 | Private notes + an outcome; nothing beneficiary-visible without an explicit decision |
| **Q4** | **Privacy.** A request carries phone, email, age, governorate and a free-text summary that may describe someone's circumstances in detail. Does a consultant see the full summary *before* accepting? Can a consultant see requests assigned to someone else? | 3 | Assigned-only, full detail after assignment. **Do not let this be decided by whatever is easiest to code.** |
| **Q5** | Zoom/Teams, or phone and WhatsApp? (decision 6) | 3, 5 | Affects whether a meeting link is stored and shown |

**Q4 is the one to answer deliberately.** The rest change how much work it is; Q4 changes who can read
a vulnerable person's account of their situation. The portfolio editor already treats beneficiary
detail as sensitive — images are labelled "privacy-vetted" and addresses are deliberately stored as
«بدون عنوان تفصيلي — خصوصية المستفيد». A consultant portal that lists every incoming request in full
to every consultant would quietly undo that.

---

## Recommendation

**Start phase 1 now**, regardless of what is decided about the portal. A consultation request that
nobody can see is a live defect affecting real beneficiaries today, and fixing it does not depend on
any answer above.

Put Q1–Q5 to the client while that runs. Phases 3–5 should not start before Q4 has an answer in
writing.
