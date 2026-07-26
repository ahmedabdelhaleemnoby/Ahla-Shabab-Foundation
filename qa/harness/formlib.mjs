import { sleep } from './lib2.mjs';

export async function fillByPlaceholder(page,ph,value){
  const ok=await page.evaluate((p,v)=>{
    const el=[...document.querySelectorAll('input,textarea')].find(e=>e.placeholder===p);
    if(!el) return false;
    const proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  },ph,value);
  await sleep(150); return ok;
}

/** Real press: move, down, small delay, up — required by RN-Web's responder system. */
export async function press(page,locator){
  const box=await page.evaluate(locator);
  if(!box) return false;
  await page.mouse.move(box.x,box.y);
  await page.mouse.down(); await sleep(110); await page.mouse.up();
  await sleep(750); return true;
}

const byExact=(t)=>`(()=>{const els=[...document.querySelectorAll('div,span')].filter(e=>(e.innerText||'').trim()===${JSON.stringify(t)})
 .map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.width>0&&o.r.height>0).sort((a,b)=>a.r.width*a.r.height-b.r.width*b.r.height);
 if(!els.length)return null; els[0].e.scrollIntoView({block:'center'});
 const r=els[0].e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`;

export const pressExact=(page,t)=>press(page,byExact(t));

/** Open the Nth remaining unfilled select ("اختر...") and choose `option`. */
export async function pickNextSelect(page,option){
  const opened=await press(page,`(()=>{const els=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()==='اختر...');
    if(!els.length)return null; els[0].scrollIntoView({block:'center'});
    const r=els[0].getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  if(!opened) return false;
  // option row lives in the modal — pick the LAST visible exact match (modal is on top)
  const picked=await press(page,`(()=>{const els=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()===${JSON.stringify(option)})
    .map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.width>0&&o.r.height>0);
    if(!els.length)return null; const o=els[els.length-1];
    return {x:o.r.left+o.r.width/2,y:o.r.top+o.r.height/2};})()`);
  return picked;
}
