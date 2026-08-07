import puppeteer from 'puppeteer-core';

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const BASE = 'http://localhost:8087';
export const SHOTS = '/Volumes/PortableSSD/Ahla Shabab Foundation/qa/screenshots/mobile';

export async function launch(width = 390, height = 844) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [`--window-size=${width},${height}`, '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const requests = [];
  page.on('request', (r) => requests.push(`${r.method()} ${r.url()}`));
  return { browser, page, logs, requests };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function boot(page) {
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 120000 });
  await sleep(2500);
}

/** Navigate via the app's dev nav ref (exposed as globalThis.__nav in __DEV__). */
export async function nav(page, name, params) {
  await page.evaluate(
    (n, p) => globalThis.__nav.navigate(n, p),
    name,
    params ?? undefined
  );
  await sleep(900);
}

export async function shot(page, file) {
  await page.screenshot({ path: `${SHOTS}/${file}.png` });
  return file;
}

/** All visible text on screen, RTL-normalized to lines. */
export async function text(page) {
  return page.evaluate(() => document.body.innerText);
}

/** Find a clickable element whose text contains `s`, and click it. */
export async function tapText(page, s, nth = 0) {
  const handle = await page.evaluateHandle((needle, index) => {
    const els = [...document.querySelectorAll('div,span,button,a,input')];
    const hits = els.filter((e) => {
      const t = (e.innerText || '').trim();
      if (!t.includes(needle)) return false;
      // prefer the innermost element containing the text
      return ![...e.children].some((c) => (c.innerText || '').includes(needle));
    });
    return hits[index] || null;
  }, s, nth);
  const el = handle.asElement();
  if (!el) throw new Error(`tapText: no element containing "${s}"`);
  await el.click();
  await sleep(800);
  return true;
}
