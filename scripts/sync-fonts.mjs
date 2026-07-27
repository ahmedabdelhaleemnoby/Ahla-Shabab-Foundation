#!/usr/bin/env node
/**
 * Copy the Cairo weights the dashboard uses out of node_modules and into
 * dashboard/public/fonts, so the dashboard can @font-face them locally instead
 * of fetching from fonts.googleapis.com (qa/DEFECTS.md D-16).
 *
 * The files come from @expo-google-fonts/cairo, already a dependency of the
 * mobile app — no new dependency and no download. They are copied at build time
 * rather than committed, so ~640 KB of binaries stay out of git.
 *
 * Runs automatically before `dev` and `build` in the dashboard workspace.
 */
import { copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SRC = join(ROOT, 'node_modules', '@expo-google-fonts', 'cairo');
const OUT = join(ROOT, 'dashboard', 'public', 'fonts');

const WEIGHTS = [
  ['Cairo_400Regular.ttf', 'Cairo-400.ttf'],
  ['Cairo_500Medium.ttf', 'Cairo-500.ttf'],
  ['Cairo_600SemiBold.ttf', 'Cairo-600.ttf'],
  ['Cairo_700Bold.ttf', 'Cairo-700.ttf'],
  ['Cairo_800ExtraBold.ttf', 'Cairo-800.ttf'],
];

if (!existsSync(SRC)) {
  console.warn(`[sync-fonts] ${SRC} not found — run npm install. Skipping.`);
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const [from, to] of WEIGHTS) {
  const src = join(SRC, from);
  const dest = join(OUT, to);
  if (!existsSync(src)) {
    console.warn(`[sync-fonts] missing ${from}, skipping`);
    continue;
  }
  // Skip unchanged files so repeat builds stay fast.
  if (existsSync(dest) && statSync(dest).size === statSync(src).size) continue;
  copyFileSync(src, dest);
  copied++;
}

console.log(copied ? `[sync-fonts] copied ${copied} font file(s) → dashboard/public/fonts` : '[sync-fonts] fonts up to date');
