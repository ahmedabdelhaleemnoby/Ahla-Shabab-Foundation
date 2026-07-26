# Build & Static Verification Results

**Date:** 2026-07-26
**Commit under test:** `ec46501` (chore(mobile): adjust android display settings and improve typography)
**Working tree:** clean — `git status` reports *nothing to commit, working tree clean*; `git diff --stat` and `git diff --cached --stat` both empty.
**Unrelated files changed:** none (there were no uncommitted changes at all). All QA artefacts were written under `qa/` after testing began.

## Environment

| Item | Value |
|---|---|
| Platform | macOS (darwin 25.5.0), arm64 |
| Node | v20.19.4 (shell) / v22.22.2 (Expo launch config) |
| Java | OpenJDK 17.0.18 (Homebrew) — **only JDK installed** |
| Android SDK | `~/Library/Android/sdk` present (platforms 33–36); `ANDROID_HOME` unset by default |
| Android AVD | `Medium_Phone_API_36.0` exists; no device attached (`adb devices` empty) |
| Runtime used for testing | Expo Web (react-native-web) on Metro `:8087`, driven by headless Google Chrome via puppeteer-core |

## Results

| Check | Command | Result | Errors/Warnings |
|---|---|---|---|
| Typecheck (all workspaces) | `npm run typecheck --workspaces --if-present` | **PASS** (exit 0) | `@ahla/shared`, `mobile` (`tsc -p tsconfig.typecheck.json`), `dashboard` — all clean, zero diagnostics |
| Unit tests | `npm test --workspace shared` (vitest) | **PASS** | 2 files, **28/28 tests passed** (`cms.test.ts` 10, `rules.test.ts` 18), 737 ms |
| Lint | — | **NOT APPLICABLE** | No ESLint/Biome config or lint script exists in any workspace |
| Dashboard build | `npm run build --workspace dashboard` | **PASS** | `tsc --noEmit` clean; vite built 1612 modules → JS 394 kB (gzip 111 kB), CSS 23 kB. 15.84 s |
| Mobile web export | `npx expo export --platform web` | **PASS** | Bundle 1.8 MB + assets, no errors |
| Mobile web dev server | Expo `start --web` :8087 | **PASS** | Boots and renders; only benign RN-Web dev warnings (below) |
| **Android debug build** | `./gradlew assembleDebug` (with `ANDROID_HOME` exported) | **FAIL** | Reproduced on 2 consecutive runs — see below |
| Android emulator / device run | — | **BLOCKED** | No build artefact could be produced for current HEAD |

### Android build failure (reproduced twice)

```
> Task :expo-constants:compileDebugKotlin FAILED
Execution failed for task ':expo-constants:compileDebugKotlin'.
> Could not resolve all files for configuration ':expo-constants:detachedConfiguration6'.
   > Failed to transform classes.jar to match attributes
     {artifactType=classpath-entry-snapshot, org.gradle.libraryelements=jar, ...}
      > Execution failed for BuildToolsApiClasspathEntrySnapshotTransform:
        .../node_modules/expo-modules-core/android/build/intermediates/
        compile_library_classes_jar/debug/bundleLibCompileToJarDebug/classes.jar
         > java.lang.IllegalArgumentException (no error message)
BUILD FAILED in 3m 52s (clean) / 14s (incremental)
```

**Assessment:** an **Android toolchain/environment failure, not an application-code failure.** It occurs inside AGP's Kotlin classpath-snapshot transform against `expo-modules-core`, before any project source compiles. Supporting evidence: TypeScript compiles clean, the JS bundle exports successfully, and the full app runs. Only one JDK (17.0.18, a Jan-2026 build) is installed and no Android Studio JBR is present, so a JDK swap could not be attempted.

**Consequence: no Android emulator or physical-device testing of the current code was performed.** Every runtime result in this report set comes from Expo Web in headless Chrome.

### Shipped APK is stale

`ahla-shabab-v1.4.0-demo.apk` was built **2026-07-22 13:00:27**, but the final commit `ec46501` ("adjust android display settings and improve typography") landed **2026-07-22 13:26:58** — ~27 minutes later. The distributable demo APK therefore **does not contain the last commit**. It was deliberately *not* installed on the emulator: doing so would have tested stale code while appearing to validate HEAD.

### Benign runtime warnings (Expo Web dev mode only)

```
[warn] "shadow*" style props are deprecated. Use "boxShadow".
[warn] props.pointerEvents is deprecated. Use style.pointerEvents
```
These come from `react-native-web` 0.21 translating RN styles; they are dev-mode deprecation notices and do not apply to native builds.

### Dashboard runtime

All 18 admin routes render real content, no page errors. Only failing request is `404 /favicon.ico` — a Vite dev-server artefact absent from the production build.
