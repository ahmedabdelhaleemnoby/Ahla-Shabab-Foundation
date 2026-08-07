import { launch, boot, nav, shot, sleep } from './lib.mjs';
const LABELS=['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];
const state=(page)=>page.evaluate((labels)=>{
  const rs=globalThis.__nav.getRootState();
  const cur=rs.routes[rs.index];
  const els=[...document.querySelectorAll('div')];
  const c=els.filter(e=>{const t=e.innerText||'';return labels.every(l=>t.includes(l));});
  let bar=false; if(c.length){const b=c[c.length-1];bar=b.getBoundingClientRect().height>10;}
  return {depth:rs.routes.length, top:cur.name, tab:cur.state?cur.state.routes[cur.state.index].name:null, bar};
},LABELS);

/** real mouse click at the centre of the innermost element containing text */
async function tap(page,needle,nth=0){
  const box=await page.evaluate((n,i)=>{
    const els=[...document.querySelectorAll('div,span')];
    const hits=els.filter(e=>{const t=(e.innerText||'').trim();
      if(!t.includes(n)) return false;
      return ![...e.children].some(c=>(c.innerText||'').includes(n));});
    const e=hits[i]; if(!e) return null;
    const r=e.getBoundingClientRect();
    if(r.width===0||r.height===0) return null;
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  },needle,nth);
  if(!box) return false;
  await page.mouse.click(box.x,box.y);
  await sleep(900); return true;
}

const {browser,page}=await launch();
await boot(page);
const rows=[];
async function step(src,label,needle,expect,nth=0){
  const ok=await tap(page,needle,nth);
  const s=await state(page);
  const actual = s.top==='Main' ? `Main/${s.tab}` : s.top;
  rows.push({src,label,expect,actual:ok?actual:'NOT-FOUND',pass:ok&&actual===expect,bar:s.bar});
  console.log(`${ok?'':'[missing] '}${src} -> ${label.padEnd(24)} expect=${expect.padEnd(22)} actual=${ok?actual:'NOT-FOUND'} bar=${s.bar} ${ok&&actual===expect?'PASS':'FAIL'}`);
}

console.log('## Bottom tabs (real clicks)');
await nav(page,'Main',{screen:'Home'});
await step('TabBar','tab الأسر','الأسر','Main/Cases');
await step('TabBar','tab الحالات العاجلة','الحالات العاجلة','Main/UrgentCases');
await step('TabBar','tab تبرع','تبرع','Main/Donate');
await step('TabBar','tab الاستشارات','الاستشارات','Main/Consultations');
await step('TabBar','tab اعرف عنا','اعرف عنا','Main/About');

console.log('\n## About screen back arrow + CTAs');
await step('About','تواصل معنا','تواصل معنا','ContactUs');
await nav(page,'Main',{screen:'About'});
await step('About','انضم متطوعاً','انضم متطوع','Volunteer');
await nav(page,'Main',{screen:'About'});
await step('About','governorate chip أسوان','أسوان','GovernorateActivity');
await nav(page,'Main',{screen:'About'});
await step('About','عرض الكل (news)','عرض الكل','NewsFeed');

console.log('\n## Home CTAs');
await nav(page,'Main',{screen:'Home'});
await step('Home','تبرع الآن','تبرع الآن','Main/Donate');
await nav(page,'Main',{screen:'Home'});
await step('Home','حالات التبرع','حالات التبرع','Main/Cases');
await nav(page,'Main',{screen:'Home'});
await step('Home','احجز استشارة','احجز استشارة','Main/Consultations');
await nav(page,'Main',{screen:'Home'});
await step('Home','تعرف على الاستشارات','تعرف على الاستشارات','ServicesBrowse');
await nav(page,'Main',{screen:'Home'});
await step('Home','اكفل أسرة شهرياً','اكفل أسرة شهرياً','Sponsorship');
await nav(page,'Main',{screen:'Home'});
await step('Home','تبرع للحالة','تبرع للحالة','CaseDetail');
await nav(page,'Main',{screen:'Home'});
await step('Home','دعم المشروع','دعم المشروع','ProjectDetail');
await nav(page,'Main',{screen:'Home'});
await step('Home','عرض الكل (urgent)','عرض الكل','Main/UrgentCases');

console.log('\n### SUMMARY'); 
console.log('pass', rows.filter(r=>r.pass).length, '/', rows.length);
console.log(JSON.stringify(rows,null,1));
await browser.close();
