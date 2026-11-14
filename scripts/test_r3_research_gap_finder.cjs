'use strict';
// Offline R3 alpha QA: no real user accounts, web requests, or publication.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {analyzeCollection,analyzeRecord,safePublicUrl,incident}=
 require('../experiments/r3/research-gap-finder.cjs');
const records=JSON.parse(fs.readFileSync('data/curated-historical-cases.json','utf8'));
assert.equal(records.length,12,'Verify expected public curated fixture before drawing conclusions');
assert.equal(records.filter(incident).length,3,'Only three featured incidents; record guides are not incidents');
const findings=analyzeCollection(records);
assert(findings.length>0,'Source-linked events should produce reviewable catalogue gap prompts');
assert(findings.every(f=>f.status==='research-prompt-unverified'));
assert(findings.every(f=>f.scope==='Current catalogue entry only'));
assert(findings.every(f=>f.dataset==='data/curated-historical-cases.json'));
assert(findings.every(f=>f.source?.url.startsWith('https://')));
assert(findings.every(f=>records.some(c=>c.id===f.caseId&&incident(c))));
assert(!findings.some(f=>/does not exist|aliens confirmed|independent witness proven/i.test(f.reason)),
 'A missing catalogue field must never be rewritten as an unqualified real-world claim');
assert(!findings.some(f=>f.caseId==='us-project-bluebook'),
 'An archive catalogue must not be treated as an eyewitness event');
const rendlesham=findings.filter(f=>f.caseId==='featured-rendlesham-1980');
assert(rendlesham.some(f=>f.key==='sighting-position-not-verified'),
 'Approximate public visitor-area coordinate is not the observation point');
assert(rendlesham.some(f=>f.key==='event-date-precision-not-indexed'),
 'Structured observation day can be absent even when source prose mentions a month');
assert(!rendlesham.some(f=>f.key==='individual-source-list-not-indexed'),
 'Do not claim detailed source list missing when it is present');
const complete={
 id:'example-event-2025',title:'A fictional complete metadata record',kind:'Featured investigation',
 year:2025,eventMonth:4,eventDay:12,eventTime:'21:00 UTC',
 lat:51,lon:-2,locationPrecision:'Published location with verified public source',
 url:'https://example.org/original-report',
 sources:[{title:'Original report',url:'https://example.org/original-report'}],
 instrumentMetadata:{device:'Test instrument',calibration:'Synthetic fixture'},
 witnessAccounts:['One report'],witnessIndependence:'Single account'
};
assert.equal(analyzeRecord(complete).length,0,'Complete synthetic fixture must not invent gaps');
const missing={...complete,year:undefined,eventMonth:undefined,eventDay:undefined,
 eventTime:'',lat:undefined,lon:undefined,locationPrecision:'approximate',
 sources:[],instrumentMetadata:null,witnessAccounts:['A','B'],witnessIndependence:null};
const missingResults=analyzeRecord(missing);
for(const key of ['event-year-not-indexed','event-date-precision-not-indexed','clock-time-not-indexed',
 'sighting-position-not-verified','individual-source-list-not-indexed',
 'instrument-metadata-not-indexed','witness-independence-not-indexed'])
 assert(missingResults.some(x=>x.key===key),'Missing-field research prompt '+key);
assert.equal(analyzeCollection([missing],{limit:2}).length,2,'Candidate work remains bounded');
assert.deepEqual(analyzeCollection([{kind:'Government records',id:'archive-index',url:'https://example.org'}]),[],
 'Archive listings must not be labelled as incident investigations');
assert.deepEqual(analyzeCollection([{...complete,kind:'Meeting notes'}]),[],
 'Unrecognised records must not be silently promoted to UAP incidents');
for(const unsafe of ['javascript:alert(1)','file:///etc/passwd','http://127.0.0.1/private',
 'https://name:password@example.org/report','not a URL'])
 assert.equal(safePublicUrl(unsafe),null,'Unsafe or non-public destination rejected: '+unsafe);
assert.deepEqual(analyzeCollection(null),[],'No data returns no assertions');
console.log('PASS R3 gap finder alpha: '+records.length+' public entries, 3 incident-only records, '+
 findings.length+' tentative field-based prompts, strict provenance, privacy and no-claim guardrails');
