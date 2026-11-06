/* Disclosure Desk: user-consented 1:1 Chat, staged and disabled until
 * separate Supabase backend and real multi-account security QA are approved.
 * No group messaging, no private Boards access, no public LIVE crossover. */
(()=>{'use strict';
const config=window.DD_COMMUNITY_TEST_CONFIG||{},flags=window.DD_COMMUNITY_FEATURES||{};
const enabled=flags.privateChat===true&&['production','test'].includes(config.environment);
const $=id=>document.getElementById(id),mk=(tag,content,cls='')=>{
 const x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=String(content);return x};
let db,host,notice,received,accepted,conversation,currentId=null,ownerId=null,rows=[],epoch=0,identityRevision=0;
const client=()=>window.supabase?(db||(db=window.supabase.createClient(config.url,config.publishableKey,
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}))):null;
function say(message){if(notice)notice.textContent=String(message)}
function button(target,label,fn){
 const b=mk('button',label,'outline');b.type='button';
 b.onclick=()=>{void fn(b)};target.append(b);return b;
}
function entry(target,text){const p=mk('p',text,'muted small');target.append(p);return p}
function reportReason(){const choice=prompt('Report reason: spam, abuse, privacy, harassment, threats or other');
 const reason=String(choice||'').trim().toLowerCase();
 return ['spam','abuse','privacy','harassment','threats','other'].includes(reason)?reason:null}
async function auth(){
 const c=client();if(!c)throw Error('Account service unavailable');
 const {data,error}=await c.auth.getUser();
 if(error||!data?.user||data.user.is_anonymous||data.user.id!==ownerId)
 throw Error('Please sign in again.');
 return c;
}
async function mutate(control,fn,success){
 const expectedOwner=ownerId,expectedRevision=identityRevision;
 control.disabled=true;
 try{
  const c=await auth();
  // A pending button press must not execute after logout or an A-to-B switch.
  if(!expectedOwner||ownerId!==expectedOwner||identityRevision!==expectedRevision)
   throw Error('Your sign-in changed. Please try again.');
  await fn(c);
  if(ownerId!==expectedOwner||identityRevision!==expectedRevision)return;
  say(success);await refresh();
 }catch(e){
  if(ownerId===expectedOwner&&identityRevision===expectedRevision)
   say(String(e?.message||'Unable to complete request').slice(0,180));
 }finally{control.disabled=false}
}
function clear(){
 ++epoch;++identityRevision;
 rows=[];currentId=null;ownerId=null;
 received?.replaceChildren();accepted?.replaceChildren();conversation?.replaceChildren()
}
function drawList(target,list){
 target.replaceChildren();if(!list.length){entry(target,'Nothing here yet.');return}
 for(const row of list){
  const unread=Math.max(0,Number(row.unread_count)||0);
  const suffix=row.status==='accepted'&&!row.contact_unavailable&&unread>0?' · '+unread+' unread':'';
  const label=(row.other_username||'Researcher')+' · '+(row.status==='pending'?'Awaiting acceptance':row.status)+suffix;
  button(target,label,()=>{currentId=row.pair_id;return openConversation(row)});
 }
}
async function refresh(){
 if(!enabled||!host?.closest('details')?.open)return;
 let stamp=++epoch;const c=client();if(!c)return;
 try{
  const {data,error}=await c.auth.getUser();
  if(stamp!==epoch)return;
  if(error||!data?.user||data.user.is_anonymous){clear();say('Sign in to use one-to-one Chat.');return}
  if(ownerId!==data.user.id){clear();ownerId=data.user.id;stamp=epoch}
  const response=await c.rpc('dd_chat_my_pairs');
  if(stamp!==epoch||ownerId!==data.user.id)return;
  if(response.error)throw response.error;
  rows=Array.isArray(response.data)?response.data:[];
  drawList(accepted,rows.filter(x=>x.status==='accepted'));
  drawList(received,rows.filter(x=>x.status!=='accepted'));
  const active=rows.find(x=>x.pair_id===currentId);
  if(active)await openConversation(active);
  else if(currentId){currentId=null;conversation?.replaceChildren()}
  if(stamp!==epoch)return;
  say('Private chat requests updated.');
 }catch(e){say('Chat unavailable. '+String(e?.message||'Please retry').slice(0,135))}
}
async function openConversation(row){
 conversation.replaceChildren();
 const title=mk('h4',row.other_username||'Private chat');conversation.append(title);
 if(row.status==='pending'){
  const intro=mk('article',undefined,'dd-chat-bubble');
  intro.append(mk('small',row.direction==='sent'?'Your invitation':'Invitation preview'),mk('p',row.initial_preview||''));
  conversation.append(intro);
 }
 const actions=mk('div',undefined,'dd-profile-actions');conversation.append(actions);
 const pairId=row.pair_id;
 if(row.status==='pending'){
  if(row.direction==='received'){
   button(actions,'Accept',b=>mutate(b,async c=>{
    const {data,error}=await c.rpc('dd_chat_respond',{p_pair_id:pairId,p_accept:true});
    if(error)throw error;if(data!==true)throw Error('Request unavailable');
   },'Request accepted. Private messaging is now available.'));
   button(actions,'Decline',b=>{
    if(!confirm('Decline this request? No conversation will begin.'))return;
    return mutate(b,async c=>{
     const {data,error}=await c.rpc('dd_chat_respond',{p_pair_id:pairId,p_accept:false});
     if(error)throw error;if(data!==true)throw Error('Request unavailable');
    },'Request declined.');
   });
  }else entry(conversation,'Awaiting the recipient’s decision. No further messages can be sent.');
 }else if(row.status==='declined')entry(conversation,'This invitation was declined or closed.');
 if(row.status==='accepted'){
  const history=mk('div',undefined,'dd-chat-history');history.setAttribute('role','log');
  history.setAttribute('aria-label','Private conversation');
  conversation.append(history);
  try{
   if(row.contact_unavailable)throw Error('Conversation blocked');
   const c=await auth();
   const {data,error}=await c.rpc('dd_chat_history',{p_pair_id:pairId,p_limit:100});
   if(error)throw error;
   if(currentId!==pairId)return;
   for(const m of (data||[]).slice().reverse()){
    const item=mk('article',undefined,'dd-chat-bubble');
    item.append(mk('small',m.mine?'You':'Other person'),mk('p',m.body||''));
    button(item,'Report message',b=>{
     const reason=reportReason();if(!reason)return;
     return mutate(b,async client=>{
      const {error}=await client.rpc('dd_chat_report',{p_pair_id:pairId,p_reason:reason,p_message_id:m.message_id});
      if(error)throw error;
     },'Selected message reported for owner review.');
    });
    history.append(item);
   }
   const lastMessageId=(data||[])[0]?.message_id;
   if(lastMessageId&&currentId===pairId){
    const seen=await c.rpc('dd_chat_mark_read',{p_pair_id:pairId,p_last_message_id:lastMessageId});
    if(!seen.error&&seen.data===true&&currentId===pairId){
     row.unread_count=0;
     drawList(accepted,rows.filter(x=>x.status==='accepted'));
     drawList(received,rows.filter(x=>x.status!=='accepted'));
    }
   }
  }catch(e){entry(history,'History is temporarily unavailable. '+String(e?.message||'').slice(0,100))}
  if(row.contact_unavailable)entry(conversation,'This conversation is blocked. Messages and history are unavailable.');
  else {
   const form=mk('form',undefined,'dd-chat-compose');
   const label=mk('label','Write a private message (max 2000 characters)');
   const body=mk('textarea');body.maxLength=2000;body.rows=3;body.required=true;
   label.append(body);const send=mk('button','Send message','outline');send.type='submit';
   form.append(label,send);conversation.append(form);
   form.onsubmit=event=>{event.preventDefault();
    const message=body.value.trim();if(!message||message.length>2000)return;
    void mutate(send,async c=>{
     const {error}=await c.rpc('dd_chat_send_message',{p_pair_id:pairId,p_body:message});
     if(error)throw error;body.value='';
    },'Message sent.');
   };
  }
 }
 if(row.status!=='declined'){
  button(actions,'Report invitation',b=>{
   const reason=reportReason();if(!reason)return;
   return mutate(b,async c=>{
    const {error}=await c.rpc('dd_chat_report',{p_pair_id:pairId,p_reason:reason,p_message_id:null});
    if(error)throw error;
   },'Invitation reported for owner review.');
  });
  button(actions,'Block',b=>{
   if(!confirm('Block this account from contacting you?'))return;
   return mutate(b,async c=>{
    const {error}=await c.rpc('dd_chat_block',{p_pair_id:pairId});
    if(error)throw error;
   },'Account blocked.');
  });
 }
}
function invite(target){
 const form=mk('form',undefined,'dd-chat-compose');
 form.append(mk('h4','Start a new chat'),mk('p','Enter their exact public username. Up to 10 new chat requests per rolling 24 hours. Only one preview message is sent until they accept.','muted small'));
 const label=mk('label','Username');
 const name=mk('input');name.required=true;name.maxLength=24;name.autocomplete='off';label.append(name);
 const caption=mk('label','Your introductory message (5–1000 characters)');
 const intro=mk('textarea');intro.required=true;intro.minLength=5;intro.maxLength=1000;intro.rows=3;caption.append(intro);
 const send=mk('button','Request chat','outline');send.type='submit';
 form.append(label,caption,send);
 form.onsubmit=event=>{
  event.preventDefault();const username=name.value.trim(),preview=intro.value.trim();
  if(!/^[A-Za-z][A-Za-z0-9_]{2,23}$/.test(username)||preview.length<5||preview.length>1000)
   {say('Use a valid username and introductory message.');return}
  void mutate(send,async c=>{
   const {error}=await c.rpc('dd_chat_request',{p_username:username,p_preview:preview});
   if(error)throw error;name.value='';intro.value='';
  },'Request sent. Further messages are disabled until accepted.');
 };
 target.append(form);
}
function init(){
 const panel=$('ddProfileChatPanel');host=$('ddProfileChatApp');if(!panel||!host)return;
 if(!enabled){entry(host,'Consent-first one-to-one messaging is being prepared. It is not active yet.');return}
 notice=mk('p','Sign in to view your chat requests.','muted small');notice.setAttribute('role','status');
 const grid=mk('div',undefined,'dd-chat-layout');
 const list=mk('div',undefined,'dd-chat-side'),view=mk('div',undefined,'dd-chat-view');
 list.append(mk('h4','Accepted Chats'));accepted=mk('div');list.append(accepted);
 list.append(mk('h4','Pending Requests (received and sent)'));received=mk('div');list.append(received);
 conversation=mk('div');view.append(conversation);grid.append(list,view);
 host.append(notice);
 button(host,'Refresh chats',()=>refresh());
 host.append(grid);invite(host);
 panel.addEventListener('toggle',()=>{if(panel.open)void refresh()});
 client()?.auth.onAuthStateChange(()=>{clear();Promise.resolve().then(()=>{void refresh()})});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void refresh()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
