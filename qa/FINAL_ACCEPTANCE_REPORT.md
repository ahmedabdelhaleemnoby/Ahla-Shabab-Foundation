# Final acceptance report — QA pass 2

**Date:** 2026-08-01
**Scope:** the bottom-navigation / email-OTP / Home-restructure / governorates /
provider-dashboard / guest-identity change set.

---

## How this was tested

| Surface | Used | Notes |
|---|---|---|
| Code inspection | ✅ | 42 screens, stores, navigator, tab bar |
| **Browser testing** | ✅ | Expo **web** dev server, headless Chrome via puppeteer-core at **320×700, 390×844, 430×932**. Assertions read React Navigation's own root state, not pixels. |
| Android **emulator** | ❌ | not run |
| **Real device** | ❌ | not run. The release APK was **built** (60 MB, exit 0) but never installed or launched. |

**No claim in this report is based on device behaviour.**

**Backend:** none. A typed API client exists at `shared/src/api`, but **no mobile
screen imports it** (0 call sites) and **zero external network requests** were
observed across the entire session. Nothing here is backend-verified, and no
backend-dependent behaviour is reported as production-ready.

---

## Executive summary

The change set is **implemented and working** on every requirement that could be
exercised in a browser. All four decision-blocking behaviours pass:

- the five-item bottom navigation works and hides correctly on inner screens;
- guest consultation submission completes end-to-end (`AS-999534`);
- same-email deduplication holds across case and whitespace variants (16/16);
- the provider dashboard displays every submitted answer (7/7 fields).

Builds are green across the board, including a release APK.

The two **PARTIAL** results are coverage gaps in this pass, not known breakage:
tablet/keyboard/font-scaling were not exercised, and not every control in all 42
screens was pressed.

The single most important caveat is **persistence: there is none**. No
`AsyncStorage`/`SecureStore` dependency exists, so login, consultation history,
returning-guest identity and provider edits all reset on reload. The app is
honest about this in its own copy, and the demo script must avoid reloading
between submitting a consultation and logging in.

## Scores

| | |
|---|---|
| **Completion** | **22 / 24 requirements fully met — 91.7%** |
| PASS | **22** |
| PARTIAL | **2** (responsive coverage; exhaustive dead-button sweep) |
| FAIL | **0** |
| BLOCKED | **0** |
| **Critical defects** | **0** |
| **High defects** | **0** |
| Medium defects | 0 |
| Low defects | 2 (D2-01 raised-button overlap, D2-02 stale walkthrough doc) |

### Automated check tallies

| Suite | Result |
|---|---|
| `qa/harness/qa2-nav.mjs` | **39 PASS**, 0 FAIL (3 informational) |
| `qa/harness/qa2-flows.mjs` | **46 PASS**, 0 FAIL (1 informational) |
| `scripts/qa2-identity.ts` | **16 PASS**, 0 FAIL |
| `qa/harness/qa2-persist.mjs` | 8 PASS, 0 FAIL (+3 persistence observations) |
| `cd shared && npx vitest run` | **32 PASS** |

## Evidence

- 22 screenshots in `qa/screenshots/mobile/qa2-*.png`
- Harness: `qa/harness/qa2-nav.mjs`, `qa2-flows.mjs`, `qa2-persist.mjs`, `scripts/qa2-identity.ts`
- Detail: `REQUIREMENTS_STATUS.md`, `NAVIGATION_MATRIX.md`, `PERSISTENCE_REPORT.md`,
  `BUILD_AND_TEST_RESULTS.md`, `DEFECTS.md`, `DEMO_LIMITATIONS.md`

**No video recordings were produced.** The harness captures stills only; the
flows listed in the brief are covered by the screenshot set and by the automated
route assertions instead.

## Corrections made during this pass

Four harness bugs produced **false results** that would otherwise have been
reported as app defects. Each is documented in `DEFECTS.md` (H-01…H-04) with the
before state, the exact fix and the retest. **No application code was changed
during this QA pass.** Specifically: a false FAIL on OTP validation (the locator
was clicking the screen header, not the submit button — which also made two
"passes" meaningless), a false FAIL on the cancelled counter (`ملغي` vs `ملغاة`),
two false PARTIALs on the provider dashboard (only the landing tab was read), and
two false FAILs on login linking (a second module instance under ESM).

## Recommended next steps

1. **Do not reload between submitting a consultation and logging in** — it resets
   the identity. Worth building into the demo script.
2. Fix D2-01 (add ~28 px bottom padding to the sticky CTA) — cosmetic, ~5 minutes.
3. Refresh `CLIENT_DEMO_WALKTHROUGH.md` for the new tab set and the About-screen
   governorates.
4. Get the client's decision on the «+650» / «+10,000» impact figures, still
   unapproved from pass 1.
5. If the demo will be shown on a phone, run an emulator or device pass first —
   this report cannot speak to on-device behaviour.
6. Before any production claim, add real persistence (`AsyncStorage`) and wire
   the existing API client.

---

# FINAL DECISION

## APPROVED WITH MINOR FIXES

Every decision-blocking behaviour was verified working: no core tab fails, guest
consultation submission succeeds, same-email deduplication holds, the provider
dashboard displays submitted answers, the bottom navigation does not obscure
content, no crashes or page errors were observed, all builds pass, and no
requested screen is missing.

It is **not** an unqualified approval because of two open items, neither of which
blocks a demo: the cosmetic overlap (D2-01) and a walkthrough document that
predates the change set (D2-02) — the document the demo is meant to be run from.
Two requirements also remain PARTIAL on coverage rather than on behaviour.

**This approval covers browser-verified behaviour only.** It does not cover
device behaviour, and it does not cover anything backend-dependent.
