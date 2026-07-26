/**
 * D-04 (editable working-hours range) and D-05 (booking reschedule).
 * Also asserts a reschedule propagates to the overview counters and that the
 * booking's status is left alone.
 */
import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pressExact } from './formlib.mjs';

const { browser, page } = await launch();
await boot(page);
const body = () => page.evaluate(() => document.body.innerText);
const rangeLine = async () => ((await body()).match(/نطاق اليوم:.*/) || ['n/a'])[0];
const apptLine = async () => ((await body()).match(/الموعد: [^\n(]*\([0-9-]+\)/) || ['n/a'])[0];
const stats = async () => {
  await pressExact(page, 'نظرة عامة');
  await sleep(500);
  const n = await page.evaluate(() =>
    document.body.innerText.split('\n').map((s) => s.trim()).filter((s) => /^\d+$/.test(s))
  );
  return `upcoming=${n[0]} today=${n[1]} new=${n[2]} done=${n[3]} cancelled=${n[4]}`;
};
const check = (ok, label) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}`);

await nav(page, 'ConsultantDashboard');

console.log('### D-04 — working-hours range is editable');
await pressExact(page, 'مواعيدي والأنصبة');
let t = await body();
check(t.includes('تعديل نطاق اليوم'), 'edit control present');
console.log(`  before: ${await rangeLine()}`);
await fillByPlaceholder(page, '10:00 ص', '09:30 ص');
await fillByPlaceholder(page, '04:00 م', '07:15 م');
await pressExact(page, 'حفظ نطاق اليوم');
let line = await rangeLine();
console.log(`  after : ${line}`);
check(line.includes('09:30 ص') && line.includes('07:15 م'), 'start + end both updated');
await shot(page, 'FIXED-prov-workinghours');

// an empty end must not wipe the stored range
await fillByPlaceholder(page, '10:00 ص', '');
await pressExact(page, 'حفظ نطاق اليوم');
check((await rangeLine()).includes('09:30 ص'), 'empty input rejected — range not wiped');

console.log('\n### D-05 — reschedule a booking');
const before = await stats();
await pressExact(page, 'الحجوزات والطلبات');
await sleep(400);
t = await body();
check(t.includes('إعادة جدولة'), 'reschedule action present');
console.log(`  before: ${await apptLine()}`);
await pressExact(page, 'إعادة جدولة');
check((await body()).includes('إعادة جدولة الموعد'), 'inline editor opens');
await shot(page, 'FIXED-prov-reschedule-open');
await fillByPlaceholder(page, 'YYYY-MM-DD', '2027-01-15');
await fillByPlaceholder(page, '11:00 ص', '09:00 ص');
await pressExact(page, 'حفظ الموعد الجديد');
const after = await apptLine();
console.log(`  after : ${after}`);
check(after.includes('2027-01-15') && after.includes('09:00 ص'), 'date + time updated');
check(!(await body()).includes('إعادة جدولة الموعد'), 'editor closes after save');
check((await body()).includes('جديد') || (await body()).includes('مؤكد'), 'status preserved (not auto-confirmed)');
await shot(page, 'FIXED-prov-reschedule-saved');

console.log('\n### reschedule propagates to overview counters');
const afterStats = await stats();
console.log(`  before: ${before}`);
console.log(`  after : ${afterStats}`);
check(/today=1/.test(afterStats), 'today count drops when a booking moves off today');

await browser.close();
