import { launch, boot, nav, shot } from './lib.mjs';
import { sleep, state } from './lib2.mjs';
import { fillByPlaceholder, pressExact } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const body=()=>page.evaluate(()=>document.body.innerText);
const reset=async()=>{await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));await sleep(500);};

console.log('### D-02 RETEST — guest gating across all six personal screens');
for(const s of ['DonationHistory','Receipts','MyBookings','Favorites','Notifications','AccountSettings']){
  await reset(); await nav(page,s);
  const t=await body();
  const gated=t.includes('لحسابك الشخصي')||t.includes('سجّل دخولك')||t.includes('سجل دخولك');
  const login=t.includes('تسجيل الدخول'), guest=t.includes('متابعة كزائر');
  const leaks=t.includes('حفظ التغييرات'); // the editable form must NOT be reachable
  console.log(`${gated&&login&&guest&&!leaks?'PASS':'FAIL'} | ${s.padEnd(18)} gated=${gated} loginBtn=${login} continueAsGuest=${guest} formLeak=${leaks}`);
}
await nav(page,'AccountSettings'); await shot(page,'FIXED-gate-AccountSettings-guest');

console.log('\n### D-02 — logged-in user still gets the real settings form');
await reset(); await nav(page,'EmailAuth');
await fillByPlaceholder(page,'example@mail.com','fixed@test.com');
await pressExact(page,'إرسال رمز التحقق');
await page.evaluate(()=>{const el=[...document.querySelectorAll('input')].find(e=>e.maxLength===6);
 Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,'123456');
 el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(300); await pressExact(page,'تأكيد'); await sleep(700);
await nav(page,'AccountSettings');
let t=await body();
console.log(`${t.includes('حفظ التغييرات')&&!t.includes('لحسابك الشخصي')?'PASS':'FAIL'} | logged-in sees editable form, no gate`);
await shot(page,'FIXED-accountsettings-loggedin');

console.log('\n### D-06 RETEST — email/OTP wording');
await page.evaluate(()=>globalThis.__appState.logout()); await reset();
await nav(page,'EmailAuth'); t=await body();
console.log(`${!t.includes('سنرسل لك رمز تحقق')?'PASS':'FAIL'} | EmailAuth no longer promises to send an email`);
console.log(`${t.includes('لا يُرسل أي بريد إلكتروني فعلياً')?'PASS':'FAIL'} | EmailAuth shows demo notice`);
await shot(page,'FIXED-login-email');
await fillByPlaceholder(page,'example@mail.com','demo@ahlashabab.com');
await pressExact(page,'إرسال رمز التحقق');
t=await body();
console.log(`${!t.includes('تم إرسال رمز التحقق إلى بريدك الإلكتروني')?'PASS':'FAIL'} | OTP no longer claims an email was sent`);
console.log(`${t.includes('لم يُرسل أي بريد إلكتروني')&&t.includes('أدخل أي رمز مكوّن من 6 أرقام')?'PASS':'FAIL'} | OTP shows demo notice + how to proceed`);
console.log(`${t.includes('إعادة إرسال')?'PASS':'FAIL'} | resend control still present (req §2)`);
await shot(page,'FIXED-login-otp');

console.log('\n### D-03 RETEST — persistence wording');
await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(500);
await nav(page,'ConsultantDashboard'); t=await body();
console.log(`${t.includes('التعديلات تُحفظ أثناء الجلسة الحالية فقط')&&!t.includes('مُحفوظة محلياً')?'PASS':'FAIL'} | provider banner states session-only`);
await shot(page,'FIXED-prov-banner');
await browser.close();
