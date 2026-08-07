import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pickSelect, clickExactText } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const body=()=>page.evaluate(()=>document.body.innerText);

async function submitConsultation(email,name){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));
  await sleep(600);
  await nav(page,'ConsultationRequest',{type:'نفسية'});
  await fillByPlaceholder(page,'اكتب اسمك',name);
  await fillByPlaceholder(page,'01xxxxxxxxx','01012345678');
  await fillByPlaceholder(page,'example@mail.com',email);
  await fillByPlaceholder(page,'العمر','30');
  await pickSelect(page,'المحافظة','القاهرة');
  await pickSelect(page,'وسيلة التواصل المفضلة','واتساب');
  await pickSelect(page,'الوقت المفضل للتواصل','أي وقت');
  await pickSelect(page,'طبيعة الحالة','قلق وتوتر');
  await pickSelect(page,'هل سبق تلقي جلسات نفسية؟','لا');
  await fillByPlaceholder(page,'اشرح باختصار ما تريد الاستشارة بشأنه...','أعاني من ضغوط متواصلة وأحتاج جلسة إرشادية.');
  await clickExactText(page,'أوافق على أن تُعالَج بياناتي بسرية لغرض الاستشارة فقط *');
  await clickExactText(page,'إرسال الطلب');
  const t=await body();
  const m=t.match(/AS-\d+|[A-Z]{2}-[\dA-Z]+/);
  return {ok:t.includes('تم استلام الطلب بنجاح'), ref:m?m[0]:null, text:t.slice(0,400)};
}

console.log('### A. submit #1 with  "Test@Example.COM"');
const r1=await submitConsultation('Test@Example.COM','أحمد تجريبي');
console.log(r1.ok?`PASS ref=${r1.ref}`:`FAIL\n${r1.text}`);
await shot(page,'consult-confirm-1');

console.log('\n### B. submit #2 with  "test@example.com" (different case)');
const r2=await submitConsultation('test@example.com','أحمد تجريبي');
console.log(r2.ok?`PASS ref=${r2.ref}`:`FAIL\n${r2.text}`);

console.log('\n### C. login via EmailAuth with "  TEST@EXAMPLE.com  " and 6-digit OTP');
await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));
await sleep(500);
await nav(page,'EmailAuth');
await fillByPlaceholder(page,'example@mail.com','   TEST@EXAMPLE.com   ');
await clickExactText(page,'إرسال رمز التحقق');
console.log('   after email submit, route =', await page.evaluate(()=>{const rs=globalThis.__nav.getRootState();return rs.routes[rs.index].name;}));
await shot(page,'otp-screen');
// type OTP
await page.evaluate(()=>{const el=[...document.querySelectorAll('input')].find(e=>e.maxLength===6);
  const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  s.call(el,'123456'); el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(400);
await clickExactText(page,'تأكيد');
const st=await page.evaluate(()=>globalThis.__appState.get());
console.log('   loggedIn =',st.loggedIn,' email =',JSON.stringify(st.email));
console.log('   consultations linked =',st.consultations.length);
console.log('   refs =',st.consultations.map(c=>c.reference).join(', '));
console.log('\n   EXPECT: loggedIn=true, email="test@example.com", consultations=2 (both refs)');
await shot(page,'after-login');
await browser.close();
