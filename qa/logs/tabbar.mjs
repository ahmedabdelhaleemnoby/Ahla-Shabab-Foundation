import { launch, boot, nav, shot, sleep } from './lib.mjs';

const LABELS = ['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];

async function tabBarInfo(page) {
  return page.evaluate((labels) => {
    const els = [...document.querySelectorAll('div')];
    // tab bar = smallest element containing ALL five labels
    const cands = els.filter(e => { const t = e.innerText||''; return labels.every(l => t.includes(l)); });
    if (!cands.length) return { present: false };
    const bar = cands[cands.length-1];
    const r = bar.getBoundingClientRect();
    // ordered visual children (left->right)
    const kids = [...bar.children].map(c => ({ t:(c.innerText||'').trim().split('\n').pop(), x: c.getBoundingClientRect().left }))
      .sort((a,b)=>a.x-b.x).map(k=>k.t);
    return { present: true, rect:{top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height)}, leftToRight: kids, vh: window.innerHeight };
  }, LABELS);
}

const { browser, page } = await launch();
await boot(page);

const ROOT = ['Home','Cases','UrgentCases','Donate','Consultations','About'];
const INNER = [['CaseDetail',{id:'c-1427'}],['ConsultationRequest',{type:'نفسية'}],['ArticleDetail',{id:'a-1'}],
  ['GovernorateActivity',{governorate:'أسوان'}],['EmailAuth'],['Otp',{email:'a@b.com'}],
  ['Sponsorship'],['ProjectDetail',{id:'p-1'}],['DonationHistory'],['ConsultantDashboard'],['MyBookings']];

console.log('### ROOT TAB SCREENS (tab bar SHOULD be present)');
for (const r of ROOT) {
  await nav(page,'Main',{screen:r});
  const i = await tabBarInfo(page);
  console.log(`${r.padEnd(16)} tabBar=${i.present} ${i.present?`bottom=${i.rect.bottom} vh=${i.vh} order(L→R)=[${i.leftToRight.join(' | ')}]`:''}`);
  await shot(page, `tab-${r}`);
}

console.log('\n### PUSHED INNER SCREENS (tab bar should be ABSENT)');
for (const [name,params] of INNER) {
  await nav(page,'Main',{screen:'Home'});
  await nav(page,name,params);
  const i = await tabBarInfo(page);
  console.log(`${name.padEnd(22)} tabBar=${i.present ? 'PRESENT  <-- LEAK' : 'absent'}`);
}
await browser.close();
