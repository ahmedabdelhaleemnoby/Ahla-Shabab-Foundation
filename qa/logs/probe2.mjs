import { launch, boot, nav } from './lib.mjs';
import { sleep } from './lib2.mjs';
const {browser,page}=await launch();
await boot(page);
await nav(page,'ConsultationRequest',{type:'نفسية'});
const info=async(tag)=>{
  const d=await page.evaluate(()=>({
    hasCairo:[...document.querySelectorAll('div')].some(e=>(e.innerText||'').trim()==='القاهرة'),
    bodyLen:document.body.innerText.length,
    divs:document.querySelectorAll('div').length,
  }));
  console.log(tag,JSON.stringify(d));
};
await info('before');
const box=await page.evaluate(()=>{
  const els=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()==='اختر...');
  const e=els[0]; e.scrollIntoView({block:'center'});
  const r=e.getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};
});
console.log('box',box);
await page.mouse.move(box.x,box.y);
await page.mouse.down(); await sleep(120); await page.mouse.up();
await sleep(1200);
await info('after real down/up');
console.log('option list sample:',await page.evaluate(()=>[...document.querySelectorAll('div')].filter(e=>['القاهرة','الجيزة','أسوان'].includes((e.innerText||'').trim())).length));
await browser.close();
