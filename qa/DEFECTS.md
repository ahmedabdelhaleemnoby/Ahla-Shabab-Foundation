# Defects — QA pass 2

> **QA pass 2 — 2026-08-01.** Verification of the bottom-navigation / email-OTP /
> governorates / provider-dashboard / guest-identity change set.
>
> **Test surfaces used:** code inspection, and **browser testing** against the
> Expo **web** build (headless Chrome 390×844, 320×700, 430×932) driven by
> puppeteer-core, asserting against React Navigation's own root state.
> **Not performed:** Android emulator testing, and real-device testing. The
> release APK was **built** but never installed or launched, so no claim is made
> about on-device behaviour.
>
> **Backend:** the app runs entirely on `@ahla/shared` mock data. A typed API
> client exists in `shared/src/api`, but **no mobile screen imports it** (0 call
> sites) and **zero external network requests** were observed across the whole
> session. Nothing here is backend-verified.


Two defects, both Low. No Critical or High defects were found.

---

**ID:** D2-01
**Title:** Raised «تبرع» button overlaps the sticky «اكفل أسرة» CTA on the Cases screen
**Requirement:** 1 — "Center donation button does not overlap content"
**Severity:** Low **Priority:** Low
**Environment:** Expo web, headless Chrome 320×700 (also visible at 390/430)
**Preconditions:** none
**Steps to reproduce:**
1. Open the app and select the «الأسر» tab.
2. Scroll so the green sticky «اكفل أسرة (3 أسر متاحة للكفالة)» CTA is showing.
3. Look at the raised circular «تبرع» button.
**Expected:** the raised button clears surrounding content.
**Actual:** the circle (`marginTop: -26` in `TabBar.tsx`) protrudes upward and
covers the lower-centre of the green CTA. The CTA's text stays readable and the
button remains tappable either side of the circle.
**Evidence:** `qa/screenshots/mobile/qa2-tabbar-320.png`
**Likely cause:** `styles.raiseWrap` lifts the button 26 px above the bar; the
sticky CTA sits directly on top of the bar with no reserved gap.
**Recommended fix:** add ~28 px bottom padding to the sticky CTA container, or
reduce the raise.
**Status:** OPEN — cosmetic; does not block the demo.

---

**ID:** D2-02
**Title:** Client walkthrough document predates this change set
**Requirement:** 24
**Severity:** Low **Priority:** Medium (it is the document used to run the demo)
**Environment:** repo
**Steps to reproduce:** `git log -1 --format=%ad -- CLIENT_DEMO_WALKTHROUGH.md`
**Expected:** describes the five-item bottom navigation, the About-screen
governorates and the provider dashboard.
**Actual:** last updated **2026-07-28**, before this change set.
**Evidence:** git metadata; 196 lines.
**Recommended fix:** refresh the navigation and governorate sections.
**Status:** OPEN.

---

## Issues found in the QA harness itself, and fixed during this pass

Reported here because they produced **false results** that would otherwise have
been published as findings. The app was not changed.

**H-01 — false FAIL and two false PASSes on OTP validation.**
*Before:* the submit-button locator matched `/متابعة|إرسال|تسجيل|التالي/` and
sorted by smallest area, which selected the screen **header** «تسجيل الدخول»
(y≈25) instead of the real «إرسال رمز التحقق» button (y≈780). Nothing was ever
clicked, so a valid email "failed" to proceed and the empty/invalid cases
"passed" for the wrong reason.
*Fix:* match the submit label exactly and take the lowest match.
*Retest:* all five cases correct — empty / no-`@` / trailing-dot rejected with
«أدخل بريداً إلكترونياً صحيحاً»; clean and spaced+uppercase both reach `Otp`.

**H-02 — false FAIL on the cancelled-bookings counter.**
*Before:* asserted the string `ملغي`. *Fix:* the app renders **`ملغاة`**.
*Retest:* PASS.

**H-03 — two false PARTIALs on the provider dashboard.**
*Before:* the dashboard is **tabbed**; the script read only the landing tab and
reported booking actions and answer fields as absent.
*Fix:* walk all four tabs before asserting.
*Retest:* actions 4/4 and answer fields 7/7 — PASS.

**H-04 — two false FAILs on identity login linking.**
*Before:* `qa/harness/package.json` sets `"type": "module"`, which loaded
`appState` as a **second module instance**, so the helper wrote to a store the
assertions never read. *Fix:* moved the test to `scripts/`, where the root
package applies. Confirmed by calling `appState.login()` directly under both
loaders. *Retest:* 16/16 PASS.
