import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pressExact, pickNextSelect } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const body=()=>page.evaluate(()=>document.body.innerText);

async function submit(email,name){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));
  await sleep(600);
  await nav(page,'ConsultationRequest',{type:'نفسية'});
  await fillByPlaceholder(page,'اكتب اسمك',name);
  await fillByPlaceholder(page,'01xxxxxxxxx','01012345678');
  await fillByPlaceholder(page,'example@mail.com',email);
  await fillByPlaceholder(page,'العمر','30');
  for(const o of ['القاهرة','واتساب','أي وقت','قلق وتوتر','لا']) await pickNextSelect(page,o);
  await fillByPlaceholder(page,'اشرح باختصار ما تريد الاستشارة بشأنه...','أعاني من ضغوط متواصلة وأحتاج جلسة إرشادية عاجلة.');
  await pressExact(page,'أوافق على أن تُعالَج بياناتي بسرية لغرض الاستشارة فقط *');
  await pressExact(page,'إرسال الطلب');
  const t=await body();
  return {ok:t.includes('تم استلام الطلب بنجاح'), ref:(t.match(/[A-Z]{2}-[0-9]+/)||[null])[0], t};
}

console.log('### A. consultation #1 — email "Test@Example.COM"');
const r1=await submit('Test@Example.COM','أحمد تجريبي');
console.log(r1.ok?`PASS ref=${r1.ref}`:'FAIL\n'+r1.t.slice(0,600));
if(r1.ok) await shot(page,'consult-confirm-1');

console.log('\n### B. consultation #2 — email "test@example.com" (lowercase)');
const r2=await submit('test@example.com','أحمد تجريبي');
console.log(r2.ok?`PASS ref=${r2.ref}`:'FAIL\n'+r2.t.slice(0,600));

console.log('\n### C. login "  TEST@EXAMPLE.com  " + OTP 123456');
await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));
await sleep(500); await nav(page,'EmailAuth');
await fillByPlaceholder(page,'example@mail.com','   TEST@EXAMPLE.com   ');
await pressExact(page,'إرسال رمز التحقق');
await page.evaluate(()=>{const el=[...document.querySelectorAll('input')].find(e=>e.maxLength===6);
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,'123456');
  el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(400); await pressExact(page,'تأكيد');
const st=await page.evaluate(()=>globalThis.__appState.get());
console.log('loggedIn=',st.loggedIn,'email=',JSON.stringify(st.email));
console.log('linked consultations=',st.consultations.length,'refs=',st.consultations.map(c=>c.reference).join(', '));
console.log('EXPECT: 2 consultations, both refs above, single identity');
await shot(page,'after-login-history');
await browser.close();
