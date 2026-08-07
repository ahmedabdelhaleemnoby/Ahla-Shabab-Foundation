import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pressExact } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const route=()=>page.evaluate(()=>{const rs=globalThis.__nav.getRootState();return rs.routes[rs.index].name;});
const body=()=>page.evaluate(()=>document.body.innerText);
const reset=async()=>{await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));await sleep(500);};

console.log('## EMAIL LOGIN VALIDATION  (expect: stay on EmailAuth + error, except valid)');
for(const [label,val] of [['empty',''],['invalid "abc"','abc'],['invalid "a@b"','a@b'],['no domain "a@"','a@'],
    ['spaces "  x@y.com  "','   x@y.com   '],['uppercase "A@B.COM"','A@B.COM'],['valid','user@mail.com']]){
  await reset(); await nav(page,'EmailAuth');
  if(val) await fillByPlaceholder(page,'example@mail.com',val);
  await pressExact(page,'إرسال رمز التحقق');
  const r=await route(); const t=await body();
  const err=t.includes('أدخل بريداً إلكترونياً صحيحاً');
  console.log(`${label.padEnd(22)} route=${r.padEnd(10)} errShown=${err}`);
  if(label==='spaces "  x@y.com  "'||label==='uppercase "A@B.COM"'){
    const inputVal=await page.evaluate(()=>{const e=[...document.querySelectorAll('input')].find(x=>x.placeholder==='example@mail.com');return e?e.value:null;});
    console.log(`   -> stored input value = ${JSON.stringify(inputVal)}`);
  }
}
console.log('\n## OTP VALIDATION (on Otp screen)');
for(const [label,code,expect] of [['empty','','reject'],['short "123"','123','reject'],['non-numeric "abcdef"','abcdef','reject'],['mixed "12ab34"','12ab34','reject'],['6 digits "000000"','000000','accept']]){
  await reset(); await nav(page,'Otp',{email:'x@y.com'});
  if(code) await page.evaluate((c)=>{const el=[...document.querySelectorAll('input')].find(e=>e.maxLength===6);
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,c);
    el.dispatchEvent(new Event('input',{bubbles:true}));},code);
  await sleep(300);
  const shown=await page.evaluate(()=>{const el=[...document.querySelectorAll('input')].find(e=>e.maxLength===6);return el?el.value:null;});
  await pressExact(page,'تأكيد');
  const r=await route(); const t=await body();
  const err=t.includes('أدخل الرمز المكوّن من 6 أرقام');
  const got = r==='Otp' ? 'reject' : 'accept';
  console.log(`${label.padEnd(22)} inputAccepted=${JSON.stringify(shown)} err=${err} result=${got} ${got===expect?'PASS':'FAIL'}`);
}
console.log('\n## OTP resend control');
await reset(); await nav(page,'Otp',{email:'x@y.com'});
console.log('t=0  :',(await body()).includes('إعادة إرسال الرمز خلال')?'countdown shown':'NO countdown');
await browser.close();
