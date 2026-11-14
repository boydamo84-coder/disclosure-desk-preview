'use strict';
/*
 * R3 Hypothesis Lab — private, offline, append-only research model.
 * NO persistence, network, account access, publishing, AI grading or scoring.
 * Development-only .cjs file; intentionally excluded from the public bundle.
 */
const SCHEMA_VERSION=1;
const ID=/^[a-z0-9][a-z0-9_-]{1,79}$/i;
const NOTICE='Researcher-written working hypotheses, not established findings. No automatic confidence or origin probability.';
const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function fail(message){throw new Error('Hypothesis Lab: '+message)}
function clone(x){return JSON.parse(JSON.stringify(x))}
function immutable(x){
 if(x&&typeof x==='object'){
  for(const value of Object.values(x))immutable(value);
  Object.freeze(x);
 }
 return x;
}
function ident(value,label){
 if(typeof value!=='string'||!ID.test(value))fail(label+' must be a stable 2–80 character identifier');
 return value;
}
function words(value,label,max=4000){
 if(typeof value!=='string'||!value.trim()||value.length>max)
  fail(label+' must contain text and be at most '+max+' characters');
 return value.trim();
}
function instant(value){
 if(typeof value!=='string'||!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(value)||
  !Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)
  fail('time must be a valid explicit UTC ISO timestamp including milliseconds');
 return value;
}
function textArray(value,label,{max=16,required=false}={}){
 if(value===undefined && !required)return [];
 if(!Array.isArray(value)||value.length>max||(required&&value.length===0))
  fail(label+' requires '+(required?'1–':'0–')+max+' entries');
 return value.map((v,i)=>words(v,label+'['+i+']',1200));
}
function entries(value,label,normalizer,{max=20,required=false}={}){
 if(value===undefined&&!required)return [];
 if(!Array.isArray(value)||value.length>max||(required&&!value.length))
  fail(label+' requires '+(required?'1–':'0–')+max+' entries');
 const seen=new Set();
 return value.map((raw,i)=>{
  if(!isObject(raw))fail(label+'['+i+'] must be an object');
  const item=normalizer(raw,label+'['+i+']');
  if(seen.has(item.id))fail(label+' contains a duplicate ID: '+item.id);
  seen.add(item.id);return item;
 });
}
function secureSource(raw,label){
 if(!isObject(raw))fail(label+' must be an object');
 const url=words(raw.url,label+'.url',2048);
 let parsed;
 try{parsed=new URL(url)}catch{fail(label+'.url is not a valid URL')}
 if(parsed.protocol!=='https:'||!parsed.hostname||parsed.username||parsed.password||
  /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|169\.254(?:\.\d{1,3}){2}|\[?::1\]?)$/i.test(parsed.hostname)||
  /^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname))
  fail(label+'.url must be a public HTTPS reference without credentials');
 return {label:words(raw.label,label+'.label',180),url:parsed.href,
  locator:raw.locator?words(raw.locator,label+'.locator',600):''};
}
function predictions(raw){
 return entries(raw,'predictions',(p,label)=>({
  id:ident(p.id,label+'.id'),
  predictedObservation:words(p.predictedObservation,label+'.predictedObservation'),
  ifObserved:words(p.ifObserved,label+'.ifObserved'),
  ifNotObserved:words(p.ifNotObserved,label+'.ifNotObserved'),
  howToTest:words(p.howToTest,label+'.howToTest')
 }),{max:20,required:true});
}
function disconfirmers(raw){
 return entries(raw,'disconfirmingTests',(p,label)=>({
  id:ident(p.id,label+'.id'),
  potentiallyDisconfirmingObservation:words(p.potentiallyDisconfirmingObservation,
   label+'.potentiallyDisconfirmingObservation'),
  howToCheck:words(p.howToCheck,label+'.howToCheck')
 }),{max:20,required:true});
}
function normalizeContent(input){
 if(!isObject(input))fail('hypothesis content must be an object');
 if(own(input,'visibility')&&input.visibility!=='private')fail('hypotheses cannot be made public by an input field');
 if(own(input,'probability')||own(input,'confidenceScore')||own(input,'alienProbability'))
  fail('automatic certainty scores or origin probabilities are not supported');
 const sources=entries(input.sources,'sources',secureSource,{max:30});
 return {
  title:words(input.title,'title',160),
  explanation:words(input.explanation,'explanation',4000),
  assumptions:textArray(input.assumptions,'assumptions',{max:20,required:true}),
  predictions:predictions(input.predictions),
  disconfirmingTests:disconfirmers(input.disconfirmingTests),
  alternativeInterpretations:textArray(input.alternativeInterpretations,
    'alternativeInterpretations',{max:20,required:true}),
  sources,
  citationStatus:sources.length?'references-provided-not-independently-verified':'references-needed',
  reviewStatus:'researcher-draft',
  note:NOTICE
 };
}
function assertNotebook(book,workspaceId){
 if(!isObject(book)||book.schemaVersion!==SCHEMA_VERSION||book.visibility!=='private'||
  !Array.isArray(book.hypotheses)||!ID.test(book.workspaceId||'')||
  !ID.test(book.caseId||''))fail('invalid or non-private notebook');
 if(workspaceId!==undefined && ident(workspaceId,'workspaceId')!==book.workspaceId)
  fail('workspace mismatch; do not mix private projects');
 return book;
}
function createNotebook({workspaceId,caseId,title,at,visibility}={}){
 if(visibility!==undefined&&visibility!=='private')fail('notebook must remain private');
 const time=instant(at);
 return immutable({schemaVersion:SCHEMA_VERSION,visibility:'private',
  workspaceId:ident(workspaceId,'workspaceId'),caseId:ident(caseId,'caseId'),
  title:words(title,'notebook title',160),createdAt:time,updatedAt:time,
  hypotheses:[],notice:NOTICE});
}
function addHypothesis(book,{workspaceId,id,content,at}={}){
 assertNotebook(book,workspaceId);
 if(workspaceId===undefined)fail('workspaceId required for writing');
 const hypothesisId=ident(id,'hypothesis ID');
 if(book.hypotheses.some(h=>h.id===hypothesisId))fail('duplicate hypothesis ID');
 const atTime=instant(at);
 if(atTime<book.createdAt||atTime<book.updatedAt)fail('hypothesis time cannot precede notebook history');
 const revision={revision:1,recordedAt:atTime,content:normalizeContent(content)};
 const next=clone(book);
 next.hypotheses.push({id:hypothesisId,revisions:[revision]});
 next.updatedAt=atTime;
 return immutable(next);
}
function reviseHypothesis(book,{workspaceId,id,content,at}={}){
 assertNotebook(book,workspaceId);
 if(workspaceId===undefined)fail('workspaceId required for writing');
 const hypothesisId=ident(id,'hypothesis ID');
 const index=book.hypotheses.findIndex(h=>h.id===hypothesisId);
 if(index<0)fail('hypothesis not found in this workspace and case');
 const history=book.hypotheses[index].revisions;
 if(!Array.isArray(history)||!history.length)fail('broken hypothesis history');
 const time=instant(at);
 if(time<=history[history.length-1].recordedAt||time<book.updatedAt)
  fail('revision must be later than prior revisions (UTC)');
 const next=clone(book);
 next.hypotheses[index].revisions.push({
  revision:history[history.length-1].revision+1,recordedAt:time,content:normalizeContent(content)
 });
 next.updatedAt=time;
 return immutable(next);
}
function revision(book,{workspaceId,id,number}={}){
 assertNotebook(book,workspaceId);
 if(workspaceId===undefined)fail('workspaceId required to read private research');
 const hypothesis=book.hypotheses.find(h=>h.id===ident(id,'hypothesis ID'));
 if(!hypothesis)fail('hypothesis not found');
 const selected=number===undefined?hypothesis.revisions[hypothesis.revisions.length-1]:
  hypothesis.revisions.find(r=>r.revision===number);
 if(!selected)fail('revision not found');
 return immutable(clone({id:hypothesis.id,...selected}));
}
function compareHypotheses(book,{workspaceId,ids}={}){
 assertNotebook(book,workspaceId);
 if(workspaceId===undefined)fail('workspaceId required to compare private research');
 if(!Array.isArray(ids)||ids.length<2||ids.length>10||new Set(ids).size!==ids.length)
  fail('compare 2–10 distinct hypotheses');
 return immutable({workspaceId:book.workspaceId,caseId:book.caseId,
  visibility:'private',comparisonType:'side-by-side-not-ranked',
  notice:NOTICE,hypotheses:ids.map(id=>revision(book,{workspaceId,id}))});
}
function serializePrivateDraft(book,{workspaceId}={}){
 assertNotebook(book,workspaceId);
 if(workspaceId===undefined)fail('workspaceId required for explicit private export');
 // Caller receives text only. No saving, uploading, sharing or public exposure.
 return JSON.stringify(book,null,2);
}
module.exports={createNotebook,addHypothesis,reviseHypothesis,revision,
 compareHypotheses,serializePrivateDraft,SCHEMA_VERSION};
