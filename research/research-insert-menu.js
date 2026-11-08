/* Disclosure Desk W.NE Research Edition: compact Insert menu.
 * Relocates existing Image and Compare buttons. Their established action
 * handlers remain attached; document save/export and other W.NE controls
 * are not replaced.
 */
(()=>{
 'use strict';
 const bar=document.querySelector('.formatbar');
 const editor=document.getElementById('editor');
 const image=document.getElementById('dd-insert-image');
 const compare=document.getElementById('dd-insert-comparison');
 if(!bar||!editor||!image||!compare||document.getElementById('dd-research-insert-trigger'))return;

 const trigger=document.createElement('button');
 trigger.type='button';
 trigger.id='dd-research-insert-trigger';
 trigger.className='tool';
 trigger.textContent='＋ Insert ▾';
 trigger.setAttribute('aria-haspopup','menu');
 trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-controls','dd-research-insert-menu');
 trigger.title='Insert an image or case comparison';
 bar.insertBefore(trigger,bar.firstChild);

 const menu=document.createElement('div');
 menu.id='dd-research-insert-menu';
 menu.setAttribute('role','menu');
 menu.setAttribute('aria-label','Insert into research document');
 menu.hidden=true;
 document.body.append(menu);
 for(const button of [image,compare]){
  button.setAttribute('role','menuitem');
  button.classList.add('dd-research-insert-action');
  button.title=button.id==='dd-insert-image'
   ?'Insert an image with caption and source'
   :'Insert a case comparison or summary';
  menu.append(button);
 }

 let selection=null;
 function rememberSelection(){
  try{
   const sel=window.getSelection();
   if(sel?.rangeCount&&editor.contains(sel.anchorNode)){
    selection=sel.getRangeAt(0).cloneRange();
   }
  }catch(_){selection=null}
 }
 function restoreSelection(){
  if(!selection)return;
  try{
   if(editor.contains(selection.commonAncestorContainer)){
    const sel=window.getSelection();
    sel.removeAllRanges();sel.addRange(selection.cloneRange());
   }
  }catch(_){}
  selection=null;
 }
 function placeMenu(){
  // Floating outside the horizontally scrolling toolbar prevents clipping.
  if(menu.hidden)return;
  if(window.matchMedia('(max-width: 600px)').matches){
   menu.style.left='10px';
   menu.style.right='10px';
   menu.style.top='auto';
   menu.style.bottom='max(12px, env(safe-area-inset-bottom))';
   return;
  }
  const rect=trigger.getBoundingClientRect();
  const w=menu.offsetWidth||208,h=menu.offsetHeight||98;
  menu.style.right='auto';
  menu.style.bottom='auto';
  menu.style.left=Math.round(Math.max(10,Math.min(rect.left,window.innerWidth-w-10)))+'px';
  menu.style.top=Math.round(rect.bottom+h+12<=window.innerHeight
   ?rect.bottom+6:Math.max(10,rect.top-h-6))+'px';
 }
 function close(focusTrigger=false){
  if(menu.hidden)return;
  menu.hidden=true;
  trigger.setAttribute('aria-expanded','false');
  if(focusTrigger)trigger.focus();
 }
 function open(){
  rememberSelection();
  menu.hidden=false;
  trigger.setAttribute('aria-expanded','true');
  placeMenu();
  image.focus();
 }
 trigger.addEventListener('pointerdown',rememberSelection);
 trigger.addEventListener('click',()=>menu.hidden?open():close(true));
 menu.addEventListener('click',event=>{
  if(event.target.closest('#dd-insert-image, #dd-insert-comparison')){
   close();
   restoreSelection(); // Existing Image/Compare listeners will capture this selection.
  }
 },true);
 menu.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close(true);return}
  if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
  event.preventDefault();
  const items=[image,compare],current=items.indexOf(document.activeElement);
  const next=(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
  items[next].focus();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!menu.hidden){event.preventDefault();close(true)}
 });
 document.addEventListener('pointerdown',event=>{
  if(!menu.hidden&&!menu.contains(event.target)&&event.target!==trigger)close();
 },true);
 window.addEventListener('resize',placeMenu);
 window.addEventListener('scroll',placeMenu,true);
})();
