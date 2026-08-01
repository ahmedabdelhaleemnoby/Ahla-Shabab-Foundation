# Persistence — QA pass 2

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


## Headline

**Nothing persists across a reload or restart.** The mobile app has **no**
`AsyncStorage`, `SecureStore` or MMKV dependency — every store is a plain
in-memory module (`appState`, `providerStore`, `demoUsers`). `localStorage` is
touched only to *read* CMS edits on web.

This is consistent with a demo build, and the UI is honest about it: the
consultation confirmation says «سُجِّل طلبك في النسخة التجريبية، ويمكنك تسجيل
الدخول بنفس البريد **أثناء هذه الجلسة**», and the provider dashboard header says
«التعديلات تُحفظ أثناء الجلسة الحالية فقط».

## Measured

| State | Set in session | After reload | Result |
|---|---|---|---|
| Login session | `loggedIn:true, email:"persist@ahla.test"` | `loggedIn:false, email:null` | **RESETS** |
| Consultation request | `consultations: 1` | `consultations: 0` | **RESETS** |
| Returning-guest identity (`demoUsersStore`) | in-memory `Map` | new empty `Map` | **RESETS** |
| Provider availability / booking status | in-memory | defaults | **RESETS** |
| Notification read state | in-memory | defaults | **RESETS** |

Evidence: `qa/harness/qa2-persist.mjs` — P-1…P-5.

## What this means for the demo

The same-email flow (requirements 17 and 18) works **within one continuous
session** and is fully verified there (16/16 in `scripts/qa2-identity.ts`). It
does **not** survive a page reload or an app restart.

**Demo script implication:** submit the consultation and log in with the same
email **without reloading in between**. Reloading resets the identity and the
history will be empty.

## Clearing demo data

There is no explicit "clear demo data" control. A reload or app restart is the
reset, and it is total — no residue is left in `localStorage` by the app itself.
