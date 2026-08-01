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
 *     http://localhost:4000/admin/  →  dashboard build     (ADMIN_DIR)
 *
 * The dashboard now lives in its own repository (ahla-shabab-dashboard), so its
 * build is no longer inside this tree. Point ADMIN_DIR at it to get the combined
 * demo back:
 *
 *     cd ../ahla-shabab-dashboard && DEMO_BASE=/admin/ npm run build
 *     cd -  && npm run demo:build
 *     ADMIN_DIR=../ahla-shabab-dashboard/dist npm run demo
 *
 * Without ADMIN_DIR the app is still served on its own; only /admin/ is absent.
 *
 * It serves BUILT output rather than proxying the dev servers on purpose: Vite's
 * dev server injects root-absolute URLs (/@vite/client, /@react-refresh) that a
 * path-based proxy would misroute to the app. Static builds have no such
 * leakage, and this is also what a real single-origin deployment looks like.
 *
 * Build the app first:
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
// Defaults to a sibling checkout of the dashboard repo, which is where it ends
// up if both are cloned next to each other.
const ADMIN_DIR = process.env.ADMIN_DIR ?? join(ROOT, '..', 'ahla-shabab-dashboard', 'dist');
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

if (!existsSync(APP_DIR)) {
  console.error(`Missing mobile web export: ${APP_DIR}\nRun:  npm run demo:build`);
  process.exit(1);
}

// The dashboard is a separate repository now, so treat it as optional: serve the
// app on its own rather than refusing to start. Only the shared-localStorage half
// of the demo is lost, and the message says exactly how to get it back.
const HAS_ADMIN = existsSync(ADMIN_DIR);

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
  if (HAS_ADMIN && url === ADMIN_PREFIX) {
    res.writeHead(302, { Location: `${ADMIN_PREFIX}/` });
    return res.end();
  }

  const isAdmin = HAS_ADMIN && url.startsWith(`${ADMIN_PREFIX}/`);
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
  if (HAS_ADMIN) {
    console.log(`  dashboard  /admin/   → ${ADMIN_DIR}`);
    console.log('\nOne origin, one localStorage: a CMS edit in the dashboard shows up in the app.');
  } else {
    console.log(`  dashboard  /admin/   → not mounted (${ADMIN_DIR} not found)`);
    console.log('\nThe dashboard lives in the ahla-shabab-dashboard repo. To include it:');
    console.log('  cd ../ahla-shabab-dashboard && DEMO_BASE=/admin/ npm run build');
    console.log('  ADMIN_DIR=../ahla-shabab-dashboard/dist npm run demo');
  }
});
