# جمعية خواطر أحلى شباب — Ahla Shabab

Mobile app **(React Native / Expo)** and the shared design system, in **TypeScript**. Arabic-first, fully **RTL**.

The admin dashboard used to live here as a third workspace; it now has its own repository at [ahla-shabab-dashboard](https://github.com/ahmedAbdelhaleemGamal/ahla-shabab-dashboard) and carries a vendored copy of `shared/`.

Built from the approved `Ahla-Shabab-App-Design.html` spec and refined against the official brand identity at [ahlashabab.com](https://ahlashabab.com) — the same royal-blue palette, Cairo type scale, spacing, and components drive both apps.

> **Demo build (v1.2.1).** This is a UI/UX presentation on mock data — no backend, payment gateway, database, or auth server. Every donation, receipt, and consultation flow is a realistic demo, clearly labeled «نسخة عرض». The backend is fully specced in [BACKEND.md](BACKEND.md) but not built.

## Monorepo layout

```
.
├── shared/        @ahla/shared — design tokens, TS types, mock data, business rules, API client
└── mobile/        Expo + React Native app (39 screens, RTL, sidebar navigation)
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

**Login:** passwordless **email** — enter your email → 6-digit verification code (mock, any code works in the demo) → signed in. Browsing and starting a donation work without login; only personal screens (receipts, bookings, favorites, notifications) prompt you to sign in.

**Donation journey (demo):** الوجهة → اختيار الحالة/المشروع → المبلغ + مرة واحدة/شهري → طريقة الدفع → الملخص → **pending receipt**. Payment methods show live states (متاحة / قيد التفعيل / بمراجعة الإدارة); a donation is **never** marked مكتمل by the app — only the dashboard's admin approval or a future server callback can do that.

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

To run both on **one origin** — which is what makes a CMS edit in the dashboard
visible in the app, since browsers partition localStorage per origin:

```bash
cd ../ahla-shabab-dashboard && DEMO_BASE=/admin/ npm run build
cd -  && npm run demo:build
ADMIN_DIR=../ahla-shabab-dashboard/dist npm run demo
```

Built with **React + Vite + TypeScript + Tailwind CSS** (RTL). The Tailwind palette maps to the CSS variables injected from `@ahla/shared`, so it stays identical to the mobile app. It is the CMS + booking-operations tool from Technical Offer §5:

- **لوحة المعلومات** (Overview) — booking KPIs, weekly-bookings bar chart, bookings-by-category donut, recent bookings, active services.
- **الحجوزات** (Bookings, §5-D) — filter by status/category/provider/governorate + search, confirm/reschedule/cancel actions, detail modal, **CSV export**.
- **الخدمات والفئات** (Services, §5-B) — nested category tree with activate/deactivate toggles, services per subcategory, add subcategory.
- **مقدمو الخدمة** (Providers, §5-C) — profile, assigned services, weekly schedule (days + slots), availability toggle.
- **إدارة المحتوى** (Portfolio CMS, §5-A) — CRUD table for projects/cases/caravans/programs/trips/articles with publish toggle + add/edit modal.
- **المستخدمون** (Users, §5-E) — beneficiaries with booking history, guest/registered, block/unblock, CSV export.
- **التقارير** (Reports, §5-G) — bookings by category/provider/governorate, status distribution, utilization, Excel/PDF export.
- **الأدوار والصلاحيات** (Roles, §5-F) — role cards, permission matrix, activity log.

Charts are dependency-free inline SVG; icons are lucide-react (same outline family as the app's Feather set).

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

- **Data is mock** (`shared/src/data.ts`) — realistic Arabic sample cases, projects, donations, consultants, and appointments. Swap this module for real API calls when a backend is ready; the UI already reads everything through it.
- **RTL** is done explicitly (row-reverse + right-aligned text with `writingDirection: 'rtl'`) rather than relying on `I18nManager.forceRTL`, so screens render correctly on first launch in Expo Go with no reload.
- **Fonts** — Cairo loads via `@expo-google-fonts/cairo` on mobile; the dashboard repo copies the same weights out of that package into its own `public/fonts/`.
