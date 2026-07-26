import { launch, boot, nav, shot, sleep } from './lib.mjs';
const LABELS = ['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];
async function info(page){
  return page.evaluate((labels)=>{
    const els=[...document.querySelectorAll('div')];
    const c=els.filter(e=>{const t=e.innerText||'';return labels.every(l=>t.includes(l));});
    if(!c.length) return {present:false};
    const bar=c[c.length-1];
    const r=bar.getBoundingClientRect();
    // is the bar actually the top-most element at its own centre point?
    const cx=r.left+r.width/2, cy=r.top+r.height-20;
    const top=document.elementFromPoint(cx,cy);
    const covered = top ? !bar.contains(top) && top!==bar : true;
    // walk ancestors for display/visibility/opacity
    let hidden=false,node=bar;
    while(node && node!==document.body){const s=getComputedStyle(node);
      if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0'){hidden=true;break;}node=node.parentElement;}
    return {present:true,hidden,covered,rect:{t:Math.round(r.top),b:Math.round(r.bottom)},topEl:top?top.tagName+'.'+(top.className||'').toString().slice(0,40):null};
  },LABELS);
}
const {browser,page}=await launch();
await boot(page);
for(const [n,p] of [['Main',{screen:'Home'}],['CaseDetail',{id:'c-1427'}],['EmailAuth',undefined],['ConsultantDashboard',undefined],['GovernorateActivity',{governorate:'أسوان'}]]){
  await nav(page,'Main',{screen:'Home'});
  if(n!=='Main') await nav(page,n,p);
  const i=await info(page);
  console.log(`${n.padEnd(22)}`, JSON.stringify(i));
  await shot(page,`vis-${n}`);
}
await browser.close();
