import { launch, boot, nav, shot } from './lib.mjs';
import { sleep, state } from './lib2.mjs';
import { pressExact } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const openDrawer=async()=>{await page.mouse.move(355,25);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1100);};
await openDrawer();
const items=await page.evaluate(()=>document.body.innerText.split('\n').map(s=>s.trim()).filter(Boolean));
console.log('drawer items:',items.join(' | '));
await shot(page,'drawer');
const TARGETS=[['الرئيسية','Main/Home'],['حالات عاجلة','Main/UrgentCases'],['اكفل أسرة','Sponsorship'],['المشروعات','Projects'],
 ['خدماتنا','ServicesBrowse'],['الاستشارات','Main/Consultations'],['طرق التبرع','PaymentInfo'],['حسابي','AccountSettings'],
 ['الإشعارات','Notifications'],['حاسبة الزكاة','ZakatCalculator'],['عن الجمعية','Main/About'],['لوحة مقدم الاستشارة','ConsultantDashboard'],
 ['تسجيل الدخول','EmailAuth']];
console.log('\n## drawer navigation');
for(const [label,expect] of TARGETS){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(500);
  await openDrawer();
  // scroll drawer list to find item
  await page.evaluate((l)=>{const e=[...document.querySelectorAll('div')].filter(x=>(x.innerText||'').trim()===l)
    .sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height)[0]; if(e)e.scrollIntoView({block:'center'});},label);
  await sleep(400);
  const ok=await pressExact(page,label);
  const s=await state(page);
  console.log(`${ok&&s.route===expect?'PASS':'FAIL'} | ${label.padEnd(22)} exp ${expect.padEnd(20)} got ${ok?s.route:'NOT-FOUND'}`);
}
await browser.close();
