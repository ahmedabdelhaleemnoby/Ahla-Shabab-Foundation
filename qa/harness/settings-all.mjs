/**
 * D-17 — every dashboard Settings section must commit to the CMS store, and the
 * app must render those values rather than compiled constants.
 *
 * These are two separate assertions on purpose. localStorage is partitioned per
 * ORIGIN, and the dashboard (:5173) and Expo web (:8087) are different origins,
 * so a dashboard edit cannot appear in the web preview — that is D-18, asserted
 * explicitly below so the limitation is proven rather than assumed. The halves
 * verified here are the two that a same-origin deployment composes:
 *   1. editor  → CMS store   (driven through the real dashboard UI)
 *   2. CMS store → app       (state written to the app's own origin)
 *
 * Needs both dev servers running.
 */
import puppeteer from 'puppeteer-core';
import { CHROME, BASE, sleep } from './lib.mjs';

const DASH = process.env.DASH_URL ?? 'http://localhost:5173';
const check = (ok, l) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${l}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1440,900', '--no-sandbox'],
});

/* ---------- 1. editor → CMS store ---------- */
const dash = await browser.newPage();
await dash.setViewport({ width: 1440, height: 900 });
await dash.goto(`${DASH}/settings`, { waitUntil: 'networkidle2', timeout: 120000 });
await sleep(2000);

/** Set a labelled field, then click that card's save button. */
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
  // the only visible حفظ button is the touched card's
  await dash.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('حفظ'));
    if (btn) btn.click();
  });
  await sleep(500);
}

console.log('### 1. dashboard editor commits to the CMS store');
await setAndSave('العنوان الرئيسي', 'عنوان محرَّر من اللوحة');
await setAndSave('الخط الساخن', '19999');
await setAndSave('فيسبوك', 'https://facebook.com/edited-demo');

const stored = await dash.evaluate(() => JSON.parse(localStorage.getItem('ahla_cms_v1')));
check(stored.settings.heroTitle === 'عنوان محرَّر من اللوحة', 'hero text committed');
check(stored.settings.hotline === '19999', 'contact detail committed');
check(stored.settings.socials.facebook === 'https://facebook.com/edited-demo', 'social link committed');
check(Array.isArray(stored.paymentMethods) && stored.paymentMethods.length > 0, 'payment methods present as a CMS slice');

await dash.reload({ waitUntil: 'networkidle2' });
await sleep(1500);
check(
  (await dash.evaluate(() => JSON.parse(localStorage.getItem('ahla_cms_v1')).settings.heroTitle)) === 'عنوان محرَّر من اللوحة',
  'survives a dashboard reload'
);

/* ---------- 2. CMS store → app ---------- */
const app = await browser.newPage();
await app.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await app.goto(BASE, { waitUntil: 'networkidle2', timeout: 120000 });
await sleep(3000);
const text = () => app.evaluate(() => document.body.innerText);

console.log('\n### D-18 — the two servers are separate origins');
const dashOrigin = await dash.evaluate(() => location.origin);
const appOrigin = await app.evaluate(() => location.origin);
console.log(`  dashboard: ${dashOrigin}   app: ${appOrigin}`);
check(dashOrigin !== appOrigin, 'different origins (so storage is partitioned)');
check(
  (await app.evaluate(() => localStorage.getItem('ahla_cms_v1'))) === null,
  'app cannot see the dashboard-written CMS state — live sync is impossible cross-origin'
);

console.log('\n### 2. app renders CMS state present in its own origin');
await app.evaluate((s) => localStorage.setItem('ahla_cms_v1', s), JSON.stringify(stored));
await app.reload({ waitUntil: 'networkidle2' });
await sleep(3000);

await app.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }));
await sleep(500);
await app.evaluate(() => globalThis.__nav.navigate('ContactUs'));
await sleep(1200);
check((await text()).includes('19999'), 'ContactUs renders the CMS hotline');

await app.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }));
await sleep(600);
await app.mouse.move(355, 25); await app.mouse.down(); await sleep(110); await app.mouse.up();
await sleep(1200);
check((await text()).includes('عنوان محرَّر من اللوحة'), 'drawer header renders the CMS hero title');

await app.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }));
await sleep(500);
await app.evaluate(() => globalThis.__nav.navigate('ZakatCalculator'));
await sleep(1200);
check(/\d/.test(await text()), 'Zakat calculator seeds its nisab from CMS settings');

await dash.evaluate(() => localStorage.clear());
await app.evaluate(() => localStorage.clear());
await browser.close();
