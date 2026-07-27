#!/usr/bin/env node
/**
 * Shared-origin demo server.
 *
 * The dashboard and the Expo web build normally run on separate dev ports, which
 * makes them separate ORIGINS. Browsers partition localStorage per origin, so the
 * CMS state the dashboard writes is invisible to the app and no edit ever shows
 * up in the preview (qa/DEFECTS.md D-18).
 *
 * This serves both from ONE port, so they share one localStorage:
 *
 *     http://localhost:4000/        →  mobile web export   (mobile/dist)
 *     http://localhost:4000/admin/  →  dashboard build     (dashboard/dist)
 *
 * It serves BUILT output rather than proxying the dev servers on purpose: Vite's
 * dev server injects root-absolute URLs (/@vite/client, /@react-refresh) that a
 * path-based proxy would misroute to the app. Static builds have no such
 * leakage, and this is also what a real single-origin deployment looks like.
 *
 * Build both first:
 *     npm run demo:build
 * then:
 *     npm run demo
 *
 * No dependencies; plain node:http.
 */
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const PORT = Number(process.env.PORT ?? 4000);
const APP_DIR = process.env.APP_DIR ?? join(ROOT, 'mobile', 'dist');
const ADMIN_DIR = process.env.ADMIN_DIR ?? join(ROOT, 'dashboard', 'dist');
const ADMIN_PREFIX = '/admin';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

for (const [label, dir] of [['mobile web export', APP_DIR], ['dashboard build', ADMIN_DIR]]) {
  if (!existsSync(dir)) {
    console.error(`Missing ${label}: ${dir}\nRun:  npm run demo:build`);
    process.exit(1);
  }
}

/** Resolve a URL path inside `dir`, refusing anything that escapes it. */
function resolveFile(dir, urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const candidate = normalize(join(dir, clean));
  if (candidate !== dir && !candidate.startsWith(dir + sep)) return null; // traversal
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}

function send(res, file, status = 200) {
  res.writeHead(status, {
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store', // a demo server should never serve a stale bundle
  });
  createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';

  // Bare /admin → /admin/ so the build's base-relative URLs resolve.
  if (url === ADMIN_PREFIX) {
    res.writeHead(302, { Location: `${ADMIN_PREFIX}/` });
    return res.end();
  }

  const isAdmin = url.startsWith(`${ADMIN_PREFIX}/`);
  const dir = isAdmin ? ADMIN_DIR : APP_DIR;
  const rel = isAdmin ? url.slice(ADMIN_PREFIX.length) : url;

  const file = resolveFile(dir, rel);
  if (file) return send(res, file);

  // SPA fallback — unknown paths are client-side routes.
  const index = join(dir, 'index.html');
  if (existsSync(index)) return send(res, index);

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404\n');
});

server.listen(PORT, () => {
  console.log(`shared-origin demo server → http://localhost:${PORT}`);
  console.log(`  app        /         → ${APP_DIR}`);
  console.log(`  dashboard  /admin/   → ${ADMIN_DIR}`);
  console.log('\nOne origin, one localStorage: a CMS edit in the dashboard shows up in the app.');
});
