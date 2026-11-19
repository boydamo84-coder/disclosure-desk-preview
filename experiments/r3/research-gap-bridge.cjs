'use strict';
/*
 * DD-WEB-R3 bridge: explicitly accepted, source-linked catalogue gaps become
 * PRIVATE research QUESTIONS, never verified evidence or hypotheses.
 * In-memory pure functions. No fetch, persistence, account access, sharing,
 * inference, AI scoring or automatic import from external sources.
 */
const TAG='research-question-not-evidence';
const URL_MAX=2048,QUESTION_MAX=250,NOTES_MAX=800,MAX_QUESTIONS=100;
const isObject=x=>x&&typeof x==='object'&&!Array.isArray(x);
const fail=m=>{throw new Error('Gap review: '+m)};
const immutable=value=>{
 if(value&&typeof value==='object'){for(const v of Object.values(value))immutable(v);Object.freeze(value);}
 return value;
};
function utcAt(value){
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)||
    !Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)
  fail('A valid explicit UTC timestamp is required');
 return value;
}
function sourceURL(raw){
 if(typeof raw!=='string'||raw.length>URL_MAX)return null;
 let u;try{u=new URL(raw)}catch{return null}
 if(u.protocol!=='https:'||!u.hostname||u.username||u.password||
    /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|\[::1\]$)/i.test(u.hostname)||
    /^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname))return null;
 return u.href;
}
function createBridge({gapFinder,notebookEngine}={}){
 if(!gapFinder||typeof gapFinder.incident!=='function'||typeof gapFinder.analyzeRecord!=='function'||
    !notebookEngine||typeof notebookEngine.serializePrivateDraft!=='function')
  fail('Source-specific Gap Finder and Hypothesis Lab engines required');
 function caseCatalogue(records){
  if(!Array.isArray(records))return [];
  return immutable(records.slice(0,5000).filter(x=>gapFinder.incident(x)&&
   x&&sourceURL(x.url)).map(x=>({
    id:x.id,title:String(x.title||x.id).slice(0,QUESTION_MAX),
    reference:sourceURL(x.url)
   })));
 }
 function candidates(records,caseId){
  if(!Array.isArray(records)||typeof caseId!=='string')return [];
  const record=records.slice(0,5000).find(x=>gapFinder.incident(x)&&x.id===caseId);
  if(!record)return [];
  const found=gapFinder.analyzeRecord(record);
  return immutable(found.filter(f=>f&&isObject(f.source)&&sourceURL(f.source.url)&&
    typeof f.reason==='string'&&f.reason.length<=2000&&
    typeof f.nextAction==='string'&&f.nextAction.length<=2000).map(f=>({
    id:f.id,key:f.key,caseId:record.id,caseTitle:String(f.caseTitle||record.title).slice(0,QUESTION_MAX),
    field:f.field,reason:f.reason,nextAction:f.nextAction,
    dataset:'data/curated-historical-cases.json',
    source:{url:sourceURL(f.source.url),label:String(f.source.label||'Catalogue-linked source').slice(0,180)},
    status:TAG,scope:'Current catalogue entry only',
    caveat:'A catalogue field is not indexed; information may exist in original documents or elsewhere.'
   })));
 }
 function recordQuestion(book,{workspaceId,records,gapId,relatedHypothesisId='',reviewerNote='',at}={}){
  if(typeof workspaceId!=='string'||!workspaceId)fail('Workspace ID required');
  // Reuse the Hypothesis Lab contract to assert notebook is private and scoped;
  // do not rewrite any existing hypothesis revision or research data.
  let next;
  try{next=JSON.parse(notebookEngine.serializePrivateDraft(book,{workspaceId}))}
  catch{fail('Notebook does not belong to the expected private workspace')}
  if(!next||next.visibility!=='private')fail('Notebook must remain private');
  const matches=candidates(records,next.caseId);
  const finding=matches.find(g=>g.id===gapId);
  if(!finding)fail('Question is not supported by this incident catalogue entry or an HTTPS source');
  if(typeof reviewerNote!=='string'||reviewerNote.length>NOTES_MAX)fail('Note is too long');
  if(typeof relatedHypothesisId!=='string'||relatedHypothesisId.length>80)
   fail('Invalid linked hypothesis');
  if(relatedHypothesisId&&!next.hypotheses.some(h=>h.id===relatedHypothesisId))
   fail('Related hypothesis must exist in this notebook');
  const time=utcAt(at);
  if(time<=next.updatedAt)fail('New research review must be later than existing notebook history');
  if(next.gapReviews===undefined)next.gapReviews=[]; // legacy encrypted notebooks
  if(!Array.isArray(next.gapReviews)||next.gapReviews.length>=MAX_QUESTIONS)
   fail('Maximum of 100 saved research questions or invalid history');
  if(next.gapReviews.some(g=>g.id===finding.id))
   fail('Question already added; duplicate reviews are not created');
  next.gapReviews.push({
   id:finding.id,caseId:finding.caseId,field:finding.field,
   reason:finding.reason,nextAction:finding.nextAction,
   source:finding.source,dataset:finding.dataset,scope:finding.scope,
   status:TAG,reviewedAt:time,reviewerNote:reviewerNote.trim(),
   relatedHypothesisId
  });
  next.updatedAt=time;
  return immutable(next);
 }
 function recordedQuestions(book,{workspaceId}={}){
  if(typeof workspaceId!=='string'||!workspaceId)fail('Workspace ID required');
  let next;
  try{next=JSON.parse(notebookEngine.serializePrivateDraft(book,{workspaceId}))}
  catch{fail('Notebook workspace mismatch')}
  return immutable(Array.isArray(next.gapReviews)?next.gapReviews:[]);
 }
 return Object.freeze({caseCatalogue,candidates,recordQuestion,recordedQuestions,TAG});
}
module.exports={createBridge};
