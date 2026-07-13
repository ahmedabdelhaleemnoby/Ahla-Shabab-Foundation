# بنية المشروع — Project Structure

Full map of the **جمعية خواطر أحلى شباب** platform: an npm-workspaces monorepo with a React Native mobile app, a React admin dashboard, and one shared package that keeps them in sync. Arabic-first, fully RTL, official brand identity from [ahlashabab.com](https://ahlashabab.com).

> Current release: **v1.2.1** (versionCode 6) · demo on mock data — the backend is specced in [BACKEND.md](BACKEND.md) but not built yet. Every donation/consultation flow is a **presentation demo**: no real payment, server, or database runs.

---

## 1. Monorepo overview

```
Ahla Shabab Foundation/
├── shared/               @ahla/shared — the single source of truth
│   └── src/
│       ├── tokens.ts             Design tokens (brand palette, type scale, spacing, radius)
│       ├── types.ts              Domain types (Case, Project, Article, Donation, AppConfig, Consultation…)
│       ├── data.ts               Mock content data + appConfig + workGovernorates
│       ├── services.ts           Services-booking catalog (categories, providers, slots)
│       ├── admin.ts              Dashboard data (bookings, users, roles, inboxes, audit log)
│       ├── rules.ts              Business rules (validation + donation-status security)
│       ├── __tests__/rules.test.ts   18 vitest unit tests enforcing the rules
│       └── index.ts              Re-exports everything
│
├── mobile/               Expo + React Native app (39 screens)
│   ├── App.tsx                   Navigation container: root stack + hidden tab navigator + sidebar
│   ├── app.json                  Expo config (name, icons, splash, versionCode)
│   ├── assets/                   logo.png (official), icon, adaptive-icon, splash
│   └── src/
│       ├── components/           AppBar, AppDrawer (sidebar), LoginGate, Screen, ui, Icon, SelectField, RemoteImage, TabBar (unused)
│       ├── navigation/           types.ts (route params) + ref.ts (global navRef)
│       ├── screens/              39 screens (see §3)
│       ├── store/                appState.ts (session+receipts+consultations) · drawer.ts · notifications.ts
│       └── theme.ts              RN styles bridge over shared tokens
│
├── dashboard/            Vite + React + Tailwind admin panel (12 modules)
│   ├── public/logo.png           Official logo
│   └── src/
│       ├── App.tsx               React-router routes
│       ├── components/           Layout (sidebar+header), ui (Card/Modal/Table/…), Charts (SVG)
│       ├── lib/csv.ts            CSV export helper
│       ├── pages/                12 pages (see §4)
│       └── theme.css             Tailwind layers (pill buttons, fields, table cells)
│
├── BACKEND.md            Full backend spec (architecture, DB model, REST API, security)
├── README.md             Quick start (install / run)
├── STRUCTURE.md          ← this file
└── .claude/launch.json   Dev-server launch configs (dashboard :5173, mobile-web :8087)
```

**Dependency rule:** `mobile` and `dashboard` import **only** from `@ahla/shared` (never from each other). Editing shared data/tokens updates both apps.

---

## 2. Shared package — `@ahla/shared`

| File | Exports | Used by |
|---|---|---|
| `tokens.ts` | Brand palette — primary **#18489F**, gold **#E9AF31**, navy ramp 300–900, radius (sm 12 / lg 16 / btn 24), Cairo type scale, spacing | Both apps |
| `types.ts` | `HumanitarianCase` (+ sponsorship fields), `Project` (+`ProjectUpdate`, category, timeline), `Article`, `Consultant`, `Donation`, `DonationStatus`, `PaymentMethodInfo`, `AppNotification` (+ date/clock/targetId), `ConsultationStatus`, `AppConfig`, `FoundationStats` | Both apps |
| `data.ts` | `cases`, `projects`, `articles`, `consultants`, `donations`, `paymentMethods`, `notifications`, `foundationStats`, **`appConfig`** (hotline, email, address, socials, hero texts, zakat nisab), **`workGovernorates`** (مناطق عمل الجمعية chips), helpers `pct()`/`egp()` | Both apps |
| `services.ts` | `serviceCategories` (nested tree), `providers` (schedules + slots), `services`, `governorates` (27), `bookingFormSchema`, `buildAvailableDays()`, `makeBookingRef()` | Both apps |
| `admin.ts` | `adminBookings`, `adminUsers`, `adminRoles` + permission matrix, `activityLog`, `volunteerApplications`, `contactMessages` | Dashboard |
| `rules.ts` | `isEgPhone`, `isEmail`, `isValidDonationAmount`, `isMethodUsable`, **`initialDonationStatus()`** | Both apps + tests |

### Critical business rules (enforced by `rules.ts` + 18 unit tests)

1. **Donations are never marked successful by the app.** `initialDonationStatus()` returns only `قيد التأكيد` (gateway methods) or `قيد المراجعة` (manual: إنستاباي / تحويل بنكي). `مكتمل` is a compile-time-unassignable value for the client (`ClientDonationStatus`) — it can only come from a server callback or dashboard admin approval (اعتماد).
2. **Beneficiary privacy.** Cases carry governorate-level `location` only — no phone numbers, exact addresses, or national IDs anywhere in app-visible data. Tests scan the data to enforce this.
3. **No unverified numeric claims.** The old "22 محافظة" stat was removed in favor of `workGovernorates` (a factual chip list — مناطق عمل الجمعية).
4. Egyptian phone validation `01[0125]xxxxxxxx`, email validation, donation amounts integer 5–1,000,000, booking refs `AS-xxxxxx`.

Run the tests: `cd shared && npx vitest run`

---

## 3. Mobile app — `mobile/` (Expo SDK 54 · RN 0.81 · React Navigation 7)

### Navigation shape

```
NavigationContainer (navRef)
├── Root Stack (native-stack; JS stack on web)
│   ├── "Main" → Tab.Navigator (tab bar HIDDEN — kept so navigate('Main',{screen}) works)
│   │   ├── Home · Discover (خدماتنا) · Donate (wizard) · News (feed) · Profile
│   └── 34 pushed screens (details, flows, auth, settings…)
└── AppDrawer (sidebar) — global overlay, opened by the ☰ button in the AppBar
```

- **Sidebar** replaced the bottom tab bar. `components/AppDrawer.tsx` slides from the **right** (RTL), 3 sections / ~20 items (main nav · حسابك · الجمعية), guest-vs-logged-in header showing the login email, login/logout footer. Add an item = one line in its `SECTIONS` array.
- **AppBar modes:** main screens → ☰ (right) + 🔔 with live unread badge (left) + title-or-logo (center); pushed screens → back arrow (right) + title + logo.
- **LoginGate** (`components/LoginGate.tsx`) wraps account-only screens: guests see the page's placeholder plus a friendly bottom-sheet explaining the benefits of logging in (never a hard block). Uses `useIsFocused` so its Modal never covers pushed screens.
- `navigation/ref.ts` exposes `navRef` so non-screen UI (the drawer) can navigate; `__DEV__` also exposes `globalThis.__nav` and `globalThis.__appState` for tests.

### Screens (39)

| Area | Screens |
|---|---|
| Tabs (5) | `HomeScreen` (hero + impact + work-area chips + quick services + urgent case + اكفل أسرة + featured project + news + consultations), `OurServicesScreen` (خدماتنا — Discover tab), `DonateScreen` (**5-step donation wizard**), `NewsFeedScreen` (أخبارنا — News tab), `ProfileScreen` (guest state + email + settings rows) |
| Donation flow | `DonationSuccessScreen` (status-aware demo receipt, share, dummy PDF), `DonationHistoryScreen`\*, `ReceiptsScreen`\*, `PaymentInfoScreen` (§13 server-confirmation explainer), `ZakatCalculatorScreen` |
| Cases & sponsorship | `CasesScreen` (search + tag filters), `CaseDetailScreen`, `UrgentCasesScreen` (حالات عاجلة), `SponsorshipScreen` (اكفل أسرة — monthly) |
| Projects | `ProjectsScreen` (category + timeline), `ProjectDetailScreen` (updates timeline) |
| Services & consultations | `ServicesBrowseScreen`, `ProviderDetailScreen`, `ServiceDetailScreen`, `BookAppointmentScreen` (**5-step wizard**), `BookingConfirmationScreen`, `MyBookingsScreen`\*, `ConsultationsScreen` (type picker), `ConsultationRequestScreen` (per-type forms), `BookingScreen` |
| Auth | `EmailAuthScreen` → `OtpScreen` (passwordless **email** login; mock code; updates `appState`) |
| Content & info | `NewsScreen` (عن الجمعية — About route), `ArticleDetailScreen`, `FaqScreen`, `PrivacyPolicyScreen`, `OnboardingScreen` (tour) |
| Engagement | `VolunteerScreen` (validated form), `ContactUsScreen` (reads `appConfig`), `NotificationsScreen` (notification center)\*, `FavoritesScreen`\* |
| Settings | `AccountSettingsScreen`, `NotificationPreferencesScreen`, `LanguageScreen` |

\* = wrapped in `LoginGate` (account-only for guests).

### State — `src/store/` (all `useSyncExternalStore`, module-level)

- `appState.ts` — session (guest by default, **email** login) + donation receipts (always **pending**) + saved consultation requests (demo, on-device only).
- `drawer.ts` — sidebar open/close.
- `notifications.ts` — notification-center read/unread; the AppBar bell badge reads its live unread count.

---

## 4. Admin dashboard — `dashboard/` (Vite · React 18 · Tailwind 3)

Everything the app shows is manageable here. Sidebar (navy gradient, official logo) + responsive layout (tables become stacked cards under `md`, drawer menu on mobile).

| Route | Page | What it controls |
|---|---|---|
| `/` | `Overview` | App-style hero with live pending counters, KPIs, weekly chart, latest bookings |
| `/bookings` | `Bookings` | Confirm / reschedule / cancel bookings, filters, CSV export |
| `/donations` | `Donations` | **Approvals module** — اعتماد/رفض for manual transfers (the only path to `مكتمل`), KPIs, CSV |
| `/services` | `Services` | Category tree (add main/sub, toggle active) + add/edit/delete services |
| `/providers` | `Providers` | Add/edit provider (working-day + time-slot chip pickers), assign services |
| `/content` | `Content` | 3 tabs editing the real app entities: **المشروعات** (+updates timeline), **الحالات** (tags, كفالة/موثقة, governorate-only privacy), **المقالات** (excerpt + body) |
| `/users` | `Users` | Beneficiaries list, block/unblock, CSV |
| `/notifications` | `Notifications` | Broadcast composer (type + audience) + send history |
| `/inbox` | `Inbox` | Volunteer applications + contact messages from the app, status actions |
| `/reports` | `Reports` | Donations analytics (totals, by method, top causes), funding progress per case/project, bookings analytics, notification performance |
| `/settings` | `Settings` | **إعدادات التطبيق** — impact numbers, hero texts, contact info, socials, payment-method availability, zakat nisab |
| `/roles` | `Roles` | Role × permission matrix + activity log |

Shared UI in `components/ui.tsx` (Card, Kpi, Badge, Toggle, Modal, TableWrap, MobileRow, ProgressCell) and dependency-free SVG charts in `components/Charts.tsx`.

---

## 5. Design system

- **Brand:** primary `#18489F`, gold `#E9AF31` (from ahlashabab.com), white surfaces on `paper` background; official calligraphic logo at `mobile/assets/logo.png` + `dashboard/public/logo.png` (1600², also drives the app icon/splash).
- **Typography:** Cairo (Google Fonts) — expo-google-fonts on mobile, `<link>` on dashboard.
- **RTL:** explicit `row-reverse` / `textAlign:'right'` everywhere (not `I18nManager`); Latin digits kept LTR via the `num` style/class.
- **Radius language:** cards 16, inputs 12, buttons pill (24 / rounded-full) — identical in both apps.
- **Demo watermarks:** every donation/receipt/consultation surface carries «نسخة عرض» / «إيصال تجريبي لغرض العرض فقط» so nothing reads as a real transaction.

---

## 6. Commands & dev workflow

```bash
npm install                 # once, at repo root (installs all 3 workspaces)

npm run mobile              # Expo dev server (Expo Go / emulator / w = web)
npm run dashboard           # Vite dev server → http://localhost:5173
npm run typecheck           # all workspaces

cd shared && npx vitest run # 18 business-rule tests
cd dashboard && npm run build
```

- **Node ≥ 20 required for Metro** (mobile). `.claude/launch.json` pins the mobile-web server to Node 22.
- Mobile typecheck uses `mobile/tsconfig.typecheck.json` (isolates @types/react 19 from the dashboard's React 18 types). Never add the `react` path mapping to `mobile/tsconfig.json` — Metro reads it and breaks the bundle.

## 7. Android APK pipeline

The exFAT SSD breaks Gradle, so release builds run inside an APFS disk image:

1. Mount `ahlabuild.sparseimage` → `/Volumes/AhlaBuild/proj` (always `hdiutil detach` before unplugging the SSD).
2. `rsync` `shared/src` + `mobile/src` + `App.tsx`/`app.json` + assets in (`--exclude='._*'`).
3. Bump `versionCode`/`versionName` in `android/app/build.gradle` **and** `app.json`.
4. **Put Node ≥ 20 on PATH first** (`export PATH=~/.nvm/versions/node/v22.22.2/bin:$PATH`) — the default Node 18 fails the JS bundle step (`createBundleReleaseJsAndAssets` → `configs.toReversed is not a function`).
5. `./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon` (Gradle 8.13). JS-only changes rebuild in ~1 min.
6. Artifacts land at repo root, e.g. `ahla-shabab-v1.2.1-demo.apk` (29 MB). `.apk` is gitignored; publish via a [GitHub Release](https://github.com/ahmedabdelhaleemnoby/Ahla-Shabab-Foundation/releases) for phone testing.

Android 12+ gotcha: the system splash shows the **adaptive icon cropped to a circle**, so icon marks are circle-safe; icon/splash res files are swapped directly in the build image to avoid `prebuild --clean`.

## 8. Documents

| File | Purpose |
|---|---|
| [README.md](README.md) | Install & run quick start |
| [BACKEND.md](BACKEND.md) | Complete backend spec — data model, REST endpoints, booking engine, security acceptance criteria. Hand this to whoever builds `backend/` |
| [STRUCTURE.md](STRUCTURE.md) | This map |

## 9. What's intentionally not built yet

- `backend/` — everything runs on `@ahla/shared` mock data; dashboard edits, app receipts, and consultation requests live in session/on-device memory only.
- Real payments · email OTP delivery · push notifications — all demo-only, clearly labeled «نسخة عرض» in the app.
- ESLint config (known gap; TypeScript strict + vitest cover the current QA).
