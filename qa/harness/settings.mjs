/**
 * D-08 — dashboard-authored impact numbers reach the app's About screen.
 * D-09 — consultation email is required and never collapses guests into one identity.
 *
 * D-08 is exercised by writing CMS state to the shared localStorage key, which is
 * exactly what the dashboard does; see settings-dashboard.mjs for the editor side.
 */
import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pressExact, pickNextSelect } from './formlib.mjs';

const { browser, page } = await launch();
await boot(page);
const body = () => page.evaluate(() => document.body.innerText);
const check = (ok, l) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${l}`);
const openAbout = async () => {
  await page.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'About' } }] }));
  await sleep(1200);
};
const writeStats = (stats) =>
  page.evaluate((s) => {
    const KEY = 'ahla_cms_v1';
    const raw = localStorage.getItem(KEY);
    const st = raw ? JSON.parse(raw) : { version: 4, menu: [], home: [], pages: [], media: [], consultations: [], activity: [], settings: {} };
    st.menu = st.menu || []; st.home = st.home || []; st.pages = st.pages || [];
    st.settings = { ...(st.settings || {}), stats: s };
    localStorage.setItem(KEY, JSON.stringify(st));
  }, stats);
const reload = async () => {
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(3000);
};

console.log('### D-08 — About stats are CMS-driven');
await openAbout();
check((await body()).includes('1.2M+'), 'compiled defaults render with no CMS override');

await writeStats({ governorates: '25', beneficiaries: '999K+', yearsOfService: '40' });
await reload();
await openAbout();
let t = await body();
check(t.includes('999K+') && t.includes('40'), 'dashboard-authored stats reach the About screen');
check(!t.includes('1.2M+'), 'previous hardcoded value no longer shown');
await shot(page, 'FIXED-about-cms-stats');

// a partial blob must not blank the UI — each field falls back independently
await writeStats({ beneficiaries: '777K+' });
await reload();
await openAbout();
t = await body();
check(t.includes('777K+') && t.includes('12'), 'partial stats fall back per field (777K+ + default 12)');
await page.evaluate(() => localStorage.clear());
await reload();

console.log('\n### D-09 — consultation email required');
await page.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }));
await sleep(600);
await nav(page, 'ConsultationRequest', { type: 'نفسية' });
t = await body();
check(!/البريد الإلكتروني \(اختياري\)/.test(t), 'email no longer labelled (اختياري)');

await fillByPlaceholder(page, 'اكتب اسمك', 'بدون بريد');
await fillByPlaceholder(page, '01xxxxxxxxx', '01011112222');
await fillByPlaceholder(page, 'العمر', '33');
for (const o of ['القاهرة', 'واتساب', 'أي وقت', 'قلق وتوتر', 'لا']) await pickNextSelect(page, o);
await fillByPlaceholder(page, 'اشرح باختصار ما تريد الاستشارة بشأنه...', 'محاولة إرسال بدون بريد إلكتروني.');
await pressExact(page, 'أوافق على أن تُعالَج بياناتي بسرية لغرض الاستشارة فقط *');
await pressExact(page, 'إرسال الطلب');
t = await body();
check(!t.includes('تم استلام الطلب بنجاح'), 'submission blocked without an email');
check(t.includes('أدخل بريدك الإلكتروني لمتابعة طلبك لاحقاً'), 'required-email validation message shown');
await shot(page, 'FIXED-consult-email-required');

await fillByPlaceholder(page, 'example@mail.com', 'required@test.com');
await pressExact(page, 'إرسال الطلب');
check((await body()).includes('تم استلام الطلب بنجاح'), 'submits once an email is supplied');

console.log('\n### D-09 — deduplication unaffected by the change');
const submit = async (email) => {
  await page.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }));
  await sleep(600);
  await nav(page, 'ConsultationRequest', { type: 'نفسية' });
  await fillByPlaceholder(page, 'اكتب اسمك', 'مكرر تجريبي');
  await fillByPlaceholder(page, '01xxxxxxxxx', '01033334444');
  await fillByPlaceholder(page, 'example@mail.com', email);
  await fillByPlaceholder(page, 'العمر', '28');
  for (const o of ['الجيزة', 'واتساب', 'أي وقت', 'قلق وتوتر', 'لا']) await pickNextSelect(page, o);
  await fillByPlaceholder(page, 'اشرح باختصار ما تريد الاستشارة بشأنه...', 'اختبار إزالة التكرار بعد التعديل.');
  await pressExact(page, 'أوافق على أن تُعالَج بياناتي بسرية لغرض الاستشارة فقط *');
  await pressExact(page, 'إرسال الطلب');
  return ((await body()).match(/[A-Z]{2}-[0-9]+/) || [null])[0];
};
const r1 = await submit('Dedup@Test.COM');
const r2 = await submit('  dedup@test.com  ');
console.log(`  refs: ${r1}, ${r2}`);

await page.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }));
await sleep(500);
await nav(page, 'EmailAuth');
await fillByPlaceholder(page, 'example@mail.com', 'DEDUP@test.com');
await pressExact(page, 'إرسال رمز التحقق');
await page.evaluate(() => {
  const el = [...document.querySelectorAll('input')].find((e) => e.maxLength === 6);
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '123456');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(300);
await pressExact(page, 'تأكيد');
const st = await page.evaluate(() => globalThis.__appState.get());
console.log(`  identity: ${st.email} | linked: ${st.consultations.length} (${st.consultations.map((c) => c.reference).join(', ')})`);
check(st.email === 'dedup@test.com' && st.consultations.length === 2, 'case/whitespace variants share one identity');

await browser.close();
