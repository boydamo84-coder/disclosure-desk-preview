/* Disclosure Desk hearing chat: signed-in members can post during approved LIVE
 * windows, while everyone can read the permanently archived approved transcript.
 * The public RPC returns no raw author/account UUIDs.
 */
(()=>{
'use strict';
const URL='https://omqxizswzcwgzqaczlhe.supabase.co',KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const mk=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const cleaners=new Set();
// LIVE countdown refreshing must not silently close an archived recording's chat.
window.ddLiveChatClose=()=>{for(const fn of [...cleaners])if(!fn.isArchivedReplay)fn()};
window.ddLiveChatMount=(host,event)=>{
 let active=true,user=null,interval=null,channel=null,history=[],oldest=null,hasOlder=false;
 const archived=event.status==='ended';
 const db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const container=mk('section','dd-live-chat-room'),header=mk('h4','',archived?'💬 Saved LIVE chat':'💬 LIVE hearing chat');
 const info=mk('p','dd-live-chat-help',archived?'Archived discussion · read-only. Messages may be removed for moderation or privacy. Times shown in UK local time.':'Public live conversation · only registered accounts can post. Refreshes every 15 seconds; do not share personal details.');
 const messages=mk('div','dd-live-chat-messages');messages.setAttribute('role','log');messages.setAttribute('aria-label','Official hearing chat transcript');
 const older=mk('button','outline','Load earlier chat');older.type='button';older.hidden=true;
 const form=mk('form','dd-live-chat-form'),input=mk('textarea'),send=mk('button','','Send');
 input.maxLength=500;input.placeholder='Add a respectful message (2–500 characters)';input.setAttribute('aria-label','Live chat message');send.type='submit';
 const sign=mk('button','dd-live-chat-join','Sign in to join');sign.type='button';
 sign.onclick=()=>{
  const button=document.querySelector('[data-tab="boards"]');
  if(button){button.click();document.getElementById('ddCloudEmail')?.focus();}
  else window.location.assign('/?dd_tab=boards');
 };
 const status=mk('p','dd-live-chat-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(input,send);container.append(header,info,messages,older,form,sign,status);host.replaceChildren(container);
 const say=(v,error=false)=>{status.textContent=v;status.dataset.error=error?'yes':'no'};
 const controls=()=>{form.hidden=archived||!user;sign.hidden=archived||!!user};
 async function draw(){
  const aliases=await window.DDPublicProfiles?.namesFor('chat',history)||{};
  if(!active)return;
  messages.replaceChildren();
  for(const m of history){
   const item=mk('article','dd-live-chat-message'),meta=mk('div','dd-live-chat-meta');
   const time=new Date(m.created_at);
   const stamp=Number.isFinite(time.getTime())?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(time):'Time unavailable';
   meta.append(mk('span','',String(aliases[m.id]||'Community member')+' · '+stamp));
   if(user&&!m.is_mine){
    const flag=mk('button','dd-live-chat-report','Flag');flag.type='button';
    flag.onclick=async()=>{
     const inputReason=window.prompt('Flag reason: spam, abuse, privacy or other','abuse');
     if(!inputReason)return;
     const reason=inputReason.trim().toLowerCase();
     if(!['spam','abuse','privacy','other'].includes(reason)){say('Choose spam, abuse, privacy or other.',true);return}
     flag.disabled=true;
     const {error}=await db.from('dd_live_chat_flags').insert({message_id:m.id,reporter_id:user.id,reason});
     if(error){flag.disabled=false;say('Flag not recorded: '+String(error.message||'Try again.').slice(0,150),true);return}
     say('Flag recorded. Five distinct registered flags temporarily hide a message for review.');
     void load(false);
    };meta.append(flag);
   }
   item.append(meta,mk('p','',String(m.body||'')));
   messages.append(item);
  }
  if(!history.length)messages.append(mk('p','muted small',archived?'No saved LIVE chat was recorded for this hearing.':'No messages yet.'));
  older.hidden=!hasOlder;
 }
 async function load(previous){
  if(!active||!db)return;
  const {data,error}=await db.rpc('dd_public_hearing_chat',{p_event_id:event.id,p_before:previous?oldest:null,p_limit:60});
  if(!active)return;
  if(error){say('Hearing chat could not load: '+String(error.message||'Try again.').slice(0,150),true);return}
  const batch=Array.isArray(data)?data:[];
  hasOlder=batch.length===60;
  if(previous){
   const all=new Map(history.map(x=>[x.id,x]));
   for(const m of batch)all.set(m.id,m);
   history=[...all.values()].sort((a,b)=>a.created_at.localeCompare(b.created_at));
  }else history=batch.slice().reverse();
  oldest=history[0]?.created_at||null;
  await draw();
  if(!previous)messages.scrollTop=messages.scrollHeight;
 }
 older.onclick=async()=>{older.disabled=true;try{await load(true)}finally{older.disabled=false}};
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!active||!db||!user||archived)return;
  const body=input.value.trim();
  if(body.length<2||body.length>500){say('Write between 2 and 500 characters.',true);return}
  send.disabled=true;say('Sending…');
  const {error}=await db.from('dd_live_chat_messages').insert({event_id:event.id,author_id:user.id,body});
  if(error)say('Not sent: '+String(error.message||'Please try again.').slice(0,140),true);
  else{input.value='';say('Sent.');await load(false)}
  send.disabled=false;
 });
 if(!db){form.hidden=true;sign.hidden=true;say('Hearing chat unavailable.',true);return ()=>{active=false}};
 const listener=db.auth.onAuthStateChange((_kind,session)=>{
  if(!active)return;
  const next=session?.user&&!session.user.is_anonymous?session.user:null;
  if(next?.id!==(user?.id||undefined)){user=next;controls();void draw();}
 });
 async function start(){
  const {data,error}=await db.auth.getUser();
  if(!active)return;
  user=!error&&data?.user&&!data.user.is_anonymous?data.user:null;
  controls();await load(false);
  if(!active||archived)return;
  try{
   channel=db.channel('dd-hearing-chat-'+event.id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'dd_live_chat_messages',filter:'event_id=eq.'+event.id},()=>void load(false))
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'dd_live_chat_messages',filter:'event_id=eq.'+event.id},()=>void load(false))
    .subscribe();
  }catch(_){/* polling remains available if realtime is unavailable */}
  interval=setInterval(()=>{if(active&&document.visibilityState==='visible')void load(false)},15000);
 }
 void start();
 const dispose=()=>{if(!active)return;active=false;listener.data?.subscription?.unsubscribe();if(interval)clearInterval(interval);if(channel)void db.removeChannel(channel);cleaners.delete(dispose)};
 dispose.isArchivedReplay=archived;
 cleaners.add(dispose);
 return dispose;
};
})();
