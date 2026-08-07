import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
import { fillByPlaceholder, pressExact } from './formlib.mjs';
const {browser,page}=await launch();
await boot(page);
const body=()=>page.evaluate(()=>document.body.innerText);
await nav(page,'ConsultantDashboard');

console.log('## OVERVIEW');
let t=await body();
for(const k of ['الحجوزات القادمة','مواعيد اليوم','طلبات جديدة','جلسات مكتملة','حجوزات ملغاة','نسخة عرض تجريبية'])
  console.log(`  ${k.padEnd(20)} ${t.includes(k)?'present':'MISSING'}`);
console.log('  stat values line:', t.split('\n').filter(l=>/^\d+$/.test(l.trim())).join(','));
await shot(page,'prov-overview');

console.log('\n## AVAILABILITY tab');
await pressExact(page,'مواعيدي والأنصبة');
t=await body(); await shot(page,'prov-availability');
console.log('  availability toggle:',t.includes('مفعّل (متاح للحجز)')?'ON':'OFF');
console.log('  weekday chips:',['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].filter(d=>t.includes(d)).length,'/7');
console.log('  start/end shown:',/نطاق اليوم/.test(t)?t.match(/نطاق اليوم:.*/)[0]:'n/a');
const slotsBefore=await page.evaluate(()=>document.body.innerText.match(/\d{2}:\d{2} [صم]/g)||[]);
console.log('  slots before:',[...new Set(slotsBefore)].join(' '));
// toggle a day
await pressExact(page,'الثلاثاء'); t=await body();
console.log('  after toggling الثلاثاء -> still rendered:',t.includes('الثلاثاء'));
// add slot
await fillByPlaceholder(page,'مثال: 04:00 م','05:30 م');
await pressExact(page,'إضافة موعد'); t=await body();
console.log('  add slot "05:30 م":',t.includes('05:30 م')?'ADDED':'FAILED');
// add unavailable date
await fillByPlaceholder(page,'YYYY-MM-DD','2026-09-09');
await pressExact(page,'إضافة استثناء'); t=await body();
console.log('  add unavailable 2026-09-09:',t.includes('2026-09-09')?'ADDED':'FAILED');
// toggle availability off
await pressExact(page,'مفعّل (متاح للحجز)'); t=await body();
console.log('  toggle availability off:',t.includes('معطّل (مغلق مؤقتاً)')?'OK':'FAILED');
console.log('  START/END TIME editable control present:',/type="text"/.test('')||t.includes('تعديل نطاق اليوم')?'yes':'NO EDIT CONTROL');
await shot(page,'prov-availability-after');

console.log('\n## BOOKINGS tab');
await pressExact(page,'الحجوزات والطلبات');
t=await body(); await shot(page,'prov-bookings');
console.log('  filters:',['الكل','جديد','مؤكد','مكتمل','ملغي'].filter(f=>t.includes(f)).join(' '));
console.log('  bookings listed:',(t.match(/AS-\d+/g)||[]).length, 'names:',['أحمد محمود إسماعيل','مريم علي حسن','عمر خالد يوسف'].filter(n=>t.includes(n)).join(', '));
console.log('  form answers visible (expanded):',t.includes('إجابات النموذج المتخصص')?'YES':'no');
console.log('  attachment placeholder:',t.includes('مرفق الحالة')?'YES':'no');
console.log('  actions:',['تأكيد','إكمال','إلغاء'].filter(a=>t.includes(a)).join(' '),'| Reschedule:',t.includes('إعادة جدولة')?'present':'ABSENT');
// search
await fillByPlaceholder(page,'بحث باسم المتقدم، البريد، الرقم...','مريم');
await sleep(600); t=await body();
console.log('  search "مريم" ->',(t.match(/AS-\d+/g)||[]).length,'result(s):',t.includes('مريم علي حسن')?'correct':'wrong');
await fillByPlaceholder(page,'بحث باسم المتقدم، البريد، الرقم...','zzzz');
await sleep(600); t=await body();
console.log('  search "zzzz" -> empty state:',t.includes('لا توجد حجوزات مطابقة للبحث')?'YES':'no');
await fillByPlaceholder(page,'بحث باسم المتقدم، البريد، الرقم...','');
await sleep(500);
// status change
await pressExact(page,'أحمد محمود إسماعيل'); await sleep(400);
await pressExact(page,'تأكيد'); await sleep(600); t=await body();
console.log('  confirm action on booking 1 -> status now:',t.includes('مؤكد')?'مؤكد present':'no change');
await shot(page,'prov-booking-detail');

console.log('\n## PROFILE tab');
await pressExact(page,'الملف الشخصي');
t=await body(); await shot(page,'prov-profile');
for(const k of ['د. محمد العربي','استشاري الصحة النفسية','المؤهلات والاعتمادات','أنواع الجلسات المعتمدة','بيانات التواصل'])
  console.log(`  ${k.slice(0,28).padEnd(30)} ${t.includes(k)?'present':'MISSING'}`);
console.log('  avatar: generic icon placeholder (no photo field in ProviderProfile)');

console.log('\n## PERSISTENCE — reload page');
await page.reload({waitUntil:'networkidle2'}); await sleep(3000);
await nav(page,'ConsultantDashboard'); await pressExact(page,'مواعيدي والأنصبة');
t=await body();
console.log('  slot "05:30 م" after reload:',t.includes('05:30 م')?'PERSISTED':'LOST');
console.log('  unavailable 2026-09-09 after reload:',t.includes('2026-09-09')?'PERSISTED':'LOST');
console.log('  availability toggle after reload:',t.includes('مفعّل (متاح للحجز)')?'back to ON (reset)':'still OFF');
await browser.close();
