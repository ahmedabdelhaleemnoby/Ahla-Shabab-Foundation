import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pressExact, pickNextSelect } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const st=()=>page.evaluate(()=>globalThis.__appState.get());

console.log('## 1. login session');
await nav(page,'EmailAuth');
await fillByPlaceholder(page,'example@mail.com','persist@test.com');
await pressExact(page,'إرسال رمز التحقق');
await page.evaluate(()=>{const el=[...document.querySelectorAll('input')].find(e=>e.maxLength===6);
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,'111111');
  el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(300); await pressExact(page,'تأكيد');
console.log('  before reload:',JSON.stringify(await st()));
await page.reload({waitUntil:'networkidle2'}); await sleep(3000);
console.log('  after  reload:',JSON.stringify(await st()));

console.log('\n## 2. notifications read-state');
await nav(page,'Notifications');
let t=await page.evaluate(()=>document.body.innerText);
console.log('  gated for guest after reload:',t.includes('لحسابك الشخصي')?'yes (logged out)':'no');

console.log('\n## 3. CMS localStorage (dashboard-shared) persistence');
console.log('  CMS key present:',await page.evaluate(()=>Object.keys(localStorage).join(',')||'(empty)'));

console.log('\n## 4. Drawer items + dead-button scan');
await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(800);
// open drawer via hamburger (top-left area)
const box=await page.evaluate(()=>{const svgs=[...document.querySelectorAll('svg')];
  const s=svgs.map(e=>({e,r:e.getBoundingClientRect()})).filter(o=>o.r.top<90&&o.r.left>250);
  if(!s.length)return null; const r=s[0].r; return {x:r.left+r.width/2,y:r.top+r.height/2};});
if(box){await page.mouse.move(box.x,box.y);await page.mouse.down();await sleep(110);await page.mouse.up();await sleep(1200);}
t=await page.evaluate(()=>document.body.innerText);
console.log('  drawer open:',t.includes('لوحة مقدم الاستشارة')?'YES':'no');
console.log(t.split('\n').filter(Boolean).slice(0,40).join(' | '));
await shot(page,'drawer-open');
await browser.close();
