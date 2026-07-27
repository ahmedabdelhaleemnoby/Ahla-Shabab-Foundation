#!/usr/bin/env node
/**
 * Generate the Android launcher icons from mobile/assets/icon.png.
 *
 * This is a BARE workflow — android/ is committed, so `expo prebuild` never runs
 * and app.json's `icon` / `android.adaptiveIcon` are NOT applied to native
 * builds. Without this, the APK ships whatever is in res/mipmap-*, which was
 * still the default Android robot (qa/DEFECTS.md D-20). Same root cause as the
 * version drift in D-19.
 *
 * Produces, for every density:
 *   ic_launcher.png             legacy square icon
 *   ic_launcher_round.png       legacy round icon
 *   ic_launcher_foreground.png  adaptive foreground, logo inset to the safe zone
 * plus mipmap-anydpi-v26/*.xml and the background colour.
 *
 * Adaptive icons are 108dp canvases of which only the centre 66dp is guaranteed
 * visible — the launcher masks the rest to a circle/squircle/etc. The logo is
 * therefore scaled to ~60% and centred, so no part of it can be clipped.
 *
 * Requires ImageMagick (`magick`). Run: node scripts/sync-android-icons.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SRC = join(ROOT, 'mobile', 'assets', 'icon.png');
const RES = join(ROOT, 'mobile', 'android', 'app', 'src', 'main', 'res');
const BG = '#FFFFFF'; // matches app.json android.adaptiveIcon.backgroundColor

/** density → [legacy px, adaptive px] */
const DENSITIES = {
  mdpi: [48, 108],
  hdpi: [72, 162],
  xhdpi: [96, 216],
  xxhdpi: [144, 324],
  xxxhdpi: [192, 432],
};

if (!existsSync(SRC)) {
  console.error(`Missing source icon: ${SRC}`);
  process.exit(1);
}

const magick = (args) => execFileSync('magick', args, { stdio: ['ignore', 'ignore', 'pipe'] });

for (const [density, [legacy, adaptive]] of Object.entries(DENSITIES)) {
  const dir = join(RES, `mipmap-${density}`);
  mkdirSync(dir, { recursive: true });

  // Legacy square — flatten onto the background so it never renders transparent.
  magick([SRC, '-resize', `${legacy}x${legacy}`, '-background', BG, '-alpha', 'remove', '-alpha', 'off',
    join(dir, 'ic_launcher.png')]);

  // Legacy round — same, masked to a circle.
  magick([SRC, '-resize', `${legacy}x${legacy}`, '-background', BG, '-alpha', 'remove', '-alpha', 'off',
    '(', '+clone', '-alpha', 'transparent', '-draw', `circle ${legacy / 2},${legacy / 2} ${legacy / 2},0`, ')',
    '-compose', 'dstin', '-composite',
    join(dir, 'ic_launcher_round.png')]);

  // Adaptive foreground — logo at 60% of the canvas, centred, transparent around it.
  const inner = Math.round(adaptive * 0.6);
  magick([SRC, '-resize', `${inner}x${inner}`, '-background', 'none',
    '-gravity', 'center', '-extent', `${adaptive}x${adaptive}`,
    join(dir, 'ic_launcher_foreground.png')]);

  // The stale .webp files would collide with the new .png at the same resource
  // name and fail the build with a duplicate-resource error.
  for (const old of ['ic_launcher.webp', 'ic_launcher_round.webp']) {
    const p = join(dir, old);
    if (existsSync(p)) rmSync(p);
  }
}

// Adaptive icon descriptors (Android 8+).
const anydpi = join(RES, 'mipmap-anydpi-v26');
mkdirSync(anydpi, { recursive: true });
const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
writeFileSync(join(anydpi, 'ic_launcher.xml'), xml);
writeFileSync(join(anydpi, 'ic_launcher_round.xml'), xml);

// Background colour lives in its own file so it can't clash with app colours.
const values = join(RES, 'values');
mkdirSync(values, { recursive: true });
writeFileSync(
  join(values, 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BG}</color>
</resources>
`
);

console.log(`Generated launcher icons for ${Object.keys(DENSITIES).length} densities + adaptive icon (bg ${BG}).`);
