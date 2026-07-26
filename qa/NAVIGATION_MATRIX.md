# Navigation Regression Matrix

**Method:** real mouse press sequences (`move → down → 110 ms → up`) in headless Chrome against the Expo Web build. Destination read from React Navigation's own root state (`__nav.getRootState()`), not inferred from pixels. Stack reset to a clean `Main` before each row so that stale hidden screens cannot produce false positives.

`Main/X` = tab X inside the tab navigator. Bare name = screen pushed onto the root stack.

## Harness-accuracy note

An earlier, weaker version of this harness matched elements by *substring*, which produced four false FAILs on Home ("تبرع" matching inside "تبرع الآن", etc.) and a false "tab bar leaks into inner screens" result (DOM presence of a `display:none` element). Both were harness artefacts. Every row below was re-run with exact-text matching and a clean stack, and the corrected results are what is reported. This is called out so the numbers are not mistaken for a flaky app.

---

## 1. Bottom tab bar — 5/5 PASS

| Source | Action | Expected | Actual | Tab bar visible | Status |
|---|---|---|---|---|---|
| TabBar | tap **الأسر** | Main/Cases | Main/Cases | yes | PASS |
| TabBar | tap **الحالات العاجلة** | Main/UrgentCases | Main/UrgentCases | yes | PASS |
| TabBar | tap **تبرع** (raised centre) | Main/Donate | Main/Donate | yes | PASS |
| TabBar | tap **الاستشارات** | Main/Consultations | Main/Consultations | yes | PASS |
| TabBar | tap **اعرف عنا** | Main/About | Main/About | yes | PASS |

RTL order confirmed identical on all six root screens, right → left:
`[الأسر] [الحالات العاجلة] [تبرع] [الاستشارات] [اعرف عنا]`

## 2. Home CTAs — 7/7 PASS

| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| Home | **تبرع الآن** | Main/Donate | Main/Donate | PASS |
| Home | **حالات التبرع** | Main/Cases | Main/Cases | PASS |
| Home | **احجز استشارة** | Main/Consultations | Main/Consultations | PASS |
| Home | **تعرف على الاستشارات** | ServicesBrowse | ServicesBrowse | PASS |
| Home | **اكفل أسرة شهرياً** | Sponsorship | Sponsorship | PASS |
| Home | **تبرع للحالة** (urgent case card) | CaseDetail | CaseDetail | PASS |
| Home | **دعم المشروع** (featured project) | ProjectDetail | ProjectDetail | PASS |

## 3. About / governorates — 4/4 PASS

| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| About | **تواصل معنا** | ContactUs | ContactUs | PASS |
| About | **انضم متطوعاً** | Volunteer | Volunteer | PASS |
| About | governorate chip **📍 أسوان** | GovernorateActivity | GovernorateActivity | PASS |
| About | governorate chip **📍 القاهرة** | GovernorateActivity | GovernorateActivity | PASS |

## 4. Side drawer — **17/17 PASS** (was 14/17 with 3 FAIL; D-01 fixed and retested)

| Source | Action | Declared target | Actual | Status |
|---|---|---|---|---|
| Drawer | الرئيسية | tab Home | Main/Home | PASS |
| Drawer | حالات عاجلة | route UrgentCases | Main/UrgentCases | PASS |
| Drawer | اكفل أسرة | route Sponsorship | Sponsorship | PASS |
| Drawer | المشروعات | route Projects | Projects | PASS |
| Drawer | خدماتنا | `route('ServicesBrowse')` *(was `tab('Discover')`)* | ServicesBrowse | **PASS** ✅*fixed* |
| Drawer | الاستشارات | route Consultations | Main/Consultations | PASS |
| Drawer | طرق التبرع | tab Donate | Main/Donate | PASS |
| Drawer | حسابي | `route('AccountSettings')` *(was `tab('Profile')`)* | AccountSettings | **PASS** ✅*fixed* |
| Drawer | الإشعارات | route Notifications | Notifications | PASS |
| Drawer | حاسبة الزكاة | route ZakatCalculator | ZakatCalculator | PASS |
| Drawer | عن الجمعية | route About | Main/About | PASS |
| Drawer | أخبارنا | `route('NewsFeed')` *(was `tab('News')`)* | NewsFeed | **PASS** ✅*fixed* |
| Drawer | انضم متطوعاً | route Volunteer | Volunteer | PASS |
| Drawer | تواصل معنا | route ContactUs | ContactUs | PASS |
| Drawer | الأسئلة الشائعة | route Faq | Faq | PASS |
| Drawer | سياسة الخصوصية | route PrivacyPolicy | PrivacyPolicy | PASS |
| Drawer | لوحة مقدم الاستشارة | route ConsultantDashboard | ConsultantDashboard | PASS |

## 5. Auth flow — PASS

| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| Guest gate sheet | **تسجيل الدخول** | EmailAuth | EmailAuth | PASS |
| Guest gate sheet | **متابعة كزائر** | back to previous | goes back | PASS |
| Drawer footer | **تسجيل الدخول** | EmailAuth | EmailAuth | PASS |
| EmailAuth | **إرسال رمز التحقق** (valid email) | Otp | Otp | PASS |
| EmailAuth | **إرسال رمز التحقق** (invalid) | stay + error | stays, error shown | PASS |
| Otp | **تأكيد** (6 digits) | login + Main/About | logged in, Main/About | PASS |
| Otp | **تأكيد** (<6 digits) | stay + error | stays, error shown | PASS |

Note: after a successful OTP the app lands on **Main/About** (اعرف عنا). That is the coded behaviour (`OtpScreen.tsx:36`) and it is not a dead end, but it is an odd destination — a user who logged in from the *My Bookings* gate is dropped on the About page rather than returned to what they wanted. Worth a UX decision, not filed as a defect.

## 6. Tab-bar visibility on pushed screens — 11/11 correct

Tab bar must disappear on every pushed screen. Verified via computed style and bounding rect, not DOM presence.

| Pushed screen | Tab bar | Status |
|---|---|---|
| CaseDetail | `display:none`, rect 0×0 | PASS |
| ConsultationRequest | hidden | PASS |
| ArticleDetail | hidden | PASS |
| GovernorateActivity | hidden | PASS |
| EmailAuth | hidden | PASS |
| Otp | hidden | PASS |
| Sponsorship | hidden | PASS |
| ProjectDetail | hidden | PASS |
| DonationHistory | hidden | PASS |
| ConsultantDashboard | hidden | PASS |
| MyBookings | hidden | PASS |

Conversely, the bar is present and correctly rendered on all six root tab screens.

## 7. Admin dashboard routes — 18/18 render

`/`, `/bookings`, `/donations`, `/services`, `/providers`, `/content`, `/users`, `/notifications`, `/inbox`, `/cms/home`, `/cms/menu`, `/cms/pages`, `/cms/media`, `/cms/forms`, `/cms/tools`, `/reports`, `/settings`, `/roles` — all render substantive content (1.1–2.2 kB of text each), no blank pages, no JS errors. Only failing request is `404 /favicon.ico`.

---

## Summary

| Group | Pass | Fail |
|---|---|---|
| Bottom tabs | 5 | 0 |
| Home CTAs | 7 | 0 |
| About / governorates | 4 | 0 |
| Drawer | **17** | **0** |
| Auth flow | 7 | 0 |
| Tab-bar hiding | 11 | 0 |
| Dashboard routes | 18 | 0 |
| **Total** | **69** | **0** |

**Dead buttons: 0.** Three were found in the initial audit (خدماتنا, حسابي, أخبارنا), all from one root cause — the CMS default menu still targeting tabs deleted in the five-tab redesign. Fixed at four layers (data, type, runtime legacy remap, dashboard authoring dropdowns) and retested: all three now navigate, and all 13 previously working drawer items still do. See D-01 in `DEFECTS.md`.

### Also verified in the post-fix regression pass
- All 5 bottom tabs, all 7 Home CTAs, all 4 About CTAs — unchanged, still passing.
- The two "see all" links, missed in the first pass because the harness omitted their trailing chevron, now verified: **عرض الكل ‹** → Main/UrgentCases (PASS), **عرض المزيد ‹** → Projects (PASS).
- All 5 consultation forms: 9/9 common fields, correct specialised fields, zero cross-contamination.
- Same-email deduplication and login-linking re-run end to end (PASS).
