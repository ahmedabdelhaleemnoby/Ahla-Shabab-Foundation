# DEFECTS

**Date:** 2026-07-26 · **Commit:** `ec46501` (main) · **App:** Ahla Shabab demo (Expo mobile + Vite admin dashboard)
**Environment:** code inspection + Expo web export in browser (mobile) + `vite preview` in browser (dashboard). **No emulator or physical device.**

Severity: **Critical** (crash / data loss / core flow unusable) · **High** (requested feature missing/wrong) · **Medium** (partial behavior / nav / persistence) · **Low** (polish / wording / debt).

**No Critical defects found.** Summary: High × 1, Medium × 5, Low × 7.

---

### D-01 — Hidden 6th `Home` tab; no tab highlighted on cold launch
- **Requirement:** 1 (five-item bottom navigation)
- **Severity:** Medium · **Priority:** High
- **Environment:** mobile (Expo web export, live)
- **Preconditions:** Cold app launch.
- **Steps:** Launch app → observe Home screen and the bottom bar.
- **Expected:** Exactly 5 root tabs; the active screen's tab is highlighted.
- **Actual:** `Tab.Navigator` declares 6 screens (`App.tsx:100-105`); `Home` has no entry in `TabBar` META (`TabBar.tsx:9-13,22`), so it renders no tab and is the initial route — on launch **no tab appears active** (confirmed in live screenshot).
- **Evidence:** Home live screenshot (no active tab); `mobile/App.tsx:100`, `mobile/src/components/TabBar.tsx:22`.
- **Likely cause:** `Home` left in the tab navigator after nav overhaul instead of being a stack screen or the `Cases` tab.
- **Recommended fix:** Make one of the 5 visible tabs the initial route, or move `Home` out of the tab navigator, or give `Home` a tab entry.
- **Status:** OPEN

### D-02 — Provider "Reschedule" booking action missing
- **Requirement:** 11 (provider bookings)
- **Severity:** High · **Priority:** High
- **Environment:** mobile (`ConsultantDashboardScreen.tsx`)
- **Preconditions:** Provider dashboard → Bookings tab → open a booking.
- **Steps:** Expand a booking → view actions.
- **Expected:** Confirm, **Reschedule**, Complete, Cancel.
- **Actual:** Only Confirm / Complete / Cancel exist (`:436-458`); no Reschedule handler anywhere. The admin dashboard's own Bookings subtitle even reads "…وإعادة جدولة المواعيد", so the feature is expected.
- **Evidence:** `mobile/src/screens/ConsultantDashboardScreen.tsx:436-458`.
- **Likely cause:** Feature not implemented.
- **Recommended fix:** Add a Reschedule action (date/time picker → `updateStatus`/new slot) in demo state.
- **Status:** OPEN

### D-03 — Provider availability start/end times are read-only
- **Requirement:** 10 (provider availability)
- **Severity:** Medium · **Priority:** Medium
- **Steps:** Availability tab → try to change a day's start/end time.
- **Expected:** Start/end times editable.
- **Actual:** `startTime`/`endTime`/`slotDurationMinutes` are display-only (`:203`); no input/handler. Day toggle, add/remove slots, and blocked dates DO work.
- **Evidence:** `ConsultantDashboardScreen.tsx:203`, `providerStore.ts:162-215`.
- **Recommended fix:** Add time editors bound to `providerStore`.
- **Status:** OPEN

### D-04 — No mobile persistence, yet UI claims "saved locally / on your device"
- **Requirement:** 10, 11, 16, 18; Phase 6 (persistence)
- **Severity:** High (honesty + persistence) → treated **Medium** for demo (in-session flows work) · **Priority:** High
- **Environment:** mobile
- **Preconditions:** Any state change (login, consultation submit, provider availability/booking status).
- **Steps:** Perform action → reload/restart the app.
- **Expected:** Either state persists, or the UI does not claim it does.
- **Actual:** `@react-native-async-storage` is **not installed and never imported**; every mobile store is in-memory module state (`appState.ts`, `demoUsers.ts` `Map`, `providerStore.ts:135-138`, `cms.ts`, `notifications.ts`). **All mobile state resets on restart.** Meanwhile banners assert persistence: `ConsultantDashboardScreen.tsx:51` "…(مُحفوظة محلياً)", `ConsultationRequestScreen.tsx:143` "حُفظ الطلب على جهازك فقط".
- **Evidence:** `rg AsyncStorage mobile/src` → 0 hits; `mobile/package.json` (no async-storage dep). Contrast: the **web dashboard** persists CMS/media via `localStorage` (`dashboard/src/store/cmsPersistence.ts`).
- **Likely cause:** Persistence never wired on mobile; copy written aspirationally.
- **Recommended fix:** Either add AsyncStorage persistence, or change the copy to "لن يُحفظ بعد إغلاق التطبيق (نسخة عرض)". At minimum fix before client demo to avoid a false claim.
- **Status:** OPEN

### D-05 — Governorate detail content is generic, not per-governorate
- **Requirement:** 8 (governorate interaction)
- **Severity:** Medium · **Priority:** Medium
- **Steps:** About → tap any two different governorates → compare "حالات مستحقة".
- **Expected:** Governorate-specific cases/projects/initiatives.
- **Actual:** `GovernorateActivityScreen.tsx:18-19` `const govCases = cases.slice(0,2)` — the same 2 cases render for every governorate; the initiative title interpolates the name onto static text. Only the name changes.
- **Evidence:** `mobile/src/screens/GovernorateActivityScreen.tsx:18-19,95`; live: القاهرة detail shows generic services/cases.
- **Recommended fix:** Filter demo data by governorate, or add a tag field per case.
- **Status:** OPEN

### D-06 — OTP screen claims an email "was sent" with no demo caveat
- **Requirement:** 3 (email OTP demo)
- **Severity:** Low · **Priority:** Low
- **Actual:** `OtpScreen.tsx:58` "تم إرسال رمز التحقق إلى بريدك الإلكتروني" (past tense) while no email service exists and any 6-digit code works. `EmailAuthScreen` correctly uses future tense "سنرسل".
- **Recommended fix:** Add a small "نسخة عرض — أدخل أي رمز من 6 أرقام" hint on the OTP screen.
- **Status:** OPEN

### D-07 — Dedup/identity module has zero automated tests
- **Requirement:** 17 (same-email deduplication)
- **Severity:** Low (behavior is correct) · **Priority:** Medium (it is a gating requirement)
- **Actual:** `demoUsers.ts` (normalize/find-or-create/attach/login) has no vitest coverage; `rules.test.ts` only tests `isEmail` format. Behavior verified correct by inspection but not guarded against regression.
- **Recommended fix:** Add `shared`/mobile tests: same email + different case + surrounding spaces → one identity; login replays history without duplication.
- **Status:** OPEN

### D-08 — Tab #1 label is "الأسر" (spec: "الأسر/الحالات")
- **Requirement:** 1 · **Severity:** Low · `TabBar.tsx:9`. Fix: update label if spec requires the combined form.
- **Status:** OPEN

### D-09 — Stale layout comment in HomeScreen
- **Requirement:** 4 · **Severity:** Low · `HomeScreen.tsx:20-22` describes an old section order ("impact numbers", "quick services") that no longer exists. Fix: delete comment.
- **Status:** OPEN

### D-10 — Residual unverified impact stats on About; dead `governorates: 22`
- **Requirement:** 4 / 7 · **Severity:** Low
- **Actual:** About screen shows "1.2M+ مستفيد" and "+10,000 متطوع" (`NewsScreen.tsx:16,18,68`) — unverified numbers (removed from Home but still on About). Dead `governorates: 22` field remains in `shared/src/data.ts:65` (not rendered).
- **Recommended fix:** Confirm these numbers with the client or remove; delete the dead `22` field.
- **Status:** OPEN

### D-11 — Assorted polish / tech debt (Low)
- 55 `any` usages across source (type debt).
- Provider avatar is a generic `user` icon placeholder, not a photo (no avatar field in `ProviderProfile`).
- Long single specialized-answer value may overflow its row (`ConsultantDashboardScreen.tsx:417-419`, no `flex:1`).
- `summary` textarea has no `maxLength` (`ConsultationRequestScreen.tsx:210-215`).
- Dead conditional `ConsultantDashboardScreen.tsx:310` (`... || 'نظرة عامة') && ... === 'الحجوزات والطلبات'` reduces to one equality.
- **Status:** OPEN

### D-12 — Duplicate route names (tabs vs root stack)
- **Requirement:** general nav robustness · **Severity:** Low
- `Cases`, `UrgentCases`, `Consultations`, `About` exist both as tab screens and as root-stack screens (`App.tsx:136,137,143,139`) — navigating the root variant shows the screen without a tab bar. Works, but a latent maintenance hazard.
- **Status:** OPEN

### D-13 — Raised Donate button can overlap content above the bar
- **Requirement:** 1 / Phase 5 · **Severity:** Low-Medium
- Raised center button uses `marginTop:-26` (`TabBar.tsx:69`) and protrudes into screen content; on Home the urgent-case card sits close behind it. No absolute-offset compensation / content inset. Standard raised-tab pattern, but each tab screen must reserve bottom space. Not device-verified.
- **Recommended fix:** Add bottom padding on tab screens equal to bar height + protrusion.
- **Status:** OPEN
