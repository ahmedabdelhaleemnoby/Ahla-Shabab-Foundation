# جمعية خواطر أحلى شباب — Ahla Shabab

Mobile app **(React Native / Expo)** and the shared design system, in **TypeScript**. Arabic-first, fully **RTL**.

The admin dashboard used to live here as a third workspace; it now has its own repository at [ahla-shabab-dashboard](https://github.com/ahmedAbdelhaleemGamal/ahla-shabab-dashboard) and carries a vendored copy of `shared/`.

Built from the approved `Ahla-Shabab-App-Design.html` spec and refined against the official brand identity at [ahlashabab.com](https://ahlashabab.com) — the same royal-blue palette, Cairo type scale, spacing, and components drive both apps.

> **Current build: v1.6.0** (versionCode 11) — see [Releases](https://github.com/ahmedabdelhaleemnoby/Ahla-Shabab-Foundation/releases).
>
> **This is no longer a mock demo.** A NestJS + PostgreSQL backend is live at
> `https://portfolio.27lashabab.com/api/v1`, and the app reads and writes real data: passwordless
> email-OTP login issues real JWTs, account screens read `/me/*`, content comes from the CMS, and
> donations are recorded on the server.
>
> **There is still no payment gateway, deliberately.** All three donation methods — تحويل بنكي /
> إنستاباي، فوري، فودافون كاش — are completed outside the app and approved by an admin, so every
> donation stays «قيد المراجعة» until then. The app never marks a donation successful by itself.
>
> Delivery status, evidence and the remaining work live in [`qa/`](qa/) —
> start with [`qa/FINAL_PROJECT_DELIVERY_AUDIT.md`](qa/FINAL_PROJECT_DELIVERY_AUDIT.md).

## Monorepo layout

```
.
├── shared/        @ahla/shared — design tokens, TS types, API client, business rules, offline fallback content
└── mobile/        Expo + React Native app (39 screens, RTL, sidebar navigation)
└── qa/            delivery audit — status matrix, fix log, remaining tasks, evidence
```

The mobile app imports tokens/data from `@ahla/shared`. The dashboard repo holds a
**copy** of `shared/` rather than a workspace link, so changes here do not reach it
automatically — see [ahla-shabab-dashboard](https://github.com/ahmedAbdelhaleemGamal/ahla-shabab-dashboard).

> 📐 **Full project map:** see [STRUCTURE.md](STRUCTURE.md) — every file, screen, page, rule, and the APK build pipeline.

## Prerequisites

- Node.js ≥ 20 (Metro's bundler requires it; the default 18 fails the release build)
- For the mobile app: the **Expo Go** app on your phone (iOS/Android), or an iOS Simulator / Android Emulator.

## Install (once, from the repo root)

```bash
npm install
```

This installs all three workspaces together.

## Run the mobile app (Expo)

```bash
npm run mobile
# or:  npm start --workspace mobile
```

Then scan the QR code with **Expo Go** (Android) or the Camera app (iOS). Press `i` / `a` in the terminal to open a simulator/emulator, or `w` for web.

**Main areas:** Home (hero + work-area chips + urgent case + اكفل أسرة + featured project + news + consultations) · خدماتنا (services sections) · التبرع (5-step donation wizard) · أخبارنا (news feed) · حسابي (account). Plus dedicated pages for **حالات عاجلة** (urgent cases), **اكفل أسرة** (monthly family sponsorship), المشروعات, per-type consultation request forms, a full notification center, and account-only screens (تبرعاتي / الإيصالات / حجوزاتي / المفضلة) gated behind an email login prompt.

**Login:** passwordless **email** — enter your email → the server emails a 6-digit code → signed in
with a real JWT pair held in the OS keystore (`expo-secure-store`). A wrong code is rejected by the
server; there is no bypass. Browsing and starting a donation work without login; only personal
screens (receipts, bookings, favorites, notifications) prompt you to sign in.

> ⚠️ **OTP email delivery is not configured yet**, so a tester may not receive the code. The app
> staying on the code screen is the correct behaviour, not a bug — see `qa/REMAINING_TASKS.md` T-06.

**Donation journey:** الوجهة → اختيار الحالة/المشروع → المبلغ + مرة واحدة/شهري → طريقة الدفع →
الملخص → **receipt**. The donation is **recorded on the server**, and the reference on the receipt is
the server's, so support can look it up. When it is made from a case or project screen, that id
travels with it — approving the donation then moves that case's fundraising total.

A donation is **never** marked مكتمل by the app. Only an admin approving it in the dashboard can do
that.

**Free Services Booking module (Technical Offer §4):** the transactional core.
- `احجز خدمة مجانية` entry on Home → **ServicesBrowse**, which has a toggle:
  - **الخدمات والفئات** — recursive catalog: main categories → unlimited nested subcategories → bookable services
  - **مقدمو الخدمة** — providers directory (photo, specialization, rating, the categories they serve) → **ProviderDetail** (bio, schedule, and their bookable services)
- **ServiceDetail** — provider bio, specialization, rating, working days
- **BookAppointment** — provider's available-days calendar (only working days enabled) → time slots → configurable booking form (name, phone, age, gender, governorate dropdown with all 27 Egyptian governorates, city, national ID, notes) with validation and guest booking
- **BookingConfirmation** — booking reference + summary

Catalog, providers, schedules, governorates, and the form schema live in `shared/src/services.ts`, so the dashboard/backend will manage the exact same shapes.

Navigation: sidebar drawer (☰ in the app bar, slides from the right) + a native stack for detail and booking screens. The five main sections (Home/Discover/Donate/News/Profile) live in a hidden tab navigator so deep links keep working.

## Run the dashboard

It lives in its own repository now:

```bash
git clone https://github.com/ahmedAbdelhaleemGamal/ahla-shabab-dashboard
cd ahla-shabab-dashboard && npm install && npm run dev
```

Open http://localhost:5173.

The single-origin trick that used to be needed here is **obsolete**: the CMS lived in
`localStorage`, which browsers partition per origin, so the dashboard and the app had to be served
together for an edit to be visible. Both now read and write the CMS through the API, so they can run
anywhere. `PUT /admin/cms` persists an edit; the app picks it up on its next `GET /cms`.

Built with **React + Vite + TypeScript + Tailwind CSS** (RTL). The Tailwind palette maps to the CSS variables injected from `@ahla/shared`, so it stays identical to the mobile app. It is the CMS + booking-operations tool from Technical Offer §5:

- **لوحة المعلومات** (Overview) — booking KPIs, weekly-bookings bar chart, bookings-by-category donut, recent bookings, active services.
- **الحجوزات** (Bookings, §5-D) — filter by status/category/provider/governorate + search, confirm/reschedule/cancel actions, detail modal, **CSV export**.
- **الخدمات والفئات** (Services, §5-B) — nested category tree with activate/deactivate toggles, services per subcategory, add subcategory.
- **مقدمو الخدمة** (Providers, §5-C) — profile, assigned services, weekly schedule (days + slots), availability toggle.
- **إدارة المحتوى** (Portfolio CMS, §5-A) — CRUD table for projects/cases/caravans/programs/trips/articles with publish toggle + add/edit modal.
- **المستخدمون** (Users, §5-E) — beneficiaries with booking history, guest/registered, block/unblock, CSV export.
- **التقارير** (Reports, §5-G) — bookings by category/provider/governorate, status distribution, utilization, Excel/PDF export.
- **الأدوار والصلاحيات** (Roles, §5-F) — role cards, permission matrix, activity log.

Charts are dependency-free inline SVG; icons are lucide-react (same outline family as the app's
Feather set).

**Every one of those screens now reads and writes the live API.** Earlier builds rendered bundled
sample rows and mutated React state only, so an admin's change looked successful and vanished on
refresh. Reads that fail now show an explicit error instead of demo rows, and writes roll back with
the server's reason on screen.

Add a `.env.local` with `VITE_API_BASE=https://portfolio.27lashabab.com/api/v1` to point a local
dashboard at production, and sign in with a real admin account.

## Type-check everything

```bash
npm run typecheck          # runs across all workspaces
```

## Design system

`shared/src/tokens.ts` holds the tokens (matched to the official ahlashabab.com brand):

- **Palette** — primary royal blue `#18489F` with a navy ramp (`navy900…navy300`), gold `#E9AF31`, semantic green/red, blue-biased neutrals, payment-brand colors.
- **Type scale** — Cairo, sizes/weights tuned for a 390px frame.
- **Spacing** — 4-point scale (screen gutter 16, card padding 16).
- **Radius** — 12 (inputs) / 16 (cards) / 24 = pill (buttons) / full (chips).
- **Elevation** — one soft navy-tinted shadow (no hard drop shadows).

The dashboard injects these colors as CSS custom properties at runtime (`--navy700`, `--green`, …) so its stylesheet and the mobile app never drift — as long as its copy of `shared/` is kept in step.

## Notes

- **Data comes from the API.** `shared/src/api/` holds the client; `shared/src/data.ts` remains only
  as the offline fallback for *public* content (cases, projects, articles) so a backend outage costs
  a slower boot rather than a blank app. **User-scoped data has no fallback** — bookings, donations,
  receipts, favourites and notifications show an explicit error rather than someone else's sample
  rows.
- **RTL** is done explicitly (row-reverse + right-aligned text with `writingDirection: 'rtl'`) rather than relying on `I18nManager.forceRTL`, so screens render correctly on first launch in Expo Go with no reload.
- **Fonts** — Cairo loads via `@expo-google-fonts/cairo` on mobile; the dashboard repo copies the same weights out of that package into its own `public/fonts/`.
