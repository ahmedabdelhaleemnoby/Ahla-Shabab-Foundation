# DEMO LIMITATIONS

**Date:** 2026-07-26 · **Commit:** `ec46501`
This is a **presentation/demo build**. The items below are expected limitations of a no-backend demo, plus the honesty gaps QA found. Nothing here should be presented to the client as production-ready.

## By design (no backend) — safe, expected
| Area | Behavior in demo | Evidence |
|---|---|---|
| Networking | **Zero** real network calls — no `fetch`, `axios`, WebSocket, `localhost`, or `process.env` in mobile source. | `rg` over `mobile/src` → 0 hits |
| Auth / OTP | Email accepts any address of valid format; **any 6-digit code** logs in. No real email is sent/verified. | `OtpScreen.tsx:29-37`, `EmailAuthScreen.tsx:18-22` |
| Payments | No gateway. New donations are created as **قيد التأكيد / قيد المراجعة**, never auto-"مكتمل". Receipts are labeled demo-only. | `shared/src/rules.ts:23-24` (unit-tested), `DonationSuccessScreen.tsx:82`, `ReceiptsScreen.tsx:46` |
| Data | All content is local mock data in `@ahla/shared`; the mobile CMS renders built-in defaults. | `shared/src/data.ts`, `services.ts`, `admin.ts`; `mobile/src/store/cms.ts` |
| Secrets | None present (the only "token" hits are CSS design tokens). | `rg` audit in `qa/logs/demo-safety-search.log` |
| Future integration | Backend touch-points are marked with `TODO(backend)` / `TODO(production)` comments (17), including the email-OTP hook. Not user-visible. | `OtpScreen.tsx:34`, `EmailAuthScreen.tsx:20`, `demoUsers.ts:97`, etc. |
| Demo disclaimers | Present on donation success, receipts, consultation confirmation, provider dashboard, and dashboard CMS. | see FINAL_ACCEPTANCE_REPORT §Demo safety |

## Honesty gaps to fix before the client demo
1. **Mobile persistence claims are false.** UI says "مُحفوظة محلياً" / "حُفظ الطلب على جهازك فقط" but nothing is written to device storage (no AsyncStorage). Anything done before an app restart is lost. → **Fix copy or add persistence** (D-04).
2. **OTP screen says a code "تم إرسال" (was sent)** to the email, with no demo caveat on that screen, while no email service exists. → soften/annotate (D-06).
3. **Unverified impact numbers** ("1.2M+ مستفيد", "+10,000 متطوع") remain on the About screen. Removed from Home, but still shown. → confirm with client or remove (D-10).
4. **Governorate detail content is generic** (same cases for every governorate) — may read as misleading if the client taps two governorates during the demo. → filter by governorate or set expectations (D-05).

## Scope not covered by this QA pass (method limits)
- **No Android emulator / physical device** was available. Therefore: on-device Android behavior, hardware-back, gesture nav bar, safe-area on real notches, keyboard obstruction, and font-scaling were **not** verified at runtime. Mobile UI was verified via **Expo web export** at 375px only.
- **Screen widths 320px / 430px / tablet** were not runtime-tested (only 375px live + code inspection of layout constraints).
- Existing `qa/device/*.png` and `qa/flows/*.mp4` are from an **earlier** pass and were not produced or re-validated here.
- The provider dashboard (mobile `ConsultantDashboardScreen`) was verified by **code inspection**, not live render, in this pass.

## Known feature gaps (demo incomplete vs. requested)
- Provider **Reschedule** action missing (D-02).
- Provider availability **start/end time editing** missing (D-03).
- Dedup/identity logic has **no automated tests** (D-07).
- Hidden 6th `Home` tab → no active tab on cold launch (D-01).
