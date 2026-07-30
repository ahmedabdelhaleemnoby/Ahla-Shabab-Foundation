# Ahla Shabab — Backend Specification

Backend requirements for **جمعية خواطر أحلى شباب**, derived from the Technical Offer (§5–§8) and the already-built frontend (`mobile/` app + `dashboard/`). Every entity and endpoint below maps to a real screen or module that already consumes it via mock data in `@ahla/shared` — the job of the backend is to replace those mocks with a real REST API + database, changing nothing about the UI contracts.

> Status: **an implementation now exists and is deployed** — `https://portfolio.27lashabab.com/api/v1` (Swagger: `/api/docs`). 113 endpoints, bearer auth, covering most of this spec.
>
> **The app has not been wired to it.** The mobile app and dashboard still run entirely on `@ahla/shared` mock data (app **v1.4.0**), and the QA acceptance report's "zero external requests" finding describes that state. Integration is a separate piece of work — see **§18** for the field-level differences that must be settled first.
>
> **Updated 2026-07-05** to cover the newer mobile screens: in-app Notifications + preferences, News/Articles feed, Volunteer applications, Contact-us messages, My Bookings, Donation history/receipts, Account settings, Zakat calculator (nisab config), FAQ, Onboarding. Sections marked **(v1.1)** are those additions.
>
> **Updated 2026-07-13 (v1.2)** for the UX-review pass: **passwordless email login** (replaces phone/OTP — see §5), the multi-step **donation wizard**, **اكفل أسرة** (monthly sponsorship) + **حالات عاجلة** (urgent cases) with sponsorship fields on `cases`, **per-type consultation request forms** (new `consultation_requests` inbox), the notification center, `workGovernorates` replacing the "22 محافظة" claim, and `appConfig`-driven app settings. Sections marked **(v1.2)** are those additions.
>
> **Updated 2026-07-19 (v1.3)** for the CMS layer shipped in v1.3.0: a **headless CMS** that controls the app's sidebar menu, Home page layout, generic CMS pages, **consultation type configuration + dynamic form builder**, and a **media library**. The demo persists everything to browser localStorage; the backend must replace localStorage with a real persistence layer. Sections marked **(v1.3)** are those additions.
>
> **Updated 2026-07-27 (v1.4)** after the QA acceptance pass and fix rounds. CMS schema moved **3 → 5** (impact numbers and payment methods became CMS-owned), the consultation **email is now required and is the identity key**, and the provider portal gained **working-hours** and **reschedule** operations. It also documents, in §17, exactly which demo state is **in-memory only** — that is the list of things the backend must own, and it is the single biggest gap between the demo and a working product. Sections marked **(v1.4)** are those additions.

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
                              FCM (push) · Email (OTP)
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
| Email/OTP | Pluggable provider (SES / SendGrid / SMTP) | Passwordless user login + transactional email |
| SMS | Pluggable provider (e.g. Twilio / local aggregator) | Optional — guest-booking verification |
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
EMAIL_PROVIDER=ses            # ses | sendgrid | smtp — powers passwordless login
EMAIL_FROM=no-reply@ahlashabab.com
EMAIL_PROVIDER_KEY=...
OTP_TTL=10m                   # email verification code lifetime
SMS_PROVIDER_KEY=...          # optional (guest-booking verification)
SMS_ENABLED=false             # feature flag
CORS_ORIGINS=https://dashboard.ahlashabab.com
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=100
```

Per Offer pricing note: hosting, domains, gateway/SMS/FCM accounts are the foundation's responsibility — the code must read all such credentials from env, never hard-code them.

---

## 5. Authentication & authorization

### 5.1 Actors
- **Guest** — browses everything and books a service with just a contact phone number (Offer §4.4). No account.
- **Registered user** — account keyed on **email** (passwordless), tracks donations/receipts, booking history, favorites, notifications, reminders. Phone is optional contact info, not the login identity.
- **Admin** — dashboard user with a role.

### 5.2 Mechanism
- **User login is passwordless email OTP** (matches the mobile app since v1.2.1): `EmailAuthScreen` collects the email → `POST /auth/otp/request` emails a 6-digit code → `OtpScreen` submits it → `POST /auth/otp/verify` returns JWT access + refresh tokens. No password is stored for end users.
- **JWT** access + refresh tokens. Access token in `Authorization: Bearer`. Refresh rotation on `/auth/refresh`.
- Admin accounts keep email + password (hashed with **argon2/bcrypt**) — separate from the passwordless end-user flow.
- The email-OTP provider is pluggable (SES / SendGrid / SMTP); an optional SMS channel can back guest-booking verification via the same request/verify endpoints.

### 5.3 Roles & permissions (Offer §5-F) — matches dashboard `adminRoles`
Roles: `مدير عام` (Super Admin), `مدير محتوى` (Content Manager), `مدير حجوزات` (Bookings Manager), `اطّلاع فقط` (Read-Only).

Permission modules (boolean per role): `portfolio, services, providers, bookings, users, reports, roles`.

- Enforce with middleware: `requirePermission('bookings', 'write')`.
- Every mutating admin action writes an **activity log** entry (actor, action, target, timestamp).

---

## 6. Data model

Entities mirror `@ahla/shared` (`types.ts`, `services.ts`, `admin.ts`, `cms/cmsTypes.ts`). Suggested tables:

### Catalog & providers
- **service_categories** — `id, name, icon, description, parent_id (self-FK, nullable → unlimited nesting), active, sort_order`
- **providers** — `id, name, specialization, bio, years_experience, rating, reviews, avatar_url, active`
- **provider_schedules** — `id, provider_id, weekday (0–6), start_time, end_time, slot_minutes` (weekly template)
- **provider_unavailable_dates** — `id, provider_id, date` (holidays/vacation)
- **services** — `id, name, description, category_id (FK), provider_id (FK), free, require_national_id, active`
- **service_form_fields** — per-service overrides of the booking form (`key, label, type, required, hidden, options_json`) so admins can configure required/optional/custom fields (Offer §4.3)

### Bookings & users
- **users** — `id, name, email (unique — login identity), phone (nullable contact), governorate, is_guest, blocked, created_at` (passwordless; no `password_hash` for end users)
- **bookings** — `id, reference (unique, e.g. AS-482910), service_id, provider_id, user_id (nullable), applicant_name, phone, age, gender, governorate, city, national_id, notes, date, time_slot, status, created_at`
  - `status ∈ {قيد الانتظار, مؤكد, مكتمل, ملغي, لم يحضر}` (Pending/Confirmed/Completed/Cancelled/No-Show)
- **favorites** — `id, user_id, entity_type (project|case|service), entity_id`

### Portfolio / CMS (Offer §5-A) — `portfolioItems`
- **portfolio_items** — `id, type (مشروع|حالة|قافلة|برنامج|رحلة|مقال), title, description, governorate, date, published, cover_url, body, metadata_json`
- **cases** — `id, code, title, location, summary, need, tag, verified, target_amount, raised_amount, supporters, cover_url` + sponsorship fields (`sponsorable, monthly_amount, sponsorship_duration, sponsorship_status ∈ {متاحة للكفالة, مكفولة جزئياً, مكتملة}`) powering the **اكفل أسرة** (Sponsorship) + **حالات عاجلة** (UrgentCases) screens; (+ `case_updates`: `id, case_id, text, kind, created_at` for "آخر التحديثات")
- **projects** — `id, title, description, status, category, timeline, target_amount, raised_amount, supporters, cover_url` (+ `project_stages`: `id, project_id, label, done, sort_order`, and `project_updates` timeline)
- **work_areas** — governorates where the foundation operates (feeds Home + About "مناطق عمل الجمعية" chips; seed from `workGovernorates`). Replaces the former unverified "22 محافظة" numeric claim.
- **foundation_stats / milestones / values / initiatives** — small content tables (beneficiaries, years of service, timeline entries) feeding the mobile Home + About screens
- **consultants** — advisory profiles for the Consultations screen

### Donations (mobile checkout)
- **donations** — `id, reference (AS-######), donor_name, user_id (nullable), cause, amount, method, recurring, status, created_at`
  - `method ∈ {بطاقة بنكية, فوري, إنستاباي, فودافون كاش, تحويل بنكي}`
  - `reference` shown on the mobile receipt (DonationSuccess) and in donation history.

### Engagement & content **(v1.1)**
- **articles** — news/activities feed: `id, category (خبر|نشاط|مقال|قافلة), title, excerpt, body, date, location, read_minutes, cover_url, published` (mobile NewsFeed/ArticleDetail; managed from dashboard Content)
- **volunteer_applications** — `id, name, phone, age, governorate, interests_json, availability, status (جديد|تم التواصل|مقبول|مرفوض), created_at` (mobile Volunteer form)
- **contact_messages** — `id, name, phone, message, status (جديد|تم الرد), created_at` (mobile ContactUs form)
- **consultation_requests** — per-type consultation forms (mobile Consultations → ConsultationRequest): `id, reference (AS-######), user_id (nullable), type (key from cms consultation types), name, phone, whatsapp, email, age, governorate, preferred_channel, preferred_time, summary, extra_fields_json (type-specific answers keyed by FormField.key), status (جديد|قيد المراجعة|تم تحديد موعد|مكتمل|ملغي), created_at`. The backend receives them and surfaces them in a dashboard inbox for the consultations team.
  - **(v1.4) `email` is required and is the identity key.** It was optional until the QA pass, which is what let anonymous submissions collapse together (D-09). The whole "returning guest" feature depends on it: a guest submits without an account, and later signs in with the same address to find their history waiting.
  - **Match on a normalised email** — `trim().toLowerCase()` — not on the raw string. `Test@Example.COM`, `test@example.com` and `"  test@example.com  "` must all resolve to **one** user. The demo implements this in `mobile/src/store/demoUsers.ts` (`normalizeEmail`, `findOrCreateDemoUserByEmail`, `attachConsultationToDemoUser`, `loginDemoUserByEmail`); the backend should own the same four behaviours and enforce uniqueness on the normalised column.
  - **Find-or-create on submit, link on login.** A request from an unknown email creates a lightweight user (no password — login is passwordless anyway) and attaches to it. On OTP login, every prior request for that email becomes visible, and **no duplicate user is created**.
  - **Never fall back to a shared address.** The demo briefly used a single `guest@ahlashabab.com` for emailless submissions, which merged unrelated people into one identity. If a CMS form config makes `email` optional again, generate a **per-submission** key instead; never a constant.
- **notifications** — per-user in-app feed: `id, user_id, kind (donation|case|project|booking|system), title, body, read, created_at` (mobile Notifications screen; most rows generated by backend events — booking status changes, donation receipts, case/project updates)
- **notification_preferences** — `user_id, key (donations|cases|projects|bookings|news|system), enabled` (mobile NotificationPreferences; must be respected before any push/in-app fan-out)
- **device_tokens** — `id, user_id, token, platform, updated_at` (FCM)
- **faqs** — `id, question, answer, sort_order, published` (mobile FAQ; editable from dashboard)
- **app_config** — key/value store: `zakat_nisab` (EGP value of 85g gold, powers the Zakat calculator default), hotline, email, address, working hours, social links (mobile ContactUs + ZakatCalculator read these).
  - **(v1.4) These now live in `cms_state.settings_json`,** not a separate store — the dashboard's *إعدادات التطبيق* writes them there and the app reads them from the same place. Keep one source of truth; if you prefer a dedicated `app_config` table, have the CMS read through to it rather than duplicating.
  - **Social links must be per-network and may be blank.** The app hides any network whose URL is empty or identical to the website, because a "Facebook" button that reopens the website is a dead button (D-12). Return them individually; do not default them all to the website URL.

### Headless CMS **(v1.3)**

The CMS controls **app structure** (not entity content). In v1.3.0 it is a localStorage demo; the backend must persist and serve a single `CmsState` blob per tenant.

- **cms_state** — `id, schema_version (int), settings_json, menu_json, home_json, pages_json, consultations_json, updated_at` — a single-row table (or key/value store) holding the serialized `CmsState` from `shared/src/cms/cmsTypes.ts`. The dashboard's `cmsStore` writes this; the mobile app reads it on launch.
  - `settings_json` → `CmsSettings`: app name, colors, hero text, contact info, social links, zakat nisab, demo label, and **(v1.4)** `stats` — the About-screen impact figures (`governorates`, `beneficiaries`, `yearsOfService`), all stored as **strings** because they are display values like `"1.2M+"`, not counts. These are editable from the dashboard and read by the app; do **not** derive them from row counts unless the foundation asks for that.
  - `menu_json` → `MenuGroup[]`: sidebar navigation groups + items with `NavTarget` (tab / route / cmsPage / external). Replaces `AppDrawer` hardcoding.
  - `home_json` → `HomeSection[]`: ordered, toggleable home sections (`hero`, `impactStats`, `workAreas`, `quickServices`, `urgentCases`, `sponsorship`, `featuredProjects`, `latestNews`, `consultations`, `donationCta`, `volunteerCta`, `contactCta`, `imageBanner`, `textBlock`, `faqPreview`, `spacer`). Each section has `config` knobs (itemCount, layout, ctaText/Target, entityIds, imageId, background, body).
  - `pages_json` → `CmsPage[]`: generic pages with `PageSection[]` + `ContentBlock[]` (rich block content: `heading`, `paragraph`, `bulletList`, `orderedList`, `quote`, `highlight`, `image`, `cta`, `contact`, `divider`). Native RN screens are referenced with `builtin: true` and do not render sections.
  - `payment_methods_json` → `PaymentMethodInfo[]` **(v1.4)**: the donation methods shown on the app's Donate step 4 — `id, group, description, availability (متاحة|قيد التفعيل|غير متاحة حالياً), manual`. `manual: true` means the donation stays **قيد المراجعة** until an admin approves it; `false` means it stays **قيد التأكيد** until the payment gateway confirms. **The app must never mark a donation successful on its own** — see §11.
  - `consultations_json` → `ConsultationTypeConfig[]`: per-type consultation config including the **dynamic form schema** (`FormField[]` — field types: `text`, `textarea`, `phone`, `whatsapp`, `email`, `number`, `age`, `governorate`, `radio`, `checkbox`, `multiselect`, `date`, `time`, `file`, `info`, `consent`). The mobile `ConsultationRequestScreen` renders these fields; the dashboard `CmsForms` page edits them.

- **cms_media** — `id, title, alt, caption, folder, src_url, type (image|svg), width, height, size_bytes, created_at, updated_at` — separates the media library from the core CMS state (mirrors `MediaItem` in `cmsTypes.ts`). Uploaded via `POST /admin/cms/media`; referenced by `mediaId` / `imageId` fields throughout the CMS.

> **Schema versioning:** `CMS_SCHEMA_VERSION` (currently **`5`**) must be stored and a migration path provided when the shape changes — the backend must run `migrate(parsed)` before persisting an imported blob. Migrations shipped so far, all backfill-on-read and safe to re-run:
> - **1 → 2** seed the media library · **2 → 3** seed consultation types
> - **3 → 4** seed `settings.stats` from `foundationStats`
> - **4 → 5** seed `paymentMethods` from the shared defaults
>
> **`NavTarget` of kind `tab` must be validated server-side** against the real tab set — `Home | Cases | UrgentCases | Donate | Consultations | About`. A menu item naming a tab that does not exist is silently ignored by React Navigation and renders as a **dead button** with no error. That is exactly how three dead menu items shipped (QA D-01); the frontend now has a compile-time guard plus a legacy remap (`Discover→ServicesBrowse`, `News→NewsFeed`, `Profile→AccountSettings`), and the API should reject or remap unknown tabs rather than storing them.

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
| POST | `/consultations` | Submit a consultation request (type*, name*, phone*, whatsapp, email, age, governorate*, preferred_channel*, preferred_time*, summary*, extra_fields) — returns `{ reference, status: 'جديد' }` |
All three are guest-friendly (no auth), rate-limited, and land in dashboard inboxes.

### Auth & account
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/otp/request` · `/auth/otp/verify` | **Passwordless email OTP** — request emails a 6-digit code to the address, verify returns JWT access + refresh (mobile EmailAuth → Otp) |
| POST | `/auth/refresh` · `/auth/logout` | Rotate / revoke tokens |
| POST | `/admin/auth/login` | Admin email + password login (dashboard only) |
| GET | `/me` · `/me/bookings` · `/me/donations` · `/me/favorites` · `/me/consultations` | Profile data (MyBookings tabs upcoming/past; DonationHistory with totals; consultation requests) |
| PATCH | `/me` | **(v1.1)** Update profile: name, phone, governorate, bio (AccountSettings). Email is the login identity — change requires re-verification |
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
| GET | `/bookings/export?format=csv\|xlsx` | Export current filter |

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
| PUT | `/providers/:id/schedule` | Weekly working days + slot duration + **(v1.4)** `start_time` / `end_time` (the working-day range) |
| POST/DELETE | `/providers/:id/unavailable` | Block/open specific dates |
| POST | `/providers/:id/services` | Assign/unassign services |
| PATCH | `/providers/:id/availability` | **(v1.4)** Toggle "accepting bookings" on/off |

**(v1.4) Provider self-service.** The mobile **لوحة مقدم الاستشارة** screen drives all of the above for the signed-in provider, so mirror them under `/me/provider/*` with the provider's own identity rather than an admin's. It also needs booking operations — see the next table.

| Method | Path | Purpose |
|---|---|---|
| GET | `/me/provider/bookings` | Own bookings, filterable by status + free-text search (name, email, phone, reference, governorate) |
| PATCH | `/me/provider/bookings/:id/status` | Confirm / complete / cancel |
| PATCH | `/me/provider/bookings/:id/schedule` | **Reschedule** — new date + time. **Must not change `status`**: moving a pending request is not the same as confirming it, and silently confirming would misrepresent the provider's intent |
| GET | `/me/provider/overview` | Counters: upcoming, today, new, completed, cancelled — derived server-side so they cannot drift from the list |

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
| GET | `/reports/bookings?groupBy=category\|provider\|governorate\|status&from=&to=` | Aggregates for charts |
| GET | `/reports/utilization` | Completion rate, no-shows, avg per provider |
| GET | `/reports/export?type=...&format=pdf\|xlsx` | Downloadable reports |

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

### Headless CMS **(v1.3)** — new dashboard CMS module

The dashboard ships six new CMS sub-pages (Home Builder, Menu Manager, Pages, Forms, Media Library, Tools). All state is currently demo-only in localStorage; these endpoints replace that layer.

| Method | Path | Purpose |
|---|---|---|
| GET | `/cms` | Full `CmsState` snapshot (public — mobile reads on launch) |
| PUT | `/admin/cms` | Replace full `CmsState` (import JSON / bulk save from dashboard) |
| PATCH | `/admin/cms/settings` | Edit `CmsSettings` (app name, colors, hero, contact info, zakat nisab) |
| PUT | `/admin/cms/menu` | Replace menu `MenuGroup[]` (sidebar manager) |
| PUT | `/admin/cms/home` | Replace home `HomeSection[]` (home builder) |
| GET/POST/PATCH/DELETE | `/admin/cms/pages` | CMS page CRUD (`CmsPage` — template, sections, rich `ContentBlock[]` content) |
| PATCH | `/admin/cms/pages/:id/status` | Publish / draft toggle |
| GET/POST/PATCH/DELETE | `/admin/cms/consultations` | Consultation type config CRUD — including the `FormField[]` dynamic form schema (form builder) |
| GET | `/admin/cms/media` | List media library items |
| POST | `/admin/cms/media` | Upload image (server compresses + stores; returns `MediaItem`) |
| DELETE | `/admin/cms/media/:id` | Delete media item (fails if still referenced) |
| GET | `/admin/cms/export` | Download full `CmsState` as JSON (Tools → Export) |
| POST | `/admin/cms/import` | Upload + validate + migrate a JSON blob (Tools → Import; runs `cmsMigrations` if `schema_version` is older) |
| POST | `/admin/cms/backup` | Create server-side snapshot before a destructive import |

**Schema versioning:** The backend must store `schema_version` alongside the state and run `migrate(blob)` on import. Mobile clients must be able to handle `schema_version` ≤ current gracefully.

**Permission gating:** Gate `/admin/cms/*` under a new `cms` permission key (or reuse `portfolio` for settings/pages/media and `roles` for form schemas — to be decided in §15 open decisions).

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
`serviceCategories, providers, services, governorates, bookingFormSchema, adminBookings, adminUsers, adminRoles, permissionModules, activityLog, portfolioItems, cases (incl. sponsorship fields), projects (incl. category/timeline), consultants, donations, foundationStats`, **(v1.1)** `articles, notifications, volunteerApplications, contactMessages`, **(v1.2)** `appConfig` (contact/hero/socials/zakat nisab) and `workGovernorates` (مناطق عمل الجمعية) — plus seed `faqs` from `mobile/src/screens/FaqScreen.tsx` and default `notification_preferences` from `NotificationPreferencesScreen.tsx`. Consultation requests start empty (submitted from the app). `app_config` now comes from `shared/appConfig` rather than being hard-coded in screens.

**(v1.3)** Seed `cms_state` from `shared/src/cms/cmsDefaults.ts` → `makeDefaultCmsState()`: this gives the correct default menu (`defaultMenu`), home sections (`defaultHome`), pages (`defaultPages`), consultation type configs with their dynamic `FormField[]` schemas (`defaultConsultationTypes`), and settings seeded from `appConfig`. Seed `cms_media` as empty (no bundled media in the demo). The `CMS_SCHEMA_VERSION` at seed time is `3`.

---

## 14. Build order (milestones)
1. **Scaffold** `backend/` + DB schema + migrations + seed from `@ahla/shared`.
2. **Auth**: admin email+password login; passwordless **email-OTP** user login + JWT + RBAC middleware; guest booking path.
3. **Catalog read APIs** → point mobile ServicesBrowse/ProviderDetail/ServiceDetail at them.
4. **Booking engine**: availability + create booking + confirmation → wire mobile BookAppointment.
5. **Dashboard admin APIs**: bookings ops, categories/services, providers/schedules → replace dashboard in-session state.
6. **Portfolio CMS + Users + Roles/Activity** — including **(v1.1)** articles, FAQs, and app-config.
7. **Engagement (v1.1+)**: volunteer applications + contact messages + consultation requests (public POST + dashboard inboxes), `PATCH /me`, notification preferences.
8. **Reports/analytics + exports**.
9. **Notifications**: in-app feed + FCM + reminders cron + admin broadcast **(v1.1: preference-filtered pipeline)**.
10. **Donations** endpoints (+ gateway sandbox), receipts by reference.
11. **(v1.3) Headless CMS**: `GET /cms` (public snapshot) + full `/admin/cms/*` suite — settings, menu, home, pages (with rich `ContentBlock[]`), consultation types + dynamic `FormField[]` schemas, media library (upload/delete), and Tools (export/import with migration). Seed `cms_state` from `makeDefaultCmsState()`. Wire mobile `cms.ts` store to fetch from `/cms` instead of falling back to `makeDefaultCmsState()`.
12. **Hardening**: rate limits (now also on `/volunteers`, `/contact`, `/consultations`, `/auth/otp/*`, `/cms` write paths), load test the booking endpoint (Offer §11), OWASP pass.

---

## 15. Open decisions (need input)
- **Stack**: confirm Node/Express (recommended) vs Laravel.
- **ORM/migrations**: Prisma vs Drizzle.
- **OTP provider** and whether OTP ships in v1.
- **Payment gateways**: which of Fawry / InstaPay / Vodafone Cash / card go live vs sandbox first.
- **Hosting/DB**: managed Postgres? where is media stored long-term (local vs S3)?
- **Auth for donors**: required accounts or fully guest-first?
- **(v1.3) CMS persistence strategy**: single-row `cms_state` table (simple, atomic) vs normalized tables per entity type (more queryable). Single-row is strongly recommended given the CMS is edited as a unit and queried as a snapshot.
- **(v1.3) CMS media storage**: store processed images in the same `UPLOAD_DIR` as booking/case media, or a separate CDN bucket? Max resolution/quality settings (current dashboard compresses client-side to ~80% JPEG ≤1280px).
- **(v1.3) CMS permission key**: add a dedicated `cms` permission module, or reuse `portfolio` for structural config? Finer-grained control (e.g. separate `cms.forms` for the consultation form builder) may be warranted.
- **(v1.4) Consultation → booking flow**: → **§20 is a full decision brief with a recommendation (option A: one pipeline).** Needs a yes/no, not more analysis.
- **(v1.4) Provider identity**: are providers `admin_users` with a restricted role, or a separate `providers` login? The mobile provider dashboard assumes a signed-in provider can read and mutate **only their own** bookings and schedule, which needs whichever model you pick to carry an ownership check.
- **(v1.4) Impact figures**: confirm the real numbers (or agree to drop the block). They are CMS-editable now, so this is a content decision, not a code change.

---

## 16. Security acceptance criteria (production sign-off — added by QA pass v2)

These MUST be implemented and tested server-side before launch. The mobile app already enforces the client half (statuses `قيد التأكيد`/`قيد المراجعة` only — see `shared/src/rules.ts` + unit tests in `shared/src/__tests__/rules.test.ts`).

**Donations**
1. `POST /donations` accepts NO `status` field from clients — the server sets it (`قيد التأكيد` gateway / `قيد المراجعة` manual). Reject any payload containing `status`.
2. Only two paths may set `مكتمل`: (a) the payment-gateway webhook after signature verification; (b) `PATCH /admin/donations/:id/status` by an admin holding the `donations` permission.
3. Webhooks are **idempotent**: store the gateway transaction id with a unique constraint; replays return 200 without state change; out-of-order events cannot regress a final state.
4. Amount + destination are re-validated server-side against the gateway's charged amount — mismatch → flag `قيد المراجعة`, never auto-complete.
5. Receipts: `GET /me/donations/:ref` returns only the requester's own receipts (401/403 otherwise); receipts contain no beneficiary personal data.
6. Rate-limit donation creation per phone/IP.

**Bookings**
7. `POST /bookings` re-validates the slot server-side (transactional unique `(provider, date, slot)`); a client submitting a booked/blocked slot gets 409 — frontend state is never trusted.
8. Duplicate booking (same phone + service + date) → 409.
9. Confirmation status returned by the server; app shows «قيد تأكيد الإدارة» until an admin confirms.
10. All times stored UTC, rendered Africa/Cairo.

**Authorization (403 matrix)**
11. Every admin endpoint checks role permissions; write an integration test per module (donations/content/cases/bookings/reports/roles) asserting each unauthorized role gets **403** for: approve/reject donation, edit case, edit project, edit impact numbers, read reports, read audit log.

**Audit log**
12. Every mutation writes: actor id, action, entity type, entity id, **previous value, new value**, timestamp, request IP + user-agent. Required for: donation approve/reject, case create/update, project create/update, booking status change, impact-number change, role/permission change. Audit entries are append-only.

**Notifications**
13. User push on donation approval/failure and booking confirmation; admin WhatsApp/notification on new manual transfer + new booking (integration credentials are the association's responsibility).

**Media (§9 of the UX spec)**
14. Admin uploads are the only image source (cases/projects/consultants/news/events). Server strips EXIF, resizes to max 1280px, re-encodes ~80% JPEG, and serves via CDN paths stored in `imageUrl`. The app renders them through `RemoteImage` (loading + broken-image + privacy-safe fallback already implemented).

---

## 17. What the demo does **not** persist (v1.4) — the backend's actual job

The QA acceptance pass established this precisely, and it is the shortest useful summary of the gap between the demo and a product. **Everything below is held in module-level JavaScript variables and is gone on reload or app restart.** The app now says so honestly on screen ("محفوظة أثناء الجلسة الحالية فقط") rather than claiming local storage it does not have.

| Demo state | Lives in | Survives restart? | Backend must own it as |
|---|---|---|---|
| Login session (`loggedIn`, `email`) | `mobile/src/store/appState.ts` | **No** | JWT access + refresh (§5.2) |
| Consultation requests | `appState.ts` | **No** | `consultation_requests` (§6) |
| Donation receipts | `appState.ts` | **No** | `donations` + receipts (§6) |
| Returning-guest identity map | `mobile/src/store/demoUsers.ts` | **No** | `users`, keyed on normalised email (§6) |
| Provider availability (days, slots, exception dates, accepting-bookings) | `mobile/src/store/providerStore.ts` | **No** | `provider_schedules` (§8) |
| Provider booking statuses + reschedules | `providerStore.ts` | **No** | `bookings` (§8) |
| Notification read state | `mobile/src/store/notifications.ts` | **No** | `notifications.read` (§6) |
| CMS content (menu, home, pages, media, consultation schemas, settings, payment methods) | `dashboard/src/store/cmsPersistence.ts` → `localStorage` | **Web only** | `cms_state` + `cms_media` (§6) |

### Two demo-only workarounds the backend replaces outright

1. **`localStorage` is partitioned per origin.** The dashboard and the Expo web build run on different ports, so a CMS edit in one is invisible to the other. The demo works around this with `scripts/demo-origin.mjs`, which serves both from a single port (app at `/`, dashboard at `/admin/`). A real API makes the whole problem disappear — **delete that script when the backend lands.** Native devices currently sync only via export/import JSON under *أدوات النظام*.

2. **No consultation data reaches the provider.** A request submitted in the app lands in `demoUsers`/`appState`; the provider dashboard reads a fixed three-booking seed in `providerStore`. They are unconnected stores, so **a consultation submitted live never appears in the provider's list.** Wiring `consultation_requests` → provider bookings is the first thing that makes the two halves one product, and it is the demo's most visible missing link.

### Two client decisions still open

- **Impact figures.** `1.2M+ مستفيد`, `+650 مبادرة`, `+10,000 متطوع` and the 2013–2025 timeline are unverified. They are now CMS-editable (`settings.stats`), so the foundation can correct or blank them without a release — but somebody has to confirm the real numbers. The `22 محافظة` claim was already removed; the app lists the 12 real governorates plus "وفي توسع مستمر…".
- **Social profile URLs.** All four still point at the website, so the app hides the row. Real URLs make it appear.

### Build note, not a backend concern but it will bite you

The mobile project is a **bare** Expo workflow — `android/` is committed, so `expo prebuild` never runs and **nothing in `app.json` reaches a native build**. Two defects came from exactly this: the version stayed at `1.0.0`/`versionCode 1` (D-19) and the launcher icon stayed the default Android robot (D-20). `scripts/sync-android-icons.mjs` and a manual `build.gradle` edit patch the symptoms; the durable fix is to adopt prebuild or run the sync scripts as part of CI. Also: the Android build fails from an exFAT volume (no hard links, which AGP requires) — build from a local disk or CI.

---

## 18. Contract reconciliation — the deployed API vs this spec (2026-07-28)

An implementation is live at `https://portfolio.27lashabab.com/api/v1`. This section records **what actually exists** and where it differs from the app's expectations, so integration starts from facts rather than assumptions.

**Verified read-only and unauthenticated.** Public `GET` endpoints were probed directly; the 93 admin endpoints and the 18 `/me/*` endpoints require a bearer token and were **not** exercised. Their shapes below are taken from the route list, not from responses — treat them as unconfirmed.

Re-run the comparison at any time:
```bash
node qa/harness/api-contract.mjs
```

### 18.1 What the API already covers

113 endpoints, titled `أحلى شباب API v1.0.0`, `bearer` auth (`access-token`). Coverage tracks this document closely:

| Area | Endpoints | Notes |
|---|---|---|
| Auth | `POST /auth/otp/request`, `/otp/verify`, `/refresh`, `/logout` | Passwordless email OTP exactly as §5.2 |
| Admin auth | `POST /admin/auth/login` | Separate password flow for staff, as specced |
| Public content | `/home`, `/foundation`, `/cases`, `/projects`, `/articles`, `/services`, `/categories`, `/providers`, `/consultants` | All returning data |
| Writes | `POST /consultations`, `/bookings`, `/donations`, `/volunteers`, `/contact` | The five public submit paths |
| Account | 18 × `/me/*` — profile, bookings, consultations, donations, favorites, notifications, device tokens | |
| **Provider self-service** | `/me/provider/bookings`, `/{id}/status`, `/{id}/schedule`, `/me/provider/overview` | **Matches §8 exactly**, including a separate `schedule` route so a reschedule need not touch status |
| CMS | `GET /cms` public; `PUT /admin/cms`, `/cms/menu`, `/cms/home`, `/cms/settings`, pages, media, consultations, import/export/backup | |
| Payments | `POST /webhooks/payment` | The gateway callback §11 requires |

### 18.2 Differences that would break the app today

`GET /cms` is the one that matters — the app consumes `CmsState` directly.

| Concern | API sends | App expects | Recommended resolution |
|---|---|---|---|
| Schema version | `schemaVersion` | `version` | **API renames** — the app, dashboard, migrations and tests all use `version` |
| Consultation types | `consultationTypes` | `consultations` | **API renames** — matches `CmsState.consultations` |
| Contact details | `contactPhone`, `contactEmail`, `contactAddress` | `hotline`, `email`, `address` | **API renames.** `hotline` is the intended meaning; `contactPhone` invites confusion with a provider's phone |
| Socials | `socialLinks` | `socials` | **API renames** |
| Zakat nisab | `zakatNisab` | `zakatNisabEgp` | **API renames** — the `Egp` suffix is deliberate; the value is currency-specific |
| Media library | *(absent)* | `media` | **API adds.** `/admin/cms/media` exists, so expose it on the public read too — `getMediaSrc()` resolves `imageId`/`mediaId` throughout the CMS and silently renders nothing without it |
| Missing settings | *(absent)* | `splashText`, `website`, `donationReassurance` | **API adds.** `donationReassurance` is the donation-screen legal text — its absence is user-visible |
| Audit / timestamps | *(absent)* | `activity`, `updatedAt` | **App tolerates** — optional, dashboard-only. Lowest priority |
| Payment methods | ✅ all five fields align | — | **No change** |
| `cases`, `consultants` | ✅ item shapes align | — | **No change** |

**Direction of travel:** rename on the **API** side. Nine of these are pure naming, and the app's names are load-bearing across `shared/`, the dashboard store, the migrations and the test suite — changing them there is a far larger, riskier diff than renaming response fields in one serializer.

### 18.3 Blocking gaps

1. **`consultationTypes` is empty.** The dynamic consultation form is CMS-driven; with an empty array the app renders **no fields at all**. Seed the five types (نفسية، دينية، طبية، أسرية، أعمال) with their `FormField[]` schemas from `shared/src/cms/cmsDefaults.ts` before any integration test.
2. **Swagger documents no payloads.** All 113 routes carry `operationId`, `tags` and a bare `200`/`201`, with **zero request or response schemas** and no `components.schemas`. Integrating against it means guessing every body. Decorating the NestJS DTOs with `@ApiProperty` would generate them automatically — this is the single highest-value fix on the API side.
3. **No `servers` block** in the spec, so generated clients have no base URL.

### 18.4 Response envelope

Not previously specified here; the implementation chose:

```jsonc
{ "data": <payload> }                                  // single resource
{ "data": { "data": [...], "meta": {                   // paginated list
    "total": 12, "page": 1, "limit": 20, "totalPages": 1 } } }
```

The double nesting on lists is awkward but harmless. **Document it as the standard** (§12) so clients unwrap consistently, or flatten lists to `{ data: [...], meta: {...} }` — either is fine, but pick one.

### 18.5 Already correct — worth not regressing

`settings.stats` returns `{ governorates: "12", beneficiaries: "1.2M+", yearsOfService: "+12" }`. Strings, as §6 requires, and **the governorate count is the real 12** rather than the unverified 22. The `beneficiaries` figure is still the unapproved `1.2M+` — see D-07; it is now editable, so this is a content decision, not a code one.

### 18.6 Consultation types — two incompatible definitions (blocking)

§18.3 recorded `consultationTypes` as empty. It is no longer: the API now returns **three** types. They do not match the app's five, in taxonomy *or* schema, and this must be settled before integration.

| | API (live) | App (`cmsDefaults.ts`) |
|---|---|---|
| Types | `psychological`, `legal`, `family` | `نفسية`, `دينية`, `طبية`, `أسرية`, `أعمال` |
| Key language | latin | **Arabic — and the key is a route param** (`ConsultationRequest: { type }`) and the config lookup key |
| Type name | `label` | `name` |
| Enabled flag | `enabled` | `visible` + `status` (`published`/`draft`) |
| Fields per type | 6–8 | 11–12 |
| Consent field | **absent** | present and **required** on every type |
| Disclaimer | **not modelled** | present on every type |

**Only `psychological` and `family` overlap.** The API has `legal` (قانونية), which the app does not offer; the app has دينية, طبية and أعمال, which the API does not.

**Two omissions are more than cosmetic:**

1. **No consent field.** Every app form ends with a required checkbox — *"أوافق على أن تُعالَج بياناتي بسرية لغرض الاستشارة فقط"*. The API's types have none, so an integrated app would collect personal health and family data **without recording consent**. That is a data-protection question, not a UI detail.
2. **No `disclaimer`.** The app shows *"هذه استشارة استرشادية ولا تُغني عن التشخيص أو العلاج المتخصص"* on every form. Dropping it from a **medical** consultation is a liability question.

Per-field, the API also has no `placeholder`, `validationMessage`, `hidden`, `sortOrder` or the `showIfKey`/`showIfValue` conditional logic. `validationMessage` carries the Arabic error copy the QA pass verified end to end; without it the app falls back to generic messages.

**Decided (2026-07-28):**

- **Taxonomy — the app's five win.** نفسية، دينية، طبية، أسرية، أعمال.
- **Keys stay Arabic.** They are route params in the app (`ConsultationRequest: { type }`), so latin keys would have meant a navigation change rather than a data migration. Note they must be **URL-encoded** in the `PATCH`/`DELETE /admin/cms/consultations/{key}` routes.
- **Fidelity — send everything, then verify.** Rather than trimming the payload to the shape the API happens to return today, `scripts/seed-consultation-types.mjs` sends the app's full definition: `disclaimer`, `consent` fields, `validationMessage`, `placeholder`, conditional `showIf*`, the lot. Where the two sides name the same thing differently it sends **both** spellings (`name`+`label`, `visible`/`status`+`enabled`), which is harmless if one is ignored. It then re-reads `GET /cms` and reports exactly what the API kept.

  **Answered while implementing §19 (2026-07-30):** the API applies **no validation** on this route — it is `@Body() body: any`, spread straight into a JSON column. Nothing is stripped, so the full-fidelity payload persists verbatim, `disclaimer` and `consent` included. The read-back stays in the script as a guard in case validation is added later.

**Still outstanding after seeding:**

1. ~~Two duplicates~~ — handled by `--prune`, which deletes `psychological` and `family` before seeding. It aborts rather than continuing if a delete fails, since seeding on top of a duplicate leaves both visible. `legal` is never pruned: it is not a duplicate.
2. **`legal` (قانونية) has no app equivalent.** It is left untouched, but the app cannot render it — there is no form schema for it on the app side. Either add one, or drop the type.
3. **If the read-back shows `disclaimer` or `consent` were dropped**, that is a schema change on the API, not something the app can work around. Both are on every form today and neither is cosmetic — see the two warnings above.

Usage:
```bash
npx tsx scripts/seed-consultation-types.mjs --prune                        # dry run
API_TOKEN=<bearer> npx tsx scripts/seed-consultation-types.mjs --apply --prune
```
`--prune` deletes the two duplicates first; omit it to seed alongside them. Dry run is the default, so the first command is safe to run at any time.

---

## 19. Swagger schemas + field renames — **implemented**

> **Status: done, awaiting review** — [`AbdelrahmanSaad10/ahlashabab_backend_app` PR #1](https://github.com/AbdelrahmanSaad10/ahlashabab_backend_app/pull/1), branch `feat/swagger-schemas-and-cms-renames`, commit `a60db3d`.
>
> Verified against a fresh database: build clean, app boots, and `qa/harness/api-contract.mjs` reports `GET /cms` **fully aligned** — top level, settings and paymentMethods all matching, where before it was 8 settings fields missing and 5 unexpected.
>
> Schemas went 0 → 8, plus request/response bodies and the missing `servers` entry. The spec below is what was built; it is kept for reference and for the ~100 routes still to be decorated.
>
> **Once merged, §18.2 and §18.3's first and third points are closed.** The remainder of §18.3 — seeding `consultations` — is unblocked but still needs the token (§18.6).

`/api/docs` renders, but the spec behind it documents **no payloads**: 0 `components.schemas`, 0 request bodies, 0 response bodies across all 113 routes (verified 2026-07-28; the JSON is byte-identical to the copy taken earlier that day). An integrator has to guess every shape.

This section is what to change. **The §18.2 renames are folded in** — write the DTOs with the *final* names, so the schemas don't document a shape that is about to change.

### 19.1 Bootstrap — `main.ts`

```ts
const config = new DocumentBuilder()
  .setTitle('أحلى شباب API')
  .setVersion('1.0.0')
  .addServer('https://portfolio.27lashabab.com', 'production')   // ← missing today
  .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'access-token')
  .build();
```

Without `addServer`, generated clients have no base URL.

> **Check the global `ValidationPipe` while you are here.** If it runs with `whitelist: true`, any property absent from a DTO is **silently stripped** from the request. That is the mechanism by which `disclaimer`, `consent` fields and `validationMessage` would vanish on seeding (§18.6) — adding them to the DTOs fixes both problems at once. If it runs with `forbidNonWhitelisted: true` the seeder gets a `400` instead, which is noisier but easier to diagnose.

### 19.2 The response envelope

Every response is wrapped in `{ data: … }`, lists as `{ data: { data: [], meta: {} } }`. Declaring that 113 times by hand is not worth it — one reusable decorator covers it:

```ts
// common/swagger/api-data-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiDataResponse = <T extends Type<unknown>>(model: T, isArray = false) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          data: isArray
            ? { type: 'array', items: { $ref: getSchemaPath(model) } }
            : { $ref: getSchemaPath(model) },
        },
      },
    }),
  );
```

For the paginated variant, wrap `{ data: T[], meta: PaginationMetaDto }` the same way.

### 19.3 Renames to apply (from §18.2)

Apply these **in the DTOs and the serializers together** — the point is that the wire format changes, not just the docs.

| Current | Rename to | Why |
|---|---|---|
| `schemaVersion` | `version` | app, dashboard, migrations and tests all use `version` |
| `consultationTypes` | `consultations` | matches `CmsState.consultations` |
| `contactPhone` | `hotline` | `contactPhone` invites confusion with a provider's phone |
| `contactEmail` | `email` | |
| `contactAddress` | `address` | |
| `socialLinks` | `socials` | |
| `zakatNisab` | `zakatNisabEgp` | the value is currency-specific; the suffix is deliberate |

And **add** these, absent today: `media` (the library already exists behind `/admin/cms/media` — expose it on the public read, since `getMediaSrc()` resolves `imageId`/`mediaId` throughout the CMS and renders nothing without it), plus `splashText`, `website`, `donationReassurance` on settings. `donationReassurance` is the donation-screen legal text; its absence is user-visible.

`activity` and `updatedAt` are optional — dashboard-only, lowest priority.

### 19.4 DTOs

```ts
// cms/dto/cms-settings.dto.ts
export class SocialsDto {
  @ApiProperty({ example: 'https://facebook.com/ahlashabab' }) facebook: string;
  @ApiProperty({ example: '' }) instagram: string;
  @ApiProperty({ example: '' }) youtube: string;
  @ApiProperty({ example: '' }) twitter: string;
}

export class FoundationStatsDto {
  @ApiProperty({ example: '12', description: 'Display string, not a count' })
  governorates: string;
  @ApiProperty({ example: '1.2M+' }) beneficiaries: string;
  @ApiProperty({ example: '+12' }) yearsOfService: string;
}

export class CmsSettingsDto {
  @ApiProperty({ example: 'خواطر أحلى شباب' }) appName: string;
  @ApiProperty() heroTitle: string;
  @ApiProperty() heroSubtitle: string;
  @ApiProperty() splashText: string;              // add
  @ApiProperty({ example: '#18489F' }) primaryColor: string;
  @ApiProperty({ example: '#E9AF31' }) secondaryColor: string;
  @ApiProperty({ example: '19XXX' }) hotline: string;        // was contactPhone
  @ApiProperty() email: string;                              // was contactEmail
  @ApiProperty() address: string;                            // was contactAddress
  @ApiProperty() workingHours: string;
  @ApiProperty() website: string;                            // add
  @ApiProperty({ type: SocialsDto }) socials: SocialsDto;    // was socialLinks
  @ApiProperty({ example: 357000 }) zakatNisabEgp: number;   // was zakatNisab
  @ApiProperty() donationReassurance: string;                // add
  @ApiProperty() demoLabel: string;
  @ApiProperty({ type: FoundationStatsDto }) stats: FoundationStatsDto;
}
```

```ts
// cms/dto/form-field.dto.ts
export const FORM_FIELD_TYPES = ['text','textarea','phone','whatsapp','email','number','age',
  'governorate','radio','checkbox','multiselect','date','time','file','info','consent'] as const;

export class FormFieldDto {
  @ApiProperty({ example: 'name' }) key: string;
  @ApiProperty({ enum: FORM_FIELD_TYPES }) type: (typeof FORM_FIELD_TYPES)[number];
  @ApiProperty({ example: 'الاسم بالكامل' }) label: string;
  @ApiProperty({ default: false }) required: boolean;
  @ApiProperty({ default: false }) hidden: boolean;
  @ApiProperty({ example: 0 }) sortOrder: number;
  @ApiPropertyOptional({ type: [String] }) options?: string[];
  @ApiPropertyOptional() placeholder?: string;
  @ApiPropertyOptional({ description: 'Arabic error copy shown on failed validation' })
  validationMessage?: string;
  @ApiPropertyOptional() help?: string;
  @ApiPropertyOptional({ description: 'Show this field only when showIfKey === showIfValue' })
  showIfKey?: string;
  @ApiPropertyOptional() showIfValue?: string;
}
```

`consent` must be in the enum — every app form ends with a required consent checkbox, and without it the API cannot represent one (§18.6).

```ts
// cms/dto/consultation-type.dto.ts
export class ConsultationTypeDto {
  @ApiProperty({ example: 'نفسية', description: 'Arabic key — also the app route param' })
  key: string;
  @ApiProperty({ example: 'استشارة نفسية' }) name: string;
  @ApiProperty({ example: 'heart' }) icon: string;
  @ApiProperty() description: string;
  @ApiProperty({ description: 'Advisory text shown on every form. Required on medical types.' })
  disclaimer: string;
  @ApiProperty({ enum: ['published', 'draft'] }) status: 'published' | 'draft';
  @ApiProperty() visible: boolean;
  @ApiProperty() homeVisible: boolean;
  @ApiProperty({ type: [String] }) availableTimes: string[];
  @ApiProperty() sortOrder: number;
  @ApiProperty({ type: [FormFieldDto] }) fields: FormFieldDto[];
}
```

`CreateConsultationTypeDto` can be `OmitType(ConsultationTypeDto, [] as const)` — the server assigns the id.

### 19.5 Controllers

```ts
@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  @Get()
  @ApiOperation({ summary: 'Full CMS state consumed by the mobile app' })
  @ApiDataResponse(CmsStateDto)
  find() { /* … */ }
}

@ApiTags('Admin · CMS')
@ApiBearerAuth('access-token')
@Controller('admin/cms/consultations')
export class AdminConsultationTypesController {
  @Post()
  @ApiBody({ type: CreateConsultationTypeDto })
  @ApiCreatedResponse({ type: ConsultationTypeDto })
  create(@Body() dto: CreateConsultationTypeDto) { /* … */ }

  @Delete(':key')
  @ApiParam({ name: 'key', example: 'نفسية', description: 'URL-encode Arabic keys' })
  @ApiNoContentResponse()
  remove(@Param('key') key: string) { /* … */ }
}
```

### 19.6 Order of work

1. ~~`addServer` + the `ApiDataResponse` helper~~ — **done.**
2. ~~**`GET /cms`** with the renames~~ — **done.** The blocker for everything else.
3. ~~**`POST /admin/cms/consultations`**~~ — **documented.** Validation deliberately *not* added: the route takes `@Body() body: any` and spreads it into a JSON column, so adding a DTO whitelist would change runtime behaviour and could reject the seeder's payload mid-run. Separate change.
4. `POST /consultations`, `/bookings`, `/donations` — the public write paths. **Not done.**
5. The remaining ~100 admin routes — **not done**, same pattern.

Verify with `node qa/harness/api-contract.mjs`; it is quiet for `GET /cms` as of PR #1.

### 19.7 Bugs found while implementing (all fixed in the same PR)

None of these were visible from the outside, because the deployed instance holds hand-seeded data that happens to be correct.

1. **Fresh installs skipped every migration.** `getState()` creates the first CMS row already stamped at `CMS_SCHEMA_VERSION`, so `migrate()` runs nothing against it. `defaultSettings()`/`defaultPaymentMethods()` — not the migration backfills — are therefore what a new deployment gets, and they returned only `foundationName`/`tagline`/`logoUrl`, none of which the app reads. **A fresh deploy served settings the app could not use.** Both defaults now return the full current schema, with the invariant recorded in a comment: a migration that backfills a field must add it to the defaults too.
2. **`paymentMethods` had the wrong shape** in both the v5 migration default and the fresh-install default — `key/label/enabled/icon`, which nothing consumes; the Donate screen reads `id/group/description/availability/manual`. Latent only because the live data was seeded by hand: a reset or fresh deploy would have rendered **no payment methods**.
3. **`media` was never read at all.** It lives in the `CmsMedia` table rather than the CMS blob, so it was not merely missing from the response — nothing queried it. Every CMS-authored image resolved to nothing through `getMediaSrc()`.
4. `defaultSettings()` had the foundation name as `أهل الشباب` rather than `أحلى شباب`.

### 19.8 Two things left open on the API

- **`npm ci` fails.** `@nestjs/swagger@11` peer-requires `@nestjs/common@^11`, but the project is on NestJS 10.4.22 — install needs `--legacy-peer-deps`. Pin swagger to `^7`/`^8` for NestJS 10, separately.
- **`POST /admin/cms/consultations` has no validation** — `@Body() body: any`, spread straight into a JSON column. Good news for the seeder (nothing strips `disclaimer`, `consent` or `validationMessage`, answering §18.6's open question) but not something to leave on an admin write endpoint.

---

## 20. Decision brief — do consultations become bookings?

This is the one design question gating integration (§15). It was a one-line note; here is the evidence and a recommendation.

### 20.1 What exists today

Two separate models, and they are **not** variations on one shape:

| | `ConsultationRequest` | `Booking` |
|---|---|---|
| Identity | `email` **required**, `phone` | `applicantName`, `phone` — **no email at all** |
| What it is about | `type` (CMS consultation key) | `serviceId` → `Service` (non-null FK) |
| Assigned to | *nobody* | `providerId` → `Provider` (non-null FK) |
| When | `preferredChannel`, `preferredTime` — **preferences** | `date` + `timeSlot` — **an actual appointment** |
| Answers | `extraFieldsJson` | `extraFieldsJson` |
| Status default | `جديد` | `قيد الانتظار` |
| Extras | — | `gender`, `city`, `nationalId`, `governorateId` FK |

A consultation request is *"someone asked, here is when they'd prefer"*. A booking is *"this provider, this service, this slot"*. Neither is a subset of the other.

### 20.2 The app has already answered this

`ProviderBooking` in `mobile/src/store/providerStore.ts` — what the provider dashboard actually renders — is a **merge of both**:

```
from ConsultationRequest   email · whatsapp · consultationType · preferredComm
                           specializedAnswers · submissionDate · generalDescription
from Booking               appointmentDate · appointmentTime · applicantName
```

Three of those exist **only** on `ConsultationRequest` and have no column on `Booking`: `email`, `type`, `preferredChannel`. So the screen that was built, reviewed and demoed assumes *a consultation request that has been scheduled* — a single pipeline. It cannot be fed by `Booking` rows without losing the consultation type, the preferred channel, and the email.

Corroborating: `ConsultationRequest.status` already includes **`تم تحديد موعد`** ("appointment scheduled"). The model anticipates scheduling — it simply has nowhere to put the result.

### 20.3 The two options

**A — one pipeline.** A consultation request gains scheduling fields and stays the same row for its whole life.

```prisma
model ConsultationRequest {
  // … existing …
  providerId String?   @map("provider_id")   // set when scheduled
  provider   Provider? @relation(...)
  date       DateTime? @db.Date
  timeSlot   String?   @map("time_slot")
}
```

- Status flow already fits: `جديد` → `قيد المراجعة` → `تم تحديد موعد` → `مكتمل` / `ملغي`
- `/me/provider/bookings` returns scheduled consultation requests **and** service bookings, unioned
- One row, one reference, one audit trail. The reference the beneficiary was given never changes
- Preserves `email`, so the returning-guest link (§6, D-09) keeps working end to end

**B — two stages, converted.** An accepted consultation request creates a `Booking` row.

- Needs a `serviceId`, which a consultation does not have — you would invent a synthetic "consultation" Service per type, or make the FK nullable
- `Booking` has no `email`; you would add one, or always join back to the request
- Two rows and two references for one thing, with a link field and a sync question on every status change
- The app's provider screen would need reshaping, since it reads consultation-only fields

### 20.4 Recommendation — **A**

Three reasons, in order of weight:

1. **It matches what is already built.** The provider dashboard, its shipped seed data, and the QA-verified reschedule behaviour all assume the merged shape. B means changing a screen that is signed off.
2. **`Booking.serviceId` is a non-null FK to the service catalogue.** A consultation is not a catalogue service. Satisfying that constraint means either fake Service rows or relaxing the FK — both worse than three nullable columns on the model that already holds the data.
3. **B risks the email link.** `email` is the identity key for the whole returning-guest feature and `Booking` has no column for it. Any conversion has to carry it across or join back, and getting that wrong silently breaks the feature the demo leads with.

**Cost of A:** three nullable columns, one migration, and a union in `/me/provider/bookings`. **Cost of B:** a synthetic service taxonomy, a new email column or a permanent join, dual references, and a provider-screen rewrite.

### 20.5 If A is chosen, the order of work

1. Migration: add `providerId`, `date`, `timeSlot` to `consultation_requests` (all nullable).
2. `PATCH /admin/consultations/:id/schedule` — assign provider + slot, set status `تم تحديد موعد`.
3. `/me/provider/bookings` returns the union; `/me/provider/bookings/:id/schedule` already exists and keeps its "must not change status" rule (§8).
4. App: point `providerStore` at the API. `ProviderBooking` needs no shape change — that is the point.
5. Keep `/bookings` for the free-services catalogue flow. The two coexist; they are not merged.

**Still open regardless of A or B:** the API's `legal` (قانونية) consultation type has no app-side form schema, so the app cannot render it (§18.6). Give it one or drop it.

---

## 21. Blocker found while documenting the routes (2026-07-30) — **the authenticated API does not work**

Found while adding Swagger decorators to the remaining backend controllers, then
verified with a test harness rather than by reading. This supersedes the working
assumption in §18/§19 that the admin API was merely *unverified* — it is broken.

### 21.1 What is wrong

`JwtAccessStrategy.validate()` resolves to `{ adminUser }` or `{ user }`, and
Passport assigns that return value straight to `request.user`. Nothing anywhere
in the codebase assigns `request.adminUser` — but three things read it:
`RolesGuard`, `CurrentAdmin`, and `ActivityLogInterceptor`.

Consequences:

| Surface | Symptom |
| --- | --- |
| Every `@RequirePermission` route (~93, i.e. the whole `/admin` API) | **403 `صلاحيات غير كافية`**, regardless of how the role's permissions are configured |
| Every `/me` route (18) | Answers **200** while reading `.sub`/`.id` off the wrapper object — so it queries with `undefined` |

The `/me` half is the more dangerous of the two, because nothing fails loudly:
the routes return success while operating on nothing.

The strategy's own comment states the intent the guard never implemented:

```ts
// Return object with adminUser key so the guard sets request.adminUser
return { adminUser };
```

### 21.2 Evidence

Reproduced with the real guard chain (global order `JwtAuthGuard` → `RolesGuard`)
and Prisma stubbed, so it needs no database and no credentials. The admin token
below carries a role that **explicitly grants** `users:read`:

| case | before | after |
| --- | --- | --- |
| admin token, role **has** `users:read` | **403** | 200 |
| `/me` with a user token | 200 but `id`/`sub` = `null` | 200, both resolve |
| admin token, role **lacks** the permission | 403 | 403 |
| user-type token on an admin route | 403 | 403 |
| anonymous / malformed token | 401 | 401 |

The deny cases hold in both directions, so the fix is not "let everyone through".

### 21.3 Why this matters here

**This, not the missing bearer token, is why the consultation-type seeding could
never have completed.** `scripts/seed-consultation-types.mjs --apply` posts to
`/admin/cms/consultations`, which is `@RequirePermission('cms', 'write')` — it
would have returned 403 with a perfectly valid token. The same applies to every
admin write this document has listed as "unconfirmed".

Fixed in backend PR #2 (`fix/auth-request-user-shape`), with a regression test at
`test/auth-request-shape.e2e-spec.ts`. **Verify the deployment runs this same
code before concluding it is affected** — the finding is confirmed against the
repo at `7a3af02`, not against `portfolio.27lashabab.com`.

### 21.4 Two smaller findings from the same pass

- **`PATCH /admin/cms/settings` accepts any key.** Its schema is
  `z.record(z.string(), z.any())`, so a misspelled key is stored and then ignored
  by the app rather than rejected. This bears directly on the §18.2 renames: a
  dashboard still sending `contactPhone` instead of `hotline` gets a 200 and the
  edit silently does nothing. Worth tightening to the known keys.
- **`POST /webhooks/payment` is `@Public()` with no signature verification.**
  Anything that can reach that URL can mark a donation paid. Documented on the
  route; needs a shared secret or provider signature check before real payments.

### 21.5 Route documentation status

All 141 routes across 39 controllers are now tagged and summarised (backend PR #3,
stacked on #1). Request bodies are derived from the Zod schemas that validate
them rather than duplicated into DTO classes, so the docs cannot drift from the
validation. Measured by generating `GET /api/docs-json` before and after:
summaries 5 → 141, write operations with a body schema 2 → 52 of 67, query
parameters 95 → 126. The 15 without an enumerable body are 10 genuinely bodyless
toggles, 5 handlers that take `@Body() any`, and the free-form settings map above.

---

## 22. API integration — the shared client (2026-07-30)

Decisions taken: **API-first with fallback to the bundled data**, and **the mobile
public surface first**. The second follows from §21 — `/admin` and `/me` cannot be
verified until PR #2 deploys, and shipping unverifiable code first is the wrong
order.

### 22.1 What exists now

`shared/src/api/` — consumed by both the app and the dashboard. Before this there
was no network code in the repo at all; all 63 files importing `@ahla/shared`
read compiled mock arrays.

| module | responsibility |
| --- | --- |
| `config.ts` | `baseUrl` is *injected*, not read from env. Metro exposes `process.env.EXPO_PUBLIC_*`, Vite exposes `import.meta.env.VITE_*`; referencing either in shared code breaks the other bundler. Each app calls `configureApi()` once at startup. |
| `http.ts` | Envelope unwrapping (`{data}` and `{data:{data,meta}}`), manual timeout (`AbortSignal.timeout` is absent from older Hermes), `ApiError` for every failure including network, so callers catch one type. |
| `errors.ts` | `ApiError` with the server's Arabic `message` and per-field `fields`. `isForbidden` is separate from `isAuthError` because of §21: while PR #2 is undeployed every `/admin` route 403s regardless of role, so "insufficient permissions" would be a lie. |
| `fallback.ts` | Reads degrade to bundled data. **Writes deliberately do not.** |
| `mappers.ts` | Wire → app types. |
| `cmsMapper.ts` | `GET /cms` → `CmsState`, tolerant of both schema versions. |
| `endpoints.ts` | Typed functions for the public surface. |

### 22.2 Why reads and writes behave differently

A read that quietly serves the compiled defaults is the difference between a demo
that works on hotel wifi and one that shows a spinner in front of the client. A
*write* that pretends to succeed is worse than any error message — so submissions
call `request()` directly and let `ApiError` reach the form, which already has the
Arabic copy and the per-field messages it needs.

### 22.3 The CMS merge, and why it is not a replacement

The deployed API is a schema version behind (`schemaVersion: 5`, with
`contactPhone` / `contactEmail` / `contactAddress` / `socialLinks` / `zakatNisab` /
`consultationTypes`). Both spellings are read, so nothing breaks when PR #1 ships.

More importantly its payload is **poorer** than the bundled defaults: no
`splashText`, `website`, `donationReassurance`, `media`, `milestones`, and no
`initiatives` / `volunteers` impact figures. So `mapCmsState` merges per field
*over* the defaults. Trusting the payload wholesale empties the About screen.

Consultation types get a stricter rule. The live types (`psychological`, `legal`,
`family`) carry no `disclaimer`, no `consent` field, and no `options` on their
choice fields. A radio with no options is an unanswerable question and a missing
consent checkbox is a compliance regression (§18.6), so an API type supplies its
own **form** only when it has all three; otherwise it contributes labels only and
the bundled form is kept. English keys are aliased onto the app's Arabic keys
(`psychological` → `نفسية`) because those keys are route params.

`legal` (قانونية) has no bundled form and is not self-sufficient, so it is
skipped — the documented §18.6 behaviour.

### 22.4 Payment methods needed real translation

The API sends latin ids and short groups; the app's `PaymentMethod` is an Arabic
union and `group` must be one of three exact display strings.

| API | app |
| --- | --- |
| `card` / `إلكتروني` | `بطاقة بنكية` / `دفع إلكتروني` |
| `fawry` / `إلكتروني` | `فوري` / `دفع إلكتروني` |
| `instapay` / `تحويل` | `إنستاباي` / `تحويل بنكي` |
| `vodafone` / `محفظة` | `فودافون كاش` / `محفظة إلكترونية` |
| `bank` / `تحويل` | `تحويل بنكي` / `تحويل بنكي` |

An unmapped id is **dropped**, not guessed: a method the app cannot label
correctly must not appear in the donate flow. `manual` defaults to `true` when
absent — the safer branch, since it never claims a payment succeeded.

### 22.5 Verification

`npx tsx scripts/verify-api-layer.ts` — 41/42 against the live API. It validates
the *mapped* objects, not the wire payload, and covers the fallback path (reads
serve bundled content, writes still throw) plus an intentionally invalid POST,
which returns 400 and stores nothing. Reads only otherwise: this points at a live
service, so it creates no consultations, bookings or donations.

### 22.6 New finding — no service in the public list can be booked

`GET /services` returns ids `svc-1`…`svc-6`. `Service.id` is `@default(uuid())` in
the Prisma schema and `CreateBookingSchema.serviceId` is `z.string().uuid()`, so
those seeded ids cannot satisfy the booking schema. **The booking flow is
unusable end-to-end** until either the seed data uses UUIDs or the DTO drops
`.uuid()`. Tracked as a known issue in the verify script rather than a failure.

### 22.7 Not done yet

No screens are wired — this is the foundation. Remaining, in order:

1. Mobile public reads (CMS, cases, projects, articles, providers) behind the
   existing stores, so screens keep their current shape.
2. Mobile public writes (consultation, contact, volunteer, donation) with
   `ApiError.fields` surfaced per input.
3. Bookings — blocked on §22.6.
4. Dashboard auth + admin surface — blocked on §21 / PR #2.
5. `/me` (profile, favourites, notifications) — blocked on §21 / PR #2.
