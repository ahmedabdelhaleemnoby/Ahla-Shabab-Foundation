/**
 * D-18 — with both apps behind scripts/demo-origin.mjs they share one origin,
 * so a CMS edit made in the dashboard must appear in the app.
 *
 * This is the assertion that was impossible before the fix: it drives the real
 * dashboard UI and then reads the real app, with no state hand-written into
 * localStorage by the test.
 *
 * Setup:
 *   npm run start --workspace mobile -- --web --port 8087
 *   DEMO_BASE=/admin/ npm run dev --workspace dashboard
 *   node scripts/demo-origin.mjs
 */
import puppeteer from 'puppeteer-core';
import { CHROME, sleep } from './lib.mjs';

const ORIGIN = process.env.DEMO_ORIGIN_URL ?? 'http://localhost:4000';
const check = (ok, l) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${l}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1440,900', '--no-sandbox'],
});

/* ---------- edit in the dashboard ---------- */
const dash = await browser.newPage();
await dash.setViewport({ width: 1440, height: 900 });
await dash.goto(`${ORIGIN}/admin/settings`, { waitUntil: 'networkidle2', timeout: 120000 });
await sleep(2500);
check((await dash.evaluate(() => document.body.innerText)).includes('أرقام الأثر'), 'dashboard renders under /admin/');

async function setAndSave(label, value) {
  await dash.evaluate(
    (lab, val) => {
      const wrap = [...document.querySelectorAll('label, div')].find(
        (e) => e.textContent.trim() === lab && e.querySelector('input, textarea')
      );
      const el = wrap && wrap.querySelector('input, textarea');
      if (!el) throw new Error(`field not found: ${lab}`);
      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    label,
    value
  );
  await sleep(300);
  await dash.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('حفظ'));
    if (btn) btn.click();
  });
  await sleep(600);
}

console.log('\n### edit in the dashboard UI');
await setAndSave('عدد المستفيدين', '4.8M+');
await setAndSave('الخط الساخن', '16123');
check(
  (await dash.evaluate(() => JSON.parse(localStorage.getItem('ahla_cms_v1')).settings.stats.beneficiaries)) === '4.8M+',
  'edit committed to the CMS store'
);

/* ---------- read it in the app, same origin ---------- */
const app = await browser.newPage();
await app.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await app.goto(ORIGIN, { waitUntil: 'networkidle2', timeout: 120000 });
await sleep(4000);

check((await app.evaluate(() => location.origin)) === (await dash.evaluate(() => location.origin)), 'app and dashboard now share one origin');
check((await app.evaluate(() => localStorage.getItem('ahla_cms_v1'))) !== null, 'app can see the dashboard-written CMS state');

const text = () => app.evaluate(() => document.body.innerText);

// `expo export` is a production bundle, so the __DEV__-only globalThis.__nav
// hook is stripped (App.tsx). That is correct for a shipped build — navigate by
// real taps instead, which exercises the production bundle end to end.
check(
  (await app.evaluate(() => typeof globalThis.__nav)) === 'undefined',
  'production bundle strips the __DEV__ nav hook (expected)'
);

async function tap(label) {
  const box = await app.evaluate((n) => {
    const hits = [...document.querySelectorAll('div,span')]
      .filter((e) => (e.innerText || '').trim() === n)
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter((o) => o.r.width > 0 && o.r.height > 0)
      .sort((a, b) => a.r.width * a.r.height - b.r.width * b.r.height);
    if (!hits.length) return null;
    hits[0].e.scrollIntoView({ block: 'center' });
    const r = hits[0].e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, label);
  if (!box) return false;
  await app.mouse.move(box.x, box.y);
  await app.mouse.down();
  await sleep(110);
  await app.mouse.up();
  await sleep(1100);
  return true;
}

check(await tap('اعرف عنا'), 'tapped the About tab');
check((await text()).includes('4.8M+'), 'About screen shows the value typed in the dashboard');

check(await tap('تواصل معنا'), 'tapped تواصل معنا');
check((await text()).includes('16123'), 'ContactUs shows the hotline typed in the dashboard');

await dash.evaluate(() => localStorage.clear());
await browser.close();
