/**
 * D-10, D-11, D-12, D-15 — the low-severity layout and link defects.
 *
 * D-11 note: the raised donate button is legitimately taller than its
 * neighbours, so the assertion compares only the four plain items. An earlier
 * version included it and reported a false failure.
 */
import puppeteer from 'puppeteer-core';
import { CHROME, BASE, SHOTS, sleep } from './lib.mjs';

const LABELS = ['الأسر', 'الحالات العاجلة', 'تبرع', 'الاستشارات', 'اعرف عنا'];
const check = (ok, l) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${l}`);

for (const w of [320, 360, 390, 430]) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [`--window-size=${w},800`, '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true });
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 120000 });
  await sleep(3500);
  console.log(`\n===== ${w} px =====`);

  /* D-11 — tab labels must stay on one line so every item is the same height. */
  const tabs = await page.evaluate((L) => {
    const c = [...document.querySelectorAll('div')].filter((e) => {
      const t = e.innerText || '';
      return L.every((l) => t.includes(l));
    });
    const bar = c[c.length - 1];
    return [...bar.children].map((k) => ({
      label: (k.innerText || '').trim().replace(/\n/g, ''),
      h: Math.round(k.getBoundingClientRect().height),
      raised: k.getBoundingClientRect().height > 60, // the donate button, taller by design
      clipped: [...k.querySelectorAll('div')].some(
        (e) => L.includes((e.innerText || '').trim()) && e.scrollWidth > e.clientWidth + 1
      ),
    }));
  }, LABELS);
  const plain = tabs.filter((t) => !t.raised).map((t) => t.h);
  check(new Set(plain).size === 1, `D-11 plain tab items all one line [${plain.join(',')}]`);
  check(!tabs.some((t) => t.clipped), 'D-11 no tab label clipped');

  /* D-10 — the secondary consultations CTA must show its full label. */
  const cta = await page.evaluate(() => {
    const e = [...document.querySelectorAll('div')].filter(
      (x) => (x.innerText || '').trim() === 'تعرف على الاستشارات' && x.children.length === 0
    )[0];
    return e ? { shown: e.innerText.trim(), clipped: e.scrollWidth > e.clientWidth + 1 } : null;
  });
  check(cta && !cta.clipped, `D-10 consultations CTA not truncated (${cta ? cta.shown : 'NOT FOUND'})`);

  /* D-15 — the two About footer buttons must render at the same height. */
  await page.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'About' } }] }));
  await sleep(1400);
  const footer = await page.evaluate(() =>
    ['تواصل معنا', 'انضم متطوعاً'].map((l) => {
      const t = [...document.querySelectorAll('div')].filter(
        (e) => (e.innerText || '').trim() === l && e.children.length === 0
      )[0];
      return t ? Math.round(t.getBoundingClientRect().height) : null;
    })
  );
  check(footer[0] !== null && footer[0] === footer[1], `D-15 footer button labels equal height [${footer.join(',')}]`);
  await page.screenshot({ path: `${SHOTS}/FIXED-w${w}-about-footer.png`, clip: { x: 0, y: 800 - 150, width: w, height: 100 } });

  /* D-12 — a social button that just reopens the website is dead; hide it until
     a distinct URL is configured, and show it once one is. */
  await page.evaluate(() => globalThis.__nav.navigate('ContactUs'));
  await sleep(1400);
  check(!(await page.evaluate(() => document.body.innerText)).includes('تابعنا على'), 'D-12 social row hidden while URLs are placeholders');

  await page.evaluate(() => {
    localStorage.setItem(
      'ahla_cms_v1',
      JSON.stringify({
        version: 5, menu: [], home: [], pages: [], media: [], consultations: [], activity: [], paymentMethods: [],
        settings: { socials: { facebook: 'https://facebook.com/ahlashabab', instagram: '', youtube: '', twitter: '' } },
      })
    );
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(3500);
  await page.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }));
  await sleep(500);
  await page.evaluate(() => globalThis.__nav.navigate('ContactUs'));
  await sleep(1400);
  const withSocial = await page.evaluate(() => document.body.innerText);
  check(withSocial.includes('تابعنا على') && withSocial.includes('فيسبوك'), 'D-12 configured network appears');
  check(!withSocial.includes('إنستجرام'), 'D-12 unconfigured networks stay hidden');
  await page.evaluate(() => localStorage.clear());

  await browser.close();
}
