# NAVIGATION MATRIX

**Date:** 2026-07-26 · **Commit:** `ec46501` · **Method:** `[live]` browser (Expo web export / dashboard `vite preview`), `[code]` source (`mobile/App.tsx`, screen `onPress` handlers, `dashboard/src/App.tsx`).
No dead routes were found — every destination resolves to a registered screen/route.

## Mobile — bottom tabs (root, under `Main`)
| Source | Action | Expected destination | Actual | Status |
|---|---|---|---|---|
| Any root tab | Tab: الأسر | `Cases` (CasesScreen) | `Cases` | PASS `[code]` |
| Any root tab | Tab: الحالات العاجلة | `UrgentCases` | `UrgentCases` | PASS `[code]` |
| Any root tab | Tab: تبرع (raised) | `Donate` | `Donate` | PASS `[code]` |
| Any root tab | Tab: الاستشارات | `Consultations` | `Consultations` (5 type cards) | PASS `[live]` |
| Any root tab | Tab: اعرف عنا | About (`NewsScreen`) | `About` (governorates section) | PASS `[live]` |

## Mobile — Home CTAs
| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| Home | تبرع الآن | `Main→Donate` | `Donate` | PASS `[code]` (`HomeScreen.tsx:52`) |
| Home | حالات التبرع | `Main→Cases` | `Cases` | PASS `[code]` (`:59`) |
| Home | احجز استشارة | `Main→Consultations` | `Consultations` | PASS `[code]` (`:88`) |
| Home | تعرف على الاستشارات | `ServicesBrowse{parentId:counseling}` | resolves | PASS `[code]` (`:95`) |

## Mobile — About / governorates
| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| About | Tap governorate chip (e.g. القاهرة) | `GovernorateActivity{governorate}` | `GovernorateActivity` (bottom bar hidden) | PASS `[live]` (`NewsScreen.tsx:85`) |
| GovernorateActivity | تبرع للحالة | Donation flow | resolves `[code]` | PASS `[code]` |
| GovernorateActivity | Back chevron | previous screen | About | PASS `[live]` |

## Mobile — consultations
| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| Consultations | Tap type card (نفسية/دينية/طبية/أسرية/أعمال) | `ConsultationRequest{type}` (per-type form) | resolves | PASS `[code]` (`ConsultationsScreen.tsx:42`) |
| ConsultationRequest | إرسال الطلب (submit) | Confirmation state + demo disclaimer | in-place success | PASS `[code]` (`:110-152`) |
| Consultations | featured consultant احجز الآن / تعرف على الخدمة | ProviderDetail / Booking | resolves | PASS `[code]` |

## Mobile — auth / guest gate
| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| LoginGate (gated screen) | تسجيل الدخول | `EmailAuth` | `EmailAuth` | PASS `[code]` (`LoginGate.tsx:64`) |
| LoginGate | متابعة كزائر | `goBack()` | dismiss | PASS `[code]` (`:65`) |
| EmailAuth | إرسال رمز التحقق (valid email) | `Otp{email}` | `Otp` | PASS `[code]` (`EmailAuthScreen.tsx:21`) |
| EmailAuth | invalid/empty email | stays, shows error | blocked | PASS `[code]` (`:16,21`) |
| Otp | تأكيد (6 digits) | `loginDemoUserByEmail` → `Main→About` | login + About | PASS `[code]` (`OtpScreen.tsx:35-36`) |
| Otp | تأكيد (<6 digits) | error, no nav | blocked | PASS `[code]` (`:30-32`) |
| Otp | إعادة إرسال الرمز (after 30s) | reset timer/code | reset | PASS `[code]` (`:39-44`) |

## Mobile — provider dashboard entry & internal tabs
| Source | Action | Expected | Actual | Status |
|---|---|---|---|---|
| Drawer (`AppDrawer`) | لوحة مقدم الخدمة | `ConsultantDashboard` | resolves | PASS `[code]` (`AppDrawer.tsx:104`) |
| Profile menu | لوحة مقدم الاستشارة | `ConsultantDashboard` | resolves | PASS `[code]` (`ProfileScreen.tsx:39`) |
| Dashboard | Tabs: نظرة عامة / مواعيدي / الحجوزات والطلبات / الملف الشخصي | state switch | switches | PASS `[code]` (`:81`) |
| Booking (expanded) | تأكيد / إكمال / إلغاء | `updateStatus` | status updates live | PASS `[code]` (`:436-458`) |
| Booking (expanded) | **Reschedule** | *(expected)* | **ABSENT** | **FAIL** (D-02) |

## Dashboard (web, admin) — routes (`dashboard/src/App.tsx:27-46`)
| Route | Component | Status |
|---|---|---|
| `/` | Overview | PASS `[live]` (metric cards + demo banner) |
| `/bookings` | Bookings | PASS `[live]` (filters/search/CSV export/table) |
| `/donations` | Donations | PASS `[code]` |
| `/services` | Services | PASS `[code]` |
| `/providers` | Providers (admin-manages-providers) | PASS `[code]` |
| `/content` | Content | PASS `[code]` |
| `/users` | Users | PASS `[code]` |
| `/notifications` | Notifications | PASS `[code]` |
| `/inbox` | Inbox | PASS `[code]` |
| `/reports` | Reports | PASS `[code]` |
| `/settings` | Settings | PASS `[code]` |
| `/roles` | Roles | PASS `[code]` |
| `/cms/home`, `/cms/menu`, `/cms/pages`, `/cms/content/:id`, `/cms/media`, `/cms/forms`, `/cms/tools` | CMS builder pages | PASS `[code]` |
| `*` | redirect → `/` | PASS `[code]` |

**Dead buttons found:** none. **Missing feature (not a dead button):** provider Reschedule (D-02).
**Not runtime-clicked (no device):** individual consultation-form fields, provider dashboard live actions, and every mobile button not listed as `[live]` above were verified by code inspection only.
