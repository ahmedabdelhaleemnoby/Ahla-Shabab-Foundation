import { launch, boot, nav } from './lib.mjs';
import { sleep } from './lib2.mjs';
const {browser,page}=await launch();
await boot(page);
const COMMON=['الاسم بالكامل','رقم الهاتف','واتساب','البريد الإلكتروني','السن','المحافظة','وسيلة التواصل المفضلة','الوقت المفضل للتواصل','ملخص المشكلة'];
const SPECIAL={'نفسية':['طبيعة الحالة','هل سبق تلقي جلسات نفسية؟'],'دينية':['موضوع الاستشارة'],
 'طبية':['التخصص المطلوب','هل توجد أمراض مزمنة؟'],'أسرية':['أطراف المشكلة','عدد أفراد الأسرة'],'أعمال':['مجال العمل','مرحلة المشروع']};
const ALLSPECIAL=[...new Set(Object.values(SPECIAL).flat())];
for(const type of Object.keys(SPECIAL)){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]})); await sleep(500);
  await nav(page,'ConsultationRequest',{type});
  const t=await page.evaluate(()=>document.body.innerText);
  const missCommon=COMMON.filter(c=>!t.includes(c));
  const ownPresent=SPECIAL[type].filter(s=>t.includes(s));
  const foreign=ALLSPECIAL.filter(s=>!SPECIAL[type].includes(s)&&t.includes(s));
  console.log(`${type.padEnd(8)} common ${COMMON.length-missCommon.length}/${COMMON.length}${missCommon.length?' MISSING:'+missCommon:''} | own ${ownPresent.length}/${SPECIAL[type].length} | foreign-leak: ${foreign.length?foreign.join(','):'none'} | consent:${t.includes('أوافق على أن تُعالَج')} | disclaimer:${t.includes('استرشادية')}`);
}
await browser.close();
