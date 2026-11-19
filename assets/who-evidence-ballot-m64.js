/* Disclosure Desk M64 — claim-scoped five-criterion ballot integration.
 * Live feature disabled by assets/community-test-config.js; registry EMPTY.
 * Server-side RLS and reviewed claim registry are the authority. This is only
 * the staged display and authenticated client adapter, NOT a voting approval.
 * No silent external SDK loading, network, storage or tracking when disabled.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DDWhoEvidenceM64=api;
})(typeof window!=='undefined'?window:null,function(win){
 'use strict';
 const caps=Object.freeze([
  Object.freeze({id:'original',column:'original_points',max:25,label:'Original statement and context',hint:'Can you inspect the original dated words in their proper context?'}),
  Object.freeze({id:'independent',column:'independent_points',max:30,label:'Independent corroboration',hint:'Do independent witnesses or records support the underlying assertion, rather than repeat it?'}),
  Object.freeze({id:'direct',column:'direct_points',max:25,label:'Direct records and measurements',hint:'What original footage, instruments, documents or provenance are inspectable?'}),
  Object.freeze({id:'testable',column:'testable_points',max:10,label:'Specificity and testability',hint:'Are claims, measurements and methods independently checkable?'}),
  Object.freeze({id:'alternatives',column:'alternatives_points',max:10,label:'Alternatives and uncertainty',hint:'Were relevant contradictory records, limitations and alternatives examined?'})
 ]);
 const names=caps.map(c=>c.id);
 const idPattern=/^[a-z0-9][a-z0-9-]{6,85}$/;
 const datePattern=/^\d{4}-\d{2}-\d{2}$/;
 const el=(tag,cls,text)=>{
  const node=document.createElement(tag);if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;return node;
 };
 const err=(x)=>x?.message||'Check your connection or account and try again.';
 const blank=()=>Object.fromEntries(names.map(n=>[n,null]));
 function validateAnswers(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Five criterion answers required');
  if(Object.keys(input).some(k=>!names.includes(k)))throw Error('Unexpected evidence criterion');
  const out=blank();
  for(const c of caps)if(Object.prototype.hasOwnProperty.call(input,c.id)){
   const x=input[c.id];
   if(x!==null&&(!Number.isInteger(x)||x<0||x>c.max))throw Error('Invalid '+c.id+' value');
   out[c.id]=x;
  }
  return out;
 }
 function assess(input){
  const answers=validateAnswers(input),answered=caps.filter(c=>answers[c.id]!==null);
  const subtotal=answered.reduce((sum,c)=>sum+answers[c.id],0);
  const max=answered.reduce((sum,c)=>sum+c.max,0);
  return Object.freeze({subtotal,assessedMaximum:max,answered:answered.length,
   unknown:5-answered.length,complete:answered.length===5,
   total:answered.length===5?subtotal:null});
 }
 function assessmentText(x){
  if(x.complete)return 'Your private evidence worksheet: '+x.total+' / 100. Not a truth probability or rating of a person.';
  if(!x.answered)return 'All five criteria unknown. “Not enough information” is distinct from zero points.';
  return x.answered+' of 5 answered · '+x.subtotal+' / '+x.assessedMaximum+
   ' points from answered criteria · '+x.unknown+' unknown. No overall score while incomplete.';
 }
 const enabled=()=>win?.DD_COMMUNITY_FEATURES?.whoEvidenceBallots===true
  &&['test','production'].includes(win?.DD_COMMUNITY_TEST_CONFIG?.environment);
 function parseRegistry(input){
  if(!input||input.schemaVersion!==1||!Array.isArray(input.approvedClaims)||input.approvedClaims.length>200)return new Map();
  const approved=new Map();
  for(const r of input.approvedClaims){
   if(!r||!idPattern.test(r.claimId)||!Number.isSafeInteger(r.claimVersion)||r.claimVersion<1||
    typeof r.statement!=='string'||r.statement.trim().length<30||
    !/^https:\/\/[^\s]+$/.test(r.originalSourceUrl||'')||
    r.status!=='independently_approved_for_community_criteria'||
    !datePattern.test(r.reviewedAt||'')||
    !r.leadEditor||!r.independentEditor||r.leadEditor===r.independentEditor||
    r.enabled!==true)continue;
   const key=r.claimId+':'+r.claimVersion;
   if(approved.has(key)){approved.delete(key);continue}
   approved.set(key,Object.freeze({...r}));
  }
  return approved;
 }
 function sourceMatches(claim,record){
  return !!(record&&claim?.id===record.claimId&&
   claim.statement===record.statement&&
   claim.claimKind!=='policy_recommendation'&&
   claim.ratingReadiness?.scorePath!=='not_applicable_to_incident_score'&&
   Array.isArray(claim.sources)&&claim.sources.some(s=>s?.kind==='primary'&&s.url===record.originalSourceUrl));
 }
 let registryPromise=null;
 async function registry(){
  if(!enabled())return new Map();
  if(!registryPromise)registryPromise=fetch('/data/who-community-approvals-m64.json',{cache:'no-store'})
   .then(r=>{if(!r.ok)throw Error('Unapproved/absent registry');return r.json()})
   .then(parseRegistry).catch(()=>new Map());
  return registryPromise;
 }
 let clientCache=null;
 function client(){
  if(!enabled())throw Error('Voting feature is disabled');
  if(clientCache)return clientCache;
  const c=win?.DD_COMMUNITY_TEST_CONFIG||{};
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.url||'')||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(c.publishableKey||'')||
    typeof win?.supabase?.createClient!=='function')
   throw Error('Secure sign-in client unavailable. Voting has not been enabled.');
  clientCache=win.supabase.createClient(c.url,c.publishableKey,
    {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  return clientCache;
 }
 async function dataOrThrow(query){
  const result=await query;if(result.error)throw result.error;return result.data;
 }
 function adapterFor(clientRef){
  const c=clientRef||client();
  const scope=async(id,version)=>{
   const row=await dataOrThrow(c.from('dd_who_m63_claim_versions')
    .select('claim_id,claim_version,statement,original_source_url,eligible,enabled,reviewed_at')
    .eq('claim_id',id).eq('claim_version',version).maybeSingle());
   return row?{id:row.claim_id,version:row.claim_version,statement:row.statement,
    source:row.original_source_url,eligible:row.eligible===true,enabled:row.enabled===true,
    reviewed:!!row.reviewed_at}:null;
  };
  async function member(){
   const {data,error}=await c.auth.getUser();
   if(error)throw error;
   if(!data?.user||data.user.is_anonymous===true)return null;
   return data.user;
  }
  async function mine(id,version){
   const row=await dataOrThrow(c.from('dd_who_m63_member_ballots')
    .select('claim_id,claim_version,is_withdrawn,original_points,independent_points,direct_points,testable_points,alternatives_points,revision')
    .eq('claim_id',id).eq('claim_version',version).maybeSingle());
   if(!row)return null;
   return {is_withdrawn:row.is_withdrawn===true,revision:row.revision,
    answers:Object.fromEntries(caps.map(m=>[m.id,row[m.column]]))};
  }
  async function write(id,version,answers){
   if(!await member())throw Error('A registered sign-in is required.');
   const valid=validateAnswers(answers);
   const previous=await mine(id,version);
   const columns=Object.fromEntries(caps.map(m=>[m.column,valid[m.id]]));
   if(previous){
    const update=c.from('dd_who_m63_member_ballots').update({...columns,is_withdrawn:false})
     .eq('claim_id',id).eq('claim_version',version)
     .select('revision').maybeSingle();
    if(!await dataOrThrow(update))throw Error('Your previous ballot was not updated');
   }else{
    const insert=c.from('dd_who_m63_member_ballots')
     .insert({...columns,claim_id:id,claim_version:version,is_withdrawn:false})
     .select('revision').maybeSingle();
    if(!await dataOrThrow(insert))throw Error('Your new ballot was not saved');
   }
  }
  async function withdraw(id,version){
   if(!await member())throw Error('A registered sign-in is required.');
   const old=await mine(id,version);if(!old||old.is_withdrawn)throw Error('No active ballot to withdraw');
   const result=c.from('dd_who_m63_member_ballots').update({is_withdrawn:true})
    .eq('claim_id',id).eq('claim_version',version).select('revision').maybeSingle();
   if(!await dataOrThrow(result))throw Error('Withdrawal not confirmed');
  }
  async function snapshots(id,version){
   const rows=await dataOrThrow(c.from('dd_who_m63_public_snapshots')
    .select('criterion,participants,answered,unknown_count,band_1,band_2,band_3,band_4,band_5,approved')
    .eq('claim_id',id).eq('claim_version',version));
   return Array.isArray(rows)?rows.filter(x=>x.approved===true&&x.answered>=10&&x.participants>=10):[];
  }
  return Object.freeze({scope,member,mine,write,withdraw,snapshots});
 }
 function mountClaim(host,claim,version,api,record){
  if(!host||!claim||!idPattern.test(claim.id||'')||!Number.isSafeInteger(version)||version<1||
    !sourceMatches(claim,record)||!api||!enabled())return null;
  let serial=0,ongoing=false,current=null,controls=new Map();
  const visible=()=>host.isConnected;
  const showStatus=(message)=>{host.replaceChildren(el('p','dd-m64-notice',message))};
  async function refresh(){
   const my=++serial;controls=new Map();
   if(!visible())return;
   showStatus('Checking approved claim and sign-in…');
   try{
    const scope=await api.scope(claim.id,version);
    if(my!==serial||!visible())return;
    if(!scope||!scope.eligible||!scope.enabled||!scope.reviewed||
       scope.id!==claim.id||scope.version!==version||
       scope.statement!==claim.statement||scope.source!==record.originalSourceUrl){
     showStatus('This exact claim and version are not approved for community assessment.');return;
    }
    const member=await api.member();
    if(my!==serial||!visible())return;
    if(!member||member.is_anonymous===true){
     showStatus('Sign in with a registered Disclosure Desk account to assess this specific claim.');return;
    }
    current=await api.mine(claim.id,version);
    if(my!==serial||!visible())return;
    const old=current&&!current.is_withdrawn?validateAnswers(current.answers):blank();
    host.replaceChildren(el('p','dd-m64-notice','Your answers are private and never describe anyone’s honesty. Individual evidence scores are not truth probabilities. If an aggregate is published, this claim version closes to new or edited ballots. Withdrawing an earlier ballot then retires that public aggregate, but previously saved screenshots or copies cannot be recalled.'));
    for(const item of caps){
     const field=el('fieldset','dd-m64-field');
     field.append(el('legend',null,item.label+' · '+item.max+' points'),
       el('p','dd-m64-hint',item.hint));
     const label=el('label','dd-m64-unknown');
     const unknown=el('input');unknown.type='checkbox';unknown.checked=old[item.id]===null;
     unknown.setAttribute('aria-label','Not enough information: '+item.label);
     label.append(unknown,document.createTextNode(' Not enough information'));
     const slider=el('input');slider.type='range';slider.min='0';slider.max=String(item.max);slider.step='1';
     slider.value=String(old[item.id]??0);
     slider.setAttribute('aria-label',item.label+' points');
     const output=el('output','dd-m64-value');
     field.append(label,slider,output);host.append(field);
     controls.set(item.id,{unknown,slider,output});
     unknown.addEventListener('change',update);slider.addEventListener('input',update);
    }
    const total=el('p','dd-m64-total');total.dataset.m64Assessment='';
    total.setAttribute('role','status');total.setAttribute('aria-live','polite');host.append(total);
    const actions=el('div','dd-m64-actions');
    const save=el('button','dd-m64-save',current&&!current.is_withdrawn?'Update private assessment':'Save private assessment');
    save.type='button';save.dataset.m64Save='';
    const remove=el('button','dd-m64-withdraw','Withdraw my assessment');
    remove.type='button';remove.dataset.m64Withdraw='';
    remove.disabled=!current||current.is_withdrawn;actions.append(save,remove);host.append(actions);
    const message=el('p','dd-m64-notice');message.dataset.m64Message='';message.setAttribute('role','status');host.append(message);
    function answerValues(){return Object.fromEntries(caps.map(c=>{
     const row=controls.get(c.id);return [c.id,row.unknown.checked?null:Number(row.slider.value)]}));}
    function update(){
     for(const c of caps){
      const r=controls.get(c.id);r.slider.disabled=r.unknown.checked;
      r.output.textContent=r.unknown.checked?'Unknown':r.slider.value+' / '+c.max;
     }
     total.textContent=assessmentText(assess(answerValues()));
    }
    save.addEventListener('click',async()=>{
     if(ongoing)return;ongoing=true;save.disabled=remove.disabled=true;message.textContent='Saving private assessment…';
     try{await api.write(claim.id,version,answerValues());await refresh()}
     catch(ex){message.textContent='Not saved: '+err(ex);save.disabled=false;remove.disabled=!current||current.is_withdrawn}
     finally{ongoing=false}
    });
    remove.addEventListener('click',async()=>{
     if(ongoing||!current||current.is_withdrawn)return;
     ongoing=true;save.disabled=remove.disabled=true;message.textContent='Withdrawing assessment…';
     try{await api.withdraw(claim.id,version);await refresh()}
     catch(ex){message.textContent='Not withdrawn: '+err(ex);save.disabled=remove.disabled=false}
     finally{ongoing=false}
    });
    update();
    const results=el('section','dd-m64-results');
    results.append(el('h5',null,'Community evidence patterns'));
    host.append(results);
    let snapshots=[];
    try{snapshots=await api.snapshots(claim.id,version)}catch(ex){
     if(my===serial&&visible())results.append(el('p','dd-m64-hint','Public aggregate results are temporarily unavailable.'));
     return;
    }
    if(my!==serial||!visible())return;
    if(!snapshots.length)results.append(el('p','dd-m64-hint','No independently approved, privacy-safe aggregated results are published for this claim.'));
    for(const row of snapshots){
     const item=caps.find(x=>x.id===row.criterion);
     if(item&&row.approved===true&&row.answered>=10){
      results.append(el('p','dd-m64-hint',item.label+': '+row.answered+' responses, '+row.unknown_count+' unknown; grouped score bands. No individual ballots are published.'));
     }
    }
   }catch(ex){if(my===serial&&visible())showStatus('Community assessment is unavailable: '+err(ex))}
  }
  return Object.freeze({refresh});
 }
 async function mountForPerson(person,host){
  if(!enabled()||!host||!Array.isArray(person?.claimEvidence))return 0;
  const approvals=await registry();if(!enabled()||!host.isConnected)return 0;
  let mounted=0;
  for(const claim of person.claimEvidence){
   const approval=[...approvals.values()]
    .filter(a=>a.claimId===claim.id)
    .sort((a,b)=>b.claimVersion-a.claimVersion)[0];
   if(!sourceMatches(claim,approval))continue;
   const article=[...host.querySelectorAll('article[data-evidence-claim-id]')]
    .find(node=>node.dataset.evidenceClaimId===claim.id);
   if(!article||!article.isConnected)continue;
   const details=el('details','dd-m64-ballot');
   details.append(el('summary',null,'Assess this exact claim · five evidence criteria'));
   const content=el('div','dd-m64-body');
   details.append(content);article.append(details);
   let opened=false;
   details.addEventListener('toggle',()=>{
    if(!details.open||opened)return;opened=true;
    try{const mountedUi=mountClaim(content,claim,approval.claimVersion,adapterFor(),approval);
     if(mountedUi)void mountedUi.refresh();else content.append(el('p','dd-m64-notice','Assessment unavailable.'))}
    catch(ex){content.replaceChildren(el('p','dd-m64-notice','Sign-in service not ready. Voting remains closed.'))}
   });
   mounted++;
  }
  return mounted;
 }
 return Object.freeze({caps,validateAnswers,assess,assessmentText,parseRegistry,sourceMatches,
  adapterFor,mountClaim,mountForPerson,enabled});
});
