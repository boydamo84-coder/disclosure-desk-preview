/* R2 M8 — bounded public, cited person ↔ case attribution ledger.
 * Documents a person's public statement/role only: never event proof.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DDPersonCaseLinks=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const str=v=>String(v==null?'':v).trim();
 const slug=v=>/^[a-z0-9][a-z0-9-]{1,90}$/.test(str(v));
 const roles=new Set(['firsthand-statement','published-commentary','retrospective-claim']);
 const safeUrl=v=>{try{const u=new URL(str(v));return u.protocol==='https:'&&!u.username&&!u.password&&!['localhost','127.0.0.1'].includes(u.hostname)&&!!u.hostname}catch(_){return false}};
 function parse(raw,options={}){
  if(!raw||raw.version!==1||raw.status!=='public-editorial-draft'||!Array.isArray(raw.links)||raw.links.length>80)
   return {valid:false,issues:['Invalid public attribution ledger'],links:[]};
  const people=options.personIds?new Set(options.personIds):null;
  const cases=options.caseIds?new Set(options.caseIds):null;
  const ids=new Set(),pairs=new Set(),links=[],issues=[];
  for(const l of raw.links){
   const cite=l?.source||{};
   const pair=str(l?.personId)+'::'+str(l?.caseId);
   if(!slug(l?.id)||!slug(l?.personId)||!slug(l?.caseId)||
      ids.has(l.id)||pairs.has(pair)||(people&&!people.has(l.personId))||(cases&&!cases.has(l.caseId))||
      !roles.has(l.role)||l.reviewStatus!=='editorial-draft'||l.eventVerified!==false||
      !str(l.personName)||!str(l.caseLabel)||!str(l.roleLabel)||!str(l.statement)||!str(l.context)||
      !safeUrl(cite.url)||!str(cite.locator)||!str(cite.publisher)||!str(cite.date)||
      str(cite.locator).length>320||str(l.statement).length>600||str(l.context).length>600){
    issues.push('Invalid or unsupported attributed person/case relationship');continue;
   }
   ids.add(l.id);pairs.add(pair);
   links.push({id:l.id,personId:l.personId,personName:str(l.personName).slice(0,120),
    caseId:l.caseId,caseLabel:str(l.caseLabel).slice(0,120),role:l.role,
    roleLabel:str(l.roleLabel).slice(0,160),statement:str(l.statement).slice(0,600),
    context:str(l.context).slice(0,600),source:{url:str(cite.url),locator:str(cite.locator),
     publisher:str(cite.publisher).slice(0,160),date:str(cite.date).slice(0,30)},
    reviewStatus:'editorial-draft',eventVerified:false});
  }
  return {valid:issues.length===0,issues,links:issues.length?[]:links,
   caution:'A cited public attribution identifies what somebody said or published. It does not verify an incident, extraordinary interpretation, witness independence or unrelated cases.'};
 }
 const byCase=(parsed,id)=>parsed?.valid?parsed.links.filter(l=>l.caseId===str(id)):[];
 const byPerson=(parsed,id)=>parsed?.valid?parsed.links.filter(l=>l.personId===str(id)):[];
 return Object.freeze({version:'0.1',parse,byCase,byPerson});
});
