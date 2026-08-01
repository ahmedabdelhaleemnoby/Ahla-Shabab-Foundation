# Requirement status — QA pass 2

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


| # | Requirement | Status | Evidence | Remaining issue | Action |
|---|---|---|---|---|---|
| 1 | Five-item bottom navigation | **PASS** | `qa2-nav.mjs` 39/39 at 320/390/430. Exactly 5 labels; `Home` is registered but renders `null` in `TabBar`. | — | none |
| 2 | Bottom bar hidden on inner screens | **PASS** | Hidden on `CaseDetail`, `ConsultationRequest`, `EmailAuth` — verified by computed style + bounding rect (`height:0`), not DOM presence | Not every pushed screen was enumerated | spot-check remaining pushes |
| 3 | Email OTP demo | **PASS** | `qa2-flows.mjs` OTP-1…OTP-9. Empty / no-`@` / trailing-dot rejected with «أدخل بريداً إلكترونياً صحيحاً»; clean and `"  Guest@Ahla.TEST  "` both proceed; input `maxLength:6`, `inputMode:numeric`; resend present | — | none |
| 4 | Home statistics removed | **PASS** | Runtime Home text contains no `1.2M` and no «مستفيد» | — | none |
| 5 | Donation first | **PASS** | Home section 1 = «ساهم في دعم الأسر الكريمة» + «تبرع الآن» | — | none |
| 6 | Consultations second | **PASS** | Home section 2 = «خدمة الاستشارات المجانية» + «احجز استشارة» | — | none |
| 7 | Governorates moved to About | **PASS** | «نطاق عملنا في المحافظات» present on About; no governorate chips on Home | — | none |
| 8 | Governorate interaction | **PASS** | Tapped «📍 القاهرة» → route `GovernorateActivity`, 920 chars of content | Empty-governorate state not exercised | add a fixture with no activity |
| 9 | Provider dashboard | **PASS** | 4 tabs: نظرة عامة / مواعيدي والأنصبة / الحجوزات والطلبات / الملف الشخصي. Overview counters 2 / 2 / 1 / 1 / 0 | — | none |
| 10 | Provider availability | **PASS** | Accepting toggle, 7 weekday chips, «تعديل نطاق اليوم» من/إلى/حفظ, slot list + «إضافة موعد», «تواريخ الاستثناءات» + «إضافة استثناء» | Changes were not asserted to survive a tab switch | — |
| 11 | Provider bookings | **PASS** | Filters الكل/جديد/مؤكد/مكتمل/ملغي; actions تأكيد, إعادة جدولة, إكمال, إلغاء | — | none |
| 12 | Provider form answers | **PASS** | «📋 بيانات نموذج المتقدم المرفوع» — 7/7 fields incl. رقم المرجعية, البريد, الهاتف, واتساب, العمر, المحافظة, وسيلة التواصل, «إجابات النموذج المتخصص», «مرفق الحالة» | — | none |
| 13 | Guest public browsing | **PASS** | 7 screens open ungated: Cases, UrgentCases, Sponsorship, Projects, NewsFeed, ServicesBrowse, Consultations | — | none |
| 14 | Guest personal-history restrictions | **PASS** | 6 screens gated: DonationHistory, Receipts, MyBookings, AccountSettings, Favorites, Notifications | — | none |
| 15 | Friendly login gate | **PASS** | Each gate explains the benefit («تبرعاتك في حسابك», «حجوزاتك في حسابك», …) and offers login | — | none |
| 16 | Guest consultation submission | **PASS** | Full 11-field نفسية form submitted end-to-end → «تم استلام الطلب بنجاح», ref `AS-999534`, status ladder جديد → قيد المراجعة | — | none |
| 17 | Same-email deduplication | **PASS** | `qa2-identity.ts` 16/16. `  Guest@Ahla.TEST ` and `guest@ahla.test` resolve to one user; 2 consultations, 1 identity; repeat reference does not duplicate | — | none |
| 18 | Login links prior requests | **PASS** | After `loginDemoUserByEmail`, session email normalised and prior requests visible (0 → 2); logging in twice does not duplicate | — | none |
| 19 | RTL | **PASS** | Tab order right→left is الأسر ‹ الحالات العاجلة ‹ تبرع ‹ الاستشارات ‹ اعرف عنا at all three widths; `flexDirection: row-reverse` | — | none |
| 20 | Responsive behaviour | **PARTIAL** | Verified at 320 / 390 / 430. Labels stay single-line via width-aware sizing | **Tablet width, keyboard-open state, and font scaling were not tested** | test if these matter for the demo |
| 21 | Demo safety | **PASS** | 0 external network requests observed; 0 user-visible TODO/FIXME/Mock; 10 TODOs all in code comments as `TODO(backend)`/`TODO(production)` | — | none |
| 22 | Build success | **PASS** | typecheck, 32 unit tests, web export, Android release APK all succeed | — | none |
| 23 | No dead buttons | **PARTIAL** | All 5 tabs, Home CTAs, governorate chips, gate CTAs, provider tabs and consultation submit verified live | **Not every button in all 42 screens was exercised** | full sweep if required |
| 24 | Client walkthrough document | **PASS** | `CLIENT_DEMO_WALKTHROUGH.md`, 224 lines | — | none — refreshed 2026-08-01 (D2-02) |

**Totals — 22 PASS · 2 PARTIAL · 0 FAIL · 0 BLOCKED.**

Both Low defects (D2-01, D2-02) were fixed and retested on 2026-08-01; see
`DEFECTS.md`. The two PARTIALs are unchanged — they are coverage gaps in this
pass, not defects.
