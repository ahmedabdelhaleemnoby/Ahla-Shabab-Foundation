import puppeteer from 'puppeteer-core';
import { CHROME, BASE, SHOTS, sleep } from './lib.mjs';
for(const [w,h,tag] of [[320,568,'320'],[390,844,'390']]){
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:[`--window-size=${w},${h}`,'--no-sandbox']});
  const page=await b.newPage(); await page.setViewport({width:w,height:h,deviceScaleFactor:3});
  await page.goto(BASE,{waitUntil:'networkidle2',timeout:120000}); await sleep(2500);
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'About'}}]})); await sleep(1200);
  await page.screenshot({path:`${SHOTS}/crop${tag}-about-footer.png`,clip:{x:0,y:h-160,width:w,height:110}});
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(1000);
  await page.screenshot({path:`${SHOTS}/crop${tag}-home-cta.png`,clip:{x:0,y:h-260,width:w,height:150}});
  await b.close();
}
