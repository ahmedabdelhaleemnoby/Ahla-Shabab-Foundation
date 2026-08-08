# بنية المشروع — Project Structure

Full map of the **جمعية خواطر أحلى شباب** platform: an npm-workspaces monorepo with a React Native mobile app and one shared package. The admin dashboard now lives in its own repository, [ahla-shabab-dashboard](https://github.com/ahmedAbdelhaleemGamal/ahla-shabab-dashboard), with a vendored copy of `shared/`. Arabic-first, fully RTL, official brand identity from [ahlashabab.com](https://ahlashabab.com).

> Current release: **v1.6.0** (versionCode 11). The backend specced in [BACKEND.md](BACKEND.md)
> **is built and live** at `https://portfolio.27lashabab.com/api/v1` — NestJS 10 + Prisma +
> PostgreSQL, 39 controllers / 143 routes / 38 models, behind a CI gate running 192 tests against a
> real database.
>
> Real: email-OTP login with JWTs, `/me/*` account data, CMS-driven content, donations recorded
> server-side and attributed to a case. **Not real, deliberately:** there is no payment gateway —
> every donation stays «قيد المراجعة» until an admin approves it.
>
> Delivery status and evidence: [`qa/`](qa/).

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
├── BACKEND.md            Full backend spec (architecture, DB model, REST API, security)
├── README.md             Quick start (install / run)
├── STRUCTURE.md          ← this file
└── .claude/launch.json   Dev-server launch config (mobile-web :8087)
```

**Dependency rule:** `mobile` imports **only** from `@ahla/shared`. The dashboard repo holds a *copy* of `shared/`, so editing tokens or data here reaches the app immediately but the dashboard only when its copy is updated.

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
| Auth | `EmailAuthScreen` → `OtpScreen` (passwordless **email** login; **real** `/auth/otp/*`; JWT pair stored in the OS keystore via `store/session.ts`) |
| Content & info | `NewsScreen` (عن الجمعية — About route), `ArticleDetailScreen`, `FaqScreen`, `PrivacyPolicyScreen`, `OnboardingScreen` (tour) |
| Engagement | `VolunteerScreen` (validated form), `ContactUsScreen` (reads `appConfig`), `NotificationsScreen` (notification center)\*, `FavoritesScreen`\* |
| Settings | `AccountSettingsScreen`, `NotificationPreferencesScreen`, `LanguageScreen` |

\* = wrapped in `LoginGate` (account-only for guests).

### State — `src/store/` (all `useSyncExternalStore`, module-level)

- `appState.ts` — session (guest by default, **email** login) + receipts + saved consultation requests.
- `session.ts` — the JWT pair, held in the OS keystore (`expo-secure-store`), rotated at boot and
  revoked server-side on logout. Bearer credentials do not belong in AsyncStorage.
- `hooks/useMyData.ts` — loads a `/me/*` collection with loading / error / empty / guest states and
  **no fallback to bundled data**: for account data, an empty list with an explanation is the honest
  answer, and a guest is told to sign in rather than shown someone else's sample rows.
- `drawer.ts` — sidebar open/close.
- `notifications.ts` — notification-center read/unread; the AppBar bell badge reads its live unread count.

---

## 4. Admin dashboard — separate repository

Moved to [ahla-shabab-dashboard](https://github.com/ahmedAbdelhaleemGamal/ahla-shabab-dashboard) (private). Vite · React 18 · Tailwind 3,
twelve modules covering bookings, donations approval, services, providers,
content, users, notifications, inbox, reports, settings, roles and the CMS.

It carries a vendored copy of `shared/` at `src/shared`, aliased to `@ahla/shared`
so its imports read exactly as they did here. That copy is the thing to watch: it
does not track this repo automatically.

To run the app and dashboard on **one origin**, which is what makes a CMS edit
visible in the app (browsers partitioned localStorage per origin). **This is obsolete** — the CMS
now lives on the server, so both read it through the API and can run anywhere. Kept for history:

```bash
cd ../ahla-shabab-dashboard && DEMO_BASE=/admin/ npm run build
cd -  && npm run demo:build
ADMIN_DIR=../ahla-shabab-dashboard/dist npm run demo
```

---

## 5. Design system

- **Brand:** primary `#18489F`, gold `#E9AF31` (from ahlashabab.com), white surfaces on `paper` background; official calligraphic logo at `mobile/assets/logo.png` (1600², also drives the app icon/splash); the dashboard repo carries the same file at `public/logo.png`.
- **Typography:** Cairo — expo-google-fonts on mobile; the dashboard repo copies the same weights out of that package into its own `public/fonts/`.
- **RTL:** explicit `row-reverse` / `textAlign:'right'` everywhere (not `I18nManager`); Latin digits kept LTR via the `num` style/class.
- **Radius language:** cards 16, inputs 12, buttons pill (24 / rounded-full) — identical in both apps.
- **Demo watermarks:** every donation/receipt/consultation surface carries «نسخة عرض» / «إيصال تجريبي لغرض العرض فقط» so nothing reads as a real transaction.

---

## 6. Commands & dev workflow

```bash
npm install                 # once, at repo root (shared + mobile)

npm run mobile              # Expo dev server (Expo Go / emulator / w = web)
npm run typecheck           # all workspaces

cd shared && npx vitest run # business-rule tests
```

- **Node ≥ 20 required for Metro** (mobile). `.claude/launch.json` pins the mobile-web server to Node 22.
- Mobile typecheck uses `mobile/tsconfig.typecheck.json`. It isolates @types/react 19 from the React 18 types the dashboard workspace used to hoist to the root; with the dashboard gone that clash should be gone too, but the config is harmless and still pins the intended version. Never add the `react` path mapping to `mobile/tsconfig.json` — Metro reads it and breaks the bundle.

## 7. Android APK pipeline

The exFAT SSD breaks Gradle, so release builds run inside an APFS disk image:

1. Mount `ahlabuild.sparseimage` → `/Volumes/AhlaBuild/proj` (always `hdiutil detach` before unplugging the SSD).
2. `rsync` `shared/src` + `mobile/src` + `App.tsx`/`app.json` + assets in (`--exclude='._*'`).
3. Bump `versionCode`/`versionName` in `android/app/build.gradle` **and** `app.json`.
4. **Put Node ≥ 20 on PATH first** (`export PATH=~/.nvm/versions/node/v22.22.2/bin:$PATH`) — the default Node 18 fails the JS bundle step (`createBundleReleaseJsAndAssets` → `configs.toReversed is not a function`).
5. `./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon` (Gradle 8.13). JS-only changes rebuild in ~1 min.
6. Artifacts land in `builds/`, e.g. `ahla-shabab-v1.6.0-demo.apk` (60 MB). `.apk` is gitignored;
   publish via a [GitHub Release](https://github.com/ahmedabdelhaleemnoby/Ahla-Shabab-Foundation/releases)
   for phone testing.
7. **Verify the artifact, not the build log.** The JS bundle is Hermes bytecode: binary-safe `grep -a`
   for ASCII, and **UTF-16LE** for Arabic strings — a UTF-8 grep for Arabic returns 0 even when the
   string is present, which reads as a missing feature. Native modules can sit in `classes2.dex` or
   `classes3.dex`, so search every dex.
8. ⚠️ **The release build is signed with the Android *debug* keystore** (`app/build.gradle` points the
   `release` type at `signingConfigs.debug`, carrying React Native's own warning). Fine for
   sideloading; **Google Play will reject it.** A real keystore is needed before any store release.

Android 12+ gotcha: the system splash shows the **adaptive icon cropped to a circle**, so icon marks are circle-safe; icon/splash res files are swapped directly in the build image to avoid `prebuild --clean`.

## 8. Documents

| File | Purpose |
|---|---|
| [README.md](README.md) | Install & run quick start |
| [BACKEND.md](BACKEND.md) | The backend spec. **It has since been built** — treat it as the design record, and the running code plus `qa/` as the source of truth where they differ |
| [STRUCTURE.md](STRUCTURE.md) | This map |
| [`qa/FINAL_PROJECT_DELIVERY_AUDIT.md`](qa/FINAL_PROJECT_DELIVERY_AUDIT.md) | **Start here for status.** The delivery verdict |
| [`qa/PROJECT_COMPLETION_MATRIX.md`](qa/PROJECT_COMPLETION_MATRIX.md) | 52 requirements, evidence-based, per layer |
| [`qa/REMAINING_TASKS.md`](qa/REMAINING_TASKS.md) | What is left, in the order to do it |
| [`qa/FIX_LOG.md`](qa/FIX_LOG.md) | Every fix with its retest — **and a register of withdrawn findings**, including ones the audit itself got wrong |
| [`qa/final-delivery-audit/`](qa/final-delivery-audit/) | Raw evidence: API probes, DB verification, security, build logs |
| [CLIENT_DECISIONS_REQUIRED.md](CLIENT_DECISIONS_REQUIRED.md) | Open decisions for the foundation |
| [MISSING_API.md](MISSING_API.md) | ⚠️ Superseded historical snapshot — use `qa/` |

## 9. What is still not built — and why

- **Payment gateway — deliberately absent.** The client's instruction is explicit: there is no online
  gateway and the app must not simulate instant payment success. All three methods are completed
  outside the app and approved by an admin. The webhook handler exists and is tested against the day
  one is ever connected — but a defect must be fixed first: it matches a pending donation **by amount
  alone**, so with two same-amount donations it would confirm the wrong donor's. See `qa/` T-10.
- **OTP email delivery** — needs SMTP plus a readable inbox. The **only** remaining item that
  requires a third party. Login cannot be completed in testing without it.
- **Push notifications (FCM)** — needs a server key.
- **Consultant portal** — not started.
- **Monitoring / error tracking** — not chosen or wired.
- **iOS build** — needs an Apple developer account.
- **A release keystore** — every build so far is debug-signed; Google Play will reject it.
- ESLint config (known gap; TypeScript strict + 192 backend tests + 43 shared tests cover current QA).
