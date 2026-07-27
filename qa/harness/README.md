# QA Harness

The scripts that produced the results in `qa/*.md`. They drive the **Expo Web** build in headless Chrome and assert against React Navigation's own state rather than against pixels, so a pass/fail is a real navigational outcome and not a screenshot diff.

Committed so the findings are reproducible rather than merely readable.

## Prerequisites

1. **Google Chrome** installed (or set `CHROME_PATH`).
2. **`puppeteer-core`**, installed *in this directory*. It is deliberately not an app dependency and this folder is not an npm workspace, so it stays out of the app build:
   ```bash
   npm install --prefix qa/harness
   ```
   (`qa/harness/node_modules/` is gitignored. Note `NODE_PATH` does **not** work here — ESM ignores it, so the install must live in this folder for Node to resolve the import.)
3. **The app running on `:8087`:**
   ```bash
   npm run start --workspace mobile -- --web --port 8087
   ```
   Wait for the first bundle to finish (~40 s) before running anything.

For the dashboard suites (`dash.mjs`, `dash2.mjs`, `settings-dashboard.mjs`, `settings-all.mjs`), also start:
```bash
npm run dev --workspace dashboard
```

## Running

From the repo root:

```bash
node qa/harness/nav2.mjs
```

Environment overrides: `CHROME_PATH`, `BASE_URL` (default `http://localhost:8087`), `SHOTS_DIR`, `DASH_SHOTS_DIR`.

Screenshots land in `qa/screenshots/` — gitignored, regenerated on each run.

## What each script covers

| Script | Covers | Report section |
|---|---|---|
| `lib.mjs`, `lib2.mjs`, `formlib.mjs` | shared helpers: launch, navigate, state read, real-pointer press, form fill | — |
| `tabvis.mjs` | tab bar hidden on pushed screens (computed style, not DOM presence) | NAVIGATION_MATRIX §6 |
| `nav2.mjs` | bottom tabs, Home CTAs, About CTAs | NAVIGATION_MATRIX §1–3 |
| `home2.mjs` | Home CTAs with a clean stack reset | NAVIGATION_MATRIX §2 |
| `drawer2.mjs`, `drawer3.mjs` | drawer items / dead-button detection | NAVIGATION_MATRIX §4, D-01 |
| `gate.mjs` | guest gating vs public browsing | REQUIREMENTS §13–14, D-02 |
| `valid.mjs` | email + OTP validation edge cases | REQUIREMENTS §3 |
| `consult2.mjs` | consultation submit, same-email dedup, login linking | REQUIREMENTS §16–18 |
| `forms.mjs` | per-type form fields, cross-contamination check | REQUIREMENTS §8 |
| `provider.mjs` | provider dashboard: overview, availability, bookings, profile | REQUIREMENTS §9–12 |
| `availability.mjs` | provider working-hours editing + booking reschedule | D-04, D-05 |
| `settings.mjs` | CMS-driven About stats; consultation email required + dedup | D-08, D-09 |
| `settings-dashboard.mjs` | dashboard impact editor commits to the CMS store (needs `:5173`) | D-08 |
| `settings-all.mjs` | all six Settings cards commit; app renders them; proves the origin split (needs both servers) | D-17, D-18 |
| `payment-methods.mjs` | CMS payment methods reach the Donate wizard's step 4 | D-17 |
| `persist.mjs` | what survives a reload | PERSISTENCE_REPORT |
| `responsive.mjs`, `overflow.mjs`, `crop.mjs` | 320/390/430/768 px layout, overflow, truncation | REQUIREMENTS §20, D-10/D-11 |
| `shots.mjs` | evidence screenshots | — |
| `dash.mjs`, `dash2.mjs` | admin dashboard routes + content | NAVIGATION_MATRIX §7 |
| `final.mjs` | network inventory (asserts 0 non-localhost requests) | DEMO_LIMITATIONS |
| `retest.mjs`, `retest2.mjs`, `last.mjs` | post-fix verification of D-01/D-02/D-03/D-06 | DEFECTS |

## Three cautions for anyone extending these

**Use real pointer events.** React Native Web's responder system ignores synthetic `dispatchEvent` clicks. Presses must be `mouse.move → down → ~110 ms → up`; a zero-delay `mouse.click()` is also unreliable. `formlib.press()` does this correctly — reuse it.

**Walk multi-step flows.** Donation payment methods live on **step 4 of a 5-step wizard**; asserting straight after loading the Donate route finds an empty list and reports a false failure. `payment-methods.mjs` walks الوجهة → الاختيار → المبلغ first.

**Reset the stack between assertions.** Pushed screens stay in the DOM while hidden, so a selector scanning the whole document can match a stale screen and report a false result. Use `__nav.reset({index:0, routes:[{name:'Main', params:{screen: tab}}]})`, and match on *exact* trimmed text — substring matching collides badly in Arabic (`تبرع` is inside `تبرع الآن`, `تبرع للحالة`, …).

All three produced false failures at some point in this work; the harness-accuracy note in `NAVIGATION_MATRIX.md` records what the first two looked like.

## Scripts deliberately not committed

One-off DOM probes (`probe.mjs`, `t0.mjs`) and superseded buggy versions (`navmatrix.mjs`, `tabbar.mjs`, `consult.mjs` — the substring-matching and DOM-presence variants described above) were left out. Shipping known-broken harnesses next to their corrected replacements would invite someone to run the wrong one.
