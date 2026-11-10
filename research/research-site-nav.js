/* Disclosure Desk Research Edition: mirror the public swipeable navigation dock.
 * Never navigate away from an open W.NE document unless its existing
 * cloud-save function confirms the current revision has been saved.
 * The independent original W.NE product is not changed by this shell.
 */
(()=>{
'use strict';
const TABS=[
 ['discover','◈','News'],['archivePage','▥','Archive'],['researchStudio','✎','W.NE'],
 ['mapPage','◎','Map'],['clips','▶','Videos'],['livePage','●','LIVE'],
 ['boards','▣','Boards'],['witness','◉','Witness'],
 ['watchRead','♫','Watch & Read'],['profilePage','👤','Profile'],['hub','☷','Explore']
];
// Match the current website's dedicated Discussions tab. Source-controlled
// feature flags and normal save-before-navigation checks still apply.
if(window.DD_COMMUNITY_FEATURES?.discussions===true){
 const beforeMedia=TABS.findIndex(row=>row[0]==='watchRead');
 TABS.splice(beforeMedia,0,['discussionsPage','☷','Discussions']);
}
if(window.DD_COMMUNITY_FEATURES?.privateChat===true){
 const beforeProfile=TABS.findIndex(row=>row[0]==='profilePage');
 TABS.splice(beforeProfile,0,['chatPage','☏','Chat']);
}
const STORAGE_KEY='dd-research-nav-hidden-v1';
const workspace=!!document.getElementById('writer');
const editor=!!document.getElementById('editor')&&!!document.getElementById('save');
const isFrame=window.parent!==window;
let busy=false,status=null,nav=null,toggle=null,dock=null;
function destination(tab){
 // Use an explicit website tab for News too. The bare '/' previously let an
 // older session's remembered W.NE landing page win after leaving the editor.
 return tab==='researchStudio'?'/research/index.html':'/?dd_tab='+encodeURIComponent(tab);
}
function say(message,error=false){
 if(status){status.textContent=message;status.dataset.error=error?'yes':'no'}
 else if(error){if(window.WNEDialogs?.notice)void window.WNEDialogs.notice(message,{title:'Navigation unavailable'});else window.alert(message)}
}
async function verifySaved(tab){
 if(workspace){
  // A new account without a selected document must be able to open Home
  // or leave Research. There is no editor revision to save yet.
  const current=document.getElementById('writer')?.getAttribute('src')||'';
  const selected=new URL(current||'./wne.html',location.href).searchParams.get('id')
    ||new URL(location.href).searchParams.get('id');
  if(!selected)return true;
 }
 if(workspace||editor){
  let save;
  try{
   save=workspace?document.getElementById('writer')?.contentWindow?.wneSaveBeforeNavigation:window.wneSaveBeforeNavigation;
  }catch(e){
   say('Cannot access the editor to verify the save. Stay in W.NE and make an emergency copy.',true);
   return false;
  }
  if(typeof save!=='function'){
   say('Editor is still loading or the report is unavailable. Your work stays open; check Save.',true);
   return false;
  }
  try{
   say('Saving your W.NE document before leaving…');
   const ok=await save('Disclosure Desk navigation to '+tab);
   if(ok!==true){
    say('Save was not confirmed. W.NE stays open—check save status or export an emergency copy.',true);
    return false;
   }
   say('Saved to cloud ✓');
   return true;
  }catch(e){
   say('Cloud save not confirmed. W.NE stays open. '+(e?.message||'Please try again.'),true);
   return false;
  }
 }
 return true;
}
async function go(tab){
 if(busy)return false;
 if(!TABS.some(x=>x[0]===tab))return false;
 if(tab==='researchStudio'&&(workspace||editor))return true; // No reload of an open report.
 busy=true;
 dock?.setAttribute('aria-busy','true');
 try{
  if(!await verifySaved(tab))return false;
  // Only remember the new page AFTER successful save. Otherwise a rejected
  // save must leave the current W.NE document and navigation state unchanged.
  try{window.top.sessionStorage?.setItem('dd_last_open_tab_v1',tab)}catch(_){}
  window.top.location.assign(destination(tab));
  return true;
 }finally{
  busy=false;
  dock?.removeAttribute('aria-busy');
 }
}
window.ddResearchNavigateTo=go;
// Research-only in-app Home. An editor iframe delegates to its same-origin
// workspace; this is never a raw /home navigation or unsaved page unload.
let homeBusy=false;
async function openResearchHome(){
 if(homeBusy||busy)return false;
 homeBusy=true;
 try{
  if(isFrame){
   try{
    if(window.parent!==window&&typeof window.parent.ddResearchOpenHome==='function')
     return await window.parent.ddResearchOpenHome();
   }catch(_){}
   // Fail closed when the parent workspace is unavailable. Never navigate a
   // frame away from unsaved research to a legacy Writer-only /home path.
   return false;
  }
  if(workspace){
   if(!await verifySaved('Research Studio Home'))return false;
   const button=document.getElementById('dd-documents-btn');
   if(!button){say('Research Studio Home is unavailable. Your document remains open.',true);return false}
   button.click();
   return true;
  }
  if(editor){
   if(!await verifySaved('Research Studio Home'))return false;
   const current=new URL(location.href).searchParams.get('id');
   const safe=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current||'');
   const route='/research/research-workspace.html?dd_home=1'+(safe?'&id='+encodeURIComponent(current):'');
   location.assign(route);
   return true;
  }
  return false;
 }finally{homeBusy=false}
}
window.ddResearchOpenHome=openResearchHome;
document.addEventListener('click',event=>{
 const anchor=event.target?.closest?.('a[data-dd-research-home-link],a[href="/home"]');
 if(!anchor)return;
 event.preventDefault();
 event.stopPropagation();
 void openResearchHome();
},true);
function interceptReturn(e){
 const a=e.target?.closest?.('a.dd-return-to-site, a.dd-workspace-site-return');
 if(!a)return;
 e.preventDefault();
 e.stopPropagation();
 try{
  if(isFrame&&typeof window.parent.ddResearchNavigateTo==='function'){
   void window.parent.ddResearchNavigateTo('discover');
   return;
  }
 }catch(_){}
 void go('discover');
}
document.addEventListener('click',interceptReturn,true);
if(isFrame)return; // Parent supplies ONE menu. Do not duplicate within editor/library iframes.
const sheet=document.createElement('link');
sheet.rel='stylesheet';sheet.href='./research-site-nav.css';
document.head.appendChild(sheet);
dock=document.createElement('div');
dock.className='dd-site-dock';
dock.setAttribute('role','region');
dock.setAttribute('aria-label','Disclosure Desk navigation');
dock.innerHTML='<div class="dd-site-dock-head"><span class="dd-site-dock-status" role="status" aria-live="polite"></span><button class="dd-site-dock-toggle" type="button" aria-expanded="true">Hide menu</button></div><nav class="dd-site-dock-track" aria-label="Disclosure Desk sections"></nav>';
document.body.appendChild(dock);
nav=dock.querySelector('nav');
status=dock.querySelector('.dd-site-dock-status');
toggle=dock.querySelector('.dd-site-dock-toggle');
for(const [id,icon,label] of TABS){
 const button=document.createElement('button');
 button.type='button';button.className='dd-site-dock-tab';button.dataset.ddTab=id;
 button.setAttribute('aria-label',label);
 if(id==='researchStudio')button.setAttribute('aria-current','page');
 const ico=document.createElement('span');ico.className='dd-site-dock-icon';ico.setAttribute('aria-hidden','true');
 if(id==='chatPage'&&typeof document.createElementNS==='function'){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.85');
  svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('class','dd-chat-nav-symbol');
  const path=document.createElementNS(ns,'path');path.setAttribute('d','M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4.2-1L3 21l2-5a8.5 8.5 0 1 1 16-4.5Z');
  svg.appendChild(path);ico.appendChild(svg);
 }else ico.textContent=icon;
 button.append(ico,document.createTextNode(label));
 button.addEventListener('click',()=>{void go(id)});
 nav.appendChild(button);
}
// Owner-only profile photo in the Research dock, using the same opaque
// private Storage key as the main website. Never derive a URL from a username.
const profileIcon=nav.querySelector('[data-dd-tab="profilePage"] .dd-site-dock-icon');
let avatarClient=null,avatarEpoch=0,avatarOwner=null,avatarUrl=null,avatarBusy=false;
const avatarUUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function resetResearchAvatar(){
 if(avatarUrl){try{URL.revokeObjectURL(avatarUrl)}catch(_){}avatarUrl=null}
 avatarOwner=null;
 if(profileIcon)profileIcon.textContent='👤';
}
async function refreshResearchAvatar(){
 const gen=++avatarEpoch;
 resetResearchAvatar();
 if(!profileIcon||!window.DD_COMMUNITY_FEATURES?.profileAvatars)return;
 const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
 if(!cfg.url||!cfg.publishableKey||!window.supabase?.createClient)return;
 try{
  avatarClient=avatarClient||window.supabase.createClient(cfg.url,cfg.publishableKey,{
   auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  });
  const auth=await avatarClient.auth.getUser();
  if(gen!==avatarEpoch)return;
  const user=auth.data?.user;
  if(auth.error||!user||user.is_anonymous||!avatarUUID.test(String(user.id||'')))return;
  avatarOwner=user.id;
  const setting=await avatarClient.rpc('dd_avatar_my_settings');
  if(gen!==avatarEpoch||avatarOwner!==user.id||setting.error)return;
  const row=Array.isArray(setting.data)?setting.data[0]:null;
  if(!avatarUUID.test(String(row?.public_key||'')))return;
  const file=await avatarClient.storage.from('dd-profile-avatars').download(row.public_key+'/avatar.webp');
  if(gen!==avatarEpoch||avatarOwner!==user.id||file.error||!file.data)return;
  const url=URL.createObjectURL(file.data);
  if(gen!==avatarEpoch||avatarOwner!==user.id){URL.revokeObjectURL(url);return}
  const img=document.createElement('img');
  img.alt='';img.setAttribute('aria-hidden','true');img.src=url;
  img.onerror=()=>{if(avatarUrl===url){resetResearchAvatar()}};
  profileIcon.replaceChildren(img);
  avatarUrl=url;
 }catch(_){if(gen===avatarEpoch)resetResearchAvatar()}
}
if(profileIcon&&window.DD_COMMUNITY_FEATURES?.profileAvatars&&window.supabase?.createClient){
 void refreshResearchAvatar();
 // Auth updates can arrive while private Storage downloads are still pending.
 // Clear immediately and discard all stale, previous-account responses.
 try{
  const cfg=window.DD_COMMUNITY_TEST_CONFIG||{};
  avatarClient=avatarClient||window.supabase.createClient(cfg.url,cfg.publishableKey,{
   auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
  });
  avatarClient.auth.onAuthStateChange((event)=>{
   if(event==='TOKEN_REFRESHED'||event==='INITIAL_SESSION')return;
   ++avatarEpoch;resetResearchAvatar();
   if(event!=='SIGNED_OUT')Promise.resolve().then(refreshResearchAvatar);
  });
 }catch(_){resetResearchAvatar()}
 window.addEventListener('pagehide',()=>{++avatarEpoch;resetResearchAvatar()},{once:true});
}

function measure(){
 const menu=dock.classList.contains('is-hidden')?0:dock.getBoundingClientRect().height;
 document.body.style.setProperty('--dd-research-dock-height',menu+'px');
 if(workspace){
  const height=document.querySelector('body>header')?.getBoundingClientRect().height||95;
  document.body.style.setProperty('--dd-research-shell-header-height',height+'px');
 }
}
function setHidden(hidden){
 dock.classList.toggle('is-hidden',hidden);
 document.body.classList.toggle('dd-site-nav-hidden',hidden);
 document.body.classList.toggle('dd-site-nav-visible',!hidden);
 toggle.textContent=hidden?'☷ Show menu':'Hide menu';
 toggle.setAttribute('aria-expanded',String(!hidden));
 try{localStorage.setItem(STORAGE_KEY,hidden?'1':'0')}catch(_){}
 measure();
 if(!hidden){
  const active=nav.querySelector('[aria-current="page"]');
  if(active)nav.scrollLeft=Math.max(0,active.offsetLeft-nav.clientWidth/2+active.clientWidth/2);
 }
}
if(workspace)document.body.classList.add('dd-site-nav-workspace');
toggle.addEventListener('click',()=>setHidden(!dock.classList.contains('is-hidden')));
const previouslyHidden=(()=>{try{return localStorage.getItem(STORAGE_KEY)==='1'}catch(_){return false}})();
setHidden(previouslyHidden);
window.addEventListener('resize',measure,{passive:true});
window.addEventListener('orientationchange',()=>requestAnimationFrame(measure));
if(typeof ResizeObserver!=='undefined'){
 const observer=new ResizeObserver(measure);
 observer.observe(dock);
 if(workspace){
  const header=document.querySelector('body>header');
  if(header)observer.observe(header);
 }
}
requestAnimationFrame(measure);
})();
