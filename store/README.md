# Google Play store assets

Generated 30 August 2026 from **v1.7.0 + the fixes listed below**, running against the
live API (`portfolio.27lashabab.com`). Every screenshot is a real screen with real
server data — nothing is mocked up.

## Feature graphic

`feature-graphic.png` — **1024 × 500, no alpha channel**, which is exactly what Play
requires. Uses the foundation's own logo (`mobile/assets/logo.png`), not a substitute.

## Phone screenshots

Play requires 2–8 phone screenshots, each side 320–3840 px, with the longer side no
more than twice the shorter. These are **1080 × 1920** (ratio 1.78 : 1) so they pass.

| # | File | Screen |
|---|---|---|
| 1 | `01-home.png` | Home — donate / cases / consultations entry points |
| 2 | `02-cases.png` | Urgent cases with live funding progress |
| 3 | `03-consult.png` | Consultation types and the featured consultant |
| 4 | `04-donate.png` | Donation wizard, step 1 — where the gift goes |
| 5 | `05-payment.png` | Payment methods, with the foundation's real bank details |
| 6 | `06-summary.png` | Summary — donation recorded as «قيد المراجعة» |

Captured on an Android 16 emulator at 1080 × 1920 / 420 dpi with a clean demo status
bar (09:30, full battery, no notification icons).

## What had to be fixed before these could be taken

Capturing screenshots ran the app end to end for the first time against the live API,
which surfaced problems that no local run would show:

1. **The الاستشارات tab crashed on open.** `mapConsultant` hard-coded `featured: false`,
   so `ConsultationsScreen`'s `.find((c) => c.featured)!` was always `undefined` and the
   screen died on `featured.name`. Offline the bundled data marks a consultant featured,
   so it only ever failed when the API answered — i.e. always, for a real user.
2. **Nine screens still told the user the app was a demo,** and most of those statements
   had become false as the features were built. The donation summary said «نسخة عرض — لا
   يتم تنفيذ أي عملية دفع فعلية» and the confirm button read «تأكيد التبرع (عرض)», while
   the donation was in fact being recorded on the server.

See `qa/FIX_LOG.md` for the full list, including the two demo notices that were **kept**
because they are still true.
