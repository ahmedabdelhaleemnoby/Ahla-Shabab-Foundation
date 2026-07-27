/**
 * D-17, payment-methods half — the Donate screen must read the CMS
 * `paymentMethods` slice rather than the compiled constant.
 *
 * Payment methods live on step 4 of a 5-step wizard, so the harness has to walk
 * الوجهة → الاختيار → المبلغ before it can assert anything. A test that only
 * loads the Donate route sees an empty method list and reports a false failure.
 */
import { launch, boot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { pressExact } from './formlib.mjs';

const METHODS = ['بطاقة بنكية', 'فوري', 'إنستاباي', 'فودافون كاش', 'تحويل بنكي'];
const check = (ok, l) => console.log(`${ok ? 'PASS' : 'FAIL'} | ${l}`);

const { browser, page } = await launch();
await boot(page);
const body = () => page.evaluate(() => document.body.innerText);
const lines = async () => (await body()).split('\n').map((s) => s.trim()).filter(Boolean);

/** Walk the wizard to step 4 (اختر طريقة الدفع) and return its text. */
async function toPaymentStep() {
  await page.evaluate(() => globalThis.__nav.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Donate' } }] }));
  await sleep(1400);
  await pressExact(page, 'حالة إنسانية');           // 1 — destination
  await pressExact(page, 'التالي');
  await sleep(600);
  const caseRow = (await lines()).find((s) => /^أسرة رقم/.test(s));
  if (caseRow) await pressExact(page, caseRow);      // 2 — pick a case
  await pressExact(page, 'التالي');
  await sleep(700);
  await pressExact(page, 'التالي');                  // 3 — amount (preset preselected)
  await sleep(800);
  return body();
}

console.log('### compiled defaults');
let t = await toPaymentStep();
check(t.includes('اختر طريقة الدفع'), 'reached the payment step');
const seen = METHODS.filter((m) => t.includes(m));
check(seen.length === METHODS.length, `all ${METHODS.length} default methods render (${seen.length}/${METHODS.length})`);
console.log(`  seen: ${seen.join(', ')}`);

console.log('\n### CMS override (authored in the app origin)');
await page.evaluate(() => {
  localStorage.setItem(
    'ahla_cms_v1',
    JSON.stringify({
      version: 5, menu: [], home: [], pages: [], media: [], consultations: [], activity: [], settings: {},
      paymentMethods: [
        { id: 'بطاقة بنكية', group: 'دفع إلكتروني', description: 'وصف محرَّر من اللوحة', availability: 'غير متاحة حالياً', manual: false },
        { id: 'تحويل بنكي', group: 'تحويل بنكي', description: 'تحويل بنكي فقط', availability: 'متاحة', manual: true },
      ],
    })
  );
});
await page.reload({ waitUntil: 'networkidle2' });
await sleep(3000);
t = await toPaymentStep();
const seen2 = METHODS.filter((m) => t.includes(m));
check(t.includes('وصف محرَّر من اللوحة'), 'CMS-authored description reaches the Donate screen');
check(!t.includes('فوري') && !t.includes('إنستاباي'), 'methods removed in the CMS are no longer offered');
check(t.includes('غير متاحة حالياً'), 'CMS availability is respected');
console.log(`  seen: ${seen2.join(', ')}`);

await page.evaluate(() => localStorage.clear());
await browser.close();
