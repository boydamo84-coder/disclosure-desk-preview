'use strict';
// M28 source-note accuracy and release boundary; strictly offline source fixtures.
// These checks test attribution and publication fences, NOT the truth of any UAP event.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const reader=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const original='https://www.govinfo.gov/content/pkg/CHRG-118hhrg57440/html/CHRG-118hhrg57440.htm';
const aaro='https://www.aaro.mil/Portals/136/PDFs/case_resolution_reports/AARO_GoFast_Case_Resolution_Card_Methodology_Final.pdf';
const expected={
 'tim-gallaudet':{passages:2,contrasts:2,category:'first_person_email_recollection_with_separate_video_interpretation'},
 'luis-elizondo':{passages:2,contrasts:0,category:'public_programme_assertion_not_physical_authentication'},
 'michael-shellenberger':{passages:3,contrasts:0,category:'source_report_and_anonymous_document_not_official_programme_confirmation'},
 'mike-gold':{passages:2,contrasts:0,category:'scientific_policy_recommendation_not_incident_claim'}
};
assert.equal(data.people.length,50);
const entries=data.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28OfficialHearingCheck);
assert.deepEqual(entries.map(p=>p.id).sort(),Object.keys(expected).sort(),
 'Only four independently spot-checked public original-hearing passages; no blanket full-review flags');
for(const p of entries){
 const c=p.claimEvidence[0],audit=c.sourceAudit,a=audit.m28OfficialHearingCheck,e=expected[p.id];
 assert.equal(a.status,'primary_hearing_passages_spot_checked_not_whole_case_audit');
 assert.equal(a.checkedAt,'2026-11-16');
 assert.equal(a.hearingDate,'2024-11-13');
 assert.equal(a.firstPartyUrl,original);
 assert.equal(a.classification,e.category);
 assert.equal(a.secondIndependentHumanEditor,'not_obtained');
 assert.equal(a.fullUnderlyingClaimVerification,false);
 assert.equal(a.permissionToPublishScoreOrCommunityVote,false);
 assert.equal(a.permissionToPublishNewPortrait,false);
 assert.equal(a.passageChecks.length,e.passages);
 assert.equal(a.contrastingRecords.length,e.contrasts);
 for(const check of [...a.passageChecks,...a.contrastingRecords]){
  assert(check.locator.length>=25&&check.finding.length>=65&&check.limit.length>=60,
   'Every spot check documents location, narrow finding and evidentiary limitation: '+p.id);
 }
 for(const ref of a.contrastingRecords)assert.equal(ref.url,aaro);
 assert.equal(c.sourceAccessCheck.fullOriginalReviewed,false,'Only passages verified, not complete case');
 assert.equal(c.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert.equal(c.ratingReadiness.status,'first_pass_triage');
 assert.equal(c.ratingReadiness.publicationApproval,'withheld');
 assert(!c.review||c.review.status!=='published');
 assert.notEqual(c.sourceReviewApproved,true);
 assert.equal(p.photoRightsAudit.finalRightsApproval,false);
}
const gall=data.people.find(p=>p.id==='tim-gallaudet').claimEvidence[0].sourceAudit.m28OfficialHearingCheck;
assert.match(gall.passageChecks.map(x=>x.limit).join(' '),/email|server logs|deletion/i);
assert.match(gall.contrastingRecords[0].finding,/13,000 feet/);
assert.match(gall.contrastingRecords[0].finding,/5.92 mph/);
assert.match(gall.contrastingRecords[0].limit,/not whether.*email/i);
assert.match(gall.contrastingRecords[1].finding,/metadata.*unavailable/);
const shell=data.people.find(p=>p.id==='michael-shellenberger').claimEvidence[0].sourceAudit.m28OfficialHearingCheck;
assert.match(shell.passageChecks[2].finding,/not the author/);
assert.match(shell.passageChecks[1].limit,/not disclosed|not publicly confirmed/);
const gold=data.people.find(p=>p.id==='mike-gold').claimEvidence[0];
assert.match(gold.sourceAudit.m28OfficialHearingCheck.passageChecks[0].finding,/not for NASA/);
assert.equal(gold.ratingReadiness.scorePath,'not_applicable_to_incident_score');
assert.equal(data.people.filter(p=>p.claimEvidence?.length).length,23);
assert.equal(data.people.reduce((n,p)=>n+(p.claimEvidence||[]).reduce((m,c)=>m+(c.researchEvidence?.items?.length||0),0),0),89);
assert.match(reader,/function m28HearingCrosscheckHtml\(claim\)/);
assert.match(reader,/m28HearingCrosscheckHtml\(claim\)\+/);
assert.match(reader,/permissionToPublishScoreOrCommunityVote!==false/);
assert.match(reader,/fullUnderlyingClaimVerification!==false/);
assert.match(reader,/claim-m28-check/);
assert.match(html,/m28=hearing-crosschecks/);
assert.match(html,/claim-m28-check\{margin/);
assert(!Object.hasOwn(gall,'score'),'No numerical credibility/sensor verdict manufactured');
console.log('M28 2024 GPO hearing source audit PASS: four source-limited profiles, nine attributed passages, two Go Fast original AARO cross-checks, 23 unsigned claim drafts, 27 non-claim profiles, 89 existing evidence items, no scores/votes/photos. NO DEPLOY.');
