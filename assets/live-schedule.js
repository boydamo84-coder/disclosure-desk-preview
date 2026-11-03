/* Disclosure Desk: verified Congress hearing schedule and real second-by-second timer.
 * Never infer a scheduled congressional hearing from article speculation.
 * No future approved start_at -> no fake countdown or fake LIVE badge.
 */
(()=>{
'use strict';
const URL='https://omqxizswzcwgzqaczlhe.supabase.co',KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const HOSTS=['congress.gov','house.gov','senate.gov','youtube.com','youtube-nocookie.com','youtu.be'];
const validUrl=(raw)=>{try{const u=new URL(raw);return u.protocol==='https:'&&HOSTS.some(x=>u.hostname===x||u.hostname.endsWith('.'+x))}catch{return false}};
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
let root,container,upcoming=[],tick=null,scheduledRefresh=null;
const publicStatus=x=>['upcoming','live','ended','cancelled'].includes(x);
function normalize(x){
 const id=String(x.id||'');
 const start=x.starts_at||x.startAt||'';
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
  const db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  if(db){
   const {data,error}=await db.from('dd_live_events').select('id,title,starts_at,ends_at,status,source_url,stream_url,recording_url,source_label,is_public').eq('is_public',true).in('status',['upcoming','live']).order('starts_at',{ascending:true}).limit(40);
   if(!error&&Array.isArray(data))fromDb=data.map(normalize).filter(Boolean);
  }
 }catch(_){}
 const byId=new Map();
 for(const a of fromFile)if(a.status==='upcoming'||a.status==='live')byId.set(a.id,a);
 for(const a of fromDb)byId.set(a.id,a); // Only server-published events can open actual chat rooms.
 return [...byId.values()].filter(x=>x.startsAt.getTime()>Date.now()-6*60*60*1000).sort((a,b)=>a.startsAt-b.startsAt).slice(0,25);
}
function link(text,href){
 const a=el('a','outline',text);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function clearTimer(){
 if(tick){clearInterval(tick);tick=null;}
}
function render(){
 if(!container)return;
 clearTimer();container.replaceChildren();
 const head=el('div','dd-hearing-summary');
 head.append(el('h2','', '📅 Upcoming UAP hearings'));
 const msg=el('p','muted small',upcoming.length?'Officially scheduled events; times displayed in UK and US Eastern local time.':'No upcoming UAP hearing has been confirmed by an official source yet. The next countdown will appear here after a dated hearing is verified.');
 head.append(msg);
 const links=el('div','dd-live-sources');
 links.append(link('Congress committee calendar ↗','https://www.congress.gov/committee-meetings'),
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
  if(event.chatAvailable&&window.ddLiveChatMount){
   const now=Date.now();
   const starts=event.startsAt.getTime();
   const until=event.endsAt?.getTime()||starts+4*60*60*1000;
   if(now>=starts-45*60*1000&&now<Math.min(until,starts+4*60*60*1000)){
    window.ddLiveChatMount(chat,event);
   }else chat.append(el('p','muted small','Registered-user live chat opens 45 minutes before the confirmed start time.'));
  }else chat.append(el('p','muted small','Hearing room awaiting official schedule approval. Discussion will open to signed-in users when confirmed.'));
  container.append(card);
  function update(){
   const ms=event.startsAt-Date.now();
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
 upcoming=await sources();
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
 window.addEventListener('pagehide',()=>{clearTimer();if(scheduledRefresh)clearInterval(scheduledRefresh)},{once:true});
}
window.DD_LIVE_SCHEDULE_TEST={normalize,remaining,embedUrl}; // Pure fixture testing only; no private data.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
