/* M34 accessible, branded W.NE Research dialogs.
 * Not a replacement for data safety, revisions or server confirmations.
 * Use Promise-based confirmations so destructive changes require a real tap.
 */
(()=>{
'use strict';
let queue=Promise.resolve(),serial=0;
function enqueue(factory){
 const task=queue.then(factory,factory);
 queue=task.then(()=>undefined,()=>undefined);
 return task;
}
function show(kind,message,options={}){
 return enqueue(()=>new Promise(resolve=>{
  const id='wne-m34-dialog-title-'+(++serial);
  const dialog=document.createElement('dialog');
  dialog.className='dd-m34-dialog wne-m34-prompt';
  dialog.setAttribute('aria-labelledby',id);
  dialog.setAttribute('aria-modal','true');
  const heading=document.createElement('h2');heading.id=id;
  heading.textContent=String(options.title||(
   kind==='confirm'?'Confirm change':kind==='input'?'Enter details':'W.NE Research'));
  const body=document.createElement('p');body.className='wne-m34-prompt-message';
  body.textContent=String(message||'');
  const actions=document.createElement('menu');
  const primary=document.createElement('button');primary.type='button';
  primary.textContent=String(options.confirmLabel||(
   kind==='confirm'?'Continue':kind==='input'?'Confirm':'OK'));
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';
  let input=null,done=false;
  const finish=value=>{
   if(done)return;done=true;
   if(dialog.open)dialog.close();
   dialog.remove();
   resolve(value);
  };
  const cancelled=()=>finish(kind==='input'?null:false);
  if(kind==='input'){
   const label=document.createElement('label');
   label.textContent=String(options.label||'Value');
   input=document.createElement('input');
   input.type=options.secret?'password':'text';
   input.name='value';input.maxLength=options.maxLength||256;
   if(options.secret){input.autocomplete='new-password';input.spellcheck=false}
   input.value=String(options.defaultValue||'');
   input.setAttribute('aria-label',label.textContent);
   label.append(input);dialog.append(heading,body,label);
  }else dialog.append(heading,body);
  if(kind!=='notice'){cancel.onclick=cancelled;actions.append(cancel)}
  primary.onclick=()=>{
   if(input){
    const value=input.value.trim();
    if(!value&&options.required!==false){input.setCustomValidity('Please enter a value.');input.reportValidity();return}
    finish(value);
   }else finish(true);
  };
  if(input)input.addEventListener('input',()=>input.setCustomValidity(''));
  dialog.addEventListener('cancel',event=>{event.preventDefault();cancelled()});
  actions.append(primary);dialog.append(actions);document.body.append(dialog);
  try{dialog.showModal()}catch(error){dialog.remove();resolve(kind==='input'?null:false);return}
  (input||(kind==='notice'?primary:cancel)).focus();
 }));
}
window.WNEDialogs=Object.freeze({
 confirm:(message,options={})=>show('confirm',message,options),
 notice:(message,options={})=>show('notice',message,options),
 input:(message,options={})=>show('input',message,options)
});
})();