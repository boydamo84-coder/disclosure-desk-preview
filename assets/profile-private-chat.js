/* Disclosure Desk: user-consented 1:1 Chat, staged and disabled until
 * separate Supabase backend and real multi-account security QA are approved.
 * No group messaging, no private Boards access, no public LIVE crossover. */
(()=>{'use strict';
const config=window.DD_COMMUNITY_TEST_CONFIG||{},flags=window.DD_COMMUNITY_FEATURES||{};
const enabled=flags.privateChat===true&&['production','test'].includes(config.environment);
const $=id=>document.getElementById(id),mk=(tag,content,cls='')=>{
 const x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=String(content);return x};
let db,host,notice,received,accepted,conversation,currentId=null,lastPaintedPairId=null,ownerId=null,rows=[],epoch=0,identityRevision=0,myUsername='You',drafts=Object.create(null),inviteSection=null,drawerToggle=null,drawerOpen=false;
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
function page(){return $('chatPage')}
function closeDrawer(){
 drawerOpen=false;
 if(host&&typeof host.className==='string')host.className=host.className.replace(/\s*dd-chat-drawer-open\b/g,'');
 drawerToggle?.setAttribute?.('aria-expanded','false');
}
function toggleDrawer(){
 if(!currentId)return;
 drawerOpen=!drawerOpen;
 if(host&&typeof host.className==='string'){
  host.className=host.className.replace(/\s*dd-chat-drawer-open\b/g,'');
  if(drawerOpen)host.className+=' dd-chat-drawer-open';
 }
 drawerToggle?.setAttribute?.('aria-expanded',String(drawerOpen));
}
function showInbox(){
 currentId=null;lastPaintedPairId=null;conversation?.replaceChildren();
 if(host&&typeof host.className==='string')host.className=host.className.replace(/\s*dd-chat-conversation-open\b/g,'');
 page()?.classList?.remove?.('dd-chat-is-conversation');
 closeDrawer();
}
function newChat(){
 showInbox();
 if(inviteSection){
  inviteSection.hidden=false;
  inviteSection.querySelector?.('input')?.focus?.();
 }
}
function clear(){
 ++epoch;++identityRevision;
 rows=[];currentId=null;ownerId=null;myUsername='You';drafts=Object.create(null);
 showInbox();
 if(inviteSection)inviteSection.hidden=true;
 received?.replaceChildren();accepted?.replaceChildren();conversation?.replaceChildren()
}
function drawList(target,list){
 target.replaceChildren();
 if(!list.length){
  entry(target,target===accepted?'No conversations yet. Search for a researcher above to start.':'No pending requests.');
  return;
 }
 for(const row of list){
  const unread=Math.max(0,Number(row.unread_count)||0);
  const name=row.other_username||'Researcher';
  const status=row.contact_unavailable?'Unavailable':
    row.status==='accepted'?(unread?'New messages':'Open conversation'):
    row.status==='pending'?(row.direction==='received'?'Incoming request · tap to respond':'Request sent · awaiting acceptance'):
    'Request closed';
  const item=button(target,name,()=>{closeDrawer();currentId=row.pair_id;if(inviteSection)inviteSection.hidden=true;return openConversation(row)});
  item.className+=' dd-chat-person'+(row.pair_id===currentId?' is-current':'');
  item.setAttribute('aria-label',name+' · '+status);
  item.append(mk('small',status,'dd-chat-person-detail'));
  if(unread&&row.status==='accepted'&&!row.contact_unavailable){
   const badge=mk('span',String(unread),'dd-chat-person-count');
   badge.setAttribute('aria-label',unread+' unread messages');item.append(badge);
  }
 }
}
function autoGrow(field){
 // One line at rest, then max three visible lines; beyond this, scroll within textarea.
 if(!field.style||typeof field.scrollHeight!=='number')return;
 field.style.height='auto';
 const height=Math.min(88,Math.max(42,field.scrollHeight));
 field.style.height=height+'px';
 field.style.overflowY=field.scrollHeight>88?'auto':'hidden';
}
async function refresh(){
 if(!enabled||!(host?.closest('details')?.open||window.DDChatTab?.isOpen?.()))return;
 let stamp=++epoch;const c=client();if(!c)return;
 try{
  const {data,error}=await c.auth.getUser();
  if(stamp!==epoch)return;
  if(error||!data?.user||data.user.is_anonymous){clear();say('Sign in to use one-to-one Chat.');return}
  if(ownerId!==data.user.id){
   clear();ownerId=data.user.id;stamp=epoch;
   if(typeof c.from==='function'){
    try{const name=await c.from('dd_public_names').select('display_name').eq('user_id',ownerId).maybeSingle();
     if(ownerId===data.user.id&&stamp===epoch)myUsername=String(name?.data?.display_name||'You').slice(0,24);
    }catch(_){}
   }
  }
  const response=await c.rpc('dd_chat_my_pairs');
  if(stamp!==epoch||ownerId!==data.user.id)return;
  if(response.error)throw response.error;
  rows=Array.isArray(response.data)?response.data:[];
  drawList(accepted,rows.filter(x=>x.status==='accepted'));
  drawList(received,rows.filter(x=>x.status!=='accepted'));
  const active=rows.find(x=>x.pair_id===currentId);
  if(active)await openConversation(active);
  else if(currentId)showInbox();
  if(stamp!==epoch)return;
  say('Private chat requests updated.');
 }catch(e){say('Chat unavailable. '+String(e?.message||'Please retry').slice(0,135))}
}
async function openConversation(row){
 const sameConversation=lastPaintedPairId===row.pair_id;
 const previous=sameConversation?conversation.querySelector?.('.dd-chat-history'):null;
 const scrollTop=previous?.scrollTop||0,nearBottom=!previous||previous.scrollHeight-previous.scrollTop-previous.clientHeight<80;
 lastPaintedPairId=row.pair_id;
 conversation.replaceChildren();
 if(host&&typeof host.className==='string'&&!host.className.includes('dd-chat-conversation-open'))host.className+=' dd-chat-conversation-open';
 page()?.classList?.add?.('dd-chat-is-conversation');
 const heading=mk('div',undefined,'dd-chat-conversation-head');
 const back=button(heading,'☰',()=>toggleDrawer());
 back.className+=' dd-chat-back';back.setAttribute('aria-label','Open conversation list');
 back.setAttribute('aria-controls','ddChatListDrawer');
 back.setAttribute('aria-expanded',String(drawerOpen));
 drawerToggle=back;
 const title=mk('h4',row.other_username||'Private chat');heading.append(title);conversation.append(heading);
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
    const item=mk('article',undefined,'dd-chat-bubble '+(m.mine?'dd-chat-bubble-mine':'dd-chat-bubble-other'));
    item.append(mk('small',m.mine?(myUsername||'You'):(row.other_username||'Researcher')),mk('p',m.body||''));
    if(m.sent_at){const time=mk('small',new Date(m.sent_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}),'dd-chat-message-time');item.append(time)}
    button(item,'Report message',b=>{
     const reason=reportReason();if(!reason)return;
     return mutate(b,async client=>{
      const {error}=await client.rpc('dd_chat_report',{p_pair_id:pairId,p_reason:reason,p_message_id:m.message_id});
      if(error)throw error;
     },'Selected message reported for owner review.');
    });
    history.append(item);
   }
   const syncHistoryScroll=()=>{
    if(currentId!==pairId||lastPaintedPairId!==pairId)return;
    if(typeof history.scrollTop==='number'&&typeof history.scrollHeight==='number')
     history.scrollTop=nearBottom?history.scrollHeight:scrollTop;
   };
   syncHistoryScroll();
   // On Android the final layout height is measured after DOM paint.
   window.requestAnimationFrame?.(syncHistoryScroll);
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
   const label=mk('label','Message (max 2000 characters)');
   label.className='dd-chat-visually-hidden';
   const bar=mk('div',undefined,'dd-chat-compose-bar');
   const body=mk('textarea');body.maxLength=2000;body.rows=1;body.required=true;
   body.placeholder='Write a message…';body.setAttribute('aria-label','Write a private message');
   body.value=drafts[pairId]||'';body.addEventListener('input',()=>{drafts[pairId]=body.value;autoGrow(body)});
   label.append(body);const send=mk('button','Send','dd-chat-send');send.type='submit';
   send.setAttribute('aria-label','Send private message');
   bar.append(label,send);form.append(bar);conversation.append(form);
   autoGrow(body);
   form.onsubmit=event=>{event.preventDefault();
    const message=body.value.trim();if(!message||message.length>2000)return;
    void mutate(send,async c=>{
     const {error}=await c.rpc('dd_chat_send_message',{p_pair_id:pairId,p_body:message});
     if(error)throw error;delete drafts[pairId];body.value='';
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
 const section=mk('section',undefined,'dd-chat-start');
 const headline=mk('h3','Find a researcher');
 const form=mk('form',undefined,'dd-chat-search-form');
 const search=mk('div',undefined,'dd-chat-search-row');
 const name=mk('input');name.required=true;name.maxLength=24;name.autocomplete='off';
 name.placeholder='Search user';name.setAttribute('aria-label','Search user by exact public username');
 const reveal=mk('button','Request chat','dd-chat-search-action');reveal.type='button';
 search.append(name,reveal);
 const detail=mk('div',undefined,'dd-chat-invite-details');detail.hidden=true;
 const caption=mk('label','Introductory message');
 const intro=mk('textarea');intro.required=true;intro.minLength=5;intro.maxLength=1000;intro.rows=1;
 intro.placeholder='Write a short introduction…';intro.setAttribute('aria-label','Invitation preview message');
 intro.addEventListener('input',()=>autoGrow(intro));caption.append(intro);
 const helper=mk('p','The recipient must accept before further messages. Up to 10 new requests per 24 hours.','muted small');
 const send=mk('button','Send request','dd-chat-send');send.type='submit';
 detail.append(caption,helper,send);
 reveal.onclick=()=>{
  const username=name.value.trim();
  if(!/^[A-Za-z][A-Za-z0-9_]{2,23}$/.test(username)){say('Enter an exact public username to request a chat.');return}
  detail.hidden=false;intro.focus?.();
 };
 form.append(search,detail);
 form.onsubmit=event=>{
  event.preventDefault();const username=name.value.trim(),preview=intro.value.trim();
  if(detail.hidden){reveal.onclick();return}
  if(!/^[A-Za-z][A-Za-z0-9_]{2,23}$/.test(username)||preview.length<5||preview.length>1000){
   say('Use a valid username and an introduction of 5–1000 characters.');return
  }
  void mutate(send,async c=>{
   const {error}=await c.rpc('dd_chat_request',{p_username:username,p_preview:preview});
   if(error)throw error;name.value='';intro.value='';detail.hidden=true;
  },'Request sent. The recipient can accept or decline it.');
 };
 section.append(headline,form);target.append(section);inviteSection=section;inviteSection.hidden=true;
}
function init(){
 const panel=$('ddProfileChatPanel');host=$('ddProfileChatApp');if(!panel||!host)return;
 if(!enabled){entry(host,'Consent-first one-to-one messaging is being prepared. It is not active yet.');return}
 // Clean inbox at rest. Search/request controls appear only when New chat is selected.
 invite(host);
 const externalNew=$('ddChatNew');if(externalNew)externalNew.onclick=()=>newChat();
 notice=mk('p','Sign in to view your chat requests.','muted small');
 notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 host.append(notice);
 const grid=mk('div',undefined,'dd-chat-layout');
 const list=mk('div',undefined,'dd-chat-side'),view=mk('div',undefined,'dd-chat-view');
 const acceptedHeader=mk('div',undefined,'dd-chat-group-head');
 const allChats=button(acceptedHeader,'← Inbox',()=>showInbox());
 allChats.className+=' dd-chat-show-inbox';allChats.setAttribute('aria-label','Return to all chats');
 acceptedHeader.append(mk('h4','Conversations'));
 const create=button(acceptedHeader,'＋',()=>newChat());
 create.className+=' dd-chat-new-from-list';create.setAttribute('aria-label','Start a new chat');
 const refreshButton=button(acceptedHeader,'↻',()=>refresh());refreshButton.className='dd-chat-refresh';refreshButton.setAttribute('aria-label','Refresh conversations');
 accepted=mk('div',undefined,'dd-chat-people');
 list.append(acceptedHeader,accepted);
 list.setAttribute('id','ddChatListDrawer');
 list.append(mk('h4','Pending requests'));
 received=mk('div',undefined,'dd-chat-people');list.append(received);
 conversation=mk('div');view.append(conversation);grid.append(list,view);
 const shade=mk('button',undefined,'dd-chat-drawer-shade');
 shade.type='button';shade.setAttribute('aria-label','Close conversation list');
 shade.onclick=()=>closeDrawer();grid.append(shade);
 host.append(grid);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&drawerOpen){closeDrawer();drawerToggle?.focus?.()}
 });
 panel.addEventListener('toggle',()=>{if(panel.open)void refresh()});
 client()?.auth.onAuthStateChange(()=>{clear();Promise.resolve().then(()=>{void refresh()})});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void refresh()});
}
window.DDPrivateChat=Object.freeze({refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
