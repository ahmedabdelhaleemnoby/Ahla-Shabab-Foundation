import { launch, boot, nav, shot } from './lib.mjs';
import { sleep, state } from './lib2.mjs';
import { fillByPlaceholder, pressExact } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const open=async()=>{await page.mouse.move(355,25);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1100);};
const body=()=>page.evaluate(()=>document.body.innerText);

console.log('### D-01 RETEST — previously dead drawer buttons');
for(const [label,expect] of [['خدماتنا','ServicesBrowse'],['حسابي','AccountSettings'],['أخبارنا','NewsFeed']]){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(500);
  await open();
  const box=await page.evaluate((l)=>{const h=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()===l)
    .map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.width>0&&o.r.height>0);
    const o=h[h.length-1]; if(!o)return null; o.e.scrollIntoView({block:'center'});
    const r=o.e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};},label);
  if(!box){console.log(`${label}: NOT FOUND`);continue;}
  await page.mouse.move(box.x,box.y);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1100);
  const s=await state(page);
  console.log(`${(s.route===expect)?'PASS':'FAIL'} | ${label.padEnd(12)} exp ${expect.padEnd(16)} got ${s.route}`);
}

console.log('\n### D-01 REGRESSION — previously working drawer items still work');
for(const [label,expect] of [['الرئيسية','Main/Home'],['حالات عاجلة','Main/UrgentCases'],['اكفل أسرة','Sponsorship'],
  ['المشروعات','Projects'],['طرق التبرع','Main/Donate'],['الإشعارات','Notifications'],['حاسبة الزكاة','ZakatCalculator'],
  ['عن الجمعية','Main/About'],['انضم متطوعاً','Volunteer'],['تواصل معنا','ContactUs'],['الأسئلة الشائعة','Faq'],
  ['سياسة الخصوصية','PrivacyPolicy'],['لوحة مقدم الاستشارة','ConsultantDashboard']]){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(450);
  await open();
  const box=await page.evaluate((l)=>{const h=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()===l)
    .map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.width>0&&o.r.height>0);
    const o=h[h.length-1]; if(!o)return null; o.e.scrollIntoView({block:'center'});
    const r=o.e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};},label);
  if(!box){console.log(`FAIL | ${label} NOT FOUND`);continue;}
  await page.mouse.move(box.x,box.y);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1000);
  const s=await state(page);
  console.log(`${(s.route===expect)?'PASS':'FAIL'} | ${label.padEnd(22)} exp ${expect.padEnd(20)} got ${s.route}`);
}
await browser.close();
