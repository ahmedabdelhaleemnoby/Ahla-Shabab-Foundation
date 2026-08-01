# Demo limitations — QA pass 2

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


What a viewer must not be told is production behaviour.

| Area | Limitation |
|---|---|
| Backend | None used. A typed API client exists (`shared/src/api`) but **no screen imports it** and **zero external requests** were observed. All content is `@ahla/shared` mock data. |
| Email OTP | No email is sent. The screen says so: «نسخة عرض — لم يُرسل أي بريد إلكتروني. أدخل أي رمز مكوّن من 6 أرقام». Any six-digit code is accepted. |
| Payments | No gateway. A donation is never marked «مكتمل» by the app — only «قيد التأكيد» or «قيد المراجعة». |
| Persistence | Nothing survives a reload or restart. See `PERSISTENCE_REPORT.md`. |
| Consultation requests | Stored in memory for the session only. The confirmation says so explicitly. |
| Provider dashboard | In-app demo portal. Edits last for the session; the header states this. |
| Social links | All four point at `https://ahlashabab.com` — placeholders, not real profiles. |
| Impact figures | «+650 مبادرة» / «+10,000 متطوع» on the About screen remain **client-unapproved** (QA D-07 from pass 1). |
| Device coverage | **Browser only.** No emulator run and no physical-device run. The release APK was built but never installed or launched. |
