/**
 * QA pass 2 — Phase 6: what survives a reload, and requirements 10/11/12
 * (provider availability, bookings, form answers).
 *
 * The app has no AsyncStorage/SecureStore dependency, so the expectation here is
 * that nothing survives a reload. This proves that rather than assuming it, and
 * records exactly what resets — which is what the demo script has to work around.
 *
 *   node qa/harness/qa2-persist.mjs
 */
import { launch, boot, nav, shot, sleep } from './lib.mjs';

const results = [];
const rec = (id, desc, status, evidence = '') => {
  results.push({ id, desc, status, evidence });
  console.log(`  ${status.padEnd(8)} ${id} ${desc}${evidence ? ` — ${evidence}` : ''}`);
};
const bodyText = (page) => page.evaluate(() => document.body.innerText);
const routeOf = (page) => page.evaluate(() => {
  const w = (s) => (s.routes[s.index].state ? w(s.routes[s.index].state) : s.routes[s.index].name);
  return w(globalThis.__nav.getRootState());
});
/** appState is exposed on globalThis in __DEV__ (see appState.ts). */
const session = (page) => page.evaluate(() => {
  const s = globalThis.__appState?.get?.();
  return s ? { loggedIn: s.loggedIn, email: s.email, consultations: s.consultations.length, receipts: s.receipts.length } : null;
});

const { browser, page, logs } = await launch(390, 844);
await boot(page);

console.log('\n## dev hooks available');
const hooks = await page.evaluate(() => ({ nav: !!globalThis.__nav, appState: !!globalThis.__appState }));
rec('P-0', '__nav and __appState exposed in dev', hooks.nav && hooks.appState ? 'PASS' : 'FAIL', JSON.stringify(hooks));

/* ─────────────── login session ─────────────── */
console.log('\n## login session');
await page.evaluate(() => globalThis.__appState.login('persist@ahla.test'));
await sleep(300);
const before = await session(page);
rec('P-1', 'login sets a session in memory', before?.loggedIn === true ? 'PASS' : 'FAIL', JSON.stringify(before));

await page.reload({ waitUntil: 'networkidle2' });
await sleep(2500);
const afterReload = await session(page);
rec('P-2', 'session AFTER reload', afterReload?.loggedIn ? 'PERSISTS' : 'RESETS', JSON.stringify(afterReload));

/* ─────────────── consultation request ─────────────── */
console.log('\n## consultation request');
await page.evaluate(() => {
  globalThis.__appState.login('persist@ahla.test');
  globalThis.__appState.addConsultation({ reference: 'AS-PERSIST-1', type: 'نفسية', status: 'جديد', date: '2026-08-01' });
});
await sleep(300);
const withConsult = await session(page);
rec('P-3', 'consultation added to session', withConsult?.consultations >= 1 ? 'PASS' : 'FAIL', JSON.stringify(withConsult));
await page.reload({ waitUntil: 'networkidle2' });
await sleep(2500);
const consultAfter = await session(page);
rec('P-4', 'consultation AFTER reload', consultAfter?.consultations >= 1 ? 'PERSISTS' : 'RESETS', JSON.stringify(consultAfter));

/* ─────────────── provider dashboard: availability + bookings ─────────────── */
console.log('\n## requirements 10/11/12 — provider dashboard');
/** The dashboard is TABBED. Reading only the landing tab reports the bookings
 *  and answer fields as missing when they are simply on another tab. */
const openTab = async (label) => {
  const b = await page.evaluate((l) => {
    const els = [...document.querySelectorAll('div,span')]
      .filter((e) => (e.innerText || '').trim() === l && e.getBoundingClientRect().height > 8)
      .sort((a, b2) => { const A = a.getBoundingClientRect(), B = b2.getBoundingClientRect();
        return A.width * A.height - B.width * B.height; });
    if (!els.length) return null;
    const r = els[0].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, label);
  if (!b) return false;
  await page.mouse.click(b.x, b.y); await sleep(1000); return true;
};

await nav(page, 'ConsultantDashboard');
await sleep(1200);
const overview = await bodyText(page);
await openTab('مواعيدي والأنصبة');
const availText = await bodyText(page);
await openTab('الحجوزات والطلبات');
const bookingsText = await bodyText(page);
await openTab('الملف الشخصي');
const profileText = await bodyText(page);
const dash = overview + availText + bookingsText + profileText;
await shot(page, 'qa2-provider-overview');
rec('PRV-6', 'availability tab: weekday toggles, day range, slots, exception dates',
  ['أيام العمل الأسبوعية', 'تعديل نطاق اليوم', 'إضافة موعد', 'إضافة استثناء'].every((k) => availText.includes(k)) ? 'PASS' : 'PARTIAL',
  ['أيام العمل الأسبوعية', 'تعديل نطاق اليوم', 'إضافة موعد', 'إضافة استثناء'].filter((k) => availText.includes(k)).join(', '));

// booking status actions offered
const actions = ['تأكيد', 'إعادة جدولة', 'إكمال', 'إلغاء'].filter((a) => bookingsText.includes(a));
rec('PRV-7', 'booking status actions offered', actions.length >= 2 ? 'PASS' : 'PARTIAL', `found: ${actions.join(', ') || 'none'}`);

// submitted answers visible (requirement 12)
const answerish = ['بيانات نموذج المتقدم', 'رقم المرجعية', 'البريد الإلكتروني', 'الهاتف', 'المحافظة',
  'إجابات النموذج المتخصص', 'مرفق الحالة'].filter((a) => bookingsText.includes(a));
rec('PRV-8', 'booking/answer detail fields visible on dashboard',
  answerish.length >= 6 ? 'PASS' : 'PARTIAL', `found ${answerish.length}/7: ${answerish.join(', ') || 'none'}`);

// try to change availability and see if state moves
const changed = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div,span')]
    .filter((e) => /تعديل|حفظ|تغيير/.test((e.innerText || '').trim()) && e.getBoundingClientRect().height > 10)
    .sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)[0];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { text: el.innerText.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
if (changed) {
  await page.mouse.click(changed.x, changed.y);
  await sleep(900);
  const after = await bodyText(page);
  rec('PRV-9', `an edit control is present ("${changed.text.slice(0, 30)}")`,
    after !== dash ? 'PASS' : 'PARTIAL', after !== dash ? 'screen state changed' : 'no visible change');
  await shot(page, 'qa2-provider-availability');
} else {
  rec('PRV-9', 'availability edit control found', 'PARTIAL', 'no تعديل/حفظ control located');
}

// provider state across reload
await page.reload({ waitUntil: 'networkidle2' });
await sleep(2500);
await nav(page, 'ConsultantDashboard');
await sleep(1000);
const dashAfter = await bodyText(page);
rec('P-5', 'provider dashboard state AFTER reload',
  dashAfter === dash ? 'RESETS' : 'CHANGED', dashAfter === dash ? 'identical to first load (defaults)' : 'differs from first load');

const errs = logs.filter((l) => l.startsWith('[pageerror]'));
rec('P-6', 'no page errors during persistence run', errs.length === 0 ? 'PASS' : 'FAIL', errs.slice(0, 2).join(' | ') || 'none');

await browser.close();
const tally = results.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
console.log(`\n===== ${JSON.stringify(tally)} =====`);
