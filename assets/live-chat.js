/* Disclosure Desk LIVE — registered-user chat for an officially approved hearing.
 * No chat messages in localStorage, HTML injection or anonymous posting.
 * PostgreSQL RLS, triggers and moderation must enforce permissions server-side.
 */
(()=>{
'use strict';
const URL='https://omqxizswzcwgzqaczlhe.supabase.co',KEY='sb_publishable_ed7rP98Oi1_NYNd9hKDFgQ_FC3lan_X';
const make=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n};
const cleaners=new Set();
window.ddLiveChatClose=()=>{for(const dispose of [...cleaners])dispose()};
window.ddLiveChatMount=(host,event)=>{
 let active=true,user=null,channel=null,interval=null;
 const db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const wrapper=make('div','dd-live-chat-room');
 const title=make('h4','', '💬 Hearing live chat');
 const info=make('p','dd-live-chat-help','Signed-in viewers only. Messages are public to other participants. Be respectful; do not share witness addresses or private research.');
 const messages=make('div','dd-live-chat-messages');messages.setAttribute('role','log');messages.setAttribute('aria-label','Messages about this congressional hearing');
 const form=make('form','dd-live-chat-form');
 const input=make('textarea');input.maxLength=500;input.placeholder='Share a respectful comment (2–500 characters)';input.setAttribute('aria-label','Live chat message');
 const send=make('button','', 'Send message');send.type='submit';
 const status=make('div','dd-live-chat-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 form.append(input,send,status);wrapper.append(title,info,messages,form);host.replaceChildren(wrapper);
 const say=(msg,error=false)=>{status.textContent=msg;status.dataset.error=error?'yes':'no'};
 const showSignedOut=()=>{
  messages.replaceChildren(make('p','muted small','Sign in to your Disclosure Desk account to read and join this hearing chat.'));
  const sign=make('button','dd-live-chat-join','Sign in / create account');
  sign.type='button';
  sign.onclick=()=>{
    const tab=document.querySelector('[data-tab="boards"]');
    if(tab){tab.click();document.getElementById('ddCloudEmail')?.focus()}
    else window.location.assign('/?dd_tab=boards');
  };
  messages.append(sign);form.hidden=true;say('A registered Disclosure Desk account is required.');
 };
 function addMessage(m){
  const item=make('article','dd-live-chat-message');
  const meta=make('div','dd-live-chat-meta');
  const name='Researcher '+String(m.author_id||'').replaceAll('-','').slice(0,6).toUpperCase();
  const when=new Date(m.created_at);
  const stamp=Number.isFinite(when.getTime())?new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(when):'';
  meta.append(make('span','',name+' · '+stamp));
  if(user&&m.author_id!==user.id){
   const report=make('button','dd-live-chat-report','Report');
   report.type='button';report.setAttribute('aria-label','Report inappropriate chat message');
   report.onclick=async()=>{
    const reason=window.prompt('Reason for report: spam, abuse, privacy, or other','abuse');
    if(!reason)return;
    if(!['spam','abuse','privacy','other'].includes(reason.trim().toLowerCase())){say('Choose spam, abuse, privacy or other.',true);return;}
    try{
     const {error}=await db.from('dd_live_chat_flags').insert({message_id:m.id,reporter_id:user.id,reason:reason.trim().toLowerCase()});
     if(error)throw error;
     say('Report submitted for moderation.');
     report.disabled=true;report.textContent='Reported';
    }catch(e){say('Report not submitted: '+(e.message||'try again'),true)}
   };
   meta.append(report);
  }
  item.append(meta,make('p','',String(m.body||'')));return item;
 }
 async function load(){
  if(!active||!db||!user)return;
  const {data,error}=await db.from('dd_live_chat_messages').select('id,event_id,author_id,body,created_at').eq('event_id',event.id).order('created_at',{ascending:false}).limit(60);
  if(!active)return;
  if(error){say('Live chat unavailable. '+error.message,true);return;}
  messages.replaceChildren();
  for(const m of (data||[]).slice().reverse())messages.append(addMessage(m));
  if(!data?.length)messages.append(make('p','muted small','No messages yet. Be the first to join the discussion.'));
  messages.scrollTop=messages.scrollHeight;
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!active||!db||!user)return;
  const body=input.value.trim();
  if(body.length<2||body.length>500){say('Write between 2 and 500 characters.',true);return;}
  send.disabled=true;say('Sending…');
  try{
   const {error}=await db.from('dd_live_chat_messages').insert({event_id:event.id,author_id:user.id,body});
   if(error)throw error;
   input.value='';say('Sent.');await load();
  }catch(e){say('Not sent: '+(e.message||'Please try again.'),true)}
  finally{send.disabled=false;}
 });
 if(!db){form.hidden=true;say('Live chat is temporarily unavailable.',true);return ()=>{active=false}};
 const authListener=db.auth.onAuthStateChange((_event,session)=>{
  if(!active)return;
  const next=session?.user&&!session.user.is_anonymous?session.user:null;
  if((next?.id||null)!==(user?.id||null)){user=next;if(!user)showSignedOut();else{form.hidden=false;void load()}}
 });
 async function start(){
  const {data,error}=await db.auth.getUser();
  if(!active)return;
  user=!error&&data?.user&&!data.user.is_anonymous?data.user:null;
  if(!user){showSignedOut();return;}
  form.hidden=false;
  await load();
  if(!active)return;
  try{
   channel=db.channel('dd-hearing-chat-'+event.id)
     .on('postgres_changes',{event:'INSERT',schema:'public',table:'dd_live_chat_messages',filter:'event_id=eq.'+event.id},()=>{void load()})
     .on('postgres_changes',{event:'UPDATE',schema:'public',table:'dd_live_chat_messages',filter:'event_id=eq.'+event.id},()=>{void load()})
     .subscribe();
  }catch(_){say('Live updates unavailable. Messages refresh periodically.')}
  interval=setInterval(()=>{if(active&&document.visibilityState==='visible')void load()},15000);
 }
 void start();
 const dispose=()=>{
  active=false;
  authListener.data?.subscription?.unsubscribe();
  if(interval)clearInterval(interval);
  if(channel)void db.removeChannel(channel);
  cleaners.delete(dispose);
 };
 cleaners.add(dispose);
 return dispose;
};
})();
