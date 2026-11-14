'use strict';
/*
 * Disclosure Desk R3 Research Gap Finder (private development alpha).
 * Analyses only explicit public catalogue fields. NO network, storage,
 * user content, scoring, geocoding or source inference. NOT web-bundled.
 */
const CASE_KINDS=new Set(['featured investigation','case report','incident report','encounter report']);
const safeText=v=>typeof v==='string'?v.trim():'';
const validYear=v=>Number.isInteger(v)&&v>=1000&&v<=2100;
const validMonth=v=>Number.isInteger(v)&&v>=1&&v<=12;
const validDay=v=>Number.isInteger(v)&&v>=1&&v<=31;
function safePublicUrl(value){
 try{
  const u=new URL(safeText(value));
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password||
     !u.hostname||['localhost','127.0.0.1','::1'].includes(u.hostname))return null;
  return u.href;
 }catch{return null;}
}
function reference(record){
 const candidates=[{url:record.url,label:'Catalogue-linked source'}];
 if(Array.isArray(record.sources))
  for(const s of record.sources.slice(0,40))if(s&&typeof s==='object')
   candidates.push({url:s.url,label:safeText(s.title)||'Source listed in this case'});
 for(const candidate of candidates){
  const url=safePublicUrl(candidate.url);
  if(url)return {url,label:candidate.label};
 }
 return null;
}
function incident(record){
 return record&&typeof record==='object'&&CASE_KINDS.has(safeText(record.kind).toLowerCase())&&
  /^[a-z0-9][a-z0-9-]{1,99}$/.test(safeText(record.id));
}
function analyzeRecord(record){
 if(!incident(record))return [];
 const findings=[];
 const source=reference(record);
 const base={caseId:record.id,caseTitle:safeText(record.title)||record.id,
  dataset:'data/curated-historical-cases.json',source,
  status:'research-prompt-unverified',scope:'Current catalogue entry only'};
 const push=(id,field,reason,nextAction)=>{
  findings.push({...base,id:record.id+':'+id,key:id,field,reason,nextAction});
 };
 if(!validYear(record.year))
  push('event-year-not-indexed','year',
   'This catalogue entry has no valid structured event year. That does not mean the incident was undated.',
   'Check the original case record and enter a verified event year with a source.');
 if(!validMonth(record.eventMonth)||!validDay(record.eventDay))
  push('event-date-precision-not-indexed','eventMonth,eventDay',
   'A complete structured event month and day are not indexed in this catalogue entry. The prose or original records may contain them.',
   'Inspect the linked source and separately record the observation date, with uncertainty and any document date distinguished.');
 const exactTime=safeText(record.eventTime)||safeText(record.eventTimestamp);
 if(!exactTime)
  push('clock-time-not-indexed','eventTime,eventTimestamp',
   'No structured observation clock time is stored in this catalogue entry; this says nothing about other records.',
   'Inspect contemporary accounts for time, time zone and whether they describe one or multiple observations.');
 const locationNote=safeText(record.locationPrecision);
 const hasCoordinates=Number.isFinite(record.lat)&&Number.isFinite(record.lon) &&
  record.lat>=-90&&record.lat<=90&&record.lon>=-180&&record.lon<=180;
 if(!hasCoordinates||!locationNote||/approximate|not the reported sighting point|visitor area|uncertain/i.test(locationNote))
  push('sighting-position-not-verified','locationPrecision,lat,lon',
   'The catalogue does not establish a verified exact observation point. Any supplied map marker may be approximate.',
   'Consult a published source for general geographic context and accuracy; do not request private witness addresses or precise private locations.');
 if(!Array.isArray(record.sources)||record.sources.length===0)
  push('individual-source-list-not-indexed','sources',
   'No separate supporting-source list is indexed for this entry. A catalogue URL may still link to valuable original records.',
   'Inspect the catalogue link, identify primary documents and add distinct citations without implying corroboration.');
 if(!record.instrumentMetadata||typeof record.instrumentMetadata!=='object'||
   (Array.isArray(record.instrumentMetadata)&&record.instrumentMetadata.length===0))
  push('instrument-metadata-not-indexed','instrumentMetadata',
   'Technical instrument metadata are not separately structured in this catalogue entry. This is not evidence that no measurements exist.',
   'If an original source contains instrument data, note model, calibration, timestamp, provenance and missing limitations.');
 if(Array.isArray(record.witnessAccounts)&&record.witnessAccounts.length>=2&&
    !record.witnessIndependence)
  push('witness-independence-not-indexed','witnessIndependence',
   'Multiple witness-account summaries are present but their independence is not classified in this catalogue.',
   'Review each original statement and establish whether accounts are firsthand, mutually independent or repeated reporting.');
 return findings;
}
function analyzeCollection(records,{limit=500}={}){
 const bounded=Number.isInteger(limit)&&limit>=0?Math.min(limit,5000):500;
 if(!Array.isArray(records))return [];
 const result=[];
 for(const record of records.slice(0,5000)){
  for(const f of analyzeRecord(record)){
   if(result.length>=bounded)return result;
   result.push(f);
  }
 }
 return result;
}
module.exports={analyzeRecord,analyzeCollection,safePublicUrl,incident};
