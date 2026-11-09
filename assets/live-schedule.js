/* Disclosure Desk: verified Congress hearing schedule and real second-by-second timer.
 * Never infer a scheduled congressional hearing from article speculation.
 * No future approved start_at -> no fake countdown or fake LIVE badge.
 */
(()=>{
'use strict';
const SUPABASE_URL='https://omqxizswzcwgzqaczlhe.supabase.co',KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const HOSTS=['congress.gov','house.gov','senate.gov','youtube.com','youtube-nocookie.com','youtu.be'];
const validUrl=(raw)=>{try{const u=new URL(raw);return u.protocol==='https:'&&HOSTS.some(x=>u.hostname===x||u.hostname.endsWith('.'+x))}catch{return false}};
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
let root,container,upcoming=[],tick=null,scheduledRefresh=null,noticeTick=null,currentNotice=null,noticeClock=null;
const publicStatus=x=>['upcoming','live','ended','cancelled'].includes(x);
function normalize(x){
 const id=String(x.id||'');
 const start=x.starts_at||x.startAt||'';
 // A date without an official time/offset cannot be used for a live countdown.
 if(typeof start!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(start))return null;
 const d=new Date(start);
 const status=String(x.status||'');
 const source=x.source_url||x.sourceUrl||'';
 const stream=x.stream_url||x.streamUrl||x.embedUrl||'';
 const recording=x.recording_url||x.recordingUrl||'';
 if(!/^[a-z0-9-]{8,120}$/.test(id)||typeof x.title!=='string'||!x.title.trim()
   ||!Number.isFinite(d.getTime())||!validUrl(source)||!publicStatus(status)
   ||(stream&&!validUrl(stream))||(recording&&!validUrl(recording)))return null;
 return {id,title:x.title.slice(0,180),startsAt:d,status,source,stream,recording,sourceLabel:String(x.source_label||x.sourceLabel||'Official hearing page').slice(0,90),
  chatAvailable:x.chatAvailable===true||x.is_public===true,endsAt:x.ends_at?new Date(x.ends_at):null};
}
function formatted(date,timeZone){
 try{return new Intl.DateTimeFormat('en-GB',{dateStyle:'full',timeStyle:'short',timeZone}).format(date)}
 catch{return date.toISOString()}
}
function remaining(ms){
 const n=Math.max(0,Math.floor(ms/1000));
 return {days:Math.floor(n/86400),hours:Math.floor(n%86400/3600),minutes:Math.floor(n%3600/60),seconds:n%60};
}
function embedUrl(raw){
 if(!validUrl(raw))return null;
 const u=new URL(raw);
 if(u.hostname==='youtu.be'||u.hostname.endsWith('.youtu.be')){
  const id=u.pathname.replace(/^\//,'');
  return /^[\w-]{11}$/.test(id)?'https://www.youtube-nocookie.com/embed/'+id:null;
 }
 if(u.hostname==='youtube.com'||u.hostname==='www.youtube.com'||u.hostname==='m.youtube.com'
    ||u.hostname==='youtube-nocookie.com'||u.hostname==='www.youtube-nocookie.com'){
  const video=u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop();
  return /^[\w-]{11}$/.test(video||'')?'https://www.youtube-nocookie.com/embed/'+video:null;
 }
 // Other government player URLs may block iframes; link to official source instead.
 return null;
}
async function sources(){
 let fromFile=[];
 try{
  const r=await fetch('data/approved-live-events.json',{cache:'no-store'});
  if(r.ok){const j=await r.json();if(Array.isArray(j))fromFile=j.map(normalize).filter(Boolean);}
 }catch(_){}
 let fromDb=[];
 try{
  const db=window.supabase?.createClient(SUPABASE_URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  if(db){
   const {data,error}=await db.from('dd_live_events').select('id,title,starts_at,ends_at,status,source_url,stream_url,recording_url,source_label,is_public').eq('is_public',true).in('status',['upcoming','live','ended']).gte('starts_at',new Date(Date.now()-48*60*60*1000).toISOString()).order('starts_at',{ascending:true}).limit(40);
   if(!error&&Array.isArray(data))fromDb=data.map(normalize).filter(Boolean);
  }
 }catch(_){}
 const byId=new Map();
 for(const a of fromFile)if(['upcoming','live','ended'].includes(a.status))byId.set(a.id,a);
 for(const a of fromDb)byId.set(a.id,a); // Only server-published events can open actual chat rooms.
 return [...byId.values()].filter(x=>x.startsAt.getTime()>Date.now()-48*60*60*1000).sort((a,b)=>a.startsAt-b.startsAt).slice(0,25);
}
function link(text,href){
 const a=el('a','outline',text);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function clearTimer(){
 if(tick){clearInterval(tick);tick=null;}
}
// Approved official source + qualified start only. Never promote speculative reports.
function noticeCandidate(items,now=Date.now()){
 const valid=items.filter(x=>x&&['upcoming','live','ended'].includes(x.status)
  &&x.startsAt instanceof Date&&Number.isFinite(x.startsAt.getTime())
  &&validUrl(x.source)&&x.startsAt.getTime()+48*60*60*1000>now
  &&(x.status!=='ended'||x.startsAt.getTime()<=now));
 return valid.find(x=>x.status==='live'&&x.startsAt.getTime()<=now)
   ||valid.find(x=>x.startsAt.getTime()>now)
   ||valid.find(x=>x.startsAt.getTime()<=now)||null;
}
function updateNoticeClock(){
 if(!currentNotice||!noticeClock)return;
 const now=Date.now(),start=currentNotice.startsAt.getTime();
 if(now>=start+48*60*60*1000){
  document.getElementById('ddLiveNewsNotice')?.setAttribute('hidden','');
  currentNotice=null;noticeClock=null;return;
 }
 if(now<start){
  const t=remaining(start-now);
  noticeClock.textContent='Starts in '+t.days+'d '+String(t.hours).padStart(2,'0')+'h '
    +String(t.minutes).padStart(2,'0')+'m '+String(t.seconds).padStart(2,'0')+'s';
 }else{
  noticeClock.textContent=currentNotice.status==='live'
   ?'Officially listed as LIVE — check the official stream'
   :currentNotice.status==='ended'
    ?'Hearing concluded — check the official page for a recording'
    :'Scheduled start reached — check the official hearing page for status';
 }
}
function renderNewsNotice(items){
 const host=document.getElementById('ddLiveNewsNotice');if(!host)return;
 const event=noticeCandidate(items);
 if(!event){host.hidden=true;host.replaceChildren();currentNotice=null;noticeClock=null;return;}
 currentNotice=event;host.hidden=false;host.replaceChildren();
 const heading=el('div','dd-news-hearing-title');
 heading.append(el('span','dd-news-hearing-tag','OFFICIAL UAP HEARING'),el('strong','',event.title));
 const dates=el('p','dd-news-hearing-dates',
  formatted(event.startsAt,'Europe/London')+' (UK) · '
  +formatted(event.startsAt,'America/New_York')+' (US Eastern)');
 noticeClock=el('p','dd-news-hearing-clock');
 noticeClock.setAttribute('role','timer');noticeClock.setAttribute('aria-live','off');
 const actions=el('div','dd-news-hearing-links');
 actions.append(link('Official hearing announcement',event.source),
  link('LIVE coverage on Disclosure Desk','/?dd_tab=live'));
 host.append(heading,dates,noticeClock,actions);
 updateNoticeClock();
}
function render(){
 if(!container)return;
 clearTimer();window.ddLiveChatClose?.();container.replaceChildren();
 const head=el('div','dd-hearing-summary');
 head.append(el('h2','', '📅 Upcoming UAP hearings'));
 const msg=el('p','muted small',upcoming.length?'Officially scheduled events; times displayed in UK and US Eastern local time.':'No upcoming UAP hearing has been confirmed by an official source yet. The next countdown will appear here after a dated hearing is verified.');
 head.append(msg);
 const links=el('div','dd-live-sources');
 links.append(link('Official House committee calendar ↗','https://docs.house.gov/Committee/Calendar/ByWeek.aspx'),
              link('House Oversight hearings ↗','https://oversight.house.gov/hearing/'));
 head.append(links);container.append(head);
 if(!upcoming.length)return;
 for(const event of upcoming){
  const card=el('article','dd-upcoming-card');
  card.dataset.eventId=event.id;
  const heading=el('h3','',event.title);card.append(heading);
  const date=el('p','dd-upcoming-date',formatted(event.startsAt,'Europe/London')+' (UK)');card.append(date);
  card.append(el('p','muted small',formatted(event.startsAt,'America/New_York')+' (US Eastern)'));
  const badge=el('p','dd-upcoming-state');
  const digits=el('div','dd-live-timer');
  digits.setAttribute('role','timer');digits.setAttribute('aria-label','Time until the officially scheduled hearing');
  card.append(badge,digits);
  const cols=el('div','dd-live-view-and-chat');
  const video=el('div','dd-live-video-area');
  const stream=event.stream||event.recording;
  const watch=embedUrl(stream);
  if(watch){
   const box=el('div','dd-upcoming-video');
   const btn=el('button','dd-upcoming-play','▶ '+(event.status==='live'?'Watch official livestream':'Open scheduled hearing stream'));
   btn.type='button';
   btn.onclick=()=>{
    const frame=el('iframe');
    frame.src=watch+'?playsinline=1&rel=0';
    frame.title='Official UAP hearing stream: '+event.title;
    frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen=true;
    frame.loading='eager';
    box.replaceChildren(frame);
   };
   box.append(btn);video.append(box);
   video.append(el('p','muted small','Playback is loaded only when selected. Official streams can start late or restrict embedding.'));
  }else{
   video.append(el('p','muted small','The official livestream has not been published yet. The original hearing page will provide the confirmed viewing details.'));
  }
  video.append(link('Official hearing details ↗',event.source));
  if(stream)video.append(link('Open publisher stream ↗',stream));
  cols.append(video);
  const chat=el('div','dd-live-chat-panel');
  cols.append(chat);card.append(cols);
  // The approved chat window can begin/end while someone keeps LIVE open.
  // A countdown-only update must mount/unmount the chat at those boundaries
  // WITHOUT re-rendering the hearing card (which may be playing video).
  const startTime=event.startsAt.getTime();
  const expiry=event.endsAt?.getTime();
  const closeTime=Math.min(Number.isFinite(expiry)?expiry:startTime+4*60*60*1000,
                           startTime+4*60*60*1000);
  let chatOpen=false,closeChat=null;
  function syncChat(now){
   const available=event.chatAvailable===true
    &&typeof window.ddLiveChatMount==='function';
   const within=available&&now>=startTime-45*60*1000&&now<closeTime;
   if(within&&!chatOpen){
    chat.replaceChildren();
    try{
     const dispose=window.ddLiveChatMount(chat,event);
     closeChat=typeof dispose==='function'?dispose:null;
     chatOpen=true;
    }catch(_){
     closeChat=null;
     chat.append(el('p','muted small','LIVE chat could not open. The official hearing link remains available.'));
    }
   }else if(!within&&chatOpen){
    closeChat?.();closeChat=null;chatOpen=false;
    chat.replaceChildren();
   }
   if(!within&&!chatOpen&&!chat.childElementCount){
    chat.append(el('p','muted small',
     available?'Registered-user LIVE chat opens 45 minutes before the confirmed start and closes after its approved window.'
              :'Hearing room awaiting official schedule approval. Chat opens only for a verified event.'));
   }
  }
  container.append(card);
  function update(){
   const now=Date.now();
   syncChat(now);
   const ms=event.startsAt.getTime()-now;
   if(ms>0){
    const units=remaining(ms);
    badge.textContent='Official hearing starts in';
    digits.replaceChildren();
    for(const [label,num] of [['Days',units.days],['Hours',units.hours],['Minutes',units.minutes],['Seconds',units.seconds]]){
     const item=el('div','dd-live-time-unit');
     item.append(el('strong','',String(num).padStart(2,'0')),el('small','',label));
     digits.append(item);
    }
   }else{
    digits.replaceChildren();
    badge.textContent=event.status==='live'?'● Officially listed as LIVE':'Scheduled start reached · awaiting live confirmation';
    digits.append(el('p','muted small',event.status==='live'?'Select the official stream to watch alongside the chat.':'The countdown has finished. Awaiting the official webcast or updated schedule.'));
   }
  }
  update();
  const old=tick;
  // Interval installed once after all cards below, not one timer per hearing.
  card._updateClock=update;
 }
 tick=setInterval(()=>{if(document.visibilityState==='visible')for(const c of container.querySelectorAll('.dd-upcoming-card'))c._updateClock?.()},1000);
}
async function refresh(){
 const result=await sources();
 renderNewsNotice(result);
 const visible=result.filter(e=>['upcoming','live'].includes(e.status)&&e.startsAt.getTime()>Date.now()-6*60*60*1000);
 const fingerprint=items=>JSON.stringify(items.map(e=>[e.id,e.title,e.startsAt.toISOString(),e.status,e.stream,e.recording,e.chatAvailable,e.source]));
 if(container&&fingerprint(visible)===fingerprint(upcoming)&&container.childElementCount)return;
 upcoming=visible;
 render();
}
function init(){
 root=document.getElementById('ddLiveMount');if(!root)return;
 container=el('section','section dd-live-schedule');
 container.id='ddLiveSchedule';
 root.prepend(container);
 void refresh();
 // Fresh public event status after curator updates without rebuilding Netlify.
 scheduledRefresh=setInterval(()=>{if(document.visibilityState==='visible')void refresh()},5*60*1000);
 noticeTick=setInterval(()=>{if(document.visibilityState==='visible')updateNoticeClock()},1000);
 window.addEventListener('pagehide',()=>{clearTimer();if(scheduledRefresh)clearInterval(scheduledRefresh);if(noticeTick)clearInterval(noticeTick)},{once:true});
}
window.DD_LIVE_SCHEDULE_TEST={normalize,remaining,embedUrl,noticeCandidate}; // Pure fixture testing only; no private data.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
