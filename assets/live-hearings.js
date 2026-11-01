/* Disclosure Desk LIVE: only curator-approved events, no fabricated schedules or sources. */
(()=>{
'use strict';
const URL='https://omqxizswzcwgzqaczlhe.supabase.co',KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const client=()=>window.supabase?.createClient(URL,KEY);
const h=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e};
const safeVideo=url=>{try{const u=new URL(url);return u.protocol==='https:'&&(/(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|(^|\.)congress\.gov$|(^|\.)house\.gov$|(^|\.)senate\.gov$/).test(u.hostname)}catch{return false}};
let events=[];
function init(){
 const host=h('section');host.id='ddLiveEvents';host.className='section';
 const title=h('h2','🔴 Disclosure Desk LIVE');host.append(title);
 const caption=h('p','Confirmed Congressional hearing streams and their research discussions. Comments are community opinion, not verified testimony.');caption.className='muted small';host.append(caption);
 const list=h('div');host.append(list);
 const root=document.getElementById('ddLiveMount');
 if(!root)return;root.append(host);
 function openEvent(event){
   const overlay=h('div');overlay.style.cssText='position:fixed;inset:0;z-index:100050;background:#08111bf5;overflow:auto;padding:14px';
   const box=h('section');box.style.cssText='max-width:750px;margin:auto;background:#142536;border:1px solid #b39a70;border-radius:12px;padding:16px';
   const close=h('button','✕ Close');close.onclick=()=>overlay.remove();box.append(close,h('h2',event.title));
   const p=h('p',event.status==='live'?'Official livestream · Discussion':event.status==='ended'?'Recording and discussion archive':'Confirmed event · Awaiting broadcast');p.className='muted small';box.append(p);
   if(event.embedUrl&&safeVideo(event.embedUrl)){const frame=h('iframe');frame.title='Official hearing video';frame.src=event.embedUrl;frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.loading='lazy';frame.style.cssText='width:100%;aspect-ratio:16/9;border:0';box.append(frame);}
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
  if(!Array.isArray(data))return;
  events=data.filter(x=>x&&typeof x.id==='string'&&/^[a-zA-Z0-9_-]{3,120}$/.test(x.id)&&typeof x.title==='string'&&x.title.length<180&&typeof x.date==='string'&&['upcoming','live','ended'].includes(x.status)&&typeof x.sourceUrl==='string'&&safeVideo(x.sourceUrl)&&(!x.embedUrl||safeVideo(x.embedUrl))).slice(0,40);render();
 }).catch(()=>{});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
