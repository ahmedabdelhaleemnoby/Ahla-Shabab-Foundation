# Defect Report

**Date:** 2026-07-26 · **Commit:** `ec46501` · **Environment:** Expo Web (react-native-web) in headless Chrome, viewports 320/390/430/768 px; admin dashboard in Chrome at 1440×900.

**Testing method disclosure:** all runtime findings below are from **browser testing** of the Expo Web build plus **code inspection**. **No emulator testing and no physical-device testing was performed** — the Android build fails in this environment (see `BUILD_AND_TEST_RESULTS.md`).

## Fix round — 2026-07-26 (after initial audit)

**Nine defects have been fixed on request:** D-01, D-02, D-06, D-03 (round 1); D-04, D-05 (round 2); D-08, D-09 (round 3); D-17 (round 4). Round 4 also surfaced **D-18**, a pre-existing delivery-path limitation logged open, and required a correction to the D-08 wording (see below). Each carries a *Fix applied* and *Retest* section below. All other defects remain open and untouched. Post-fix verification: typecheck clean (3 workspaces), 28/28 unit tests pass, dashboard builds, and the full navigation + consultation + gating regression suite re-run green.

| ID | Severity | Title | Status |
|---|---|---|---|
| D-01 | High | Three dead buttons in the side menu (خدماتنا / حسابي / أخبارنا) | **FIXED** |
| D-02 | High | Account Settings screen is not guest-gated | **FIXED** |
| D-03 | Medium | No persistence anywhere — all demo state resets on reload, contradicting an on-screen claim | **FIXED (copy)** — see note |
| D-04 | Medium | Provider working-hours start/end cannot be changed | **FIXED** |
| D-05 | Medium | Provider "Reschedule" action does not exist | **FIXED** |
| D-06 | Medium | OTP screen asserts an email was sent; no email service exists and no demo hint is shown | **FIXED** |
| D-07 | Medium | Unverified "1.2M+ beneficiaries" statistic still displayed (relocated, not removed) | Open — client decision |
| D-08 | Medium | Dashboard "impact numbers" editor has no effect on the mobile app | **FIXED** |
| D-09 | Medium | Guest consultations with no email all collapse into one shared identity | **FIXED** |
| D-10 | Low | 320 px: "تعرف على الاستشارات" button label truncated | Open |
| D-11 | Low | 320 px: "الحالات العاجلة" tab label wraps, misaligning the tab row | Open |
| D-12 | Low | All four social links are the same placeholder URL | Open |
| D-13 | Low | Shipped demo APK predates the final commit | Open |
| D-14 | Low | Dead conditional + stale section comment (technical debt) | Open |
| D-15 | Low | About footer buttons render at uneven heights when a label wraps | Open |
| D-16 | Low | Admin dashboard loads fonts from an external CDN | Open — informational |
| **D-17** | Medium | Remaining dashboard Settings sections are draft-only — save does nothing | **FIXED** |
| **D-18** | **Medium** | **Dashboard and Expo web are different origins, so CMS edits never reach the web preview live** | **Open — pre-existing, found during the D-17 fix** |

---

## D-01 — Three dead buttons in the side menu

- **Requirement:** Phase 4 — "No dead buttons are allowed."
- **Severity:** High · **Priority:** P1
- **Environment:** Expo Web, 390×844, guest session
- **Preconditions:** App freshly loaded on Home.
- **Steps to reproduce:**
  1. Tap the hamburger icon (top-left) to open the side drawer.
  2. Tap **خدماتنا**.
  3. Repeat for **حسابي** and **أخبارنا**.
- **Expected:** each item navigates to its screen (services browser, account, news feed).
- **Actual:** the drawer closes and the app stays on Home. No navigation, no error, no feedback. Verified by reading the navigator's root state before/after each tap:

```
label                  | declared target | resulting route | verdict
خدماتنا                | tab('Discover') | Main/Home       | DEAD BUTTON — no navigation
حسابي                  | tab('Profile')  | Main/Home       | DEAD BUTTON — no navigation
أخبارنا                | tab('News')     | Main/Home       | DEAD BUTTON — no navigation
```
  (All 14 other drawer items navigate correctly — see `NAVIGATION_MATRIX.md`.)
- **Evidence:** `qa/screenshots/mobile/drawer.png`; drawer-scoped click harness output above.
- **Likely cause:** `shared/src/cms/cmsDefaults.ts:52,63,79` still declare `target: tab('Discover')`, `tab('Profile')`, `tab('News')`. Those three tabs were removed in the five-tab redesign (`mobile/src/navigation/types.ts:71-78` now defines only `Home | Cases | UrgentCases | Donate | Consultations | About`). `AppDrawer.go()` calls `nav('Main', { screen: 'Discover' })`, which React Navigation silently ignores for an unknown child route. The default menu was not migrated alongside the navigation overhaul.
- **Fix applied (4 layers — data, types, runtime, authoring):**
  1. **Data** — `shared/src/cms/cmsDefaults.ts`: `m-services` → `route('ServicesBrowse')`, `m-profile` → `route('AccountSettings')`, `m-news` → `route('NewsFeed')`.
  2. **Types (prevents recurrence)** — `shared/src/cms/cmsTypes.ts`: `MainTab` changed from the stale `'Home' | 'Discover' | 'Donate' | 'News' | 'Profile'` to the real tab set `'Home' | 'Cases' | 'UrgentCases' | 'Donate' | 'Consultations' | 'About'`, and the `tab()` helper in `cmsDefaults` now takes `MainTab` instead of an inline literal union. **Any future `tab` target naming a non-existent tab is now a compile error rather than a silent runtime no-op** — this is the change that stops the bug class, not just the instance.
  3. **Runtime (handles already-persisted state)** — on web the app and dashboard share one `localStorage` key, and `readCms()` accepts a stored menu without a version check, so a CMS state saved *before* this fix would have resurrected the dead links. Added `LEGACY_TAB_ROUTES` (`Discover→ServicesBrowse`, `News→NewsFeed`, `Profile→AccountSettings`) and applied it in both places that navigate from a `NavTarget`: `AppDrawer.go()` and `CmsPageScreen.handleCta()`.
  4. **Authoring** — `dashboard/src/pages/CmsMenu.tsx` and `dashboard/src/components/RichContentEditor.tsx` both offered the stale five-tab list in their target dropdowns, letting an admin recreate the bug. Both now use `TABS: MainTab[]` with the correct set, type-checked against the shared union.
- **Retest — PASS.** All three previously dead items now navigate, and all 13 previously working items still do (16/16 total):
  ```
  PASS | خدماتنا      exp ServicesBrowse   got ServicesBrowse
  PASS | حسابي        exp AccountSettings  got AccountSettings
  PASS | أخبارنا      exp NewsFeed         got NewsFeed
  … 13/13 pre-existing drawer items unchanged and passing
  ```
- **Status:** **FIXED**

---

## D-02 — Account Settings screen is not guest-gated

- **Requirement:** §6 — "Verify Guest cannot directly access personal history: … Account settings."
- **Severity:** High · **Priority:** P1
- **Environment:** Expo Web, 390×844, guest (not logged in)
- **Preconditions:** No login performed; `__appState.get().loggedIn === false`.
- **Steps to reproduce:** Navigate to the `AccountSettings` route as a guest (reachable in-app via the drawer entry *حسابي* once D-01 is fixed, and directly by route).
- **Expected:** the friendly `LoginGate` sheet appears — "هذه الصفحة لحسابك الشخصي", a **تسجيل الدخول** button and a **متابعة كزائر** escape, as it does for the other five personal screens.
- **Actual:** the full editable personal-profile form renders with no gate at all:
  ```
  إعدادات الحساب
  الاسم بالكامل / رقم الهاتف / البريد الإلكتروني / المحافظة (اختياري) / نبذة عنك
  حفظ التغييرات
  ```
  Gate coverage measured across the six personal screens:
  ```
  DonationHistory    gated=YES  loginBtn=true  continueAsGuest=true
  Receipts           gated=YES  loginBtn=true  continueAsGuest=true
  MyBookings         gated=YES  loginBtn=true  continueAsGuest=true
  Favorites          gated=YES  loginBtn=true  continueAsGuest=true
  Notifications      gated=YES  loginBtn=true  continueAsGuest=true
  AccountSettings    gated=NO   loginBtn=false continueAsGuest=false
  ```
- **Evidence:** `qa/screenshots/mobile/gate-AccountSettings-guest.png` vs. `gate-MyBookings.png`.
- **Likely cause:** `AccountSettingsScreen.tsx` is the only one of the six that does not import/wrap `LoginGate` (confirmed: `grep -rn "LoginGate" src/screens/` lists Notifications, DonationHistory, MyBookings, Receipts, Favorites only).
- **Fix applied:** `AccountSettingsScreen.tsx` now wraps its body in `<LoginGate>`, matching the pattern used by the other five screens exactly (same import position, same JSX nesting, benefit bullets written for this screen):
  ```tsx
  <LoginGate
    icon="user"
    title="إعدادات حسابك"
    benefits={['بياناتك محفوظة ولا تعيد إدخالها كل مرة',
               'تعبئة تلقائية لنماذج التبرع والاستشارة',
               'تحكم في وسائل التواصل والتذكيرات']}
  >
  ```
- **Retest — PASS.** All six personal screens now gate consistently, and the editable form is confirmed unreachable for a guest (`formLeak=false` checks for the "حفظ التغييرات" button):
  ```
  PASS | DonationHistory    gated=true loginBtn=true continueAsGuest=true formLeak=false
  PASS | Receipts           gated=true loginBtn=true continueAsGuest=true formLeak=false
  PASS | MyBookings         gated=true loginBtn=true continueAsGuest=true formLeak=false
  PASS | Favorites          gated=true loginBtn=true continueAsGuest=true formLeak=false
  PASS | Notifications      gated=true loginBtn=true continueAsGuest=true formLeak=false
  PASS | AccountSettings    gated=true loginBtn=true continueAsGuest=true formLeak=false
  ```
  Positive case also verified — after login the real editable form renders with no gate: `PASS | logged-in sees editable form, no gate`.
- **Evidence:** `qa/screenshots/mobile/FIXED-gate-AccountSettings-guest.png`, `FIXED-accountsettings-loggedin.png`
- **Status:** **FIXED**

---

## D-03 — No persistence anywhere; on-screen text claims otherwise

- **Requirement:** Phase 6 — persistence of session, consultation requests, guest identity, provider availability, provider booking status.
- **Severity:** Medium · **Priority:** P2
- **Environment:** Expo Web, 390×844
- **Preconditions:** none.
- **Steps to reproduce:**
  1. Log in with `persist@test.com` + any 6-digit code. Confirm `loggedIn: true`.
  2. Reload the page.
  3. Separately: in the provider dashboard add slot `05:30 م` and exception date `2026-09-09`, then reload.
- **Expected:** state described in the UI as locally saved survives a reload/restart.
- **Actual:** everything resets.
  ```
  session before reload: {"loggedIn":true,"email":"persist@test.com","receipts":[],"consultations":[]}
  session after  reload: {"loggedIn":false,"email":null,"receipts":[],"consultations":[]}

  provider slot "05:30 م"        after reload: LOST
  provider exception 2026-09-09  after reload: LOST
  provider availability toggle   after reload: reset to ON
  ```
- **Evidence:** harness output above; `localStorage` is empty (`Object.keys(localStorage)` → `(empty)`).
- **Likely cause:** `appState.ts`, `demoUsers.ts` and `providerStore.ts` are all plain module-level variables (`let state = …`, `new Map()`), with no `AsyncStorage`/`localStorage` layer. Only the CMS store (`mobile/src/store/cms.ts`) reads `localStorage`, and only on web.
- **Aggravating factor — misleading copy:** the provider dashboard banner reads *"نسخة عرض تجريبية — لوحة تحكم مقدم الخدمة (**مُحفوظة محلياً**)"* and the consultation confirmation reads *"**حُفظ الطلب على جهازك فقط**"*. Both assert local saving that does not happen. Within a single uninterrupted session the demo behaves correctly; after any reload or app restart the claim is false.
- **Fix applied — option (b), the copy fix. The underlying behaviour is unchanged: state still does not persist.** Three user-facing strings now describe what actually happens:

  | File | Before | After |
  |---|---|---|
  | `ConsultationRequestScreen.tsx` | "نسخة عرض — حُفظ الطلب على جهازك فقط ولم يُرسل لأي جهة." | "نسخة عرض — الطلب محفوظ أثناء الجلسة الحالية فقط ولم يُرسل لأي جهة. **سيُمسح عند إغلاق التطبيق.**" |
  | `ConsultationRequestScreen.tsx` | "تم حفظ طلبك في النسخة التجريبية، ويمكنك تسجيل الدخول بنفس البريد لمتابعته." | "سُجِّل طلبك في النسخة التجريبية، ويمكنك تسجيل الدخول بنفس البريد **أثناء هذه الجلسة** لمتابعته." |
  | `ConsultantDashboardScreen.tsx` | "لوحة تحكم مقدم الخدمة (مُحفوظة محلياً)" | "لوحة تحكم مقدم الخدمة (**التعديلات تُحفظ أثناء الجلسة الحالية فقط**)" |

  The accurate half of the consultation disclaimer — *"ولم يُرسل لأي جهة"* — was deliberately preserved, since it is independently verified true.

  **Why not real persistence (option a):** it needs `@react-native-async-storage/async-storage`, which is not currently a dependency. Adding a native module requires a native rebuild, and **the Android build is broken in this environment** — so the change could not have been verified on the platform that matters. A web-only `localStorage` shim was also rejected: it would make web and native behave differently, which is worse than honest in-memory behaviour. Real persistence remains the better product outcome and is still recommended as a follow-up, once the Android toolchain is fixed.

  Left untouched: `defaultSettings.demoLabel` ("يتم حفظ التعديلات على هذا الجهاز فقط") — that string describes the **dashboard CMS**, which genuinely does persist to `localStorage`, so it is accurate as written.
- **Retest — PASS.**
  ```
  PASS | provider banner states session-only
  PASS | submission still works
  PASS | disclaimer states session-only
  PASS | still states not sent anywhere
  ```
- **Evidence:** `qa/screenshots/mobile/FIXED-prov-banner.png`, `FIXED-consult-confirm.png`
- **Status:** **FIXED (wording).** The persistence gap itself is unchanged and is now accurately disclosed — see `PERSISTENCE_REPORT.md`.

---

## D-04 — Provider working-hours start/end cannot be changed

- **Requirement:** §5 Availability — "Start/end times can be changed."
- **Severity:** Medium · **Priority:** P2
- **Environment:** Expo Web, 390×844, `ConsultantDashboard` → tab *مواعيدي والأنصبة*
- **Steps to reproduce:** Open the availability tab and look for a control to edit the working-day range.
- **Expected:** editable start and end time.
- **Actual:** the range renders as static text only — `نطاق اليوم: 10:00 ص إلى 04:00 م`. There is no input, picker, or button next to it. Harness result: `START/END TIME editable control present: NO EDIT CONTROL`.
- **Evidence:** `qa/screenshots/mobile/prov-availability.png`
- **Likely cause:** `providerStore.ts` exposes `toggleAvailability`, `toggleDay`, `addSlot`, `removeSlot`, `addUnavailableDate`, `removeUnavailableDate` — but **no mutator for `startTime`/`endTime`** (nor for `slotDurationMinutes`). The screen renders `profile.startTime`/`profile.endTime` read-only at `ConsultantDashboardScreen.tsx:203`.
- **Fix applied:** added `providerStore.setWorkingHours(startTime, endTime)` and an editable **تعديل نطاق اليوم** card in the availability tab — two inputs (من / إلى) prefilled from the current profile, plus a save button. Styling reuses the same input treatment as the existing slot and exception-date fields (extracted to a shared `timeInputStyle` rather than duplicating the inline object a third time). The mutator trims and rejects an empty start or end, so a blank field cannot wipe the stored range.
- **Retest — PASS** (`qa/harness/availability.mjs`):
  ```
  PASS | edit control present
    before: نطاق اليوم: 10:00 ص إلى 04:00 م
    after : نطاق اليوم: 09:30 ص إلى 07:15 م
  PASS | start + end both updated
  PASS | empty input rejected — range not wiped
  ```
- **Evidence:** `qa/screenshots/mobile/FIXED-prov-workinghours.png`
- **Scope note:** `slotDurationMinutes` is still read-only, displayed beside the range. The requirement asked only for start/end, so it was left alone rather than widened unasked — worth a follow-up if the client wants the full range editable.
- **Status:** **FIXED**

---

## D-05 — Provider "Reschedule" action does not exist

- **Requirement:** §5 Bookings — "Reschedule action."
- **Severity:** Medium · **Priority:** P2
- **Environment:** Expo Web, `ConsultantDashboard` → *الحجوزات والطلبات* → expand a booking
- **Expected:** four actions — Confirm, Reschedule, Complete, Cancel.
- **Actual:** only three render: `تأكيد` (Confirm), `إكمال` (Complete), `إلغاء` (Cancel). Harness result: `actions: تأكيد إكمال إلغاء | Reschedule: ABSENT`.
- **Evidence:** `qa/screenshots/mobile/prov-booking-detail.png`
- **Likely cause:** `ConsultantDashboardScreen.tsx:436-458` renders exactly three `<Button>`s; `providerStore` has no mutator for `appointmentDate`/`appointmentTime`.
- **Fix applied:** added `providerStore.reschedule(bookingId, date, time)` and an **إعادة جدولة** button below the three status actions. It toggles an inline editor prefilled with the booking's current date and time, with save/cancel. The mutator trims and rejects empty values.
  **Status is deliberately left untouched** — rescheduling a pending request must not silently confirm it, so a `جديد` booking stays `جديد` after being moved.
- **Retest — PASS** (`qa/harness/availability.mjs`):
  ```
  PASS | reschedule action present
    before: الموعد: 11:00 ص (2026-07-26)
  PASS | inline editor opens
    after : الموعد: 09:00 ص (2027-01-15)
  PASS | date + time updated
  PASS | editor closes after save
  PASS | status preserved (not auto-confirmed)
  PASS | today count drops when a booking moves off today
  ```
  The last line checks integration rather than just the widget: moving a booking off today took the Overview "مواعيد اليوم" counter from 2 to 1, with upcoming/new/completed/cancelled unchanged.
- **Evidence:** `qa/screenshots/mobile/FIXED-prov-reschedule-open.png`, `FIXED-prov-reschedule-saved.png`
- **Note:** the reschedule still does not persist across a reload — see D-03. Within a session it behaves correctly.
- **Status:** **FIXED**

---

## D-06 — OTP screen asserts an email was sent

- **Requirement:** §2 — "No claim is made that a real email was sent"; §9 — demo disclaimer appears where needed.
- **Severity:** Medium · **Priority:** P2
- **Environment:** Expo Web, `EmailAuth` → `Otp`
- **Steps to reproduce:** Enter a valid email, tap **إرسال رمز التحقق**.
- **Expected:** wording that does not assert delivery, plus a demo hint that any 6-digit code is accepted.
- **Actual:** the screen states **"تم إرسال رمز التحقق إلى بريدك الإلكتروني"** ("the verification code has been sent to your email") above the address. No email service exists — no network request of any kind is made (verified: zero non-localhost requests during the whole flow). The preceding screen likewise promises *"سنرسل لك رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني"*. Neither screen carries a demo banner, unlike the consultation confirmation and provider dashboard which both do.
- **Evidence:** `qa/screenshots/mobile/login-otp.png`, `login-email.png`
- **Likely cause:** `OtpScreen.tsx:58` and `EmailAuthScreen.tsx:39`. The backend markers are correctly present in code (`// TODO(production): send and verify OTP through backend email service` at `EmailAuthScreen.tsx:20`, `OtpScreen.tsx:34`, `demoUsers.ts:97`) but no user-facing demo notice was added.
- **Fix applied:** both screens reworded, and the gold `alert-triangle` demo card used elsewhere in the app added to each.

  | File | Before | After |
  |---|---|---|
  | `OtpScreen.tsx` | "تم إرسال رمز التحقق إلى بريدك الإلكتروني" | "تسجيل الدخول بالبريد" + demo card: "نسخة عرض — **لم يُرسل أي بريد إلكتروني**. أدخل أي رمز مكوّن من 6 أرقام للمتابعة." |
  | `EmailAuthScreen.tsx` | "سنرسل لك رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني لتأكيد هويتك." | "يُستخدم بريدك لتأكيد هويتك وربط طلبات الاستشارة السابقة بحسابك." + demo card: "نسخة عرض — **لا يُرسل أي بريد إلكتروني فعلياً**، ويُقبل أي رمز مكوّن من 6 أرقام في الشاشة التالية." |

  The **resend control was deliberately kept** — requirement §2 requires a resend action to exist, and with the demo card directly above it the label is no longer misleading in context.
- **Retest — PASS.**
  ```
  PASS | EmailAuth no longer promises to send an email
  PASS | EmailAuth shows demo notice
  PASS | OTP no longer claims an email was sent
  PASS | OTP shows demo notice + how to proceed
  PASS | resend control still present (req §2)
  ```
  Full OTP validation matrix re-run and unchanged: empty / short / non-numeric / mixed all rejected, six digits accepted.
- **Evidence:** `qa/screenshots/mobile/FIXED-login-otp.png`, `FIXED-login-email.png`
- **Status:** **FIXED**

---

## D-07 — Unverified "1.2M+ beneficiaries" statistic still displayed

- **Requirement:** §3 — "The old 1.2M or similar unverified statistics section is removed."
- **Severity:** Medium · **Priority:** P2
- **Environment:** Expo Web, About tab (اعرف عنا)
- **Expected (literal requirement):** removed from Home — **satisfied**. Home carries no impact numbers at all.
- **Actual:** the figure was **relocated, not retired**. The About screen shows a `1.2M+ / مستفيد` stat card near the top, plus a second unverified block lower down under *أثرنا في المجتمع*: `+1,200,000 مستفيد من خدماتنا`, `+650 مبادرة ومشروع`, `+10,000 متطوع فعّال`, and a hardcoded milestone timeline (2013 / 2015 / 2019 / 2022 / 2025).
- **Evidence:** `qa/screenshots/mobile/tab-About.png` (1.2M+ card clearly visible), `w320-About.png`
- **Likely cause:** `NewsScreen.tsx:68` renders `foundationStats.beneficiaries` (`'1.2M+'` from `shared/src/data.ts:66`) and `NewsScreen.tsx:15-19` defines a local hardcoded `IMPACT` array.
- **Note in the app's favour:** the separate **"22 محافظة"** claim is *not* rendered anywhere — `foundationStats.governorates: 22` exists in data but no screen displays it (verified by grep). The About page instead lists the 12 real governorates plus "وفي توسع مستمر…", which is the honest presentation.
- **Recommended fix:** confirm with the client whether these figures are approved. If not, remove the `IMPACT` block and the beneficiaries stat card, or replace with figures the foundation can substantiate. This is a **judgement call for the client**, not an unambiguous bug — flagging because the stated intent was to eliminate unverified impact numbers, and they remain one tab away.
- **Status:** Open — needs client decision

---

## D-08 — Dashboard "impact numbers" editor has no effect on the mobile app

- **Requirement:** implied by §5/§9 — the demo must not imply capability that does not exist.
- **Severity:** Medium · **Priority:** P2
- **Environment:** Admin dashboard `/settings`, 1440×900
- **Steps to reproduce:** Open **إعدادات التطبيق** → section *أرقام الأثر (الرئيسية + عن الجمعية في التطبيق)* with fields عدد المحافظات / عدد المستفيدين / سنوات العطاء. Edit and save.
- **Expected:** given the section's own heading claims it drives "الرئيسية + عن الجمعية في التطبيق", the mobile About screen should reflect the new values.
- **Actual:** the mobile app never reads these values. `mobile/src/store/cms.ts` exports only `getMenu`, `getHomeSections`, `getCmsPageBySlug`, `getMediaSrc`, `getConsultationTypes`, `getConsultationType` — there is **no `getSettings`**. `NewsScreen.tsx:5` imports the static `foundationStats` from `@ahla/shared` instead. The editor is therefore inert with respect to the app.
- **Evidence:** dashboard `/settings` text dump; `grep -rn "getSettings" mobile/src` → no matches.
- **Likely cause:** the CMS settings slice was built on the dashboard side without a corresponding mobile reader.
- **Correction to the original diagnosis.** The report first said the mobile side simply didn't read the setting. On implementing the fix it turned out to be worse in both directions: **`CmsSettings` had no `stats` field at all**, and **`dashboard/src/pages/Settings.tsx` never imported the CMS store** — its `save()` only flipped a badge to green (`setSaved(...)`), so edits didn't even survive a dashboard reload, let alone reach the app. Three layers were missing, not one.
- **Fix applied:**
  1. **Schema** — added `stats: FoundationStatsSettings` to `CmsSettings`, seeded in `defaultSettings` from `foundationStats`. Schema version bumped **3 → 4**, with a migration in `cmsPersistence.migrate()` that backfills `settings.stats` so CMS state saved before this change still resolves.
  2. **Dashboard** — the impact card now reads from `useCms()` and commits via `mutate()` on save, with an activity-log entry (`عدّل أرقام الأثر`).
  3. **Mobile** — added `getSettings()` to `mobile/src/store/cms.ts`, merging stored settings over the compiled defaults **per field**, so a partial CMS blob can't blank the UI. `NewsScreen` now renders `stats.beneficiaries` / `stats.yearsOfService` instead of the static import.
- **A latent bug the new test caught:** `makeDefaultCmsState()` deep-copies `socials` but the added `stats` object was still shared by reference across every call — the exact bug class the `socials` handling already guards against. Fixed, and covered by an assertion.
- **Retest — PASS** (`qa/harness/settings.mjs` + `settings-dashboard.mjs`):
  ```
  app side:
  PASS | compiled defaults render with no CMS override
  PASS | dashboard-authored stats reach the About screen
  PASS | previous hardcoded value no longer shown
  PASS | partial stats fall back per field (777K+ + default 12)

  dashboard side:
  before: ['22','1.2M+','12'] → after save: ['22','3.5M+','12']
  PASS | save commits to the CMS store
  PASS | change recorded in the CMS activity log
  PASS | survives a dashboard reload
  ```
- **Evidence:** `qa/screenshots/mobile/FIXED-about-cms-stats.png`
- **Correction to this entry (made in round 4).** The retest line above, *"dashboard-authored stats reach the About screen"*, was verified by writing CMS state to the **app's own origin** — it proves the app-side reader, which is real and correct. It does **not** prove that editing in the running dashboard shows up in the running web preview: those are served on different ports, so their `localStorage` is partitioned and no live sync occurs. That limitation is pre-existing, affects every CMS slice, and is now logged as **D-18**. The accurate statement is: *the app renders CMS-authored stats*, and the supported way to move CMS state between the two is the dashboard's export/import JSON.
- **Knock-on for D-07:** the client can change or blank the "1.2M+" figure from the dashboard without a code change — via export/import, or from a same-origin deployment.
- **Scope boundary:** only the impact-numbers card was wired. The other Settings sections are still draft-only — logged as **D-17** rather than silently left.
- **Status:** **FIXED**

---

## D-09 — Guest consultations without an email collapse into one shared identity

- **Requirement:** §7 — guest consultation identity and deduplication.
- **Severity:** Medium · **Priority:** P2
- **Environment:** Expo Web, any consultation form
- **Preconditions:** The email field is **optional** in every consultation form (`required: false` in `baseFields()`), so this path is reachable by design.
- **Steps to reproduce:** Submit a consultation leaving البريد الإلكتروني blank, as a guest. Repeat as a different person, also blank.
- **Expected:** distinct anonymous submissions, or the email field made required.
- **Actual:** `ConsultationRequestScreen.tsx:102` falls back to the literal `'guest@ahlashabab.com'`. Every emailless guest submission is therefore attached to a **single shared demo user record**. Anyone who later logs in as `guest@ahlashabab.com` would see all of them.
- **Evidence:** code inspection of `ConsultationRequestScreen.tsx:102` + `demoUsers.ts:60-87`. Not exercised end-to-end at runtime because the deduplication test used the email path.
- **Likely cause:** placeholder fallback introduced so `attachConsultationToDemoUser` always receives a string.
- **Fix applied — both remedies, because either alone leaves a hole:**
  1. **`email` is now `required: true`** on every consultation form (`baseFields()` in `cmsDefaults.ts`), with the message *"أدخل بريدك الإلكتروني لمتابعة طلبك لاحقاً"*. It is the identity key for the entire returning-guest feature, so it should never have been optional.
  2. **The fallback no longer collapses identities.** The CMS form builder can still un-require or hide the field, so the defensive path matters: `'guest@ahlashabab.com'` is replaced by a per-submission key, `anon-<reference>@demo.local`.
- **A second, worse bug found while fixing this:** the original line used `??`, which only catches `undefined`. A user who typed an email and then cleared it left `values['email'] === ''`, and `normalizeEmail('')` is `''` — so **every such submission attached to a single empty-string identity**, a shared bucket that wasn't even the documented `guest@` one. Changed to `||` with a `.trim()`, so blank input falls through to the anonymous key.
- **Retest — PASS** (`qa/harness/settings.mjs`):
  ```
  PASS | email no longer labelled (اختياري)
  PASS | submission blocked without an email
  PASS | required-email validation message shown
  PASS | submits once an email is supplied
  PASS | case/whitespace variants share one identity   ← dedup regression
  ```
- **Evidence:** `qa/screenshots/mobile/FIXED-consult-email-required.png`
- **Status:** **FIXED**

---

## D-10 — 320 px: consultation CTA label truncated

- **Requirement:** Phase 5 — no clipping / unreadable text at 320 px.
- **Severity:** Low · **Priority:** P3
- **Steps to reproduce:** Load Home at 320×568.
- **Expected:** full label "تعرف على الاستشارات".
- **Actual:** renders as "تعرف على الا…". Measured: `scrollWidth 130 > clientWidth 98`, `clip: true`. At 390 px it fits exactly (`130/130`, `clip: false`), so 320 px is the only affected width.
- **Evidence:** `qa/screenshots/mobile/w320-Home.png`, `crop320-home-cta.png`
- **Likely cause:** `HomeScreen.tsx:99` uses `adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}`. `adjustsFontSizeToFit` is a **no-op on react-native-web**, so the text truncates instead of shrinking. On real Android/iOS it would likely shrink as intended — **this specific defect may be web-only and should be re-checked on a device once the Android build is fixed.**
- **Recommended fix:** shorten the label (e.g. "عن الاستشارات") or allow two lines at narrow widths.
- **Status:** Open — needs device re-verification

---

## D-11 — 320 px: tab label wraps and misaligns the tab row

- **Requirement:** Phase 1 — no clipping on small screens; Phase 5 — no overlap/misalignment.
- **Severity:** Low · **Priority:** P3
- **Steps to reproduce:** View any root tab at 320×568.
- **Expected:** five evenly aligned tab items.
- **Actual:** "الحالات العاجلة" wraps to two lines, so that item measures 63 px tall against 46 px for its neighbours, pushing its icon visibly higher than the rest. Tab-bar height grows 69 px → 86 px. Measured:
  ```
  320px: [الأسر h=46] [الحالات العاجلة h=63] [تبرع h=71] [الاستشارات h=46] [اعرف عنا h=46]
  390px: [الأسر h=46] [الحالات العاجلة h=46] [تبرع h=71] [الاستشارات h=46] [اعرف عنا h=46]
  ```
  No label is *clipped* (`clippedTabs: []` at every width) and the bar stays flush to the bottom — it is an alignment blemish, not a functional failure.
- **Evidence:** `qa/screenshots/mobile/w320-Home.png`
- **Likely cause:** `TabBar.tsx:68` `fontSize: 9.5` with no `numberOfLines`; at 320 px each of five flex items gets ~59 px.
- **Recommended fix:** add `numberOfLines={1}` plus a slightly smaller font at narrow widths, or shorten the label to "عاجلة".
- **Status:** Open

---

## D-12 — All four social links are the same placeholder URL

- **Requirement:** Phase 4 — contact and social links must not be dead.
- **Severity:** Low · **Priority:** P3
- **Actual:** `shared/src/data.ts:35-38` sets facebook, instagram, youtube and twitter all to `https://ahlashabab.com` — the website URL, not social profiles. `ContactUsScreen.tsx:57` opens `appConfig.website` for **every** social button regardless of which is tapped.
- **Evidence:** grep output of `shared/src/data.ts:33-38`.
- **Recommended fix:** supply the real profile URLs, or hide the social row for the demo.
- **Status:** Open

---

## D-13 — Shipped demo APK predates the final commit

- **Severity:** Low (release hygiene; would become High if that APK is what the client is shown) · **Priority:** P2
- **Actual:** `ahla-shabab-v1.4.0-demo.apk` mtime `2026-07-22 13:00:27`; commit `ec46501` ("adjust android display settings and improve typography") authored `2026-07-22 13:26:58`. The APK cannot contain that commit.
- **Recommended fix:** rebuild the demo APK from `ec46501` before the client session. Note this is currently blocked locally by the Gradle failure — an EAS build is the likely route.
- **Status:** Open

---

## D-14 — Dead conditional and stale comment (technical debt)

- **Severity:** Low · **Priority:** P3
- **Actual:**
  1. `ConsultantDashboardScreen.tsx:310` — `{(activeTab === 'الحجوزات والطلبات' || activeTab === 'نظرة عامة') && activeTab === 'الحجوزات والطلبات' && (…)}` reduces to the single right-hand test; the left disjunction is dead.
  2. `HomeScreen.tsx:20-22` — the header comment still describes the *old* section order ("hero → impact numbers → quick services → urgent cases → featured projects → latest news → online consultations") which no longer matches the implemented order (donation hero → consultations hero → vision/mission → urgent → sponsorship → featured project). Misleading for whoever maintains this next.
- **Recommended fix:** simplify the condition; rewrite the comment.
- **Status:** Open

---

## D-15 — About footer buttons render at uneven heights

- **Severity:** Low (cosmetic) · **Priority:** P3
- **Actual:** at 390 px the outline button "تواصل معنا" wraps to two lines inside its fixed `width: 130` while "انضم متطوعاً" stays on one, so the two footer buttons have visibly different heights. Measured text heights 60 px vs 30 px.
- **Explicitly NOT a clipping defect:** tight crops at both 320 px and 390 px confirm the text stays **inside** the button bounds — the button grows to fit. `qa/screenshots/mobile/crop390-about-footer.png`, `crop320-about-footer.png`.
- **Likely cause:** `NewsScreen.tsx:51` hardcodes `style={{ width: 130 }}`.
- **Recommended fix:** let both buttons flex, or widen to ~150 px.
- **Status:** Open

---

## D-16 — Admin dashboard loads fonts from an external CDN

- **Requirement:** §9 — "No real API requests."
- **Severity:** Low · **Priority:** P3
- **Actual:** the dashboard requests `fonts.googleapis.com` and `fonts.gstatic.com` (Cairo webfont) on every page load. The **mobile app makes zero external requests** — it bundles Cairo via `@expo-google-fonts/cairo`.
- **Assessment:** **safe** — no user or application data is transmitted; this is a static font fetch. Recording it because the requirement asked for an exhaustive network inventory, and because the dashboard will render with fallback fonts if demoed offline.
- **Recommended fix:** self-host the Cairo woff2 files if the demo may run without internet.
- **Status:** Open — informational


---

## D-17 — Remaining dashboard Settings sections are draft-only

- **Requirement:** implied by §5/§9 — the demo must not imply capability it does not have.
- **Severity:** Medium · **Priority:** P2
- **Found:** while fixing D-08 (not in the original audit — the sections render and validate, so nothing looks wrong until you reload).
- **Environment:** Admin dashboard `/settings`, 1440×900
- **Steps to reproduce:** edit any field under *نصوص الشاشة الرئيسية*, *بيانات التواصل*, *مواقع التواصل*, *وسائل الدفع*, or *نصاب الزكاة*; press حفظ; reload the page.
- **Expected:** the edit persists, as it now does for *أرقام الأثر*.
- **Actual:** the badge turns green ("تم الحفظ") but nothing is written. All of these sections are local `useState` seeded from `appConfig` / `seedMethods`, and `save()` only flips the badge. The edit is gone on reload and never reaches the app.
- **Likely cause:** `dashboard/src/pages/Settings.tsx` was built as a visual mock. Only the impact-numbers card has been wired to the CMS store (D-08).
- **Fix applied:**
  1. **Dashboard** — all six cards now hold a draft and commit through `mutate()` on save: hero texts, contact details, socials, zakat nisab, payment methods, alongside the impact numbers wired in round 3. Drafts seed from the CMS store rather than the static `appConfig`/`seedMethods`, so a reload shows the saved values.
  2. **Schema** — `paymentMethods` became a first-class CMS slice (`CmsState.paymentMethods`), the only one of the six with no existing home. Schema **4 → 5**, with a migration backfilling it for stored state.
  3. **Mobile readers** — the app previously read compiled constants in five places. Now: `AppDrawer` (hero title), `ContactUsScreen` (hotline/email/address/hours + **each social link opens its own URL**, which it did not before — it opened the website for all four), `CmsPageScreen` (website), `ZakatCalculatorScreen` (nisab seed), `DonateScreen` (payment methods). `ContactUsScreen`'s contact list was module-level, so it snapshotted at import time — moved inside the component so an edit is picked up on the next render.
- **Retest — PASS** (`qa/harness/settings-all.mjs`, `payment-methods.mjs`):
  ```
  editor → CMS store:                        app renders CMS state:
  PASS | hero text committed                 PASS | ContactUs renders the CMS hotline
  PASS | contact detail committed            PASS | drawer header renders the CMS hero title
  PASS | social link committed               PASS | Zakat seeds its nisab from CMS
  PASS | payment methods slice present       PASS | all 5 default methods render
  PASS | survives a dashboard reload         PASS | CMS description reaches Donate
                                             PASS | removed methods no longer offered
                                             PASS | CMS availability respected
  ```
- **A harness trap worth recording:** payment methods sit on **step 4 of a 5-step wizard**. The first version of the test loaded the Donate route and asserted directly, saw an empty list, and reported a false failure. `payment-methods.mjs` now walks الوجهة → الاختيار → المبلغ first.
- **Scope note:** `slotDurationMinutes`, `appName`, `splashText` and the brand colours remain uneditable — they were not part of the Settings page and were not added.
- **Delivery caveat:** these two halves compose only in a same-origin deployment — see **D-18**.
- **Status:** **FIXED**


---

## D-18 — Dashboard and Expo web are different origins, so CMS edits never reach the preview live

- **Requirement:** implied by §5/§9 — the demo must not imply capability it does not have.
- **Severity:** Medium · **Priority:** P2
- **Found:** round 4, while building the end-to-end test for D-17. **Pre-existing and unrelated to any fix in this branch** — it affects every CMS slice (menu, home, pages, media, consultation schemas, settings), not just the ones wired here.
- **Steps to reproduce:** edit anything in the dashboard at `localhost:5173`, save, then open the Expo web build at `localhost:8087`.
- **Expected (per the comment previously in `mobile/src/store/cms.ts`):** *"it shares the exact same localStorage key as the dashboard, so edits made in the dashboard are reflected live in the preview."*
- **Actual:** nothing is shared. `localStorage` is partitioned per **origin**, and a different port is a different origin. Proven rather than assumed:
  ```
  dashboard: http://localhost:5173   app: http://localhost:8087
  PASS | different origins (so storage is partitioned)
  PASS | app cannot see the dashboard-written CMS state — live sync is impossible cross-origin
  ```
- **Likely cause:** the comment assumed same-origin serving; the two dev servers have always run on separate ports.
- **Fix applied (documentation only):** the inaccurate comment in `mobile/src/store/cms.ts` has been replaced with an accurate one stating the partitioning and pointing at the supported path. **No behaviour was changed** — making live sync work needs both apps served from one origin, which is a deployment decision, not a code fix.
- **The supported sync path already exists** and was not built for this: dashboard → **أدوات النظام** → *تصدير الإعدادات JSON*, then import. It is also the only way to reach a real device.
- **Demo guidance:** do not promise live dashboard→app sync. Either demo the two independently, or pre-load the app's CMS state via import before the session.
- **Status:** Open — needs a deployment decision (single origin) or acceptance of the export/import flow
