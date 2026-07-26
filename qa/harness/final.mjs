import { launch, boot, nav } from './lib.mjs';
import { sleep } from './lib2.mjs';
const {browser,page,requests}=await launch();
await boot(page);
for(const s of ['Home','Cases','UrgentCases','Donate','Consultations','About']){
  await page.evaluate((t)=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:t}}]}),s); await sleep(600);
}
await nav(page,'EmailAuth'); await nav(page,'ConsultantDashboard');
console.log('non-localhost requests during full session:',requests.filter(r=>!r.includes('localhost:8087')).length);
await browser.close();
