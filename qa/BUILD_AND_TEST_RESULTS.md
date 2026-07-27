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
| **Android debug build** (from exFAT volume) | `./gradlew assembleDebug` | **FAIL** | Root cause found: the project volume is **exFAT** — see below |
| **Android debug build** (from local APFS disk) | `./gradlew assembleDebug` | **PASS** | BUILD SUCCESSFUL in 11m 03s → `app-debug.apk` (107 MB) |
| **Android release build** (from local APFS disk) | `./gradlew assembleRelease` | **PASS** | BUILD SUCCESSFUL in 8m 42s → `app-release.apk` (59.8 MB), versionCode 8 / 1.4.0 |
| Android emulator run | AVD `QA_API36` (android-36, arm64-v8a) | **PASS** | Release APK installed and launched; Home renders, tabs navigate, back button correct, **0 fatal exceptions** in logcat |
| Physical-device run | — | **NOT PERFORMED** | No device attached |

### Android build — root cause found, and it builds

**The blocker was the filesystem, not the toolchain.** The project lives on `/Volumes/PortableSSD`, which is **exFAT**:

```
/dev/disk4s1 on /Volumes/PortableSSD (exfat, local, nodev, nosuid, noowners, noatime, fskit)
/dev/disk3s1s1 on /                  (apfs, ...)
```

exFAT has no hard links, no POSIX permissions and no symlinks — all of which AGP's artifact transforms rely on. The build log says so directly:

```
C/C++: Hard link from '…/libreactnative.so' to '…/expo-modules-core/android/build/…/libreactnative.so'
       failed. Doing a slower copy instead.
```

Copied to a local APFS disk and rebuilt: **BUILD SUCCESSFUL**, with **zero** hard-link warnings. Both debug and release APKs produced.

This supersedes the original diagnosis below, which named the AGP/JDK combination. That was wrong — the same JDK and AGP build the project fine from APFS.

**Two secondary issues found and fixed along the way:**
1. A 10-minute timeout killed an NDK download mid-flight, leaving a stub directory containing only `.installer`. Gradle then failed with `NDK … did not have a source.properties file`. Removing the stub let it re-download cleanly (2.4 GB).
2. `kotlin.incremental.useClasspathSnapshot=false` was added to `gradle.properties` while diagnosing. It got the build past `:expo-constants:compileDebugKotlin` on exFAT, but the build still failed later at dexing — the flag is **not** what fixed things, APFS was. It is retained as harmless.

### Original (superseded) failure signature, for the record

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

The original assessment called this an AGP/JDK toolchain failure. **That was wrong.** The same JDK 17.0.18 and AGP 8.11.0 build the project successfully from APFS; the variable was the filesystem.

### Emulator run — the app works natively

The stock AVD (`Medium_Phone_API_36.0`) could not boot: its `.avd` directory was missing (only the pointer `.ini` remained) and it was configured for 32-bit `arm`, unsupported on Apple Silicon — `PANIC: CPU Architecture 'arm' is not supported`. A replacement AVD was created from the already-installed `android-36 / google_apis_playstore / arm64-v8a` image.

The **release** APK (which embeds the JS bundle; a debug APK shows a blank screen without Metro) installed and launched cleanly:

| Native check | Result |
|---|---|
| App launches, Home renders | **PASS** — donation hero first, consultations second, vision/mission, urgent case |
| Bottom bar, 5 items, RTL order | **PASS** — الأسر · الحالات العاجلة · تبرع · الاستشارات · اعرف عنا, right→left |
| Tab navigation | **PASS** — About tab opens, highlights, governorate chips render |
| Hardware BACK from a non-initial tab | **PASS** — returns to Home, does not exit |
| Hardware BACK from Home | **PASS** — exits, as expected |
| Fatal exceptions in logcat | **0** |
| D-10 (CTA truncation) on native | Renders in full on one line — the defect was **web-only**, as suspected; the fix is harmless natively |
| D-11 (tab label wrap) on native | Single line, tab row aligned |
| D-15 (footer buttons) on native | Both one line, equal height |

### Shipped APK — refreshed

`ahla-shabab-v1.4.0-demo.apk` was previously built **2026-07-22 13:00:27**, ~27 minutes *before* commit `ec46501`, so it did not contain the last commit. It has been **replaced with a release build of the current branch**: `versionCode 8`, `versionName 1.4.0`, 59.8 MB, signed with the debug keystore (as `build.gradle` specifies for this demo).

Note the size jump from ~28 MB (previous EAS builds) to 59.8 MB: this local build is a universal APK carrying all four ABIs, where EAS produced per-ABI/bundle output. Not a defect; worth knowing if size matters for distribution.

### Benign runtime warnings (Expo Web dev mode only)

```
[warn] "shadow*" style props are deprecated. Use "boxShadow".
[warn] props.pointerEvents is deprecated. Use style.pointerEvents
```
These come from `react-native-web` 0.21 translating RN styles; they are dev-mode deprecation notices and do not apply to native builds.

### Dashboard runtime

All 18 admin routes render real content, no page errors. Only failing request is `404 /favicon.ico` — a Vite dev-server artefact absent from the production build.
