export const LABELS=['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];
export const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

export const state=(page)=>page.evaluate((labels)=>{
  const rs=globalThis.__nav.getRootState();
  const cur=rs.routes[rs.index];
  const els=[...document.querySelectorAll('div')];
  const c=els.filter(e=>{const t=e.innerText||'';return labels.every(l=>t.includes(l));});
  let bar=false; if(c.length){bar=c[c.length-1].getBoundingClientRect().height>10;}
  return {depth:rs.routes.length, top:cur.name, tab:cur.state?cur.state.routes[cur.state.index].name:null, bar,
    route: cur.name==='Main' ? 'Main/'+(cur.state?cur.state.routes[cur.state.index].name:'?') : cur.name};
},labelsArg());
function labelsArg(){return ['الأسر','الحالات العاجلة','تبرع','الاستشارات','اعرف عنا'];}

/** Click element whose EXACT trimmed text === needle. Smallest visible wins. */
export async function tapExact(page,needle,{inTabBar=false}={}){
  const box=await page.evaluate((n,tb,labels)=>{
    let scope=document.body;
    if(tb){
      const c=[...document.querySelectorAll('div')].filter(e=>{const t=e.innerText||'';return labels.every(l=>t.includes(l));});
      if(!c.length) return null; scope=c[c.length-1];
    }
    const els=[...scope.querySelectorAll('div,span')];
    const hits=els.filter(e=>(e.innerText||'').trim()===n)
      .map(e=>({e,r:e.getBoundingClientRect()}))
      .filter(o=>o.r.width>0&&o.r.height>0&&o.r.top<window.innerHeight&&o.r.bottom>0)
      .sort((a,b)=>a.r.width*a.r.height-b.r.width*b.r.height);
    if(!hits.length) return null;
    const r=hits[0].r; return {x:r.left+r.width/2,y:r.top+r.height/2};
  },needle,inTabBar,labelsArg());
  if(!box) return false;
  await page.mouse.click(box.x,box.y);
  await sleep(950); return true;
}

/** Scroll the app's scroll container so the element with exact text is in view. */
export async function scrollToText(page,needle){
  return page.evaluate((n)=>{
    const els=[...document.querySelectorAll('div,span')];
    const hit=els.filter(e=>(e.innerText||'').trim()===n)
      .sort((a,b)=>{const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();return A.width*A.height-B.width*B.height;})[0];
    if(!hit) return false;
    hit.scrollIntoView({block:'center'}); return true;
  },needle).then(async r=>{await sleep(500);return r;});
}
