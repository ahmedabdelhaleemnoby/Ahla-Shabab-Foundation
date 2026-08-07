import puppeteer from 'puppeteer-core';
import { CHROME, sleep } from './lib.mjs';
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--window-size=1440,900','--no-sandbox']});
const page=await b.newPage(); await page.setViewport({width:1440,height:900});
const bad=[];
page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
for(const r of ['/','/bookings','/providers','/cms/forms','/settings']){
  await page.goto('http://localhost:5173'+r,{waitUntil:'networkidle2',timeout:60000}); await sleep(1200);
  const t=await page.evaluate(()=>{
    const main=document.querySelector('main')||document.body;
    return main.innerText.replace(/\s+/g,' ').trim();});
  console.log(`\n--- ${r} (${t.length} chars) ---\n${t.slice(0,260)}`);
}
console.log('\n4xx/5xx responses:',bad.length?bad:'none');
await b.close();
