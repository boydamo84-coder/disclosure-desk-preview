/* Disclosure Desk Research Edition: one familiar swipeable eleven-tab dock.
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
 ['watchRead','♫','Watch & Read'],['hub','☷','Explore'],['profilePage','👤','Profile']
];
// The public site remains eleven tabs until the separately reviewed Discussions
// backend is activated. Use the same explicit feature gate in the Research dock.
if(window.DD_COMMUNITY_FEATURES?.discussions===true){
 const afterWitness=TABS.findIndex(row=>row[0]==='witness')+1;
 TABS.splice(afterWitness,0,['discussionsPage','☷','Discussions']);
}
if(window.DD_COMMUNITY_FEATURES?.privateChat===true){
 const beforeProfile=TABS.findIndex(row=>row[0]==='profilePage');
 TABS.splice(beforeProfile,0,['chatPage','✉','Chat']);
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
dock.innerHTML='<div class="dd-site-dock-head"><span class="dd-site-dock-label">DISCLOSURE DESK</span><span class="dd-site-dock-status" role="status" aria-live="polite"></span><button class="dd-site-dock-toggle" type="button" aria-expanded="true">Hide menu</button></div><nav class="dd-site-dock-track" aria-label="Disclosure Desk sections"></nav>';
document.body.appendChild(dock);
nav=dock.querySelector('nav');
status=dock.querySelector('.dd-site-dock-status');
toggle=dock.querySelector('.dd-site-dock-toggle');
for(const [id,icon,label] of TABS){
 const button=document.createElement('button');
 button.type='button';button.className='dd-site-dock-tab';button.dataset.ddTab=id;
 button.setAttribute('aria-label',label);
 if(id==='researchStudio')button.setAttribute('aria-current','page');
 const ico=document.createElement('span');ico.className='dd-site-dock-icon';ico.setAttribute('aria-hidden','true');ico.textContent=icon;
 button.append(ico,document.createTextNode(label));
 button.addEventListener('click',()=>{void go(id)});
 nav.appendChild(button);
}
function measure(){
 if(!workspace)return;
 const height=document.querySelector('body>header')?.getBoundingClientRect().height||95;
 const menu=dock.classList.contains('is-hidden')?0:dock.getBoundingClientRect().height;
 document.body.style.setProperty('--dd-research-shell-header-height',height+'px');
 document.body.style.setProperty('--dd-research-dock-height',menu+'px');
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
if(typeof ResizeObserver!=='undefined'&&workspace){
 const observer=new ResizeObserver(measure);
 const header=document.querySelector('body>header');
 if(header)observer.observe(header);
}
requestAnimationFrame(measure);
})();
