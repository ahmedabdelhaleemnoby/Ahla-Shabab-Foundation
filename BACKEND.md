# Ahla Shabab — Backend Specification

Backend requirements for **جمعية خواطر أحلى شباب**, derived from the Technical Offer (§5–§8) and the already-built frontend (`mobile/` app + `dashboard/`). Every entity and endpoint below maps to a real screen or module that already consumes it via mock data in `@ahla/shared` — the job of the backend is to replace those mocks with a real REST API + database, changing nothing about the UI contracts.

> Status: **not started** (deferred). This document is the source of truth for what to build.
>
> **Updated 2026-07-05** to cover the newer mobile screens (~29 total): in-app Notifications + preferences, News/Articles feed, Volunteer applications, Contact-us messages, My Bookings, Donation history/receipts, Account settings, Zakat calculator (nisab config), FAQ, Onboarding. Sections marked **(v1.1)** are the additions.

---

## 1. Scope & goals

A single backend that serves **two clients**:

1. **Mobile app** (React Native / Expo) — beneficiaries & donors. Mostly reads (portfolio, services catalog, providers, articles), plus writes: **service bookings** (guest or account), **donations**, **volunteer applications**, **contact messages**, profile edits, and notification preferences.
2. **Admin dashboard** (React) — foundation staff. Full CRUD + booking operations + reports, gated by **roles & permissions**.

Non-goals for v1: real payment-gateway settlement (integrate provider sandboxes only), analytics beyond the dashboard's reports, multi-language content (Arabic only for now).

---

## 2. Architecture (three-tier, per Offer §6.1)

```
┌─────────────┐     HTTPS/JWT      ┌──────────────┐      ┌─────────────┐
│  Mobile app │ ─────────────────▶ │  Backend API │ ───▶ │  PostgreSQL │
│  Dashboard  │ ◀───────────────── │  (REST)      │      │  + media FS │
└─────────────┘                    └──────┬───────┘      └─────────────┘
                                          │
                                          ▼
                              FCM (push) · SMS (OTP)
```

- **Presentation:** mobile app + dashboard (built).
- **Application:** REST API — business logic, validation, auth, booking engine.
- **Data:** PostgreSQL (relational, referential integrity) + local filesystem for media.

---

## 3. Tech stack

The Offer allows **Laravel (PHP)** or **Node/Express**. Recommendation: **Node.js + Express + TypeScript + PostgreSQL** so the whole repo stays one language and can share `@ahla/shared` types.

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node 20 + TypeScript | Reuse `@ahla/shared` domain types |
| Framework | Express (or Fastify/NestJS) | REST |
| DB | PostgreSQL 15 | Prisma or Drizzle ORM for typed queries + migrations |
| Auth | JWT (access + refresh) | `bcrypt`/`argon2` for password hashing |
| Validation | zod | Validate every request body/query |
| Files | Local filesystem (`/uploads`) | Served behind the API; S3-compatible later |
| Push | Firebase Cloud Messaging | Booking status + reminders |
| SMS/OTP | Pluggable provider (e.g. Twilio / local aggregator) | Optional add-on |
| Jobs | node-cron / BullMQ | Reminders, slot cleanup |

New workspace: `backend/` alongside `mobile/`, `dashboard/`, `shared/`.

---

## 4. Environments & configuration (env vars)

```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://user:pass@host:5432/ahla_shabab
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
UPLOAD_DIR=/var/app/uploads
PUBLIC_BASE_URL=https://api.ahlashabab.com
FCM_SERVER_KEY=...
OTP_PROVIDER_KEY=...          # optional
OTP_ENABLED=false             # feature flag
CORS_ORIGINS=https://dashboard.ahlashabab.com
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=100
```

Per Offer pricing note: hosting, domains, gateway/SMS/FCM accounts are the foundation's responsibility — the code must read all such credentials from env, never hard-code them.

---

## 5. Authentication & authorization

### 5.1 Actors
- **Guest** — books a service with just a phone number (Offer §4.4). No account.
- **Registered user** — optional account (phone + name, optional password), tracks booking history, favorites, reminders.
- **Admin** — dashboard user with a role.

### 5.2 Mechanism
- **JWT** access + refresh tokens. Access token in `Authorization: Bearer`. Refresh rotation on `/auth/refresh`.
- Passwords hashed with **argon2/bcrypt**.
- **OTP (optional, `OTP_ENABLED`)** — phone verification to reduce no-shows; `POST /auth/otp/request` → `POST /auth/otp/verify` returns a short-lived token that authorizes a guest booking.

### 5.3 Roles & permissions (Offer §5-F) — matches dashboard `adminRoles`
Roles: `مدير عام` (Super Admin), `مدير محتوى` (Content Manager), `مدير حجوزات` (Bookings Manager), `اطّلاع فقط` (Read-Only).

Permission modules (boolean per role): `portfolio, services, providers, bookings, users, reports, roles`.

- Enforce with middleware: `requirePermission('bookings', 'write')`.
- Every mutating admin action writes an **activity log** entry (actor, action, target, timestamp).

---

## 6. Data model

Entities mirror `@ahla/shared` (`types.ts`, `services.ts`, `admin.ts`). Suggested tables:

### Catalog & providers
- **service_categories** — `id, name, icon, description, parent_id (self-FK, nullable → unlimited nesting), active, sort_order`
- **providers** — `id, name, specialization, bio, years_experience, rating, reviews, avatar_url, active`
- **provider_schedules** — `id, provider_id, weekday (0–6), start_time, end_time, slot_minutes` (weekly template)
- **provider_unavailable_dates** — `id, provider_id, date` (holidays/vacation)
- **services** — `id, name, description, category_id (FK), provider_id (FK), free, require_national_id, active`
- **service_form_fields** — per-service overrides of the booking form (`key, label, type, required, hidden, options_json`) so admins can configure required/optional/custom fields (Offer §4.3)

### Bookings & users
- **users** — `id, name, phone (unique), password_hash (nullable for guests), governorate, is_guest, blocked, created_at`
- **bookings** — `id, reference (unique, e.g. AS-482910), service_id, provider_id, user_id (nullable), applicant_name, phone, age, gender, governorate, city, national_id, notes, date, time_slot, status, created_at`
  - `status ∈ {قيد الانتظار, مؤكد, مكتمل, ملغي, لم يحضر}` (Pending/Confirmed/Completed/Cancelled/No-Show)
- **favorites** — `id, user_id, entity_type (project|case|service), entity_id`

### Portfolio / CMS (Offer §5-A) — `portfolioItems`
- **portfolio_items** — `id, type (مشروع|حالة|قافلة|برنامج|رحلة|مقال), title, description, governorate, date, published, cover_url, body, metadata_json`
- **cases** — `id, code, title, location, summary, need, tag, verified, target_amount, raised_amount, supporters, cover_url` (+ `case_updates`: `id, case_id, text, kind, created_at` for "آخر التحديثات")
- **projects** — `id, title, description, status, target_amount, raised_amount, supporters, cover_url` (+ `project_stages`: `id, project_id, label, done, sort_order`)
- **foundation_stats / milestones / values / initiatives** — small content tables (governorates count, beneficiaries, years, timeline entries) feeding the mobile Home + About screens
- **consultants** — advisory profiles for the Consultations screen

### Donations (mobile checkout)
- **donations** — `id, reference (AS-######), donor_name, user_id (nullable), cause, amount, method, recurring, status, created_at`
  - `method ∈ {بطاقة بنكية, فوري, إنستاباي, فودافون كاش, تحويل بنكي}`
  - `reference` shown on the mobile receipt (DonationSuccess) and in donation history.

### Engagement & content **(v1.1)**
- **articles** — news/activities feed: `id, category (خبر|نشاط|مقال|قافلة), title, excerpt, body, date, location, read_minutes, cover_url, published` (mobile NewsFeed/ArticleDetail; managed from dashboard Content)
- **volunteer_applications** — `id, name, phone, age, governorate, interests_json, availability, status (جديد|تم التواصل|مقبول|مرفوض), created_at` (mobile Volunteer form)
- **contact_messages** — `id, name, phone, message, status (جديد|تم الرد), created_at` (mobile ContactUs form)
- **notifications** — per-user in-app feed: `id, user_id, kind (donation|case|project|booking|system), title, body, read, created_at` (mobile Notifications screen; most rows generated by backend events — booking status changes, donation receipts, case/project updates)
- **notification_preferences** — `user_id, key (donations|cases|projects|bookings|news|system), enabled` (mobile NotificationPreferences; must be respected before any push/in-app fan-out)
- **device_tokens** — `id, user_id, token, platform, updated_at` (FCM)
- **faqs** — `id, question, answer, sort_order, published` (mobile FAQ; editable from dashboard)
- **app_config** — key/value store: `zakat_nisab` (EGP value of 85g gold, powers the Zakat calculator default), hotline, email, address, working hours, social links (mobile ContactUs + ZakatCalculator read these)

### Admin & audit
- **admin_users** — `id, name, email, password_hash, role_id, active`
- **roles** — `id, name, description, permissions_json`
- **activity_log** — `id, actor_id, action, target, created_at`

### Reference
- **governorates** — the 27 Egyptian governorates (seed from `shared/services.ts`).

---

## 7. Public API (mobile app)

Base: `/api/v1`. All list endpoints support `?page=&limit=&q=`. Read endpoints are public; booking/donation writes accept guest or bearer token.

### Portfolio / content
| Method | Path | Purpose |
|---|---|---|
| GET | `/home` | Aggregated home payload: hero, foundationStats, quickServices, urgent case, featured project |
| GET | `/foundation` | About: stats, mission/vision, values, initiatives, milestones, impact |
| GET | `/projects` · `/projects/:id` | Projects list + detail (with stages) |
| GET | `/cases` · `/cases/:id` | Cases list (filter `?tag=`) + detail (with updates) |
| GET | `/consultants` | Consultations hub |
| GET | `/articles?category=` · `/articles/:id` | **(v1.1)** News/activities feed + article detail |
| GET | `/faqs` | **(v1.1)** Published FAQ entries |
| GET | `/config` | **(v1.1)** App config: zakat nisab, hotline/email/address, social links |

### Services catalog & booking (Offer §4)
| Method | Path | Purpose |
|---|---|---|
| GET | `/categories?parentId=` | Child categories (null = main). Unlimited nesting |
| GET | `/categories/:id/services` | Bookable services in a (sub)category |
| GET | `/services/:id` | Service + provider detail |
| GET | `/providers` · `/providers/:id` | Providers directory + profile (with their services) |
| GET | `/services/:id/availability?from=&to=` | **Available days + open slots** for the service's provider (schedule minus unavailable dates minus already-booked). Drives the calendar |
| GET | `/services/:id/form` | Effective booking-form field schema for this service |
| POST | `/bookings` | Create a booking (guest: phone only; or bearer). Returns `{ reference, status: 'قيد الانتظار', ... }` |
| GET | `/bookings/:reference` | Booking confirmation lookup |

### Donations
| Method | Path | Purpose |
|---|---|---|
| POST | `/donations` | Create a donation (cause, amount, method, recurring). Returns `{ reference, status }` — the reference is shown on the receipt screen |

### Engagement **(v1.1)**
| Method | Path | Purpose |
|---|---|---|
| POST | `/volunteers` | Submit a volunteer application (name*, phone*, age, governorate*, interests*[], availability) |
| POST | `/contact` | Submit a contact-us message (name*, phone*, message*) |
Both are guest-friendly (no auth), rate-limited, and land in dashboard inboxes.

### Auth & account
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/otp/request` · `/auth/otp/verify` | Optional phone OTP |
| POST | `/auth/register` · `/auth/login` · `/auth/refresh` | Accounts |
| GET | `/me` · `/me/bookings` · `/me/donations` · `/me/favorites` | Profile data (MyBookings tabs upcoming/past; DonationHistory with totals) |
| PATCH | `/me` | **(v1.1)** Update profile: name, phone, email, governorate, bio (AccountSettings) |
| POST/DELETE | `/me/favorites` | Add/remove favorite |
| GET | `/me/notifications` | **(v1.1)** In-app notification feed (paginated, unread count) |
| PATCH | `/me/notifications/:id/read` · POST `/me/notifications/read-all` | **(v1.1)** Mark read / mark all read |
| GET/PUT | `/me/notification-preferences` | **(v1.1)** Per-type toggles (donations, cases, projects, bookings, news, system) |
| POST | `/me/device-tokens` | **(v1.1)** Register/refresh the FCM token |

---

## 8. Admin API (dashboard)

Base: `/api/v1/admin` — all require a valid admin JWT + the relevant permission.

### Bookings (Offer §5-D)
| Method | Path | Purpose |
|---|---|---|
| GET | `/bookings` | List with filters: `status, categoryId, providerId, governorate, date, q` |
| PATCH | `/bookings/:id/status` | Transition: confirm / reschedule / cancel / complete / no-show (notifies user) |
| PATCH | `/bookings/:id` | Reschedule (date/time), edit fields |
| GET | `/bookings/calendar?providerId=` | Per-provider upcoming appointments |
| GET | `/bookings/export?format=csv|xlsx` | Export current filter |

### Services & categories (§5-B)
| Method | Path | Purpose |
|---|---|---|
| GET/POST/PATCH/DELETE | `/categories` | Nested category CRUD |
| PATCH | `/categories/:id/active` | Activate / deactivate (keeps data) |
| GET/POST/PATCH/DELETE | `/services` | Service CRUD + per-service form config |

### Providers (§5-C)
| Method | Path | Purpose |
|---|---|---|
| GET/POST/PATCH/DELETE | `/providers` | Provider CRUD (profile, bio, avatar) |
| PUT | `/providers/:id/schedule` | Weekly working days + slot duration |
| POST/DELETE | `/providers/:id/unavailable` | Block/open specific dates |
| POST | `/providers/:id/services` | Assign/unassign services |

### Portfolio content (§5-A)
| Method | Path | Purpose |
|---|---|---|
| GET/POST/PATCH/DELETE | `/portfolio` | CRUD for projects, cases, caravans, programs, trips, articles, stats |
| PATCH | `/portfolio/:id/publish` | Publish / unpublish |
| POST | `/uploads` | Media upload (returns URL) |

### Users (§5-E)
| Method | Path | Purpose |
|---|---|---|
| GET | `/users` | List/filter (phone, name, governorate, registered/guest) |
| GET | `/users/:id/bookings` | Booking history |
| PATCH | `/users/:id/block` | Block / unblock |
| GET | `/users/export` | CSV export |

### Roles & audit (§5-F) and Reports (§5-G)
| Method | Path | Purpose |
|---|---|---|
| GET/POST/PATCH | `/roles` | Roles + permission matrix |
| GET | `/activity` | Activity log |
| GET | `/reports/bookings?groupBy=category|provider|governorate|status&from=&to=` | Aggregates for charts |
| GET | `/reports/utilization` | Completion rate, no-shows, avg per provider |
| GET | `/reports/export?type=...&format=pdf|xlsx` | Downloadable reports |

### Engagement & content management **(v1.1)** — new dashboard modules
| Method | Path | Purpose |
|---|---|---|
| GET/POST/PATCH/DELETE | `/articles` | News/activities CRUD + publish toggle (feeds mobile NewsFeed) |
| GET | `/volunteers` | Volunteer applications inbox — filter by status/governorate/interest |
| PATCH | `/volunteers/:id/status` | جديد → تم التواصل → مقبول/مرفوض |
| GET | `/volunteers/export` | CSV export |
| GET | `/messages` | Contact-us inbox |
| PATCH | `/messages/:id` | Mark replied / add internal note |
| GET/POST/PATCH/DELETE | `/faqs` | FAQ CRUD + ordering |
| PUT | `/config` | Edit app config (zakat nisab, contact info, social links) |
| POST | `/notifications/broadcast` | Compose a push/in-app announcement to a segment (all, governorate, donors, …) — respects user preferences |

These imply two new sidebar modules in the dashboard (Volunteers inbox, Messages inbox) plus Articles/FAQ tabs inside Content — gate them under the existing `portfolio` (articles/faqs/config) and `users` (volunteers/messages) permission keys, or add dedicated keys if finer control is wanted.

---

## 9. Booking engine rules (the hard part)

1. **Slot generation** — from each provider's weekly `provider_schedules` (start/end + `slot_minutes`), generate concrete slots for a requested date range, **excluding** `provider_unavailable_dates` and any slot already taken by a non-cancelled booking.
2. **Availability endpoint** returns only future, open slots; the mobile calendar greys out full/unavailable days.
3. **Conflict detection** — creating/rescheduling a booking must be **transactional** with a uniqueness guard on `(provider_id, date, time_slot)` for active statuses, to prevent double-booking under concurrency (Offer §11 load-tests this).
4. **Reference generation** — unique human code `AS-######`.
5. **Status machine** — `Pending → Confirmed → Completed`, with `Cancelled`/`No-Show` as terminal side states; each transition may fire a notification.
6. **Form validation** — validate the submitted booking against the service's effective `service_form_fields` (required/optional/hidden, phone format, gender enum, governorate in the 27-list).
7. **Guest vs account** — guest bookings key off phone; if a matching user exists, link them.

---

## 10. Notifications
- **Two channels, one pipeline (v1.1):** every notable event writes an **in-app notification row** (feeds the mobile Notifications screen + bell unread badge) *and* optionally sends **FCM push** — both filtered through the user's `notification_preferences` before fan-out.
- Event triggers: booking received/confirmed/rescheduled/cancelled; reminder N hours before appointment (cron); donation receipt + monthly-sponsorship renewal; case reaching coverage milestones; project stage changes; admin broadcasts.
- **SMS/OTP** (optional): verification + optional booking confirmation text.
- Store device tokens per user (`POST /me/device-tokens`); no-op gracefully when a channel isn't configured.

---

## 11. Security (Offer §8)
- HTTPS/TLS everywhere; HSTS.
- Argon2/bcrypt password hashing; JWT with expiry + refresh rotation.
- **RBAC** on every admin route.
- Input validation + sanitization on **every** endpoint (zod) → prevents SQLi/XSS; use parameterized queries/ORM.
- CSRF protection for any cookie-based flows; prefer bearer tokens.
- **Rate-limiting** on `login`, `otp`, `bookings` (abuse/no-show protection).
- Activity log retained for accountability.
- CORS locked to known dashboard/app origins.
- Never log secrets or full national IDs.

---

## 12. Conventions
- **Errors**: `{ "error": { "code": "VALIDATION", "message": "...", "fields": {...} } }`, correct HTTP status codes.
- **Pagination**: `{ data: [...], page, limit, total }`.
- **Dates**: ISO `YYYY-MM-DD`; times as stored Arabic slot labels + a normalized 24h field.
- **Money**: integer EGP (piastres optional); currency label handled client-side.
- **i18n**: content Arabic; API keys/enums in Arabic where the UI already uses them (statuses, methods) to match `@ahla/shared`.

---

## 13. Seed data
Seed the DB directly from the existing mocks in `@ahla/shared` so the apps look identical on day one:
`serviceCategories, providers, services, governorates, bookingFormSchema, adminBookings, adminUsers, adminRoles, permissionModules, activityLog, portfolioItems, cases, projects, consultants, donations, foundationStats`, **(v1.1)** `articles, notifications` — plus seed `faqs` from the questions hard-coded in `mobile/src/screens/FaqScreen.tsx`, `app_config` from the contact details in `ContactUsScreen.tsx` + the `DEFAULT_NISAB` in `ZakatCalculatorScreen.tsx`, and default `notification_preferences` from `NotificationPreferencesScreen.tsx`.

---

## 14. Build order (milestones)
1. **Scaffold** `backend/` + DB schema + migrations + seed from `@ahla/shared`.
2. **Auth**: admin login + JWT + RBAC middleware; guest + OTP flag.
3. **Catalog read APIs** → point mobile ServicesBrowse/ProviderDetail/ServiceDetail at them.
4. **Booking engine**: availability + create booking + confirmation → wire mobile BookAppointment.
5. **Dashboard admin APIs**: bookings ops, categories/services, providers/schedules → replace dashboard in-session state.
6. **Portfolio CMS + Users + Roles/Activity** — including **(v1.1)** articles, FAQs, and app-config.
7. **Engagement (v1.1)**: volunteer applications + contact messages (public POST + dashboard inboxes), `PATCH /me`, notification preferences.
8. **Reports/analytics + exports**.
9. **Notifications**: in-app feed + FCM + reminders cron + admin broadcast **(v1.1: preference-filtered pipeline)**.
10. **Donations** endpoints (+ gateway sandbox), receipts by reference.
11. **Hardening**: rate limits (now also on `/volunteers`, `/contact`), load test the booking endpoint (Offer §11), OWASP pass.

---

## 15. Open decisions (need input)
- **Stack**: confirm Node/Express (recommended) vs Laravel.
- **ORM/migrations**: Prisma vs Drizzle.
- **OTP provider** and whether OTP ships in v1.
- **Payment gateways**: which of Fawry / InstaPay / Vodafone Cash / card go live vs sandbox first.
- **Hosting/DB**: managed Postgres? where is media stored long-term (local vs S3)?
- **Auth for donors**: required accounts or fully guest-first?
