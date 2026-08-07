import { launch, boot, nav } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
await nav(page,'ConsultationRequest',{type:'نفسية'});
console.log('inputs:',await page.evaluate(()=>[...document.querySelectorAll('input,textarea')].map(e=>({tag:e.tagName,ph:e.placeholder,ml:e.maxLength}))));
await fillByPlaceholder(page,'اكتب اسمك','أحمد تجريبي');
await fillByPlaceholder(page,'example@mail.com','Test@Example.COM');
console.log('after fill:',await page.evaluate(()=>[...document.querySelectorAll('input,textarea')].map(e=>e.value)));
console.log('choose count:',await page.evaluate(()=>[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()==='اختر...').length));
// click first "اختر..."
const r=await page.evaluate(()=>{
  const els=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()==='اختر...')
    .map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.height>0);
  if(!els.length) return null; const o=els[0]; o.e.scrollIntoView({block:'center'});
  const rr=o.e.getBoundingClientRect(); return {x:rr.left+rr.width/2,y:rr.top+rr.height/2};
});
console.log('first select box',r);
if(r){await page.mouse.click(r.x,r.y); await sleep(900);}
console.log('modal text:',(await page.evaluate(()=>document.body.innerText)).slice(0,300));
await browser.close();
