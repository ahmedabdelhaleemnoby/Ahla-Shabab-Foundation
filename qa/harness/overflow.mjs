import puppeteer from 'puppeteer-core';
import { CHROME, BASE, SHOTS, sleep } from './lib.mjs';
for(const [w,h] of [[320,568],[390,844]]){
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:[`--window-size=${w},${h}`,'--no-sandbox']});
  const page=await b.newPage(); await page.setViewport({width:w,height:h,deviceScaleFactor:2});
  await page.goto(BASE,{waitUntil:'networkidle2',timeout:120000}); await sleep(2500);
  console.log(`\n=== ${w}px ===`);
  // Home consultation CTA truncation
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(900);
  console.log(' Home CTA texts:',await page.evaluate(()=>[...document.querySelectorAll('div')]
    .filter(e=>/تعرف على/.test((e.innerText||'').trim())&&e.children.length===0)
    .map(e=>({shown:e.innerText.trim(),clip:e.scrollWidth>e.clientWidth+1,sw:e.scrollWidth,cw:e.clientWidth}))));
  // About footer buttons: does text escape the button box?
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'About'}}]})); await sleep(1100);
  console.log(' About footer buttons:',await page.evaluate(()=>{
    const out=[];
    for(const label of ['تواصل معنا','انضم متطوعاً']){
      const t=[...document.querySelectorAll('div')].filter(e=>(e.innerText||'').trim()===label&&e.children.length===0)[0];
      if(!t){out.push({label,found:false});continue;}
      // button = nearest ancestor with a border radius >=50
      let btn=t.parentElement;
      while(btn&&parseFloat(getComputedStyle(btn).borderRadius)<50)btn=btn.parentElement;
      const tr=t.getBoundingClientRect(),br=btn?btn.getBoundingClientRect():null;
      out.push({label,lines:Math.round(tr.height/parseFloat(getComputedStyle(t).lineHeight||'18')),
        textBottom:Math.round(tr.bottom),btnBottom:br?Math.round(br.bottom):null,
        overflowPx:br?Math.round(tr.bottom-br.bottom):null,
        textTop:Math.round(tr.top),btnTop:br?Math.round(br.top):null});
    }
    return out;}));
  // tab bar icon alignment
  console.log(' tab items:',await page.evaluate(()=>{
    const L=['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];
    const c=[...document.querySelectorAll('div')].filter(e=>{const t=e.innerText||'';return L.every(l=>t.includes(l));});
    const bar=c[c.length-1];
    return [...bar.children].map(k=>{const svg=k.querySelector('svg');const r=svg?svg.getBoundingClientRect():null;
      return {t:(k.innerText||'').trim().replace(/\n/g,'⏎'),iconTop:r?Math.round(r.top):null,h:Math.round(k.getBoundingClientRect().height)};});
  }));
  await b.close();
}
