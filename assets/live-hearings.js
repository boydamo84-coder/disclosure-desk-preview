/* Disclosure Desk LIVE: only curator-approved events, no fabricated schedules or sources. */
(()=>{
'use strict';
const URL='https://omqxizswzcwgzqaczlhe.supabase.co',KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const client=()=>window.supabase?.createClient(URL,KEY);
const h=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e};
const safeVideo=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['youtube.com','youtube-nocookie.com','congress.gov','house.gov','senate.gov'].some(domain=>u.hostname===domain||u.hostname.endsWith('.'+domain))}catch{return false}};
const BUNDLED_HEARINGS=[
 {id:'house-uap-2025-09-09',title:'Restoring Public Trust Through UAP Transparency and Whistleblower Protection',date:'2025-09-09',status:'ended',embedUrl:'https://www.youtube-nocookie.com/embed/LBKRr5OvF6E',sourceUrl:'https://oversight.house.gov/hearing/restoring-public-trust-through-uap-transparency-and-whistleblower-protection/'},
 {id:'house-uap-2024-11-13',title:'Unidentified Anomalous Phenomena: Exposing the Truth',date:'2024-11-13',status:'ended',embedUrl:'https://www.youtube-nocookie.com/embed/kT2iWKZr0qA',sourceUrl:'https://oversight.house.gov/hearing/unidentified-anomalous-phenomena-exposing-the-truth/'},
 {id:'house-uap-2023-07-26',title:'UAP: Implications on National Security, Public Safety, and Government Transparency',date:'2023-07-26',status:'ended',embedUrl:'https://www.youtube-nocookie.com/embed/KQ7Dw-739VY',sourceUrl:'https://oversight.house.gov/hearing/unidentified-anomalous-phenomena-implications-on-national-security-public-safety-and-government-transparency/'}
];
let events=BUNDLED_HEARINGS.slice();
function init(){
 const host=h('section');host.id='ddLiveEvents';host.className='section';
 const title=h('h2','🔴 Disclosure Desk LIVE');host.append(title);
 const caption=h('p','Confirmed Congressional hearing streams and their research discussions. Comments are community opinion, not verified testimony.');caption.className='muted small';host.append(caption);
 const list=h('div');host.append(list);
 const root=document.getElementById('ddLiveMount');
 if(!root)return;root.append(host);
 function openEvent(event){
   const overlay=h('div');overlay.style.cssText='position:fixed;inset:0;z-index:100050;background:#08111bf5;overflow:auto;padding:max(58px,env(safe-area-inset-top,0px)) 12px max(20px,env(safe-area-inset-bottom,0px))';
   const box=h('section');box.style.cssText='max-width:750px;margin:auto;background:#142536;border:1px solid #b39a70;border-radius:12px;padding:16px';
   const close=h('button','✕ Close');close.onclick=()=>overlay.remove();close.style.cssText='margin-bottom:12px;padding:10px 14px';box.append(close,h('h2',event.title));
   const p=h('p',event.status==='live'?'Official livestream · Discussion':event.status==='ended'?'Recording and discussion archive':'Confirmed event · Awaiting broadcast');p.className='muted small';box.append(p);
   if(event.embedUrl&&safeVideo(event.embedUrl)){const frame=h('iframe');frame.title='Official hearing recording';frame.src=event.embedUrl+'?playsinline=1&rel=0';frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;frame.loading='eager';frame.style.cssText='display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:10px;background:#000;margin:14px 0';box.append(frame);const y=h('a','Watch directly on YouTube ↗');y.href='https://www.youtube.com/watch?v='+event.embedUrl.split('/').pop();y.target='_blank';y.rel='noopener noreferrer';y.style.cssText='display:inline-block;margin-bottom:12px;color:#e6c48a';box.append(y);}
   else if(event.sourceUrl){const a=h('a','Open verified official event page');a.href=event.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';box.append(a);}
   const discuss=h('button','💬 '+(event.status==='live'?'Join live discussion':'View hearing discussion'));discuss.type='button';discuss.className='outline';discuss.style.margin='12px';
   discuss.onclick=()=>{overlay.remove();window.ddOpenCaseDiscussion?.('hearing:'+event.id,'Hearing Discussion')};box.append(discuss);
   const note=h('p','Discussion updates appear when reopened. Real-time subscriptions and replay timestamps are still in development.');note.className='muted small';box.append(note);
   overlay.append(box);document.body.append(overlay);
 }
 function render(){
  list.replaceChildren();
  if(!events.length){const msg=h('p','No confirmed hearing streams listed yet. We publish only verified events.');msg.className='muted small';list.append(msg);return}
  for(const [sectionTitle,filtered] of [['🔴 Live Now',events.filter(e=>e.status==='live')],['📅 Upcoming Hearings',events.filter(e=>e.status==='upcoming')],['▶ Past Hearings · Official Recordings',events.filter(e=>e.status==='ended')]]){
   if(!filtered.length)continue;
   const heading=h('h3',sectionTitle);heading.style.margin='18px 0 10px';list.append(heading);
   for(const event of filtered){
    const card=h('article');card.className='card';card.style.padding='14px';card.style.marginBottom='10px';
    const heading=h('strong',event.title);heading.style.display='block';heading.style.marginBottom='6px';
    const date=h('p',event.date+' · '+(event.status==='ended'?'Past hearing':event.status==='live'?'Live hearing':'Upcoming hearing'));date.className='muted small';
    const actions=h('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:10px';
    const btn=h('button',event.status==='live'?'🔴 Watch live':event.status==='ended'?'▶ Watch recording':'View event');btn.type='button';btn.onclick=()=>openEvent(event);actions.append(btn);
    const official=h('a','Official hearing page ↗');official.href=event.sourceUrl;official.target='_blank';official.rel='noopener noreferrer';official.className='outline';official.style.cssText='display:inline-flex;align-items:center;padding:10px;text-decoration:none';actions.append(official);
    card.append(heading,date,actions);list.append(card);
   }
  }
 }
 render();
 fetch('data/approved-live-events.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('No events file');return r.json()}).then(data=>{
  if(!Array.isArray(data)||!data.length)return;
  const verified=data.filter(x=>x&&typeof x.id==='string'&&/^[a-zA-Z0-9_-]{3,120}$/.test(x.id)&&typeof x.title==='string'&&x.title.length<180&&typeof x.date==='string'&&['upcoming','live','ended'].includes(x.status)&&typeof x.sourceUrl==='string'&&safeVideo(x.sourceUrl)&&(!x.embedUrl||safeVideo(x.embedUrl))).slice(0,40);
  if(verified.length){const bundled=new Map(BUNDLED_HEARINGS.map(e=>[e.id,e]));events=verified.map(e=>({...bundled.get(e.id),...e,embedUrl:e.embedUrl||bundled.get(e.id)?.embedUrl}));}render();
 }).catch(()=>{render()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
