# 02 — Navigation Matrix

**Method.** Two verifications were performed in this session:

1. **Static route integrity** — every `navigate('X')` literal in `mobile/src` was matched
   against the routes registered in `mobile/App.tsx`.
2. **Data-driven link integrity (the important one)** — the drawer is CMS-driven, so route
   names arrive as *data*, not code. Every menu target served by the **live API**
   (`GET /cms`) was resolved against the registered route table.

**Not performed this session:** runtime click-through on a device/emulator (no emulator was
started). Rows below are therefore marked *static-verified*; physical tap-through of every
button is listed as an open task (`REMAINING_TASKS.md` → T-19).

## Route registry

- Registered stack routes: **40**
- Tab routes: **6** (`Home`, `Cases`, `UrgentCases`, `Donate`, `Consultations`, `About`)
- Distinct `navigate()` targets used in code: **32**
- **Unresolved code targets: 0** — every literal target exists in the registry.

## Live CMS drawer targets → route resolution

| # | Menu label | Kind | Target | Resolves? |
|---|---|---|---|---|
| 1 | الرئيسية | tab | `Home` | ✅ |
| 2 | الحالات | tab | `Cases` | ✅ |
| 3 | حالات عاجلة | tab | `UrgentCases` | ✅ |
| 4 | تبرع | tab | `Donate` | ✅ |
| 5 | الاستشارات | tab | `Consultations` | ✅ |
| 6 | عن الجمعية | tab | `About` | ✅ |
| 7 | تصفح الخدمات | route | `ServicesBrowse` | ✅ |
| 8 | تطوع معنا | route | `Volunteer` | ✅ |
| 9 | الأخبار | route | `NewsFeed` | ✅ |
| 10 | الأسئلة الشائعة | route | `Faq` | ✅ |
| 11 | تواصل معنا | route | `ContactUs` | ✅ |

**DEAD LINKS: none.** All 11 live menu entries resolve to registered screens.
This is the single highest-risk failure mode for a CMS-driven drawer (an admin can type a
route name that does not exist) and it currently passes.

## Screen ↔ backing-data status

| Screen group | Reachable | Data source | Status |
|---|---|---|---|
| Home, Cases, UrgentCases, Sponsorship, Projects, ProjectDetail, CaseDetail | ✅ | **API** (`content.ts` → `fetchCases`/`fetchProjects`, bundled fallback) | PASS |
| NewsFeed, ArticleDetail | ✅ | **API** (`fetchArticles`) | PASS |
| ServicesBrowse, ServiceDetail, ProviderDetail, Consultations | ✅ | **API** (`fetchServices`, `fetchConsultants`) | PASS |
| CmsPage (generic pages) | ✅ | **API** (`fetchCmsTagged`) | PASS |
| About, Faq, PrivacyPolicy, ContactUs, Volunteer, ZakatCalculator, GovernorateActivity | ✅ | CMS + bundled config | PASS |
| EmailAuth → Otp | ✅ | **local only** — any 6-digit code accepted (`OtpScreen.tsx:35`) | **FAIL** |
| MyBookings, DonationHistory, Receipts, Favorites, Notifications, NotificationPreferences, AccountSettings | ✅ | **local stores only** — never call `/me/*` | **FAIL** |
| BookAppointment, BookingConfirmation | ✅ | local; availability TODO at `BookAppointmentScreen.tsx:48` | PARTIAL |
| Donate → DonationSuccess, PaymentInfo | ✅ | local receipt; demo-labelled | PARTIAL |
| ConsultantDashboard | registered route, **not referenced by any code path or live menu entry** | local `providerStore.ts` | **MISSING (unreachable)** |

## Findings

| ID | Finding | Severity |
|---|---|---|
| N-01 | `ConsultantDashboard` is registered in `App.tsx` but is not reachable from any code literal or from the live CMS menu. Either wire it into the menu or remove the route. | Medium |
| N-02 | Seven account screens are reachable but display **local demo state**, not the signed-in user's real data (consequence of G-04). A reviewer clicking through will see plausible-but-fake bookings/receipts. | **High** |
| N-03 | Runtime tap-through of every button was not executed this session — static and data-level integrity only. | Open task |
