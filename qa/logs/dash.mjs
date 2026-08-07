import puppeteer from 'puppeteer-core';
import { CHROME, sleep } from './lib.mjs';
const OUT='/Volumes/PortableSSD/Ahla Shabab Foundation/qa/screenshots/dashboard';
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--window-size=1440,900','--no-sandbox']});
const page=await b.newPage(); await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
const errs=[],reqs=[];
page.on('pageerror',e=>errs.push(e.message));
page.on('console',m=>{if(m.type()==='error')errs.push('[console] '+m.text());});
page.on('request',r=>reqs.push(r.url()));
await page.goto('http://localhost:5173',{waitUntil:'networkidle2',timeout:120000}); await sleep(2500);
console.log('title:',await page.title());
await page.screenshot({path:`${OUT}/00-overview.png`});
// sidebar links
const links=await page.evaluate(()=>[...document.querySelectorAll('a')].map(a=>({t:a.innerText.trim().replace(/\n/g,' '),h:a.getAttribute('href')})).filter(l=>l.h));
console.log('nav links:',links.length);
for(const l of links) console.log('  ',l.h,'|',l.t);
// visit each route
for(const l of links){
  await page.goto('http://localhost:5173'+l.h,{waitUntil:'networkidle2',timeout:60000}); await sleep(1200);
  const txt=await page.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').slice(0,90));
  console.log(`route ${l.h.padEnd(18)} len=${String((await 0,txt.length)).padEnd(4)} :: ${txt}`);
  await page.screenshot({path:`${OUT}/route${l.h.replace(/\//g,'_')||'_root'}.png`});
}
console.log('\nPAGE ERRORS:',errs.length?errs.slice(0,10):'none');
console.log('EXTERNAL REQUESTS:',reqs.filter(r=>!r.includes('localhost:5173')&&!r.startsWith('data:')).slice(0,10));
await b.close();
