# BUILD & TEST RESULTS

**Date:** 2026-07-26 · **Verifier:** QA acceptance pass · **Commit:** `ec46501` (branch `main`, working tree clean)
**Environment:** macOS (darwin 25.5.0), Node v20.19.4, npm 10.8.2. Real command execution — logs under `qa/logs/`.

## Summary table

| Check | Command | Result | Errors/Warnings |
|---|---|---|---|
| Dashboard build | `cd dashboard && npm run build` (`tsc --noEmit && vite build`) | **PASS** (exit 0) | 1612 modules transformed, built in 15.58s. Bundle: `index.js` 394.01 kB (gzip 111.41 kB), `index.css` 23.14 kB. No TS errors. |
| Mobile typecheck | `cd mobile && npm run typecheck` (`tsc -p tsconfig.typecheck.json --noEmit`) | **PASS** (exit 0) | No type errors. |
| Shared typecheck | `cd shared && npm run typecheck` (`tsc --noEmit`) | **PASS** (exit 0) | No type errors. |
| Shared unit tests | `cd shared && npm test` (`vitest run`) | **PASS** (exit 0) | **28/28 passed** — `rules.test.ts` (18), `cms.test.ts` (10). Duration 664ms. Only warning: Vite CJS-API deprecation notice (harmless). |
| Lint | — | **NOT APPLICABLE** | No ESLint/Prettier config present in any workspace (`.eslintrc*` / `eslint.config.*` absent). Lint is not configured for this project. |
| Mobile web export | `cd mobile && npx expo export --platform web` | See "Mobile web export" note below | Attempted for browser-based UI evidence. |
| Android build | `expo run:android` | **BLOCKED** | No Android emulator or physical device available in this environment. Not executed. Pre-built demo APKs exist in repo root (`ahla-shabab-v1.4.0-demo.apk` is the latest) but were **not** produced or validated by this pass. |
| Root typecheck | `npm run typecheck` (workspaces `--if-present`) | **PASS (covered)** | Equivalent to the three workspace typechecks above, all green. |

## Notes

- **No mobile unit tests exist.** Automated test coverage lives only in `shared/` (28 tests, business rules + CMS defaults). The mobile app (`mobile/src`) and the dashboard (`dashboard/src`) have **no** automated tests. In particular the demo-user dedup/identity module (`mobile/src/store/demoUsers.ts`) — a demo-approval gating criterion — has **zero** test coverage (see DEFECTS D-07).
- **Builds are genuinely clean** — the dashboard production build and all three TypeScript typechecks compile with no errors, which is strong evidence the codebase is internally consistent.
- Raw logs: `qa/logs/dashboard-build.log`, `qa/logs/mobile-typecheck.log`, `qa/logs/shared-test.log`, `qa/logs/mobile-web-export.log`.

### Method disclosure
- **Code inspection:** exhaustive (all feature areas).
- **Browser testing:** real — the dashboard was built and served via `vite preview` on `localhost:4599` and driven in a live browser (screenshots in `FINAL_ACCEPTANCE_REPORT.md`).
- **Emulator testing:** none available.
- **Real-device testing:** NOT performed. Any pre-existing `qa/device/*.png` and `qa/flows/*.mp4` are artifacts from an earlier pass and were not produced or re-validated by this verification.
