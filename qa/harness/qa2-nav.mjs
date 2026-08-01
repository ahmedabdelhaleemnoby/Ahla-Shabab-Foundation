/**
 * QA pass 2 — Requirement 1: bottom navigation.
 *
 * Asserts against React Navigation's own root state rather than pixels, so a
 * pass means the app really is on that route. Tab-bar visibility is checked by
 * computed style + bounding rect, never DOM presence: the bar stays mounted on
 * inner screens and a presence check reports a false failure.
 *
 *   node qa/harness/qa2-nav.mjs
 */
import { launch, boot, nav, shot, sleep, SHOTS } from './lib.mjs';
import { tapExact } from './lib2.mjs';

const EXPECTED = [
  { route: 'Cases', label: 'الأسر' },
  { route: 'UrgentCases', label: 'الحالات العاجلة' },
  { route: 'Donate', label: 'تبرع' },
  { route: 'Consultations', label: 'الاستشارات' },
  { route: 'About', label: 'اعرف عنا' },
];

const results = [];
const rec = (id, desc, status, evidence) => {
  results.push({ id, desc, status, evidence });
  console.log(`  ${status.padEnd(7)} ${id} ${desc}${evidence ? ` — ${evidence}` : ''}`);
};

/** The tab bar element, identified by containing every tab label. */
const barMetrics = (page) =>
  page.evaluate((labels) => {
    const cands = [...document.querySelectorAll('div')].filter((e) => {
      const t = e.innerText || '';
      return labels.every((l) => t.includes(l));
    });
    if (!cands.length) return { present: false };
    const el = cands[cands.length - 1];
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      present: true,
      visible: r.height > 0 && r.width > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0,
      top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height),
      viewportH: window.innerHeight,
    };
  }, EXPECTED.map((e) => e.label));

/** Visual left-to-right order of the tab labels, for RTL checking. */
const labelOrder = (page) =>
  page.evaluate((labels) => {
    const found = labels.map((l) => {
      const els = [...document.querySelectorAll('div,span')]
        .filter((e) => (e.innerText || '').trim() === l)
        .map((e) => ({ l, r: e.getBoundingClientRect() }))
        .filter((o) => o.r.height > 0 && o.r.top > window.innerHeight * 0.6);
      return els[0] ?? null;
    }).filter(Boolean);
    return found.sort((a, b) => a.r.left - b.r.left).map((o) => o.l);
  }, EXPECTED.map((e) => e.label));

const activeRoute = (page) =>
  page.evaluate(() => {
    const s = globalThis.__nav.getRootState();
    const walk = (st) => {
      const r = st.routes[st.index];
      return r.state ? walk(r.state) : r.name;
    };
    return walk(s);
  });

async function run(width, height, tag) {
  const { browser, page, logs } = await launch(width, height);
  console.log(`\n===== viewport ${width}x${height} =====`);
  await boot(page);
  await nav(page, 'Cases');

  const m = await barMetrics(page);
  rec(`NAV-${tag}-1`, 'tab bar renders', m.present && m.visible ? 'PASS' : 'FAIL', JSON.stringify(m));

  // exactly five items, correct labels
  const count = await page.evaluate((labels) => {
    return labels.filter((l) =>
      [...document.querySelectorAll('div,span')].some((e) => {
        const t = (e.innerText || '').trim();
        const r = e.getBoundingClientRect();
        return t === l && r.height > 0 && r.top > window.innerHeight * 0.6;
      })).length;
  }, EXPECTED.map((e) => e.label));
  rec(`NAV-${tag}-2`, 'exactly 5 labels present in the bar', count === 5 ? 'PASS' : 'FAIL', `${count}/5`);

  const order = await labelOrder(page);
  const expectRtl = [...EXPECTED].map((e) => e.label).reverse(); // right-to-left => reversed L-to-R
  rec(`NAV-${tag}-3`, 'RTL visual order (right→left)', JSON.stringify(order) === JSON.stringify(expectRtl) ? 'PASS' : 'FAIL',
    `L→R: ${order.join(' | ')}`);

  // no stale tabs
  const stale = await page.evaluate(() => {
    const old = ['اكتشف', 'الأخبار', 'حسابي', 'الرئيسية'];
    return old.filter((l) => [...document.querySelectorAll('div,span')].some((e) => {
      const r = e.getBoundingClientRect();
      return (e.innerText || '').trim() === l && r.height > 0 && r.top > window.innerHeight * 0.6;
    }));
  });
  rec(`NAV-${tag}-4`, 'no legacy tabs in the bar', stale.length === 0 ? 'PASS' : 'FAIL', stale.join(',') || 'none');

  // each tab opens its root
  for (const { route, label } of EXPECTED) {
    await nav(page, 'Cases'); await sleep(300);
    let ok = false, actual = 'not-tapped';
    try {
      await tapExact(page, label, { inTabBar: true });
      actual = await activeRoute(page);
      ok = actual === route;
    } catch (e) { actual = `tap failed: ${e.message.slice(0, 40)}`; }
    rec(`NAV-${tag}-5-${route}`, `tap "${label}" → ${route}`, ok ? 'PASS' : 'FAIL', `landed on ${actual}`);
  }

  // bar hidden on pushed screens
  const inner = [
    ['CaseDetail', { id: 'case-1' }],
    ['ConsultationRequest', { type: 'نفسية' }],
    ['EmailAuth', undefined],
  ];
  for (const [screen, params] of inner) {
    try {
      await nav(page, screen, params);
      const mm = await barMetrics(page);
      const hidden = !mm.present || !mm.visible || mm.top >= mm.viewportH;
      rec(`NAV-${tag}-6-${screen}`, `tab bar hidden on ${screen}`, hidden ? 'PASS' : 'FAIL', JSON.stringify(mm));
    } catch (e) {
      rec(`NAV-${tag}-6-${screen}`, `tab bar hidden on ${screen}`, 'BLOCKED', e.message.slice(0, 60));
    }
  }

  // overlap: does the raised Donate button cover content?
  await nav(page, 'Cases'); await sleep(400);
  const overlap = await page.evaluate(() => {
    const bars = [...document.querySelectorAll('div')].filter((e) => (e.innerText || '').includes('تبرع') && (e.innerText || '').includes('اعرف عنا'));
    if (!bars.length) return null;
    const bar = bars[bars.length - 1].getBoundingClientRect();
    // any element with real text whose box intersects the bar's band
    const clipped = [...document.querySelectorAll('div,span')].filter((e) => {
      const t = (e.innerText || '').trim();
      if (!t || t.length < 4) return false;
      if (e.closest('div') && (e.innerText || '').includes('اعرف عنا')) return false;
      const r = e.getBoundingClientRect();
      return r.height > 0 && r.top < bar.bottom && r.bottom > bar.top + 8 && r.left < window.innerWidth;
    }).length;
    return { barTop: Math.round(bar.top), clipped };
  });
  rec(`NAV-${tag}-7`, 'no content clipped behind the bar', overlap ? 'INFO' : 'BLOCKED', JSON.stringify(overlap));

  await shot(page, `qa2-tabbar-${width}`);
  const errs = logs.filter((l) => l.startsWith('[pageerror]') || l.startsWith('[error]'));
  rec(`NAV-${tag}-8`, 'no console/page errors', errs.length === 0 ? 'PASS' : 'FAIL', errs.slice(0, 2).join(' | ') || 'none');
  await browser.close();
}

for (const [w, h, tag] of [[320, 700, '320'], [390, 844, '390'], [430, 932, '430']]) {
  await run(w, h, tag);
}

const tally = results.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
console.log(`\n===== ${JSON.stringify(tally)} =====`);
console.log(`screenshots: ${SHOTS}`);
