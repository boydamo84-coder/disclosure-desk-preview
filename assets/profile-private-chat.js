/* Disclosure Desk: user-consented 1:1 Chat, staged and disabled until
 * separate Supabase backend and real multi-account security QA are approved.
 * No group messaging, no private Boards access, no public LIVE crossover. */
(()=>{'use strict';
const config=window.DD_COMMUNITY_TEST_CONFIG||{},flags=window.DD_COMMUNITY_FEATURES||{};
const enabled=flags.privateChat===true&&['production','test'].includes(config.environment);
const $=id=>document.getElementById(id),mk=(tag,content,cls='')=>{
 const x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=String(content);return x};
let db,host,notice,received,accepted,conversation,currentId=null,lastPaintedPairId=null,lastConversationSignature='',ownerId=null,rows=[],epoch=0,identityRevision=0,myUsername='You',drafts=Object.create(null),inviteSection=null,drawerToggle=null,drawerOpen=false,inboxMode='all',previews=Object.create(null);
const client=()=>window.supabase?(db||(db=window.supabase.createClient(config.url,config.publishableKey,
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}))):null;
function say(message){
 if(!notice)return;
 notice.textContent=String(message);
 notice.hidden=message==='Private chat requests updated.';
}
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
async function mutate(control,fn,success,feedback){
 const expectedOwner=ownerId,expectedRevision=identityRevision;
 control.disabled=true;
 if(feedback){feedback.textContent='Sending request…';feedback.dataset.state='pending'}
 try{
  const c=await auth();
  // A pending button press must not execute after logout or an A-to-B switch.
  if(!expectedOwner||ownerId!==expectedOwner||identityRevision!==expectedRevision)
   throw Error('Your sign-in changed. Please try again.');
  await fn(c);
  if(ownerId!==expectedOwner||identityRevision!==expectedRevision)return;
  await refresh(true);
  if(feedback){feedback.textContent=success;feedback.dataset.state='success'}
  say(success);
 }catch(e){
  if(ownerId===expectedOwner&&identityRevision===expectedRevision){
   const raw=String(e?.message||'Unable to complete request');
   const message=feedback&&/username unavailable/i.test(raw)
    ?'Username unavailable. Ask the member to save a public username and allow Chat requests in Profile.'
    :raw.slice(0,180);
   if(feedback){feedback.textContent=message;feedback.dataset.state='error'}
   say(message);
  }
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
function renderInbox(){
 drawList(accepted,rows.filter(x=>x.status==='accepted'));
 drawList(received,rows.filter(x=>x.status!=='accepted'));
 const unread=rows.filter(x=>x.status==='accepted'&&!x.contact_unavailable&&Number(x.unread_count)>0).length;
 const modes=host?.querySelectorAll?.('[data-dd-inbox-mode]')||[];
 for(const b of modes){const selected=b.dataset.ddInboxMode===inboxMode;b.setAttribute('aria-pressed',String(selected));b.textContent=b.dataset.ddInboxMode==='unread'?'Unread'+(unread?' ('+unread+')':''):'All chats'}
}
function showInbox(){
 currentId=null;lastPaintedPairId=null;lastConversationSignature='';conversation?.replaceChildren();
 if(conversation){const empty=mk('div',undefined,'dd-chat-empty');empty.append(mk('strong','Your conversations'),mk('p','Choose a chat from the list, or start a new conversation using a public username.'));conversation.append(empty)}
 if(host&&typeof host.className==='string')host.className=host.className.replace(/\s*dd-chat-conversation-open\b/g,'');
 page()?.classList?.remove?.('dd-chat-is-conversation');
 closeDrawer();
 if(accepted&&received)renderInbox();
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
 rows=[];currentId=null;ownerId=null;myUsername='You';drafts=Object.create(null);previews=Object.create(null);inboxMode='all';
 showInbox();
 if(inviteSection){inviteSection.hidden=true;inviteSection.querySelector?.('form')?.reset?.()}
 received?.replaceChildren();accepted?.replaceChildren();conversation?.replaceChildren()
}
function drawList(target,list){
 target.replaceChildren();
 const query=String($('ddChatInboxSearch')?.value||'').trim().toLowerCase();
 const filtered=target===accepted&&inboxMode==='unread'?list.filter(row=>Number(row.unread_count)>0&&!row.contact_unavailable):list;
 const visible=query?filtered.filter(row=>String(row.other_username||'Researcher').toLowerCase().includes(query)):filtered;
 if(target===received){const label=$('ddChatRequestsLabel');if(label)label.textContent='Message requests'+(list.length?' ('+list.length+')':'')}
 if(!visible.length){
  entry(target,query?'No matching conversations.':
   target===accepted?(inboxMode==='unread'?'You’re all caught up.':'No conversations yet. Tap New chat to find a researcher.'):'No pending requests.');
  return;
 }
 for(const row of visible){
  const unread=Math.max(0,Number(row.unread_count)||0);
  const name=row.other_username||'Researcher';
  const status=row.contact_unavailable?'Unavailable':
    row.status==='accepted'?(previews[row.pair_id]||(unread?unread+' unread '+(unread===1?'message':'messages'):'Private conversation')):
    row.status==='pending'?(row.direction==='received'?'Incoming request · tap to respond':'Request sent · awaiting acceptance'):
    'Request closed';
  const item=button(target,name,()=>{closeDrawer();currentId=row.pair_id;if(inviteSection)inviteSection.hidden=true;renderInbox();return openConversation(row)});
  item.className+=' dd-chat-person'+(row.pair_id===currentId?' is-current':'');
  item.setAttribute('aria-label',name+' · '+status);item.setAttribute('aria-pressed',String(row.pair_id===currentId));
  item.append(mk('small',status,'dd-chat-person-detail'));
  const avatar=mk('span',String(name).trim().charAt(0).toUpperCase()||'R','dd-chat-avatar');
  avatar.setAttribute('aria-hidden','true');item.append(avatar);
   window.DDMemberAvatars?.decorate?.(avatar,name);
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
function conversationSignature(row){
 return [row.pair_id,row.status,row.direction,row.contact_unavailable,row.unread_count].join(':');
}
async function refresh(forceConversation=false){
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
  renderInbox();
  const active=rows.find(x=>x.pair_id===currentId);
  // Polling must never rebuild the message editor and keyboard when nothing changed.
  // A send/accept action explicitly requests a forced redraw; unread changes redraw as needed.
  if(active&&(forceConversation||conversationSignature(active)!==lastConversationSignature))await openConversation(active);
  else if(currentId&&!active)showInbox();
  else if(!currentId)showInbox();
  if(stamp!==epoch)return;
  say('Private chat requests updated.');
 }catch(e){say('Chat unavailable. '+String(e?.message||'Please retry').slice(0,135))}
}
async function openConversation(row){
 const conversationOwner=ownerId,conversationRevision=identityRevision;
 lastConversationSignature=conversationSignature(row);
 const sameConversation=lastPaintedPairId===row.pair_id;
 const previous=sameConversation?conversation.querySelector?.('.dd-chat-history'):null;
 const scrollTop=previous?.scrollTop||0,nearBottom=!previous||previous.scrollHeight-previous.scrollTop-previous.clientHeight<80;
 lastPaintedPairId=row.pair_id;
 conversation.replaceChildren();
 if(host&&typeof host.className==='string'&&!host.className.includes('dd-chat-conversation-open'))host.className+=' dd-chat-conversation-open';
 page()?.classList?.add?.('dd-chat-is-conversation');
 const heading=mk('div',undefined,'dd-chat-conversation-head');
 const back=button(heading,'←',()=>showInbox());
 back.className+=' dd-chat-back';back.setAttribute('aria-label','Back to chats');
 back.setAttribute('aria-controls','ddChatListDrawer');
 drawerToggle=back;
 const peerName=row.other_username||'Private chat';
 const avatar=mk('span',String(peerName).trim().charAt(0).toUpperCase()||'R','dd-chat-avatar dd-chat-avatar-peer');
 avatar.setAttribute('aria-hidden','true');
 window.DDMemberAvatars?.decorate?.(avatar,peerName);
 const peer=mk('div',undefined,'dd-chat-peer-title');
 peer.append(mk('h4',peerName),mk('small',row.status==='accepted'?'Private conversation':'Chat request'));
 heading.append(avatar,peer);conversation.append(heading);
 if(row.status==='pending'){
  const intro=mk('article',undefined,'dd-chat-bubble');
  intro.append(mk('small',row.direction==='sent'?'Your invitation':'Invitation preview'),mk('p',row.initial_preview||''));
  conversation.append(intro);
 }
 const actions=mk('div',undefined,'dd-profile-actions dd-chat-safety-actions');
 if(row.status==='accepted'){
  const menu=mk('details',undefined,'dd-chat-safety-menu');
  const summary=mk('summary','⋮');summary.setAttribute('aria-label','Conversation safety options');
  menu.append(summary,actions);heading.append(menu);
 }else conversation.append(actions);
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
   if(currentId!==pairId||ownerId!==conversationOwner||identityRevision!==conversationRevision)return;
   if(data?.[0]){previews[pairId]=(data[0].mine?'You: ':'')+String(data[0].body||'').replace(/\s+/g,' ').slice(0,100);renderInbox()}
   let previousDay='';
   for(const m of (data||[]).slice().reverse()){
    const sent=m.sent_at?new Date(m.sent_at):null;
    const day=sent&&!Number.isNaN(sent.getTime())?sent.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'';
    if(day&&day!==previousDay){history.append(mk('div',day,'dd-chat-day'));previousDay=day}
    const item=mk('article',undefined,'dd-chat-bubble '+(m.mine?'dd-chat-bubble-mine':'dd-chat-bubble-other'));
    item.append(mk('small',m.mine?(myUsername||'You'):(row.other_username||'Researcher')),mk('p',m.body||''));
    if(m.sent_at){const time=mk('small',new Date(m.sent_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}),'dd-chat-message-time');item.append(time)}
    const msgTools=mk('details',undefined,'dd-chat-message-menu');
    const msgMenuLabel=mk('summary','⋯');
    msgMenuLabel.setAttribute('aria-label','Message options');
    msgTools.append(msgMenuLabel);
    button(msgTools,'Report message',b=>{
     const reason=reportReason();if(!reason)return;
     return mutate(b,async client=>{
      const {error}=await client.rpc('dd_chat_report',{p_pair_id:pairId,p_reason:reason,p_message_id:m.message_id});
      if(error)throw error;
     },'Selected message reported for owner review.');
    });
    item.append(msgTools);history.append(item);
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
   if(lastMessageId&&currentId===pairId&&ownerId===conversationOwner&&identityRevision===conversationRevision&&Number(row.unread_count)>0){
    const seen=await c.rpc('dd_chat_mark_read',{p_pair_id:pairId,p_last_message_id:lastMessageId});
    if(!seen.error&&seen.data===true&&currentId===pairId){
     row.unread_count=0;
     lastConversationSignature=conversationSignature(row);
     renderInbox();
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
   body.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();form.requestSubmit?.()}});
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
 const newHead=mk('div',undefined,'dd-chat-new-head');newHead.append(headline);
 const closeNew=button(newHead,'✕',()=>{if(inviteSection)inviteSection.hidden=true;$('ddChatNew')?.focus?.()});
 closeNew.setAttribute('aria-label','Close new chat request');
 const form=mk('form',undefined,'dd-chat-search-form');
 const guidance=mk('p','Enter their public username, then send a short introduction. They’ll accept before the conversation starts.','dd-chat-search-help');
 const search=mk('div',undefined,'dd-chat-search-row');
 const name=mk('input');name.required=true;name.maxLength=24;name.autocomplete='off';
 name.placeholder='Public username';name.setAttribute('aria-label','Search user by exact public username');
 const reveal=mk('button','Request chat','dd-chat-search-action');reveal.type='button';
 search.append(name,reveal);
 const detail=mk('div',undefined,'dd-chat-invite-details');detail.hidden=true;
 const caption=mk('label','Introductory message');
 const intro=mk('textarea');intro.required=true;intro.minLength=5;intro.maxLength=1000;intro.rows=1;
 intro.placeholder='Write a short introduction…';intro.setAttribute('aria-label','Invitation preview message');
 intro.addEventListener('input',()=>autoGrow(intro));caption.append(intro);
 const helper=mk('p','The recipient must accept before further messages. Up to 10 new requests per 24 hours.','muted small');
 const send=mk('button','Send request','dd-chat-send');send.type='submit';
 const feedback=mk('p','','muted small dd-chat-request-feedback');
 feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
 detail.append(caption,helper,send);
 reveal.onclick=()=>{
  const username=name.value.trim();
  if(!/^[A-Za-z][A-Za-z0-9_]{2,23}$/.test(username)){
   feedback.textContent='Enter an exact public username to request a chat.';feedback.dataset.state='error';return
  }
  feedback.textContent='';detail.hidden=false;intro.focus?.();
 };
 form.append(guidance,search,detail,feedback);
 form.onsubmit=event=>{
  event.preventDefault();const username=name.value.trim(),preview=intro.value.trim();
  if(detail.hidden){reveal.onclick();return}
  if(!/^[A-Za-z][A-Za-z0-9_]{2,23}$/.test(username)||preview.length<5||preview.length>1000){
   feedback.textContent='Use a valid username and an introduction of 5–1000 characters.';
   feedback.dataset.state='error';return
  }
  void mutate(send,async c=>{
   const {data,error}=await c.rpc('dd_chat_request',{p_username:username,p_preview:preview});
   if(error)throw error;
   if(typeof data!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(data))
    throw Error('Request was not confirmed by the server. Please retry.');
   name.value='';intro.value='';detail.hidden=true;
  },'Request sent. The recipient can accept or decline it.',feedback);
 };
 section.append(newHead,form);target.append(section);inviteSection=section;inviteSection.hidden=true;
}
function fitChatViewport(){
 const root=page();if(!root?.style?.setProperty)return;
 const vv=window.visualViewport;
 const height=vv?.height||window.innerHeight;
 if(Number.isFinite(height))root.style.setProperty('--dd-chat-visual-height',height+'px');
 root.style.setProperty('--dd-chat-visual-top',(vv?.offsetTop||0)+'px');
 const keyboard=Number.isFinite(height)&&window.innerHeight-height>140;
 const dock=document.querySelector?.('nav.nav')?.getBoundingClientRect?.().height||70;
 root.style.setProperty('--dd-chat-bottom-space',(keyboard?0:Math.ceil(dock)+4)+'px');
}
function init(){
 const panel=$('ddProfileChatPanel');host=$('ddProfileChatApp');if(!panel||!host)return;
 if(!enabled){entry(host,'Consent-first one-to-one messaging is being prepared. It is not active yet.');return}
 // Clean inbox at rest. Search/request controls appear only when New chat is selected.
 invite(host);
 const externalNew=$('ddChatNew');if(externalNew)externalNew.onclick=()=>newChat();
 const inboxSearch=$('ddChatInboxSearch');
 if(inboxSearch)inboxSearch.addEventListener('input',renderInbox);
 notice=mk('p','Sign in to view your chat requests.','muted small');
 notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 host.append(notice);
 const grid=mk('div',undefined,'dd-chat-layout');
 const list=mk('div',undefined,'dd-chat-side'),view=mk('div',undefined,'dd-chat-view');
 page()?.classList?.add?.('dd-chat-designed');
 const sidebarHead=mk('div',undefined,'dd-chat-sidebar-head');
 sidebarHead.append(mk('h2','Chats'));
 if(externalNew){externalNew.textContent='＋';externalNew.setAttribute('aria-label','Start a new chat');sidebarHead.append(externalNew)}
 else button(sidebarHead,'＋',()=>newChat());
 list.append(sidebarHead);
 const filter=inboxSearch?.closest?.('.dd-chat-inbox-filter');if(filter)list.append(filter);
 const modes=mk('div',undefined,'dd-chat-inbox-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Filter conversations');
 for(const [id,label] of [['all','All chats'],['unread','Unread']]){const b=button(modes,label,()=>{inboxMode=id;renderInbox()});b.dataset.ddInboxMode=id;b.setAttribute('aria-pressed',String(id===inboxMode))}
 list.append(modes);
 const acceptedHeader=mk('div',undefined,'dd-chat-group-head');
 const allChats=button(acceptedHeader,'← Inbox',()=>showInbox());
 allChats.className+=' dd-chat-show-inbox';allChats.setAttribute('aria-label','Return to all chats');
 acceptedHeader.append(mk('h4','Messages'));
 const refreshButton=button(acceptedHeader,'↻',()=>refresh());refreshButton.className='dd-chat-refresh';refreshButton.setAttribute('aria-label','Refresh conversations');
 accepted=mk('div',undefined,'dd-chat-people');
 list.append(acceptedHeader,accepted);
 list.setAttribute('id','ddChatListDrawer');
 const requests=mk('details',undefined,'dd-chat-requests');
 const requestLabel=mk('summary','Message requests');requestLabel.id='ddChatRequestsLabel';requests.append(requestLabel);
 received=mk('div',undefined,'dd-chat-people');requests.append(received);list.append(requests);
 const privacy=mk('p','Private messages · Requests need acceptance','dd-chat-privacy-note');list.append(privacy);
 conversation=mk('div');view.append(conversation);grid.append(list,view);
 const shade=mk('button',undefined,'dd-chat-drawer-shade');
 shade.type='button';shade.setAttribute('aria-label','Close conversation list');
 shade.onclick=()=>closeDrawer();grid.append(shade);
 host.append(grid);showInbox();fitChatViewport();
 window.addEventListener?.('resize',fitChatViewport);window.visualViewport?.addEventListener?.('resize',fitChatViewport);window.visualViewport?.addEventListener?.('scroll',fitChatViewport);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&drawerOpen){closeDrawer();drawerToggle?.focus?.()}
 });
 panel.addEventListener('toggle',()=>{if(panel.open)void refresh()});
 client()?.auth.onAuthStateChange((event,session)=>{
  // Token refreshes and duplicate same-identity sign-in events must not tear down
  // the Chat UI or dismiss the Android keyboard.
  if(event==='TOKEN_REFRESHED'||(event==='SIGNED_IN'&&session?.user?.id===ownerId))return;
  clear();Promise.resolve().then(()=>{void refresh()});
 });
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void refresh()});
}
window.DDPrivateChat=Object.freeze({refresh});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
