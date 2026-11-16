'use strict';
// M28b: offline contract for four diverse original-publication source checks.
// Pure source audit assertions. Never validates underlying event truth or enables scores.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const expected={
 'mick-west':{url:'https://www.metabunk.org/threads/gimbal-ufo-a-new-analysis.12333/',type:'published_optical_hypothesis_not_object_identification',passages:3,contrasts:0},
 'kevin-knuth':{url:'https://www.mdpi.com/1099-4300/21/10/939',type:'conditional_motion_calculation_not_radar_verified_acceleration',passages:3,contrasts:0},
 'leslie-kean':{url:'https://thedebrief.org/intelligence-officials-say-u-s-has-retrieved-non-human-craft/',type:'journalistic_multiple_source_assertion_not_independently_tested_physical_claim',passages:3,contrasts:0},
 'avi-loeb':{url:'https://galileo.hsites.harvard.edu/sites/g/files/omnuum6371/files/chemical_classification_of_spherules_1-s2.0-s0009254124004959-main.pdf',type:'physical_sample_chemistry_with_unproven_event_attribution',passages:3,contrasts:2}
};
assert.equal(data.people.length,50);
const p=data.people.filter(x=>x.claimEvidence?.[0]?.sourceAudit?.m28bOriginalSourceCheck);
assert.deepEqual(p.map(x=>x.id).sort(),Object.keys(expected).sort(),'Exactly four researched M28b source records');
assert.equal(data.people.filter(x=>x.claimEvidence?.length).length,23);
assert.equal(data.people.filter(x=>x.evidenceScope).length,27);
assert.equal(data.people.reduce((a,p)=>a+(p.claimEvidence||[]).reduce((n,c)=>n+(c.researchEvidence?.items?.length||0),0),0),89);
assert.equal(data.people.filter(x=>x.claimEvidence?.[0]?.sourceAudit?.m28OfficialHearingCheck).length,4,'Keep four M28a GPO reviews intact');
for(const person of p){
 const c=person.claimEvidence[0],audit=c.sourceAudit,r=audit.m28bOriginalSourceCheck,x=expected[person.id];
 assert.equal(r.status,'selected_original_publication_passages_checked_not_complete_independent_claim_review');
 assert.equal(r.checkedAt,'2026-11-16');
 assert.equal(r.primaryUrl,x.url);
 assert.equal(r.publicationDate,/^\d{4}-\d{2}-\d{2}$/.test(r.publicationDate)?r.publicationDate:'');
 assert.equal(r.category,x.type);
 assert(r.method.length>=55,'Specific inspected source scope');
 assert.equal(r.passageChecks.length,x.passages);
 assert.equal(r.contrastChecks.length,x.contrasts);
 assert(r.sourceLineageNote.length>=90&&r.remainingGap.length>=90);
 for(const entry of r.passageChecks){
  assert(entry.locator.length>=30,'Specific original passage');
  assert(entry.finding.length>=75&&entry.limit.length>=75,'Narrow finding and limitation');
 }
 for(const entry of r.contrastChecks){
  assert(entry.url.startsWith('https://'));
  assert.equal(entry.accessStatus,'publisher_indexed_abstract_direct_fulltext_blocked',
   'Blocked full-text must not become a completed paper review');
  assert(entry.finding.length>=75&&entry.limit.length>=75);
 }
 assert.equal(r.fullUnderlyingClaimVerification,false);
 assert.equal(r.secondIndependentHumanEditor,'not_obtained');
 assert.equal(r.permissionToPublishScoreOrCommunityVote,false);
 assert.equal(r.permissionToPublishNewPortrait,false);
 assert.equal(c.sourceAccessCheck.fullOriginalReviewed,false);
 assert.equal(c.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert.equal(c.ratingReadiness.publicationApproval,'withheld');
 assert.notEqual(c.sourceReviewApproved,true);
 assert(c.review?.status!=='published');
 assert.equal(person.photoRightsAudit.finalRightsApproval,false);
}
const west=p.find(x=>x.id==='mick-west').claimEvidence[0].sourceAudit.m28bOriginalSourceCheck;
assert.match(west.passageChecks[2].finding,/unidentified aerial object|not proving/);
assert.match(west.method,/not independently executed/);
const knuth=p.find(x=>x.id==='kevin-knuth').claimEvidence[0].sourceAudit.m28bOriginalSourceCheck;
assert.match(knuth.passageChecks[1].finding,/0\.78 ± 0\.08 seconds/);
assert.match(knuth.passageChecks[2].finding,/5,370 g/);
assert.match(knuth.passageChecks[2].limit,/not.*directly verified/i);
const kean=p.find(x=>x.id==='leslie-kean').claimEvidence[0].sourceAudit.m28bOriginalSourceCheck;
assert.match(kean.passageChecks[0].limit,/not released for an external audit/);
assert.match(kean.passageChecks[2].limit,/not departmental authentication/);
const loeb=p.find(x=>x.id==='avi-loeb').claimEvidence[0].sourceAudit.m28bOriginalSourceCheck;
assert.match(loeb.passageChecks[1].finding,/cannot prove.*directly attributable to IM1/i);
assert(loeb.contrastChecks.some(x=>x.url.endsWith('S000925412500018X')));
assert(loeb.contrastChecks.some(x=>x.url.endsWith('S0009254125000178')));
assert(loeb.contrastChecks.every(x=>x.limit.includes('full')||x.limit.includes('abstract')));
assert.match(js,/function m28bOriginalSourceCheckHtml\(claim\)/);
assert.match(js,/m28bOriginalSourceCheckHtml\(claim\)\+/);
assert.match(js,/permissionToPublishScoreOrCommunityVote!==false/);
assert.match(js,/secondIndependentHumanEditor!=='not_obtained'/);
assert.match(html,/m28b=source-comparisons/);
assert.match(html,/claim-m28b-check\{margin/);
console.log('M28b source gate PASS: 4 original publication source-limited reviews (West, Knuth, Kean, Loeb); 12 located passages, two 2025 indexed abstracts marked full-text blocked; 50 people, 23 drafts, 27 no-score roles; no approvals, votes or photos; NO DEPLOY.');
