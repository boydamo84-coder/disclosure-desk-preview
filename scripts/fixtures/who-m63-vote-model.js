'use strict';
// M63 development-only model and controlled preview. NOT in public site package.
// Production must use server-enforced authenticated RLS; UI is not a security boundary.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DDWhoM63Preview=api;
})(typeof window!=='undefined'?window:null,function(){
 const criteria=Object.freeze([
  Object.freeze({id:'original',name:'Original record and context',max:25,help:'Check the original speaker, date, transcript and full context.'}),
  Object.freeze({id:'independent',name:'Independent corroboration',max:30,help:'Distinguish independent records from repetitions of one account.'}),
  Object.freeze({id:'direct',name:'Original records and measurements',max:25,help:'What original footage, sensor readings or documents can be inspected?'}),
  Object.freeze({id:'testable',name:'Specificity and testability',max:10,help:'Can the methods, assumptions and measurements be independently checked?'}),
  Object.freeze({id:'alternatives',name:'Alternatives and uncertainty',max:10,help:'Have competing explanations and limitations been considered?'})
 ]);
 const fields=criteria.map(c=>c.id);
 function validate(input){
  if(!input||Array.isArray(input)||typeof input!=='object')throw new TypeError('Expected five answer categories');
  if(Object.keys(input).some(k=>!fields.includes(k)))throw new RangeError('Unknown criterion');
  const output={};
  for(const c of criteria){
   const v=Object.prototype.hasOwnProperty.call(input,c.id)?input[c.id]:null;
   if(v===null){output[c.id]=null;continue}
   if(!Number.isInteger(v)||v<0||v>c.max)throw new RangeError('Invalid points for '+c.id);
   output[c.id]=v;
  }
  return output;
 }
 function result(input){
  const answers=validate(input);
  let n=0,subtotal=0,maximum=0;
  for(const c of criteria)if(answers[c.id]!==null){n++;subtotal+=answers[c.id];maximum+=c.max}
  return Object.freeze({answered:n,unanswered:5-n,subtotal,assessedMaximum:maximum,
   points:n===5?subtotal:null,complete:n===5});
 }
 function format(value){
  if(value.complete)return 'Your private evidence worksheet: '+value.points+' / 100. This is not a probability or a rating of anyone.';
  if(value.answered===0)return 'All five criteria are unanswered. Not enough information is different from zero points.';
  return value.answered+' of 5 assessed · '+value.subtotal+' / '+value.assessedMaximum+
   ' points from answered categories · '+value.unanswered+' unknown. No overall score while incomplete.';
 }
 const blank=()=>Object.fromEntries(fields.map(id=>[id,null]));
 function mount(host,adapter,claim){
  if(!host||!adapter||!claim||typeof claim.id!=='string'||!Number.isInteger(claim.version))throw new TypeError('Invalid ballot preview');
  let token=0,viewer=null,existing=null,rows=new Map(),saving=false;
  const el=(tag,klass,text)=>{const node=document.createElement(tag);if(klass)node.className=klass;if(text!=null)node.textContent=text;return node};
  function answersFromControls(){
   const out={};for(const c of criteria){const r=rows.get(c.id);out[c.id]=r.missing.checked?null:Number(r.slider.value)}
   return validate(out);
  }
  function update(){
   for(const c of criteria){const r=rows.get(c.id);r.slider.disabled=r.missing.checked;
    r.output.textContent=r.missing.checked?'Unknown':r.slider.value+' / '+c.max}
   const status=host.querySelector('[data-assessment]');
   if(status)status.textContent=format(result(answersFromControls()));
  }
  async function refresh(){
   const myToken=++token;rows=new Map();host.replaceChildren();
   host.append(el('p','quiet','Checking this exact claim and sign-in status…'));
   const scope=await adapter.claim(claim.id,claim.version);
   if(myToken!==token)return;
   if(!scope||scope.eligible!==true||scope.enabled!==true||scope.version!==claim.version){
    host.replaceChildren(el('p','notice','Community ballots are not open for this claim and version. Original sources remain available.'));return;
   }
   viewer=await adapter.member();
   if(myToken!==token)return;
   if(!viewer||viewer.is_anonymous===true){
    host.replaceChildren(el('p','notice','Sign in with a regular Disclosure Desk account before assessing a claim. Anonymous and guest voting is unavailable.'));return;
   }
   existing=await adapter.mine(claim.id,claim.version);
   if(myToken!==token)return;
   const top=el('div','ballot-header');
   top.append(el('h2',null,'Assess this specific claim'),
     el('p','quiet','Five evidence questions · one private ballot per account and claim version. This is not a personal credibility score.'));
   host.replaceChildren(top);
   const notes=el('p','quiet','Your answers are private. Future community results use reviewed, coarse criterion distributions only.');
   host.append(notes);
   const saved=existing&&!existing.is_withdrawn?validate(existing.answers):blank();
   for(const c of criteria){
    const group=el('fieldset');
    const legend=el('legend',null,c.name+' · max '+c.max);group.append(legend);
    group.append(el('p','quiet',c.help));
    const unknownLabel=el('label','unknown');
    const missing=el('input');missing.type='checkbox';missing.checked=saved[c.id]===null;
    missing.setAttribute('aria-label','Not enough information for '+c.name);
    unknownLabel.append(missing,document.createTextNode(' Not enough information'));group.append(unknownLabel);
    const output=el('output','value');
    const slider=el('input');slider.type='range';slider.min='0';slider.max=String(c.max);slider.step='1';
    slider.value=String(saved[c.id]??0);slider.setAttribute('aria-label',c.name+' points');
    group.append(slider,output);host.append(group);
    rows.set(c.id,{missing,slider,output});
    missing.addEventListener('change',update);slider.addEventListener('input',update);
   }
   const assessment=el('div','assessment');assessment.dataset.assessment='true';
   assessment.setAttribute('role','status');assessment.setAttribute('aria-live','polite');host.append(assessment);
   const action=el('div','actions');const save=el('button',null,existing&&!existing.is_withdrawn?'Update my ballot':'Save private ballot');
   save.type='button';save.dataset.save='true';const withdraw=el('button','secondary','Withdraw my ballot');
   withdraw.type='button';withdraw.dataset.withdraw='true';withdraw.disabled=!existing||existing.is_withdrawn;
   action.append(save,withdraw);host.append(action);
   const message=el('p','quiet');message.dataset.notice='true';message.setAttribute('role','status');host.append(message);
   save.addEventListener('click',async()=>{
    if(saving)return;const answers=answersFromControls();saving=true;save.disabled=true;withdraw.disabled=true;
    message.textContent='Checking and saving…';
    try{await adapter.save(claim.id,claim.version,answers);message.textContent='Private ballot saved. No public identity is displayed.';await refresh()}
    catch(err){message.textContent='Not saved: '+(err?.message||'Retry later.');save.disabled=false;withdraw.disabled=!existing||existing.is_withdrawn}
    finally{saving=false}
   });
   withdraw.addEventListener('click',async()=>{
    if(saving||!existing||existing.is_withdrawn)return;saving=true;save.disabled=true;withdraw.disabled=true;
    message.textContent='Withdrawing…';
    try{await adapter.withdraw(claim.id,claim.version);await refresh()}
    catch(err){message.textContent='Withdrawal not confirmed: '+(err?.message||'Retry later.');save.disabled=false;withdraw.disabled=false}
    finally{saving=false}
   });
   update();
   const aggregate=el('div','aggregate');
   const rowsPublished=await adapter.snapshots(claim.id,claim.version);
   if(myToken!==token)return;
   aggregate.append(el('h3',null,'Community evidence patterns'));
   if(!Array.isArray(rowsPublished)||!rowsPublished.length)
    aggregate.append(el('p','quiet','No approved, privacy-safe community distributions have been published.'));
   else for(const item of rowsPublished){
    if(!item.approved||item.answered<10)continue;
    const label=criteria.find(c=>c.id===item.criterion);
    if(label)aggregate.append(el('p',null,label.name+': '+item.answered+' answered; '+item.unknown_count+' unknown. Five grouped score bands available.'));
   }
   host.append(aggregate);
  }
  return Object.freeze({refresh,read:()=>rows.size?answersFromControls():null});
 }
 return Object.freeze({criteria,validate,result,format,blank,mount});
});
