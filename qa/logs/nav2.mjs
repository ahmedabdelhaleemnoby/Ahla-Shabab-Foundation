import { launch, boot, nav, shot } from './lib.mjs';
import { state, tapExact, scrollToText, sleep } from './lib2.mjs';
const {browser,page}=await launch();
await boot(page);
const rows=[];
async function step(src,needle,expect,{tabBar=false,reset}={}){
  if(reset) await nav(page,'Main',{screen:reset});
  if(!tabBar) await scrollToText(page,needle);
  const ok=await tapExact(page,needle,{inTabBar:tabBar});
  const s=await state(page);
  const pass= ok && s.route===expect;
  rows.push({src,action:needle,expect,actual:ok?s.route:'ELEMENT-NOT-FOUND',bar:s.bar,pass});
  console.log(`${pass?'PASS':'FAIL'} | ${src.padEnd(14)} | ${needle.padEnd(26)} | exp ${expect.padEnd(22)} | got ${(ok?s.route:'NOT-FOUND').padEnd(22)} | bar=${s.bar}`);
}
console.log('## Bottom tab bar');
for(const [l,e] of [['الأسر','Main/Cases'],['الحالات العاجلة','Main/UrgentCases'],['تبرع','Main/Donate'],['الاستشارات','Main/Consultations'],['اعرف عنا','Main/About']])
  await step('TabBar',l,e,{tabBar:true});

console.log('\n## Home CTAs');
for(const [l,e] of [['تبرع الآن','Main/Donate'],['حالات التبرع','Main/Cases'],['احجز استشارة','Main/Consultations'],
  ['تعرف على الاستشارات','ServicesBrowse'],['اكفل أسرة شهرياً','Sponsorship'],['تبرع للحالة','CaseDetail'],['دعم المشروع','ProjectDetail']])
  await step('Home',l,e,{reset:'Home'});

console.log('\n## About CTAs');
for(const [l,e] of [['تواصل معنا','ContactUs'],['انضم متطوعاً','Volunteer'],['📍 أسوان','GovernorateActivity'],['📍 القاهرة','GovernorateActivity']])
  await step('About',l,e,{reset:'About'});

console.log('\n## SUMMARY  pass='+rows.filter(r=>r.pass).length+'/'+rows.length);
import{writeFileSync}from'fs';
writeFileSync('/private/tmp/claude-501/-Volumes-PortableSSD-Ahla-Shabab-Foundation/7928d13a-c328-483f-8326-f2e109073b0b/scratchpad/nav-rows.json',JSON.stringify(rows,null,1));
await browser.close();
