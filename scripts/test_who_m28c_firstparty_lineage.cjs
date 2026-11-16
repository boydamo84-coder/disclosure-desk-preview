'use strict';
// M28c test: sourced attribution and scope, never the truth of an unobserved incident.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const reader=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const gpo='https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm';
const expected={
 'david-grusch':{source:gpo,date:'2023-07-26',kind:'secondhand_claim',slots:['secondhand_claim','secondhand_claim','firsthand_scope_limit'],context:0},
 'ryan-graves':{source:gpo,date:'2023-07-26',kind:'secondhand_claim',slots:['firsthand_context','secondhand_claim','firsthand_scope_limit'],context:0},
 'david-fravor':{source:gpo,date:'2023-07-26',kind:'firsthand_visual_account',slots:['firsthand_visual_account','separate_source_chain','firsthand_scope_limit'],context:0},
 'christopher-mellon':{source:'https://christopherkmellon.substack.com/p/the-us-government-is-sitting-on-a',date:'2025-10-14',kind:'policy_recommendation',slots:['attributed_opinion','attributed_policy_argument','policy_recommendation'],context:1}
};
const records=data.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28cFirstPartyCheck);
assert.equal(data.people.length,50,'Full Who directory intact');
assert.deepEqual(records.map(p=>p.id).sort(),Object.keys(expected).sort(),'Only four M28c records, no fake blanket approval');
assert.equal(data.people.filter(p=>p.claimEvidence?.length).length,23);
assert.equal(data.people.filter(p=>p.evidenceScope).length,27);
assert.equal(data.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28OfficialHearingCheck).length,4);
assert.equal(data.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28bOriginalSourceCheck).length,4);
assert.equal(data.people.reduce((n,p)=>n+(p.claimEvidence||[]).reduce((m,c)=>m+(c.researchEvidence?.items?.length||0),0),0),89);
for(const person of records){
 const claim=person.claimEvidence[0],r=claim.sourceAudit.m28cFirstPartyCheck,e=expected[person.id];
 assert.equal(r.originalUrl,e.source);
 assert.equal(r.publicationDate,e.date);
 assert.equal(r.checkedAt,'2026-11-16');
 assert.equal(r.status,'selected_original_statement_published_scope_check_not_full_incident_review');
 assert.equal(r.passageChecks.length,3);
 assert.deepEqual(r.passageChecks.map(x=>x.evidenceKind),e.slots);
 assert.equal(r.contextSources.length,e.context);
 assert(r.method.length>=80&&r.claimScope.length>=90);
 assert(r.nextValidation.length>=95&&r.sourceLineageNote.length>=100);
 for(const q of r.passageChecks){
  assert(q.locator.length>=35);
  assert(q.finding.length>=85);
  assert(q.limit.length>=90);
 }
 assert.equal(r.fullUnderlyingClaimVerification,false);
 assert.equal(r.independentSecondHumanEditor,'not_obtained');
 assert.equal(r.scorePublicationPermission,false);
 assert.equal(r.communityVotePermission,false);
 assert.equal(r.newImageRightsPermission,false);
 assert.equal(claim.sourceAccessCheck.fullOriginalReviewed,false);
 assert.equal(claim.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert.equal(claim.ratingReadiness.publicationApproval,'withheld');
 assert.notEqual(claim.sourceReviewApproved,true);
 assert(claim.review?.status!=='published');
 assert.equal(person.photoRightsAudit.finalRightsApproval,false);
}
const grusch=records.find(p=>p.id==='david-grusch').claimEvidence[0].sourceAudit.m28cFirstPartyCheck;
assert.match(grusch.passageChecks[2].finding,/not personally witnessed alleged bodies/);
assert.match(grusch.passageChecks[1].finding,/forty people/);
const graves=records.find(p=>p.id==='ryan-graves').claimEvidence[0].sourceAudit.m28cFirstPartyCheck;
assert.match(graves.passageChecks[2].finding,/answered no/);
const fravor=records.find(p=>p.id==='david-fravor').claimEvidence[0].sourceAudit.m28cFirstPartyCheck;
assert.match(fravor.passageChecks[1].finding,/different crew/);
assert.match(fravor.passageChecks[2].finding,/fire-control radars did not pick up/);
const mellon=records.find(p=>p.id==='christopher-mellon').claimEvidence[0];
assert.equal(mellon.ratingReadiness.scorePath,'not_applicable_to_incident_score');
assert.equal(mellon.sourceAudit.m28cFirstPartyCheck.contextSources[0].url,'https://www.archives.gov/research/topics/uaps');
assert.match(mellon.sourceAudit.m28cFirstPartyCheck.contextSources[0].limit,/neither audits all/);
assert.match(reader,/function m28cFirstPartyCheckHtml\(claim\)/);
assert.match(reader,/m28cFirstPartyCheckHtml\(claim\)\+/);
assert.match(reader,/scorePublicationPermission!==false/);
assert.match(reader,/communityVotePermission!==false/);
assert.match(html,/m28c=lineage/);
assert.match(html,/claim-m28c-check\{margin/);
console.log('M28c PASS: GPO 2023 3 testimony scope checks, Mellon 2025 original policy and NARA collection; 12 passages, no scores/votes/images/independent human approval, 50 profiles intact, NO DEPLOY');
