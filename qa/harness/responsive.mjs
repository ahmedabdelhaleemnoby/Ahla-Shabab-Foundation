import puppeteer from 'puppeteer-core';
import { CHROME, BASE, SHOTS, sleep } from './lib.mjs';
const LABELS=['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];
const WIDTHS=[[320,568,'320'],[390,844,'390'],[430,932,'430'],[768,1024,'tablet768']];
const SCREENS=[['Home',null],['Cases',null],['UrgentCases',null],['Donate',null],['Consultations',null],['About',null]];

for(const [w,h,tag] of WIDTHS){
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:[`--window-size=${w},${h}`,'--no-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:w,height:h,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await page.goto(BASE,{waitUntil:'networkidle2',timeout:120000}); await sleep(2500);
  console.log(`\n===== ${w}x${h} =====`);
  for(const [s] of SCREENS){
    await page.evaluate((t)=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:t}}]}),s);
    await sleep(900);
    const r=await page.evaluate((labels,W)=>{
      const out={};
      // horizontal page overflow
      out.docScrollW=document.documentElement.scrollWidth; out.win=window.innerWidth;
      out.hOverflow=document.documentElement.scrollWidth>window.innerWidth+1;
      // tab bar
      const c=[...document.querySelectorAll('div')].filter(e=>{const t=e.innerText||'';return labels.every(l=>t.includes(l));});
      if(c.length){const b=c[c.length-1];const br=b.getBoundingClientRect();
        out.bar={h:Math.round(br.height),bottom:Math.round(br.bottom),fitsBottom:Math.abs(br.bottom-window.innerHeight)<2};
        // any tab label clipped?
        out.clipped=[...b.querySelectorAll('div')].filter(e=>{const t=(e.innerText||'').trim();
          return labels.includes(t)&&(e.scrollWidth>e.clientWidth+1);}).map(e=>e.innerText.trim());
      }
      // elements overflowing viewport horizontally
      out.wide=[...document.querySelectorAll('div,span')].filter(e=>{const r=e.getBoundingClientRect();
        return r.width>0&&(r.right>W+1||r.left<-1)&&r.height>0&&r.height<400;}).length;
      return out;
    },labels=>labels,w).catch(()=>null);
    const rr=await page.evaluate((labels,W)=>{
      const out={};
      out.hOverflow=document.documentElement.scrollWidth>window.innerWidth+1;
      out.scrollW=document.documentElement.scrollWidth;
      const c=[...document.querySelectorAll('div')].filter(e=>{const t=e.innerText||'';return labels.every(l=>t.includes(l));});
      if(c.length){const b=c[c.length-1];const br=b.getBoundingClientRect();
        out.barH=Math.round(br.height); out.barBottom=Math.round(br.bottom); out.vh=window.innerHeight;
        out.clipped=[...b.querySelectorAll('div')].filter(e=>{const t=(e.innerText||'').trim();
          return labels.includes(t)&&e.scrollWidth>e.clientWidth+1;}).map(e=>e.innerText.trim());
      }
      out.overflowEls=[...document.querySelectorAll('div,span')].filter(e=>{const r=e.getBoundingClientRect();
        return r.width>0&&r.height>0&&r.height<400&&(r.right>W+1.5||r.left<-1.5);}).slice(0,4)
        .map(e=>({t:(e.innerText||'').trim().slice(0,24),r:Math.round(e.getBoundingClientRect().right),l:Math.round(e.getBoundingClientRect().left)}));
      return out;
    },LABELS,w);
    console.log(` ${s.padEnd(14)} hOverflow=${rr.hOverflow} scrollW=${rr.scrollW} barH=${rr.barH} barBottom=${rr.barBottom}/${rr.vh} clippedTabs=${JSON.stringify(rr.clipped||[])} overflow=${JSON.stringify(rr.overflowEls)}`);
    await page.screenshot({path:`${SHOTS}/w${tag}-${s}.png`});
  }
  await browser.close();
}
