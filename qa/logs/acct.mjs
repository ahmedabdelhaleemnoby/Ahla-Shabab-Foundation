import { launch, boot, nav, shot } from './lib.mjs';
const {browser,page}=await launch();
await boot(page);
await nav(page,'AccountSettings');
console.log(await page.evaluate(()=>document.body.innerText));
await shot(page,'gate-AccountSettings-guest');
await browser.close();
