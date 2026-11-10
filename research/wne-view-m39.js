/* M39: W.NE Research Edition sticky controls + optional Fit Page display.
 * Never edits editor HTML or save/export payloads.
 */
(()=>{
 'use strict';
 const main=document.querySelector('main.main');
 const workarea=main?.querySelector('.workarea');
 const paper=workarea?.querySelector('.paper');
 const tabs=document.getElementById('dd-word-ribbon-v1');
 const panel=document.getElementById('dd-word-context-v1');
 const bar=main?.querySelector('.formatbar');
 if(!main||!workarea||!paper||!tabs||!panel||!bar)return;
 const containers=[...main.children].filter(node=>node.matches?.(
  '.mobilebar,.topbar,.formatbar,#dd-word-ribbon-v1,#dd-word-context-v1'
 ));
 if(containers.length>=4&&!document.getElementById('wne-m39-sticky-controls')){
  const sticky=document.createElement('div');
  sticky.id='wne-m39-sticky-controls';
  sticky.setAttribute('role','group');
  sticky.setAttribute('aria-label','Document ribbon and formatting tools');
  containers[0].before(sticky);
  for(const node of containers)sticky.append(node);
 }
 const sticky=document.getElementById('wne-m39-sticky-controls');
 const storageKey='dd-wne-research-fit-page-m39';
 let fit=false;
 try{fit=localStorage.getItem(storageKey)==='fit'}catch(_){}
 const formatButton=document.createElement('button');
 formatButton.id='wne-m39-fit-toggle';
 formatButton.type='button';
 formatButton.title='Fit the complete A4-width document onto this screen (view only)';
 formatButton.setAttribute('aria-label','Fit full document page width to screen');
 // Keep Fit Page visible at the START of the horizontally scrolling Home bar.
 // Appending it would bury it behind all formatting tools on mobile.
 bar.prepend(formatButton);
 const pageWidth=794;
 function updateFit(){
  if(!fit||document.body.classList.contains('tv'))return;
  const computed=getComputedStyle(workarea);
  const available=Math.max(90,workarea.clientWidth-
   (parseFloat(computed.paddingLeft)||0)-(parseFloat(computed.paddingRight)||0)-4);
  const ratio=Math.min(1,Math.max(.15,available/pageWidth));
  document.body.style.setProperty('--wne-m39-fit-ratio',String(ratio));
 }
 function syncButtons(){
  const caption=fit?'▣ Fit page ON':'▢ Fit page';
  formatButton.textContent=caption;
  formatButton.setAttribute('aria-pressed',String(fit));
  for(const button of panel.querySelectorAll('[data-action="fitpage"]')){
   button.textContent=fit?'▣ Fit page ON · Use readable view':'▢ Fit entire page';
   button.setAttribute('aria-pressed',String(fit));
   button.title='Toggle full-page-width preview; your saved document is unchanged';
  }
 }
 function setFit(enabled){
  fit=!!enabled;
  document.body.classList.toggle('wne-m39-fit-page',fit);
  try{localStorage.setItem(storageKey,fit?'fit':'readable')}catch(_){}
  updateFit();syncButtons();
 }
 function syncViewMenu(){
  if(document.body.dataset.ddRibbonView!=='view')return;
  let button=panel.querySelector('[data-action="fitpage"]');
  if(!button){
   button=document.createElement('button');
   button.type='button';button.dataset.action='fitpage';
   panel.append(button);
  }
  syncButtons();
 }
 formatButton.addEventListener('click',()=>setFit(!fit));
 // The original W.NE menu dispatcher has no 'fitpage' action. Capture our
 // single added button before that dispatcher, while leaving all old handlers.
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-action="fitpage"]')){
   event.preventDefault();event.stopImmediatePropagation();setFit(!fit);
  }
 },true);
 tabs.addEventListener('click',syncViewMenu);
 tabs.addEventListener('keydown',()=>queueMicrotask(syncViewMenu));
 // The View menu is rebuilt when switching tabs.
 const menuObserver=new MutationObserver(()=>{
  if(document.body.dataset.ddRibbonView==='view'&&!panel.querySelector('[data-action="fitpage"]'))
   syncViewMenu();
 });
 menuObserver.observe(panel,{childList:true});
 const menu=document.getElementById('wne-file-menu');
 if(menu&&sticky){
  const positionMenu=()=>{
   if(menu.hidden)return;
   const top=Math.min(window.innerHeight-110,
    Math.max(70,Math.ceil(sticky.getBoundingClientRect().height)+7));
   menu.style.setProperty('top',top+'px','important');
   menu.style.setProperty('max-height',Math.max(100,window.innerHeight-top-12)+'px','important');
  };
  new MutationObserver(()=>requestAnimationFrame(positionMenu))
   .observe(menu,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('resize',positionMenu,{passive:true});
 }
 if(typeof ResizeObserver==='function'){
  const observer=new ResizeObserver(()=>updateFit());
  observer.observe(workarea);
 }else window.addEventListener('resize',updateFit,{passive:true});
 window.addEventListener('orientationchange',()=>requestAnimationFrame(updateFit),{passive:true});
 // Reflect the selected view when returning from another Research document.
 setFit(fit);syncViewMenu();
 window.DDWNEPageView={get mode(){return fit?'fit':'readable'},setFit};
})();
