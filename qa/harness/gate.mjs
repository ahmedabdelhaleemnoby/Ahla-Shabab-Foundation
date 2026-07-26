import { launch, boot, nav, shot } from './lib.mjs';
import { sleep } from './lib2.mjs';
const {browser,page}=await launch();
await boot(page);
const txt=()=>page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ').slice(0,700));
const logged=()=>page.evaluate(()=>globalThis.__appState.get().loggedIn);

console.log('## GUEST — restricted screens');
for(const s of ['DonationHistory','Receipts','MyBookings','Favorites','Notifications','AccountSettings']){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));
  await sleep(700); await nav(page,s);
  const t=await txt();
  const gated=t.includes('سجل دخولك')||t.includes('سجّل دخولك')||t.includes('لحسابك الشخصي');
  const hasLogin=t.includes('تسجيل الدخول'); const hasGuest=t.includes('متابعة كزائر');
  console.log(`${s.padEnd(18)} gated=${gated?'YES':'NO '} loginBtn=${hasLogin} continueAsGuest=${hasGuest}`);
  await shot(page,`gate-${s}`);
}
console.log('\n## GUEST — public screens reachable');
for(const [s,p] of [['UrgentCases',null],['Sponsorship',null],['About',null],['Projects',null],['NewsFeed',null],['ServicesBrowse',{parentId:null}],['Consultations',null],['ConsultationRequest',{type:'نفسية'}],['CaseDetail',{id:'c-1427'}],['ZakatCalculator',null],['Faq',null],['ContactUs',null],['Volunteer',null],['PrivacyPolicy',null]]){
  await page.evaluate(()=>globalThis.__nav.reset({index:0,routes:[{name:'Main',params:{screen:'Home'}}]}));
  await sleep(500); await nav(page,s,p||undefined);
  const t=await txt();
  const blocked=t.includes('لحسابك الشخصي');
  console.log(`${s.padEnd(20)} blocked=${blocked?'BLOCKED <-- unexpected':'open'}  len=${t.length}`);
}
console.log('\nloggedIn at end =',await logged());
await browser.close();
