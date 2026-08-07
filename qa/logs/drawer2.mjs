import { launch, boot } from './lib.mjs';
import { sleep, state } from './lib2.mjs';
const {browser,page}=await launch();
await boot(page);
const open=async()=>{await page.mouse.move(355,25);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1100);};
// click a label INSIDE the drawer panel only (drawer width 296, anchored right)
async function tapDrawer(label){
  const box=await page.evaluate((l)=>{
    const hits=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()===l)
      .map(e=>({e,r:e.getBoundingClientRect()}))
      .filter(o=>o.r.width>0&&o.r.height>0&&o.r.left>=window.innerWidth-300);
    if(!hits.length) return null;
    hits[0].e.scrollIntoView({block:'center'});
    const r=hits[0].e.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  },label);
  if(!box) return false;
  await page.mouse.move(box.x,box.y);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1000);
  return true;
}
const T=[['الرئيسية','Main/Home'],['حالات عاجلة','UrgentCases'],['اكفل أسرة','Sponsorship'],['المشروعات','Projects'],
['خدماتنا','?Discover'],['الاستشارات','Consultations'],['طرق التبرع','Main/Donate'],['حسابي','?Profile'],
['الإشعارات','Notifications'],['حاسبة الزكاة','ZakatCalculator'],['عن الجمعية','About'],['أخبارنا','?News'],
['انضم متطوعاً','Volunteer'],['تواصل معنا','ContactUs'],['الأسئلة الشائعة','Faq'],['سياسة الخصوصية','PrivacyPolicy'],
['لوحة مقدم الاستشارة','ConsultantDashboard']];
console.log('label                  | declared target | resulting route | verdict');
for(const [label,target] of T){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(450);
  await open();
  const ok=await tapDrawer(label);
  const s=await state(page);
  const moved = s.route!=='Main/Home' || label==='الرئيسية';
  console.log(`${label.padEnd(22)} | ${target.padEnd(15)} | ${(ok?s.route:'NOT-FOUND').padEnd(15)} | ${ok?(moved?'navigates':'DEAD BUTTON — no navigation'):'not found'}`);
}
await browser.close();
