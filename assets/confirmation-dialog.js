/* Disclosure Desk shared, accessible in-site confirmation dialog.
 * A cancelled, unsupported or interrupted dialog always fails closed.
 * Never performs mutations itself: callers retain existing authenticated RPC/RLS checks.
 */
(()=>{'use strict';
 let busy=false;
 const node=(tag,cls,value)=>{
  const el=document.createElement(tag);if(cls)el.className=cls;
  if(value!==undefined)el.textContent=String(value);return el;
 };
 function show(options={}){
  return new Promise(resolve=>{
   if(busy||!document.body)return resolve(false);
   const dialog=node('dialog','dd-confirm-dialog');
   if(typeof dialog.showModal!=='function')return resolve(false);
   const opts=typeof options==='string'?{message:options}:options||{};
   busy=true;
   const previous=document.activeElement;
   const card=node('div','dd-confirm-card');
   const heading=node('div','dd-confirm-heading');
   const emblem=node('span','dd-confirm-symbol',opts.danger===false?'?':'!');
   emblem.setAttribute('aria-hidden','true');
   const eyebrow=node('span','dd-confirm-eyebrow','DISCLOSURE DESK · CONFIRM ACTION');
   const title=node('h2','dd-confirm-title',opts.title||'Confirm action');
   const message=node('p','dd-confirm-message',opts.message||'Do you want to continue?');
   const fields=node('div','dd-confirm-fields');
   const actions=node('div','dd-confirm-actions');
   const cancel=node('button','dd-confirm-cancel','Cancel');
   const accept=node('button','dd-confirm-accept',opts.confirmText||'Continue');
   cancel.type=accept.type='button';
   if(opts.danger!==false)accept.classList.add('dd-confirm-danger');
   const token=String(opts.requiredPhrase||'');
   if(token){
    const label=node('label','dd-confirm-phrase-label','Type '+token+' to confirm');
    const input=node('input','dd-confirm-phrase');
    input.type='text';input.autocomplete='off';input.spellcheck=false;
    input.autocapitalize='characters';input.setAttribute('aria-label','Type '+token+' to confirm');
    input.maxLength=Math.max(16,token.length);
    input.addEventListener('input',()=>{accept.disabled=input.value!==token});
    accept.disabled=true;label.append(input);fields.append(label);
   }
   heading.append(emblem,eyebrow);card.append(heading,title,message,fields);
   actions.append(cancel,accept);card.append(actions);dialog.append(card);
   dialog.setAttribute('aria-modal','true');
   title.id='dd-confirm-title';message.id='dd-confirm-message';
   dialog.setAttribute('aria-labelledby',title.id);
   dialog.setAttribute('aria-describedby',message.id);
   let settled=false;
   const done=accepted=>{
    if(settled)return;settled=true;
    if(dialog.open)dialog.close();
    dialog.remove();busy=false;
    if(previous?.isConnected&&typeof previous.focus==='function')previous.focus({preventScroll:true});
    resolve(accepted===true);
   };
   cancel.addEventListener('click',()=>done(false));
   accept.addEventListener('click',()=>{if(!accept.disabled)done(true)});
   dialog.addEventListener('cancel',event=>{event.preventDefault();done(false)});
   dialog.addEventListener('close',()=>done(false));
   dialog.addEventListener('click',event=>{if(event.target===dialog)done(false)});
   document.body.append(dialog);
   try{dialog.showModal();cancel.focus({preventScroll:true})}catch{done(false)}
  });
 }
 window.DDConfirm=Object.freeze({show});
})();
