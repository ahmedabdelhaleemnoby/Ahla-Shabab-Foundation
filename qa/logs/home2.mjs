import { launch, boot, shot } from './lib.mjs';
import { state, tapExact, scrollToText, sleep } from './lib2.mjs';
const {browser,page}=await launch();
await boot(page);
const reset=async(tab)=>{ await page.evaluate((t)=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:t}}]}),tab); await sleep(1200); };
for(const [needle,expect] of [['تبرع الآن','Main/Donate'],['اكفل أسرة شهرياً','Sponsorship'],['تبرع للحالة','CaseDetail'],['دعم المشروع','ProjectDetail'],['عرض الكل','Main/UrgentCases'],['عرض المزيد','Projects']]){
  await reset('Home');
  const found=await scrollToText(page,needle);
  const ok=await tapExact(page,needle);
  const s=await state(page);
  console.log(`${(ok&&s.route===expect)?'PASS':'FAIL'} | ${needle.padEnd(22)} | scrolled=${found} clicked=${ok} | exp ${expect.padEnd(18)} got ${ok?s.route:'NOT-FOUND'}`);
}
await browser.close();
