/* M76 — completely local claim-evidence worksheet. No accounts, votes,
   network requests, cookies, storage, or publication. This is not an
   editorial score, a truth probability, or a judgement about a person. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DDWhoPrivateWorksheetM76=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const criteria=Object.freeze([
  Object.freeze({id:'original',max:25,label:'Original statement and context',
   hint:'Check the dated original words, what they actually describe, and the available context.'}),
  Object.freeze({id:'independent',max:30,label:'Independent corroboration',
   hint:'Look for independently obtained accounts or records, not copies of the same source.'}),
  Object.freeze({id:'direct',max:25,label:'Original measurements and documents',
   hint:'Consider original imagery, instruments, authenticated records and provenance.'}),
  Object.freeze({id:'testable',max:10,label:'Specificity and testability',
   hint:'Can the assertion or evidence be independently checked or reproduced?'}),
  Object.freeze({id:'alternatives',max:10,label:'Alternatives and uncertainty',
   hint:'Consider competing interpretations, missing data and contradictory records.'})
 ]);
 const known=new Set(criteria.map(x=>x.id));
 function eligible(claim){
  if(!claim||typeof claim!=='object'||typeof claim.statement!=='string'||claim.statement.length<30||
   claim.claimKind==='policy_recommendation'||
   claim.ratingReadiness?.claimType!=='incident_or_observation'||
   claim.ratingReadiness?.scorePath==='not_applicable_to_incident_score')return false;
  return Array.isArray(claim.sources)&&claim.sources.some(source=>{
   if(source?.kind!=='primary')return false;
   try{
    const url=new URL(source.url);
    return url.protocol==='https:'&&!url.username&&!url.password;
   }catch{return false;}
  });
 }
 function assess(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||
   Object.keys(input).some(key=>!known.has(key)))throw Error('Invalid personal evidence answers');
  let answered=0,points=0,maximum=0;
  for(const c of criteria){
   const value=input[c.id];
   if(value===null||value===undefined||value==='')continue;
   if(!Number.isInteger(value)||value<0||value>c.max)
    throw Error('Invalid evidence points for '+c.id);
   answered++;points+=value;maximum+=c.max;
  }
  return Object.freeze({answered,unknown:criteria.length-answered,points,maximum,
   total:answered===criteria.length?points:null});
 }
 function report(result){
  if(result.answered===0)return 'All five criteria are marked Not enough information. No overall score.';
  if(result.answered===criteria.length)
   return 'Your personal evidence worksheet: '+result.total+' / 100. This is not a truth probability or a rating of a person.';
  return result.answered+' of 5 criteria assessed · '+result.points+' / '+result.maximum+
   ' points across answered criteria · '+result.unknown+
   ' marked Not enough information. No overall score while incomplete.';
 }
 function mountForPerson(person,host){
  if(!person||!host||typeof host.querySelectorAll!=='function')return 0;
  const claims=Array.isArray(person.claimEvidence)?person.claimEvidence.slice(0,12):[];
  const cards=host.querySelectorAll('article.claim-review');
  let index=0,mounted=0;
  for(const claim of claims){
   if(!claim?.statement)continue;
   const card=cards[index++];
   if(!card||!eligible(claim)||card.querySelector('.dd-private-worksheet'))continue;
   const doc=card.ownerDocument;
   const details=doc.createElement('details');
   details.className='dd-private-worksheet';
   const summary=doc.createElement('summary');
   summary.textContent='Assess this claim privately — five evidence criteria';
   details.appendChild(summary);
   const intro=doc.createElement('p');
   intro.className='muted small';
   intro.textContent='Only for this specific public claim. Your answers stay on this page: no sign-in, upload, saved record or community vote. Not enough information is different from zero.';
   details.appendChild(intro);
   const fields=doc.createElement('div');
   fields.className='dd-private-fields';
   const selects=new Map();
   for(const c of criteria){
    const label=doc.createElement('label');
    label.className='dd-private-field';
    const heading=doc.createElement('strong');
    heading.textContent=c.label+' (0–'+c.max+')';
    label.appendChild(heading);
    const hint=doc.createElement('span');
    hint.className='muted small';
    hint.textContent=c.hint;
    label.appendChild(hint);
    const select=doc.createElement('select');
    select.setAttribute('aria-label',c.label);
    select.setAttribute('autocomplete','off');
    const unknown=doc.createElement('option');
    unknown.value='';
    unknown.textContent='Not enough information';
    select.appendChild(unknown);
    for(let n=0;n<=c.max;n++){
     const opt=doc.createElement('option');
     opt.value=String(n);
     opt.textContent=String(n)+' / '+c.max;
     select.appendChild(opt);
    }
    select.value='';
    selects.set(c.id,select);
    label.appendChild(select);
    fields.appendChild(label);
   }
   details.appendChild(fields);
   const result=doc.createElement('p');
   result.className='dd-private-result';
   result.setAttribute('role','status');
   result.setAttribute('aria-live','polite');
   function recalc(){
    const answers={};
    for(const c of criteria){
     const v=selects.get(c.id).value;
     answers[c.id]=v===''?null:Number(v);
    }
    result.textContent=report(assess(answers));
   }
   for(const select of selects.values())select.addEventListener('change',recalc);
   recalc();
   details.appendChild(result);
   const actions=doc.createElement('div');
   actions.className='dd-private-actions';
   const clear=doc.createElement('button');
   clear.type='button';
   clear.className='btn';
   clear.textContent='Clear my answers';
   clear.addEventListener('click',()=>{
    for(const select of selects.values())select.value='';
    recalc();
    selects.values().next().value?.focus();
   });
   actions.appendChild(clear);
   const notice=doc.createElement('p');
   notice.className='muted small';
   notice.textContent='Personal notes only; no Disclosure Desk editorial number, no submitted ballot and no public percentage.';
   actions.appendChild(notice);
   details.appendChild(actions);
   card.appendChild(details);
   mounted++;
  }
  return mounted;
 }
 return Object.freeze({criteria,eligible,assess,report,mountForPerson});
});
