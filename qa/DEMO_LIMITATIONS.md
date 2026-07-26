# Demo Limitations & Demo-Safety Audit

This project is a **presentation demo**. There is no backend, no database, no payment gateway, no email service and no authentication server. Nothing below should be read as production-ready.

## Demo-safety verdict: strong on the mobile app

### Network activity — verified clean

| Check | Result |
|---|---|
| Static scan for `fetch(` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` / `EventSource` across `mobile/src`, `dashboard/src`, `shared/src` | **zero matches** |
| `axios` dependency or import | **none** |
| Runtime: all requests during a full mobile session (boot, browse, consult, login, OTP, provider dashboard) | **zero non-localhost requests** |
| `localhost` / `127.0.0.1` hardcoded in source | **none** |
| Secrets, tokens, API keys | **none found** |

The only `http://` in the whole codebase is the SVG XML namespace inside a placeholder-image generator (`cmsDefaults.ts:200`) — not a network call.

### Payment, email, persistence claims

| Claim the app could wrongly make | Actual behaviour |
|---|---|
| Payment completed | **Never asserted.** Donation receipt statuses are typed `'قيد التأكيد' \| 'قيد المراجعة' \| 'مكتمل' \| 'فشل'` and the app only ever writes pending states. `appState.ts:6-9` documents that `'مكتمل'` can only come from a server or admin — the UI cannot produce it. |
| Consultation persisted on a server | **Correctly denied.** Confirmation screen states "نسخة عرض — حُفظ الطلب على جهازك فقط **ولم يُرسل لأي جهة**" — the "not sent anywhere" half is verified true. |
| A real verification email was sent | **Wrongly asserted — see D-06.** The OTP screen says "تم إرسال رمز التحقق إلى بريدك الإلكتروني" although no email service exists and no request is made. This is the one demo-honesty gap in the app. |
| Data saved locally | **Overstated — see D-03.** Two screens claim local saving; state is RAM-only and resets on restart. |

### Developer artefacts not leaking to users

| Token | Occurrences | User-visible? | Classification |
|---|---|---|---|
| `TODO(production)` / `TODO(backend)` | 14, all in `//` or `/* */` comments | No | **Safe** — and required: §2 asked for a future-integration marker for backend email OTP. Present at `EmailAuthScreen.tsx:20`, `OtpScreen.tsx:34`, `demoUsers.ts:97`. |
| `FIXME` | 0 | — | Safe |
| `HARDCODED` | 0 | — | Safe |
| `@ts-ignore` | 0 | — | Safe |
| `eslint-disable` | 0 | — | Safe |
| "Mock" | 2, both in comments (`FavoritesScreen.tsx:13`, `GovernorateActivityScreen.tsx:17`) | No | Safe |
| `console.log` | 0 in app source | — | Safe |
| `any` | present in `useNavigation<any>()` and a few casts | No | **Technical debt**, not a safety issue |

No screen renders any TODO/FIXME/Mock/Test-Data/developer label. Verified both by grep and by dumping rendered text from every screen visited.

### Demo disclaimers present where they matter

- Consultation confirmation — gold warning card, demo notice ✓
- Provider dashboard — gold banner at top of every tab ✓
- File-attachment field — "إرفاق ملف (**غير مفعّل في نسخة العرض**)" ✓
- Provider attachment preview — "(معاينة تجريبية)" ✓
- Consultation forms — advisory disclaimer "هذه استشارة استرشادية ولا تُغني عن التشخيص أو العلاج المتخصص" ✓
- **Email login / OTP — missing ✗ (D-06)**

### One external dependency, on the dashboard only

The admin dashboard fetches the Cairo webfont from `fonts.googleapis.com` / `fonts.gstatic.com`. No data is transmitted; it is a static asset fetch. Classified **safe**, but noted because (a) the requirement asked for a complete network inventory and (b) the dashboard will fall back to system fonts if demoed offline. The **mobile app has no such dependency** — it bundles Cairo locally.

## Functional limitations to state plainly to the client

1. **No data survives an app restart.** Login, consultation history, returning-guest identity, provider availability and booking statuses all reset. Demo each story in a single sitting.
2. **Any six-digit OTP works.** There is no code generation, delivery or verification.
3. **No email is ever sent**, despite what the OTP screen currently says.
4. **No payment is ever taken.** The donation flow ends in a pending reference number.
5. **Governorate pages are templated.** Every governorate shows the same three service categories, the same two cases and the same water-connections initiative, with only the name interpolated (`GovernorateActivityScreen.tsx:18,51` use `cases.slice(0,2)` and `serviceCategories.slice(0,3)`). Fine as a visual demo; do not present it as real per-governorate data.
6. **Impact figures are unverified.** "1.2M+ مستفيد", "+650 مبادرة", "+10,000 متطوع" and the 2013–2025 milestone timeline are hardcoded (D-07). The "22 محافظة" claim is *not* shown — the app honestly lists 12 governorates plus "وفي توسع مستمر…".
7. **The dashboard's impact-number editor does not reach the app** (D-08).
8. **Social links are placeholders** — all four point at the same URL (D-12).
9. **The provider dashboard is a mobile screen**, reachable from the drawer and profile — not a separate web portal. The separate web app at `dashboard/` is the **admin/CMS** console, a different thing.
10. **Consultation data does not flow between the two.** Requests submitted in the app land in `demoUsers`/`appState`; the provider dashboard reads a fixed three-booking seed in `providerStore`. They are unconnected stores, so a consultation submitted live will not appear in the provider's list.

## Platform coverage of this audit

| Coverage | Status |
|---|---|
| Code inspection | Complete |
| Browser testing (Expo Web, headless Chrome, 320/390/430/768 px) | Complete |
| Admin dashboard browser testing (1440×900) | Complete |
| Emulator testing | **Not performed** — Android build fails in this environment |
| Physical-device testing | **Not performed** |

Behaviours that could differ on a real device and were therefore *not* confirmed: Android hardware back button, gesture-navigation bar insets, keyboard show/hide and field obstruction, OS font scaling, `adjustsFontSizeToFit` (a no-op on web — see D-10), and native `Linking.openURL` behaviour.
