import { launch, boot, nav, shot, sleep } from './lib.mjs';
const LABELS=['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];
const state = (page)=>page.evaluate((labels)=>{
  const rs=globalThis.__nav.getRootState();
  const cur=rs.routes[rs.index];
  const els=[...document.querySelectorAll('div')];
  const c=els.filter(e=>{const t=e.innerText||'';return labels.every(l=>t.includes(l));});
  let barVisible=false;
  if(c.length){const b=c[c.length-1];const r=b.getBoundingClientRect();barVisible=r.height>10;}
  return {stackDepth:rs.routes.length, top:cur.name,
    tab: cur.state? cur.state.routes[cur.state.index].name : null, barVisible};
},LABELS);

const {browser,page}=await launch();
await boot(page);

console.log('# About tab back-arrow behaviour');
await nav(page,'Main',{screen:'About'});
console.log('before  ', JSON.stringify(await state(page)));
// click the AppBar back arrow (top-right chevron)
await page.evaluate(()=>{ // find the appbar back pressable near top-right
  const els=[...document.querySelectorAll('div[tabindex], div')];
  const cands=els.filter(e=>{const r=e.getBoundingClientRect();return r.top<110&&r.top>=0&&r.width>40&&r.width<80&&r.height>40&&r.height<80&&r.left>250;});
  if(cands.length) cands[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));
});
await sleep(1000);
console.log('after   ', JSON.stringify(await state(page)));
await shot(page,'about-after-back');
await browser.close();
