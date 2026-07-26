import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pressExact } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const reset=async(t='Home')=>{await page.evaluate((x)=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:x}}]}),t);await sleep(800);};
// consultation picker + each form
await reset('Consultations'); await shot(page,'consultations-picker');
for(const t of ['نفسية','دينية','طبية','أسرية','أعمال']){
  await reset(); await nav(page,'ConsultationRequest',{type:t}); await shot(page,`form-${t}`);
}
// governorate detail
await reset(); await nav(page,'GovernorateActivity',{governorate:'أسوان'}); await shot(page,'governorate-detail');
// email login + otp
await reset(); await nav(page,'EmailAuth'); await shot(page,'login-email');
await fillByPlaceholder(page,'example@mail.com','demo@ahlashabab.com');
await pressExact(page,'إرسال رمز التحقق'); await shot(page,'login-otp');
// login then history
await page.evaluate(()=>{const el=[...document.querySelectorAll('input')].find(e=>e.maxLength===6);
 Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,'123456');
 el.dispatchEvent(new Event('input',{bubbles:true}));});
await sleep(300); await pressExact(page,'تأكيد'); await sleep(800);
await nav(page,'MyBookings'); await shot(page,'history-mybookings-loggedin');
await nav(page,'DonationHistory'); await shot(page,'history-donations-loggedin');
console.log('done');
await browser.close();
