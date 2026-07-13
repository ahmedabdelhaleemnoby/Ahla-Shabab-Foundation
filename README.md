# جمعية خواطر أحلى شباب — Ahla Shabab

Mobile app **(React Native / Expo)** + Admin dashboard **(React + Vite)**, both written in **TypeScript** and sharing one design system. Arabic-first, fully **RTL**.

Built from the approved `Ahla-Shabab-App-Design.html` spec — the same navy palette, Cairo type scale, spacing, and components drive both apps.

## Monorepo layout

```
.
├── shared/        @ahla/shared — design tokens, TS types, mock data + business rules (single source of truth)
├── mobile/        Expo + React Native app (31 screens, RTL, sidebar navigation)
└── dashboard/     Vite + React + Tailwind admin dashboard (12 modules, RTL)
```

Both apps import tokens/data from `@ahla/shared`, so the palette and content stay in sync.

> 📐 **Full project map:** see [STRUCTURE.md](STRUCTURE.md) — every file, screen, page, rule, and the APK build pipeline.

## Prerequisites

- Node.js ≥ 18
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

**Portfolio screens:** Home · Project Detail · Donate/Checkout · Consultations · Book Appointment · Cases List · Case Detail · Profile · About.

**Free Services Booking module (Technical Offer §4):** the transactional core.
- `احجز خدمة مجانية` entry on Home → **ServicesBrowse**, which has a toggle:
  - **الخدمات والفئات** — recursive catalog: main categories → unlimited nested subcategories → bookable services
  - **مقدمو الخدمة** — providers directory (photo, specialization, rating, the categories they serve) → **ProviderDetail** (bio, schedule, and their bookable services)
- **ServiceDetail** — provider bio, specialization, rating, working days
- **BookAppointment** — provider's available-days calendar (only working days enabled) → time slots → configurable booking form (name, phone, age, gender, governorate dropdown with all 27 Egyptian governorates, city, national ID, notes) with validation and guest booking
- **BookingConfirmation** — booking reference + summary

Catalog, providers, schedules, governorates, and the form schema live in `shared/src/services.ts`, so the dashboard/backend will manage the exact same shapes.

Navigation: sidebar drawer (☰ in the app bar, slides from the right) + a native stack for detail and booking screens. The five main sections (Home/Discover/Donate/News/Profile) live in a hidden tab navigator so deep links keep working.

## Run the dashboard (Vite)

```bash
npm run dashboard
# or:  npm run dev --workspace dashboard
```

Open http://localhost:5173.

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

`shared/src/tokens.ts` holds the tokens:

- **Palette** — navy ramp (`navy900…navy300`, primary `navy700 #1B3A6B`), semantic green/gold/red, blue-biased neutrals, payment-brand colors.
- **Type scale** — Cairo, sizes/weights tuned for a 390px frame.
- **Spacing** — 4-point scale (screen gutter 20, card padding 16).
- **Radius** — 10 (inputs) / 14 (buttons) / 20 (cards) / full (pills).
- **Elevation** — one soft navy-tinted shadow (no hard drop shadows).

The dashboard injects these colors as CSS custom properties at runtime (`--navy700`, `--green`, …) so its stylesheet and the mobile app never drift.

## Notes

- **Data is mock** (`shared/src/data.ts`) — realistic Arabic sample cases, projects, donations, consultants, and appointments. Swap this module for real API calls when a backend is ready; the UI already reads everything through it.
- **RTL** is done explicitly (row-reverse + right-aligned text with `writingDirection: 'rtl'`) rather than relying on `I18nManager.forceRTL`, so screens render correctly on first launch in Expo Go with no reload.
- **Fonts** — Cairo (Google Fonts) loads via `@expo-google-fonts/cairo` on mobile and a `<link>` in `dashboard/index.html`.
