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
// Discussions are available through Explore on the public site, not as a
// duplicate bottom tab. Keep this dock identical across Research and website.
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
 return tab==='researchStudio'?'/research/index.html':
        tab==='discover'?'/':'/?dd_tab='+encodeURIComponent(tab);
}
function say(message,error=false){
 if(status){status.textContent=message;status.dataset.error=error?'yes':'no'}
 else if(error)window.alert(message);
}
async function verifySaved(tab){
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
  window.top.location.assign(destination(tab));
  return true;
 }finally{
  busy=false;
  dock?.removeAttribute('aria-busy');
 }
}
window.ddResearchNavigateTo=go;
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
