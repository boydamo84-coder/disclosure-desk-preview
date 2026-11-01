/* Disclosure Desk LIVE: only curator-approved events, no fabricated schedules or sources. */
(()=>{
'use strict';
const SUPABASE_URL='https://omqxizswzcwgzqaczlhe.supabase.co',KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const client=()=>window.supabase?.createClient(SUPABASE_URL,KEY);
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
   const close=h('button','✕ Close');close.onclick=()=>{overlay.remove();if(activePlayback){const player=activePlayback;activePlayback=null;if(player.isConnected&&player._preview)player.replaceChildren(player._preview)}};close.style.cssText='margin-bottom:12px;padding:10px 14px';box.append(close,h('h2',event.title));
   const p=h('p',event.status==='live'?'Official livestream · Discussion':event.status==='ended'?'Recording and discussion archive':'Confirmed event · Awaiting broadcast');p.className='muted small';box.append(p);
   // Resolve the recording from the trusted bundled catalogue by hearing ID,
   // regardless of whether an external event feed omitted or replaced embedUrl.
   const bundled=BUNDLED_HEARINGS.find(e=>e.id===event.id);
   const embed=(bundled&&bundled.embedUrl)||event.embedUrl||'';
   if(embed&&safeVideo(embed)){
     const videoBox=h('div');videoBox.style.cssText='margin:14px 0;background:#000;border-radius:10px;overflow:hidden;aspect-ratio:16/9';
     const frame=h('iframe');frame.title='Official hearing recording';frame.src=embed+'?playsinline=1&rel=0';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.loading='eager';frame.style.cssText='width:100%;height:100%;border:0;display:block';videoBox.append(frame);box.append(videoBox);
   }
   const links=h('div');links.style.cssText='display:flex;flex-wrap:wrap;gap:10px;margin:12px 0';
   if(embed&&safeVideo(embed)){
     const yt=h('a','▶ Watch on YouTube ↗');yt.href='https://www.youtube.com/watch?v='+embed.split('/').pop();yt.target='_blank';yt.rel='noopener noreferrer';yt.className='outline';yt.style.cssText='display:inline-flex;padding:10px;color:#e7cc9a';links.append(yt);
   }
   if(event.sourceUrl&&safeVideo(event.sourceUrl)){
     const source=h('a','Official hearing page ↗');source.href=event.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';source.className='outline';source.style.cssText='display:inline-flex;padding:10px;color:#e7cc9a';links.append(source);
   }
   box.append(links);
   if(!embed||!safeVideo(embed)){const issue=h('p','Embedded player unavailable for this record. Use the official hearing page.');issue.className='muted small';box.append(issue)}
   const discuss=h('button','💬 '+(event.status==='live'?'Join live discussion':'View hearing discussion'));discuss.type='button';discuss.className='outline';discuss.style.margin='12px';
   discuss.onclick=()=>{overlay.remove();window.ddOpenCaseDiscussion?.('hearing:'+event.id,'Hearing Discussion')};box.append(discuss);
   const note=h('p','Discussion updates appear when reopened. Real-time subscriptions and replay timestamps are still in development.');note.className='muted small';box.append(note);
   overlay.append(box);document.body.append(overlay);
 }
 // Add a navigation entry before playing in Android WebView so Back returns to LIVE
 // instead of closing the activity when there was no previous page history.
 let activePlayback=null;
 window.addEventListener('popstate',()=>{
  if(activePlayback){const player=activePlayback;activePlayback=null;
   if(player.isConnected&&player._preview)player.replaceChildren(player._preview);
  }
 });
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
    card.append(heading,date);
    const bundled=BUNDLED_HEARINGS.find(e=>e.id===event.id);
    const embed=bundled?.embedUrl||event.embedUrl||'';
    if(embed&&safeVideo(embed)){
      const player=h('div');player.className='dd-live-inline-player';player.style.cssText='position:relative;aspect-ratio:16/9;background:#07111b;border-radius:12px;overflow:hidden;margin:12px 0';
      const preview=h('button','▶ Play official recording');preview.type='button';preview.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;color:#fff;background:linear-gradient(145deg,#1d3446,#09121d);font-size:18px;font-weight:700;cursor:pointer';
      const videoId=embed.split('/').pop();
      if(/^[A-Za-z0-9_-]{11}$/.test(videoId)){preview.style.background='linear-gradient(#0005,#0009),url(https://i.ytimg.com/vi/'+videoId+'/hqdefault.jpg) center/cover';preview.style.textShadow='0 2px 8px #000';}
      preview.setAttribute('aria-label','Play '+event.title);
      preview.onclick=()=>{
        if(!activePlayback){try{history.pushState({ddLivePlayback:true},'','#live-recording')}catch{}}
        activePlayback=player;
        // Only mount the requested player; don't load three third-party embeds on page entry.
        document.querySelectorAll('.dd-live-inline-player iframe').forEach(frame=>{frame.parentElement?.replaceChildren(frame.parentElement._preview||h('span','Recording paused'))});
        const frame=h('iframe');frame.title='Official hearing recording: '+event.title;frame.src=embed+'?playsinline=1&rel=0';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.style.cssText='display:block;width:100%;height:100%;border:0';player.replaceChildren(frame);
      };
      player._preview=preview;player.append(preview);card.append(player);
    }
    const actions=h('div');actions.className='dd-live-card-actions';actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:10px';
    const details=h('button','💬 Discussion / Details');details.type='button';details.className='outline';details.onclick=()=>openEvent(event);actions.append(details);
    if(embed&&safeVideo(embed)){const y=h('a','YouTube ↗');y.href='https://www.youtube.com/watch?v='+embed.split('/').pop();y.target='_blank';y.rel='noopener noreferrer';y.className='outline';y.style.cssText='display:inline-flex;align-items:center;padding:10px;text-decoration:none';actions.append(y)}
    const official=h('a','Official source ↗');official.href=event.sourceUrl;official.target='_blank';official.rel='noopener noreferrer';official.className='outline';official.style.cssText='display:inline-flex;align-items:center;padding:10px;text-decoration:none';actions.append(official);
    card.append(actions);list.append(card);
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
