/* Dedicated Chat tab for the existing consent-gated DD private messaging module.
 * Uses existing authenticated RPCs, no extra database, no direct table reads,
 * no public profile / email enumeration, no Realtime publication changes.
 */
(()=>{'use strict';
const flags=window.DD_COMMUNITY_FEATURES||{},cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
if(flags.privateChat!==true||!['test','production'].includes(cfg.environment))return;
let client=null,badge=null,previousFingerprint='',inFlight=false,owner=null;
const getClient=()=>window.supabase?(client||(client=window.supabase.createClient(cfg.url,cfg.publishableKey,
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}))):null;
const page=()=>document.getElementById('chatPage');
const isOpen=()=>!!page()&&!page().classList.contains('hidden');
function countUnread(pairs){
 return pairs.reduce((n,p)=>n+(p.status==='accepted'&&!p.contact_unavailable?Math.max(0,Number(p.unread_count)||0):0)
  +(p.status==='pending'&&p.direction==='received'?1:0),0);
}
function setBadge(count){
 if(!badge)return;
 badge.textContent=count>99?'99+':String(count);
 badge.hidden=count<1;
 const tab=badge.closest('button');
 if(tab)tab.setAttribute('aria-label',count>0?'Chat, '+count+' unread items':'Chat');
}
async function poll(){
 if(inFlight||document.visibilityState==='hidden')return;
 const c=getClient();if(!c)return;
 inFlight=true;
 try{
  const identity=await c.auth.getUser(),id=identity?.data?.user?.is_anonymous?null:identity?.data?.user?.id;
  if(!id){owner=null;previousFingerprint='';setBadge(0);return}
  if(owner!==id){owner=id;previousFingerprint='';setBadge(0)}
  const answer=await c.rpc('dd_chat_my_pairs');
  if(answer.error)throw answer.error;
  const now=await c.auth.getUser();
  if(now?.data?.user?.id!==id)return; // In-flight account changes cannot update the badge.
  const rows=Array.isArray(answer.data)?answer.data:[];
  setBadge(countUnread(rows));
  const fingerprint=rows.map(p=>[p.pair_id,p.status,p.unread_count,p.contact_unavailable].join(':')).join('|');
  const composerFocused=!!document.activeElement?.closest?.('.dd-chat-compose');
  if(isOpen()&&fingerprint!==previousFingerprint&&!composerFocused){
   previousFingerprint=fingerprint;
   window.DDPrivateChat?.refresh?.();
  }else if(!isOpen())previousFingerprint=fingerprint;
 }catch(e){/* Retain last rendered state during transient network loss. */}
 finally{inFlight=false}
}
function init(){
 const mount=document.getElementById('ddChatPageMount');
 const existing=document.getElementById('ddProfileChatApp');
 const oldPanel=document.getElementById('ddProfileChatPanel');
 const rail=document.querySelector('.nav-inner');
 if(!mount||!existing||!rail||!page())return;
 // MOVE the original UI, not a second Chat app or another Supabase schema.
 mount.append(existing);
 if(oldPanel){
  const note=document.createElement('p');note.className='muted small';
  note.textContent='Your conversations now have their own Chat tab. Username and privacy preferences remain in Profile.';
  oldPanel.append(note);
  const open=document.createElement('button');open.className='outline';open.type='button';
  open.textContent='Open Chat';open.onclick=()=>window.navigateTo?.('chatPage');oldPanel.append(open);
 }
 page().removeAttribute('hidden');
 const tab=document.createElement('button');tab.className='tab';tab.type='button';tab.dataset.tab='chatPage';
 const ico=document.createElement('span');ico.className='ico';ico.textContent='✉';
 const label=document.createElement('span');label.textContent='Chat';
 badge=document.createElement('span');badge.className='dd-chat-unread-badge';badge.hidden=true;
 badge.setAttribute('aria-live','polite');
 tab.append(ico,label,badge);
 tab.setAttribute('aria-label','Chat');
 tab.onclick=()=>{window.navigateTo?.('chatPage');void poll()};
 rail.insertBefore(tab,rail.querySelector('[data-tab="profilePage"]'));
 const c=getClient();
 c?.auth.onAuthStateChange(()=>{owner=null;previousFingerprint='';setBadge(0);
  Promise.resolve().then(()=>{void poll()})});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void poll()});
 window.setInterval(()=>{void poll()},15000);
 void poll();
}
window.DDChatTab=Object.freeze({isOpen,poll});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
