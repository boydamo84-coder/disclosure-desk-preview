'use strict';
// M52: trace repeated PUBLIC SOURCE REFERENCES, never score a person or assert independent corroboration.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const people=JSON.parse(read('data/public-people-directory.json')).people;
const js=read('assets/people-directory.js');
const build=read('scripts/build_public_release.cjs');
const claims=people.flatMap(p=>(p.claimEvidence||[]).map(c=>({person:p,claim:c})));
const expected={
 'house-uap-hearing-2023-07-26':{count:5,relation:'same_proceeding'},
 'house-uap-hearing-2024-11-13':{count:4,relation:'same_proceeding'},
 'coulthart-7news-2023-original-upload':{count:2,relation:'same_recording'},
 'barber-newsnation-2025-original-special':{count:2,relation:'same_recording'},
 'council-bluffs-paper-2022-100788':{count:2,relation:'same_published_study'},
 'underwood-interview-2019-nimitz':{count:2,relation:'same_interview'},
 'rendlesham-suffolk-1980-police-log':{count:2,relation:'same_document'},
 'dod-navy-three-videos-2020-announcement':{count:3,relation:'same_public_release'},
 'aaro-gofast-methodology-2025-reproduced':{count:2,relation:'original_and_copy_unverified_bytes'},
 'lazar-klas-dec-1989-two-transcriptions':{count:2,relation:'same_interview_transcription'},
 'council-bluffs-daily-nonpareil-clipping-1977':{count:2,relation:'same_clipping'}
};
assert.equal(people.length,50,'Directory must retain 50 profiles');
assert.equal(people.filter(p=>p.evidenceScope).length,27);
assert.equal(claims.length,23);
let linkCount=0, annotated=0;
const families=new Map();
for(const {person,claim} of claims){
 const summary=claim.evidenceReviewSummary;
 assert(summary && summary.finding.length>=45 && summary.remaining.length>=45);
 assert(typeof summary.lineageNote==='string' && summary.lineageNote.trim().length>=100,
  person.id+' missing substantial lineage explanation');
 assert(!/\b\d{1,3}\s*%/.test(summary.lineageNote),person.id+' no percentages in source lineage');
 assert(Array.isArray(summary.links)&&summary.links.length>=1);
 assert.equal(claim.status,'source_review_pending');
 assert.equal(claim.researchEvidence.status,'research_draft');
 assert.equal(claim.sourceAudit.reviewerSignoff,'not_obtained');
 assert.equal(claim.ratingReadiness.secondEditor,'not_assigned');
 assert.equal(claim.ratingReadiness.publicationApproval,'withheld');
 for(const link of summary.links){
  linkCount++;
  assert(/^https:\/\/[^\s]+$/i.test(link.url),person.id+' source must remain HTTPS');
  if(!link.sharedRecord)continue;
  annotated++;
  const {key,relation}=link.sharedRecord;
  assert(/^[a-z0-9-]{4,100}$/.test(key),person.id+' bad record id');
  assert(expected[key] && expected[key].relation===relation,person.id+' fabricated lineage class');
  const list=families.get(key)||[];list.push({person:person.id,url:link.url});families.set(key,list);
 }
}
assert.equal(linkCount,84,'Original 84 reader evidence links unchanged');
assert.equal(annotated,28,'Exactly 28 source references annotated, without adding any new claims');
assert.equal(families.size,11);
for(const [key,{count}]of Object.entries(expected))
 assert.equal(families.get(key)?.length,count,'Incorrect reused-source identity '+key);
const full = key=>families.get(key).map(r=>r.url);
assert(full('coulthart-7news-2023-original-upload').every(u=>u.includes('v=x_9gTDXF9Vc')),'Same broadcast ID');
assert(full('barber-newsnation-2025-original-special').every(u=>u.includes('v=3dtA9w5ldHw')),'Same broadcast ID');
assert(full('house-uap-hearing-2023-07-26').every(u=>u.includes('CHRG-118hhrg53022')),'Same House publication ID');
assert(full('house-uap-hearing-2024-11-13').every(u=>u.includes('CHRG-118hhrg57440')),'Same House publication ID');
assert(full('council-bluffs-paper-2022-100788').every(u=>u.includes('10.1016/j.paerosci.2021.100788')),'Same DOI');
assert(full('aaro-gofast-methodology-2025-reproduced').some(u=>u.includes('theblackvault.com')),'AARO copy host recorded');
assert(full('aaro-gofast-methodology-2025-reproduced').some(u=>u.includes('www.aaro.mil')),'AARO original retained');
assert(!people.some(p=>(p.evidenceScope||{}).lineageNote),'Role-only profiles must not receive event-related lineage or ratings');
assert(js.includes('How these sources relate:'),'Source lineage explanation displayed');
assert(js.includes('Same named report; copy not hash-matched'),'Original and mirror remain unverified');
assert(js.includes('Shared hearing document; witness accounts may differ'),'Different witnesses not conflated');
assert(js.includes('esc(summary.lineageNote)'),'Lineage prose HTML escaped');
assert(js.includes('esc(lineageTypes[link.sharedRecord.relation])'),'Lineage labels HTML escaped');
assert(js.includes('target="_blank" rel="noopener noreferrer"'),'External-link isolation retained');
assert(!build.includes("'WHO_M52_SOURCE_LINEAGE_READER_2026-11-17.md'"),'Research handover file cannot be public-package allowlisted');
console.log('M52 PASS: 50 profiles, 23 source-lineage explanations, 84 links, 28 grouped references across 11 document/video families, unchanged withheld rating and voting gates.');
