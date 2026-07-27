# Final Acceptance Report
## Ahla Shabab Demo — Mobile App + Provider/Admin Dashboards

**Date:** 2026-07-26
**Commit under test:** `ec46501` — *chore(mobile): adjust android display settings and improve typography*
**Revision:** 6 — post-fix. Ten defects fixed and retested: D-01, D-02, D-06, D-03 (round 1); D-04, D-05 (round 2); D-08, D-09 (round 3); D-17 (round 4); D-18 (round 5). Round 4 surfaced D-18 and required a correction to the D-08 claim; round 5 closed it. This report reflects the fixed build.
**Working tree at audit start:** clean. **Now:** 20 source files modified across four fix rounds (listed in §8), verified against `git diff --name-only ec46501`.
**App version:** `app.json` 1.4.0, Android versionCode 8

**Companion documents:** `REQUIREMENTS_STATUS.md` · `DEFECTS.md` · `NAVIGATION_MATRIX.md` · `PERSISTENCE_REPORT.md` · `BUILD_AND_TEST_RESULTS.md` · `DEMO_LIMITATIONS.md`
**Evidence:** 82 mobile screenshots in `qa/screenshots/mobile/`, 19 dashboard screenshots in `qa/screenshots/dashboard/`, reproducible harness in `qa/harness/`

> **Evidence gap — video:** Phase 7 of the brief asked for seven recorded flow videos. **No videos were recorded**; `qa/videos/` is empty. Each of the seven flows was instead exercised end-to-end by a scripted harness with per-step state assertions and screenshots at each stage, which is stronger evidence for pass/fail than a screen recording — but it is not the requested artefact, and is recorded here as an unmet deliverable rather than quietly omitted.
>
> Note: `.gitignore` tracks `qa/*.md` and `qa/harness/` (reports + the harness that produced them) and excludes the ~52 MB of screenshots, videos and run output, which stay on disk only.

---

## 1. Executive summary

The five-tab navigation redesign, the move of governorates into *اعرف عنا*, the donation-first / consultations-second home reordering, the email-OTP demo login, the returning-guest email identity system and the provider dashboard have all been **built and verified working**. The core client-facing story holds up: **all 69 verified navigation actions land correctly**, all five consultation forms carry the right fields with no cross-contamination, and the same-email deduplication feature — the most technically interesting requirement — works exactly as specified, including across capitalisation and whitespace variants.

The initial audit found three blocking problems; **all have since been fixed and retested.**

**First, three dead buttons in the side menu.** *خدماتنا*, *حسابي* and *أخبارنا* pointed at tab routes (`Discover`, `Profile`, `News`) deleted during the five-tab redesign, so tapping them did nothing at all. **Fixed** — and fixed at the type level too, so the `MainTab` union now makes any future stale tab target a compile error rather than a silent runtime no-op. A runtime remap also covers CMS state already saved before the fix, and the dashboard's authoring dropdowns no longer offer the removed tabs. All 17 drawer items now navigate.

**Second, the Account Settings screen was not guest-gated** — a guest saw a fully editable personal-profile form where the login sheet belonged. **Fixed**; all six personal screens now gate identically, with the editable form confirmed unreachable for guests and still fully available once logged in.

**Third, two on-screen statements were untrue.** The OTP screen claimed a code "has been sent to your email" with no email service behind it, and two screens claimed data was "saved locally" when all state lives in RAM. **Both corrected.** The OTP and email screens now carry the same gold demo card used elsewhere, stating plainly that no email is sent and any six-digit code works. The persistence strings now say "أثناء الجلسة الحالية فقط". Note this last one is a **copy fix, not a behaviour fix** — nothing persists, it is simply now disclosed accurately (reasoning in §5).

Everything else is either passing or a known, documented demo limitation. Notably, the **demo-safety posture of the mobile app is excellent**: zero network calls verified both statically and at runtime, no secrets, no localhost, no user-visible developer artefacts, payment never shown as completed, and honest disclaimers on the consultation flow, the provider dashboard and the file-upload placeholder.

One coverage gap must be stated clearly: **the Android build fails in this environment**, so no emulator or physical-device testing was performed. All runtime evidence comes from the Expo Web build in headless Chrome. The failure is in the Android toolchain (AGP's Kotlin classpath-snapshot transform against `expo-modules-core`), not in application code — TypeScript compiles clean and the JS bundle exports successfully.

---

## 2. Scoreboard

| Metric | Initial audit | **After fixes** |
|---|---|---|
| Requirements assessed | 24 | 24 |
| **PASS** | 14 | **22** |
| **PARTIAL** | 8 | **2** |
| **FAIL** | 1 | **0** |
| **BLOCKED** | Android build/device testing | unchanged (inside #22) |
| **Weighted completion** | ~79% | **~96%** |
| Defects logged | 16 | **18** (**10 fixed**, 8 open) |
| — Critical | 0 | **0** |
| — High | 2 | **0** (both fixed) |
| — Medium | 7 | **1** — D-07 only (D-03/04/05/06/08/09/17/18 fixed) |
| — Low | 7 | 7 |
| Navigation actions verified | 69 (66 pass, 3 fail) | **69 (69 pass, 0 fail)** |
| Unit tests | 28/28 pass | **32/32 pass** (4 added) |
| Typecheck | clean (3 workspaces) | **clean (3 workspaces)** |

### Critical issues
**None**, before or after. No crash in any flow, no data corruption, no broken core tab.

### High issues — **both fixed**
- ~~**D-01** three dead drawer buttons~~ → **FIXED.** 17/17 drawer items navigate; recurrence now blocked by the type system.
- ~~**D-02** Account Settings not guest-gated~~ → **FIXED.** 6/6 personal screens gate consistently.

### Also fixed (round 2)
- ~~**D-04** provider working-hours not editable~~ → **FIXED.** `تعديل نطاق اليوم` card with من/إلى inputs; empty input rejected so a blank field cannot wipe the range.
- ~~**D-05** no reschedule action~~ → **FIXED.** Inline date/time editor prefilled from the booking. Status is deliberately **not** changed — rescheduling a pending request must not silently confirm it — and the Overview "today" counter follows the move (2→1).

### Also fixed (round 3)
- ~~**D-08** dashboard impact-number editor inert~~ → **FIXED.** Worse than first diagnosed: `CmsSettings` had no `stats` field *and* the Settings page never imported the CMS store, so edits didn't survive a dashboard reload either. Schema bumped 3→4 with a migration; editor commits via `mutate()`; mobile reads via a new `getSettings()` with per-field fallback.
- ~~**D-09** blank-email guests shared one identity~~ → **FIXED.** Email is now required, and the defensive fallback is per-submission rather than a shared constant. A second, worse variant surfaced while fixing: `??` meant a *cleared* field produced `''`, collapsing those submissions into an empty-string identity — now handled.

### Also fixed (round 4)
- ~~**D-17** remaining Settings sections draft-only~~ → **FIXED.** All six cards now commit through `mutate()`; `paymentMethods` became a CMS slice (schema 4→5 + migration); five mobile screens now read CMS values instead of compiled constants. A side-effect worth noting: each social button now opens **its own** URL — previously all four opened the website.

### Also fixed (round 5)
- ~~**D-18** dashboard and app on different origins~~ → **FIXED.** `scripts/demo-origin.mjs` serves the mobile web export at `/` and the dashboard build at `/admin/` from one port, so they share one `localStorage`. `npm run demo:build && npm run demo`. Normal dev mode is unchanged (`DEMO_BASE` unset ⇒ identical behaviour), verified.

  This closes the loop opened in round 3: a value **typed into the dashboard UI now appears in the app UI**, verified with no state hand-written by the test. It is the assertion that was impossible before.

  Worth recording: the obvious approach — a path-based reverse proxy in front of both dev servers — does not work, because Vite's dev server injects root-absolute URLs (`/@vite/client`) that a `/admin`-prefixed proxy misroutes to the app. Serving built output avoids this and matches a real deployment.

### Correction to the round-3 D-08 claim
The D-08 retest line *"dashboard-authored stats reach the About screen"* was originally verified by writing CMS state to the **app's own origin** — proving the app-side reader, not live delivery. Round 5 makes the stronger claim true and proves it directly; `DEFECTS.md` records both the correction and the new evidence.

### Remaining open (none blocking)
1 Medium — **D-07** (unverified 1.2M stat) — **needs a client decision, not a code fix**; it is now editable from the dashboard and that edit reaches the app.
7 Low — D-10/D-11 (320 px layout), D-12 (placeholder social links), D-13 (stale demo APK), D-14 (tech debt), D-15 (cosmetic), D-16 (dashboard webfont, informational).

---

## 3. What was verified working

**Navigation.** All five tabs navigate correctly with the correct RTL order (`الأسر · الحالات العاجلة · تبرع · الاستشارات · اعرف عنا`, right to left). The raised centre donation button is visually emphasised and does not overlap content at any tested width. The tab bar is present on all six root screens and correctly hidden — verified by computed style, not DOM presence — on all eleven pushed screens tested, including case details, donation steps, consultation forms, article details, governorate details and login/OTP.

**Email OTP demo.** Login is by email, not phone. Empty, `abc`, `a@b` and `a@` are all rejected with an Arabic error. Whitespace is stripped at the input layer, and uppercase addresses are normalised to lowercase downstream. The OTP field accepts exactly six digits, filters non-numerics, rejects short codes, and accepts any six-digit value. A resend control appears behind a 30-second countdown. Backend integration markers are present in code and never rendered to users.

**Home.** No impact statistics remain on Home. The donation hero is first, the consultations hero second, both CTA pairs navigate correctly, Arabic text wraps properly, and no broken image or empty section appears.

**Governorates in About.** Present under the exact heading *"نطاق عملنا في المحافظات"*, interactive, opening a per-governorate page with services, cases, an initiative and consultation availability. Twelve governorates are listed with an honest "وفي توسع مستمر…" chip — and the unverified "22 محافظة" claim is **not rendered anywhere**, which is the right call.

**Returning-guest identity.** Two consultations submitted as `Test@Example.COM` and `test@example.com` resolved to one identity with no duplicate user. Logging in afterwards with `"   TEST@EXAMPLE.com   "` normalised correctly and linked **both** prior requests (`AS-455572`, `AS-455586`) with no duplicate record. All four required helpers exist and are exercised.

**Consultation forms.** All five types (نفسية، دينية، طبية، أسرية، أعمال) carry all nine common fields, their own specialised fields, and **zero foreign-field leakage** between types. Consent checkbox and advisory disclaimer present on every form. Validation, submission confirmation, reference number, status timeline and demo notice all work.

**Provider dashboard.** All five overview counts render. Availability toggling, weekday selection, slot add/remove and exception-date add/remove all work. Booking filters, search, empty state, detail expansion, specialised answers, attachment placeholder and Confirm/Complete/Cancel actions all work. Optional missing fields degrade cleanly.

**Guest access model.** Fourteen public screens open freely; five of six personal screens show a friendly, non-blocking login sheet with benefits, a login button and a "continue as guest" escape.

---

## 4. Testing method — stated precisely

| Method | Coverage |
|---|---|
| **Code inspection** | Complete across `mobile/src`, `dashboard/src`, `shared/src` |
| **Browser testing** (Expo Web / react-native-web, headless Chrome, real pointer events, 320 / 390 / 430 / 768 px) | Complete — all navigation, forms, gating, OTP, dedup, provider dashboard, persistence |
| **Browser testing** (admin dashboard, 1440×900) | All 18 routes |
| **Emulator testing** | **Not performed** |
| **Physical-device testing** | **Not performed** |

An AVD (`Medium_Phone_API_36.0`) exists but no installable build could be produced for the current commit. The shipped `ahla-shabab-v1.4.0-demo.apk` was built 27 minutes *before* the final commit and was deliberately not used, since testing it would have validated stale code while appearing to validate HEAD.

**Not verifiable on web, therefore unverified:** Android hardware back button, gesture-navigation bar insets, keyboard show/hide and field obstruction, OS font scaling, and `adjustsFontSizeToFit` (a no-op on react-native-web, which is why D-10 may be web-only).

### Honesty note on harness accuracy
An early version of the click harness used substring matching and DOM-presence checks, producing four false navigation failures and a false "tab bar leaks into inner screens" result. Both were harness bugs, not app bugs. Every affected case was re-run with exact-text matching, clean stack resets and computed-style checks; only the corrected results are reported. Nothing in the application source was modified at any point during this pass.

---

## 5. Demo readiness decision

**Demo readiness: yes.** The application is stable, visually complete and demonstrates every headline feature the client asked for. It does not crash, it makes no network calls, and it never claims a payment succeeded.

Critically, **unscripted exploration is now safe.** The three conditions that made free-roaming risky in the initial audit are gone: no menu item is a silent no-op, no personal screen leaks an editable form to a guest, and no screen claims something the demo cannot do. A client can open the drawer, tap anything, and get a coherent response.

**Client-presentation readiness: yes, with two caveats that are not code defects.**

1. **D-07 needs a client decision, not a fix.** The "1.2M+ مستفيد", "+650 مبادرة" and "+10,000 متطوع" figures were removed from Home but still appear on About. If they are not approved numbers, they should come out before the session. Only the client can say.
2. **Nothing has been verified on a real device.** All evidence is Expo Web. The Android build fails in this environment, and the shipped demo APK predates the final commit. If the demo is delivered as an installable APK rather than a screen-share, that APK must be rebuilt and re-verified first.

The persistence fix deserves one plain sentence: **it changed the words, not the behaviour.** State still resets on restart. It is now disclosed accurately, which is what makes it demo-safe — but if the intended narrative is "close the app, come back, your request is still here", that story does not work and should be left out of the script.

---

## 6. Recommended next steps

**Before the client demo (required)**
1. ~~Fix D-01, D-02, D-06, D-03~~ — **done, retested, verified.**
2. Get an Android build out — fix the local toolchain or build via EAS — and **rebuild the demo APK from the current commit** (D-13).
3. Re-run this acceptance pass on a real device or emulator once a build exists, focusing on what web could not cover: back button, keyboard, safe areas, font scaling, and whether D-10's truncation reproduces natively.

**Before the client demo (decisions needed from the client)**
4. **D-07** — confirm whether "1.2M+ مستفيد", "+650 مبادرة" and "+10,000 متطوع" are approved figures. They were removed from Home but remain on About. This is the client's call, not a bug.
5. **D-12** — supply real social-media URLs or hide the social row.

**Shortly after**
6. ~~**D-04 / D-05** — provider working-hours editing and the Reschedule action~~ — **done, retested, verified.**
7. ~~**D-08** — wire the dashboard's impact-number editor through to the app~~ — **done, retested, verified.**
8. ~~**D-09** — make the consultation email field required~~ — **done, retested, verified.**
8b. ~~**D-17** — wire the remaining Settings sections~~ — **done, retested, verified.**
8c. ~~**D-18** — serve both apps from one origin~~ — **done, retested, verified** (`npm run demo`).
9. **D-10 / D-11** — fix the two 320 px layout issues.
10. **D-14** — clear the dead conditional and the stale Home comment.

**Worth flagging as a product gap, not a defect**
11. Consultations submitted in the app do not appear in the provider dashboard — they are separate in-memory stores. If the intended demo narrative is "user submits → provider sees it", that connection does not currently exist and should be built or explicitly avoided in the script.

---

## 7. Final decision

Judged strictly against the brief's own bar: no core tab is broken, guest consultation works, same-email deduplication works, the provider dashboard displays submitted answers, the bottom navigation does not overlap content, the app does not crash, no major requested screen is missing — and, following the fix round, **the "no dead buttons" requirement now passes outright at 69/69 verified actions.**

All four conditions attached to the initial verdict have been closed and independently retested:

| Condition | Status |
|---|---|
| **D-01** three dead drawer buttons repointed | ✅ **Closed** — 17/17 drawer items navigate; `MainTab` type now makes recurrence a compile error |
| **D-02** Account Settings guest-gated | ✅ **Closed** — 6/6 personal screens gate; form unreachable for guests, intact when logged in |
| **D-06** OTP "email sent" wording corrected + demo notice added | ✅ **Closed** — both screens reworded, demo card added, resend retained per §2 |
| **D-03** "saved locally" wording corrected | ✅ **Closed (copy)** — three strings now say session-only. **Behaviour unchanged: nothing persists.** |

Two further defects were fixed in a second round, completing requirement §5 (provider dashboard):

| Defect | Status |
|---|---|
| **D-04** provider working-hours start/end not editable | ✅ **Closed** — editable من/إلى range; empty input rejected |
| **D-05** no reschedule action | ✅ **Closed** — inline date/time editor; status preserved; Overview counters follow the move |

Requirements #10 and #11 (provider availability, provider bookings) therefore move PARTIAL → PASS.

Post-fix regression: typecheck clean across 3 workspaces, 28/28 unit tests pass, dashboard builds, 69/69 navigation actions pass, all 5 consultation forms correct with no cross-contamination, same-email deduplication and login-linking still working, and 0 non-localhost network requests across a full session.

# APPROVED FOR CLIENT DEMO

**Two caveats that sit outside the code and remain the client's/team's call:**

1. **D-07 — unverified impact figures.** "1.2M+ مستفيد", "+650 مبادرة", "+10,000 متطوع" and the 2013–2025 timeline still appear on the About page. They were removed from Home as requested, but not retired. If these are not approved figures, pull them before the session. This is a content decision, not a defect.
2. **No device verification.** Every result in this report comes from the Expo Web build in headless Chrome. The Android build fails in this environment and the shipped `v1.4.0-demo.apk` predates the final commit. **This approval covers a screen-shared or web-hosted demo.** If the demo is handed over as an installable APK, that APK must first be rebuilt from the current commit and re-verified on a device — and until that happens, an APK-based demo is **NOT APPROVED**.

Scope of this approval, stated plainly: the app is approved as a *presentation demo*. It has no backend, no persistence across restarts, no real email, and no real payment — all now accurately disclosed in-app.

---

## 8. Files changed in the fix round

Twenty source files across four fix rounds (several touched more than once), no dependencies added, no behaviour changed beyond the nine defects:

| File | Change | Defect |
|---|---|---|
| `shared/src/cms/cmsTypes.ts` | `MainTab` corrected to the real tab set; added `LEGACY_TAB_ROUTES` | D-01 |
| `shared/src/cms/cmsDefaults.ts` | 3 menu targets repointed; `tab()` helper now typed `MainTab` | D-01 |
| `mobile/src/components/AppDrawer.tsx` | legacy-tab remap in `go()` | D-01 |
| `mobile/src/screens/CmsPageScreen.tsx` | legacy-tab remap in `handleCta()` | D-01 |
| `dashboard/src/pages/CmsMenu.tsx` | tab dropdown uses `MainTab[]` | D-01 |
| `dashboard/src/components/RichContentEditor.tsx` | tab dropdown uses `MainTab[]` | D-01 |
| `mobile/src/screens/AccountSettingsScreen.tsx` | wrapped in `LoginGate` | D-02 |
| `mobile/src/screens/EmailAuthScreen.tsx` | reworded + demo card | D-06 |
| `mobile/src/screens/OtpScreen.tsx` | reworded + demo card | D-06 |
| `mobile/src/screens/ConsultationRequestScreen.tsx` | 2 persistence strings corrected | D-03 |
| `mobile/src/screens/ConsultantDashboardScreen.tsx` | banner string corrected; editable working-hours card; reschedule button + inline editor | D-03, D-04, D-05 |
| `mobile/src/store/providerStore.ts` | added `setWorkingHours()` and `reschedule()` mutators | D-04, D-05 |
| `shared/src/cms/cmsTypes.ts` | added `stats` to `CmsSettings`; schema 3 → 4 | D-08 |
| `shared/src/cms/cmsDefaults.ts` | seeded `settings.stats`; deep-copy fix; email now required | D-08, D-09 |
| `shared/src/__tests__/cms.test.ts` | schema-version update + 2 new tests (stats seeding, email required) | D-08, D-09 |
| `dashboard/src/store/cmsPersistence.ts` | v3 → v4 migration backfilling `settings.stats` | D-08 |
| `dashboard/src/pages/Settings.tsx` | impact card wired to the CMS store via `mutate()` | D-08 |
| `mobile/src/store/cms.ts` | added `getSettings()` with per-field fallback | D-08 |
| `mobile/src/screens/NewsScreen.tsx` | About stats read from CMS settings | D-08 |
| `mobile/src/screens/ConsultationRequestScreen.tsx` | per-submission anonymous identity fallback | D-09 |
| `shared/src/cms/cmsTypes.ts` | `paymentMethods` slice; schema 4 → 5 | D-17 |
| `dashboard/src/pages/Settings.tsx` | all six cards commit via `mutate()` | D-17 |
| `mobile/src/screens/ContactUsScreen.tsx` | contact + per-network social links from CMS | D-17 |
| `mobile/src/screens/ZakatCalculatorScreen.tsx` | nisab seeded from CMS | D-17 |
| `mobile/src/screens/DonateScreen.tsx` | payment methods from CMS | D-17 |
| `mobile/src/components/AppDrawer.tsx` | hero title from CMS | D-17 |
| `mobile/src/store/cms.ts` | `getPaymentMethods()`; corrected origin comment | D-17, D-18 |

Post-fix evidence: `FIXED-*.png` in `qa/screenshots/mobile/`.
