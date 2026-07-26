import { launch, boot } from './lib.mjs';
import { sleep, state } from './lib2.mjs';
const {browser,page}=await launch();
await boot(page);
const open=async()=>{await page.mouse.move(355,25);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1200);};
for(const label of ['الاستشارات','خدماتنا','حسابي','أخبارنا']){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(500);
  await open();
  const info=await page.evaluate((l)=>{
    const hits=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()===l)
      .map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.width>0&&o.r.height>0);
    // drawer item = the LAST one in DOM order (modal appended last)
    const o=hits[hits.length-1]; if(!o) return null;
    o.e.scrollIntoView({block:'center'});
    const r=o.e.getBoundingClientRect();
    return {count:hits.length,x:r.left+r.width/2,y:r.top+r.height/2,left:Math.round(r.left)};
  },label);
  if(!info){console.log(label,'NOT FOUND');continue;}
  await page.mouse.move(info.x,info.y);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1100);
  const s=await state(page);
  console.log(`${label.padEnd(14)} matches=${info.count} clickedLeft=${info.left} -> route=${s.route}`);
}
await browser.close();
