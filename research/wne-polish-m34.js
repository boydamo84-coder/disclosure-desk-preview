/* M34: Browser polish. Keep original W.NE handlers; do not alter document contents. */
(()=>{
 'use strict';
 const tabs=document.getElementById('dd-word-ribbon-v1');
 const panel=document.getElementById('dd-word-context-v1');
 const mobile=document.querySelector('.mobilebar');
 const fileMenu=document.getElementById('wne-file-menu');
 if(!tabs||!panel||!fileMenu)return;
 /* The primary Word-style tabs must precede secondary formatting controls. */
 if(mobile?.parentElement){mobile.after(tabs,panel)}
 else document.querySelector('.topbar')?.before(tabs,panel);
 function markFile(active){
  const buttons=[...tabs.querySelectorAll('[data-ribbon]')];
  if(active){
   for(const b of buttons){const on=b.dataset.ribbon==='file';b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1}
   document.body.dataset.ddRibbonView='file';
  }else{
   const f=buttons.find(b=>b.dataset.ribbon==='file');
   f?.setAttribute('aria-selected','false');
  }
 }
 tabs.addEventListener('click',event=>{
  const b=event.target.closest('[data-ribbon]');
  if(!b)return;
  if(b.dataset.ribbon==='file')markFile(!fileMenu.hidden);
  else {
   markFile(false);
   if(b.dataset.ribbon==='insert'){
    const compare=panel.querySelector('[data-action=compare]');
    if(compare)compare.textContent='📑 Case citation / comparison';
    const image=panel.querySelector('[data-action=image]');
    if(image)image.textContent='🖼 Image & caption';
   }
  }
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&fileMenu.hidden)markFile(false)
 });
 /* A readable, reversible light/dark choice belongs in View (not another toolbar). */
 function addTheme(){
  if(document.body.dataset.ddRibbonView!=='view'||panel.querySelector('[data-action=theme]'))return;
  const b=document.createElement('button');b.type='button';b.dataset.action='theme';
  b.textContent='◐ Light / Dark';b.title='Change document page theme';
  panel.append(b);
 }
 tabs.addEventListener('click',()=>addTheme());
 panel.addEventListener('click',event=>{
  if(!event.target.closest('[data-action=theme]'))return;
  event.stopImmediatePropagation();
  document.getElementById('theme')?.click();
 },true);
 /* Keep the File menu always scrollable, even when an older action calculates
    a position using its hidden toolbar button. */
 const styleMenu=()=>{if(!fileMenu.hidden){fileMenu.style.setProperty('top','116px','important');fileMenu.style.setProperty('left','8px','important')}};
 const observer=new MutationObserver(styleMenu);
 observer.observe(fileMenu,{attributes:true,attributeFilter:['hidden','style']});
 /* Modal New Document dialog: no destructive action or cloud write until
    user confirms; never silently replace the original active document. */
 const newBtn=fileMenu.querySelector('[data-file-action=new]');
 if(newBtn){
  const dialog=document.createElement('dialog');dialog.id='dd-m34-new-document';dialog.className='dd-m34-dialog';
  dialog.setAttribute('aria-labelledby','dd-m34-new-heading');
  dialog.innerHTML='<form method="dialog" id="dd-m34-new-form"><h2 id="dd-m34-new-heading">New research document</h2><p>Create a separate private document. Your current report will be saved first and will not be replaced.</p><label for="dd-m34-new-title">Document name</label><input id="dd-m34-new-title" name="title" maxlength="150" required value="New Research Document" autocomplete="off"><p role="status" id="dd-m34-new-status" aria-live="polite"></p><menu><button type="button" id="dd-m34-new-cancel">Cancel</button><button type="submit" id="dd-m34-new-create">Create document</button></menu></form>';
  document.body.append(dialog);
  const input=dialog.querySelector('input'),submit=dialog.querySelector('[type=submit]'),
   feedback=dialog.querySelector('[role=status]'),cancel=dialog.querySelector('#dd-m34-new-cancel');
  let busy=false;
  cancel.onclick=()=>{if(!busy)dialog.close()};
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
  newBtn.addEventListener('click',event=>{
   if(busy)return;
   event.preventDefault();event.stopImmediatePropagation();
   fileMenu.hidden=true;
   document.getElementById('wne-file-button')?.setAttribute('aria-expanded','false');
   feedback.textContent='';dialog.showModal();input.focus();input.select();
  },true);
  dialog.querySelector('form').addEventListener('submit',async event=>{
   event.preventDefault();if(busy)return;
   const title=input.value.trim();
   if(!title){feedback.textContent='Please enter a document name.';return}
   busy=true;submit.disabled=true;cancel.disabled=true;feedback.textContent='Saving the open document first…';
   try{
    if(typeof window.wneSaveBeforeNavigation!=='function'||await window.wneSaveBeforeNavigation('before creating a document')!==true)
     throw Error('Your open document was not confirmed saved. Use Save or Emergency Copy before leaving.');
    feedback.textContent='Creating your private document…';
    const create=await fetch('/api/library',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({action:'create',title,mode:'study',structure:'sections'})});
    const created=await create.json();
    if(!create.ok||!created?.id||!/^[0-9a-f-]{36}$/i.test(created.id))
     throw Error(created?.error||'Cloud did not confirm document creation.');
    const opened=await fetch('/api/library',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({action:'open',id:created.id})});
    if(!opened.ok)throw Error('Document created, but it could not be opened. Find it under My Documents.');
    window.top.location.assign('/research/research-workspace.html?id='+encodeURIComponent(created.id));
   }catch(error){feedback.textContent=error.message||String(error)}
   finally{busy=false;submit.disabled=false;cancel.disabled=false}
  });
 }
 /* Recovery copy confirmation is handled by the original strictly additive
    cloud API; only the resulting navigation choice is styled. */
 window.DDRecoveryCopyNotice=function(result){
  if(!result?.id||!/^[0-9a-f-]{36}$/i.test(result.id))
   return alert('The cloud did not confirm a valid recovered document. Stay in your current report.');
  const dialog=document.createElement('dialog');dialog.className='dd-m34-dialog';
  const title=document.createElement('h2');title.textContent='Recovered copy saved';
  const p=document.createElement('p');p.textContent='A separate copy, '+String(result.title||'Recovered document')+', was created. Your original research is unchanged.';
  const hint=document.createElement('p');hint.textContent='Would you like to open the recovered document now?';
  const menu=document.createElement('menu');
  const stay=document.createElement('button');stay.type='button';stay.textContent='Stay in current report';
  const open=document.createElement('button');open.type='submit';open.textContent='Open recovered copy';
  menu.append(stay,open);dialog.append(title,p,hint,menu);document.body.append(dialog);
  const close=()=>{dialog.close();dialog.remove()};
  stay.onclick=close;open.onclick=()=>{close();window.top.location.assign('/research/research-workspace.html?id='+encodeURIComponent(result.id))};
  dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
  dialog.showModal();
 };
})();
