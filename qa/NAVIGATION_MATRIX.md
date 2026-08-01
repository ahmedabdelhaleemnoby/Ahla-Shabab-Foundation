# Navigation matrix — QA pass 2

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


Destinations are read from React Navigation's root state after each action, so a
row passes only if the app really is on that route.

## Bottom tabs (verified at 320, 390 and 430)

| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| any root | tap «الأسر» | `Cases` | `Cases` | PASS |
| any root | tap «الحالات العاجلة» | `UrgentCases` | `UrgentCases` | PASS |
| any root | tap «تبرع» | `Donate` | `Donate` | PASS |
| any root | tap «الاستشارات» | `Consultations` | `Consultations` | PASS |
| any root | tap «اعرف عنا» | `About` (renders `NewsScreen`) | `About` | PASS |

## Tab-bar visibility

| Screen | Expected | Actual | Status |
|---|---|---|---|
| `Cases` (root) | visible | visible, `top:632 bottom:700` at 320×700 | PASS |
| `CaseDetail` | hidden | `height:0`, not visible | PASS |
| `ConsultationRequest` | hidden | `height:0`, not visible | PASS |
| `EmailAuth` | hidden | `height:0`, not visible | PASS |

## Content and CTAs

| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| Home | «تبرع الآن» / «حالات التبرع» | donation flow | present and wired to `Donate` / `Cases` | PASS |
| Home | «احجز استشارة» | `Consultations` | wired | PASS |
| Home | «تعرف على الاستشارات» | `ServicesBrowse` | wired | PASS |
| About | tap «📍 القاهرة» | `GovernorateActivity` | `GovernorateActivity`, 920 chars | PASS |
| EmailAuth | «إرسال رمز التحقق» (valid) | `Otp` | `Otp` | PASS |
| EmailAuth | «إرسال رمز التحقق» (invalid) | stay + error | stayed, «أدخل بريداً إلكترونياً صحيحاً» | PASS |
| ConsultationRequest | «إرسال الطلب» (complete) | confirmation | «تم استلام الطلب بنجاح» + ref `AS-999534` | PASS |
| ConsultationRequest | «إرسال الطلب» (incomplete) | blocked | blocked — required selects/consent unmet | PASS |
| Provider dashboard | 4 tab chips | switch tab | all four switch | PASS |

## Guest gate

| Screen | Expected | Actual | Status |
|---|---|---|---|
| DonationHistory / Receipts / MyBookings / AccountSettings / Favorites / Notifications | friendly gate + login CTA | all six gated with a benefit explanation | PASS |
| Cases / UrgentCases / Sponsorship / Projects / NewsFeed / ServicesBrowse / Consultations | open to guests | all seven open | PASS |

**Dead buttons found: none, within the set exercised.** Not every control across
all 42 screens was pressed — see requirement 23 (PARTIAL).
