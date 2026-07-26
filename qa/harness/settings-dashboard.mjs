/**
 * D-08, editor side — the dashboard's "أرقام الأثر" card must commit to the CMS
 * store (and therefore reach the app), not just flip its badge to green.
 * Requires the dashboard dev server: npm run dev --workspace dashboard
 */
import puppeteer from 'puppeteer-core';
import { CHROME, sleep } from './lib.mjs';

const DASH = process.env.DASH_URL ?? 'http://localhost:5173';
const check = (ok, l) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${l}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--window-size=1440,900', '--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${DASH}/settings`, { waitUntil: 'networkidle2', timeout: 120000 });
await sleep(2000);

const impactInputs = () =>
  page.evaluate(() => [...document.querySelectorAll('input.num')].slice(0, 3).map((i) => i.value));

console.log('before      :', await impactInputs());

await page.evaluate(() => {
  const el = [...document.querySelectorAll('input.num')][1]; // beneficiaries
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '3.5M+');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(400);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('حفظ'));
  btn && btn.click();
});
await sleep(800);

console.log('after save  :', await impactInputs());
const stored = await page.evaluate(() => {
  const s = localStorage.getItem('ahla_cms_v1');
  return s ? JSON.parse(s).settings?.stats : null;
});
console.log('stored stats:', JSON.stringify(stored));
check(stored?.beneficiaries === '3.5M+', 'save commits to the CMS store');

const log = await page.evaluate(() => JSON.parse(localStorage.getItem('ahla_cms_v1')).activity[0]);
check(log?.action === 'عدّل أرقام الأثر', 'change recorded in the CMS activity log');

await page.reload({ waitUntil: 'networkidle2' });
await sleep(2000);
console.log('after reload:', await impactInputs());
check((await impactInputs())[1] === '3.5M+', 'survives a dashboard reload');

// Leave storage clean so the mobile suite starts from compiled defaults.
await page.evaluate(() => localStorage.clear());
await browser.close();
