'use strict';
// M56: validate a PRIVATE working reviewer scorecard; never publish one.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const scorecard=JSON.parse(read('data/who-m56-fravor-private-working-scorecard.json'));
const handoff=JSON.parse(read('data/who-editorial-handoff-m29.json'));
const publicPeople=JSON.parse(read('data/public-people-directory.json'));
const build=read('scripts/build_public_release.cjs');
const whoHtml=read('who-is-who.html'),whoJs=read('assets/people-directory.js'),site=read('index.html');
assert.equal(scorecard.schemaVersion,1);
assert.equal(scorecard.status,'internal_first_pass_withdrawn_pending_scope_separation_and_independent_review');
assert.equal(scorecard.visibility,'NOT_FOR_PUBLIC_RELEASE');
assert.equal(scorecard.claimId,'fravor-2023-house-2004-encounter');
assert.equal(scorecard.personId,'david-fravor');
assert.equal(scorecard.caseId,'featured-nimitz-2004');
assert.equal(scorecard.rubricVersion,handoff.policy.governingMethodology);
assert.equal(scorecard.reviewScope.distinctAssertions.length,5);
assert(scorecard.reviewScope.excludes.some(x=>/honesty/.test(x)));
assert(scorecard.reviewScope.excludes.some(x=>/probability/.test(x)));
assert.equal(scorecard.scoreState,'WITHDRAWN_COMPOUND_SCORING_UNIT_REQUIRES_CLAIM_SEPARATION');
assert.equal(scorecard.decision,'NO_CURRENT_SCORE_REVIEW_SCOPE_RECALIBRATION_REQUIRED');
assert.equal(scorecard.independentWitnessCount,null,'An unverified head count is not corroboration');
assert.equal(scorecard.claimOfVerifiedExtraordinaryPerformance,false);
const rubric=handoff.proposedRubric;
assert.equal(rubric.status,'criteria_defined_no_scores_assigned','M29 published framework must still be unassigned');
assert.equal(rubric.maxTotalPoints,100);
assert.equal(handoff.policy.noClaimScorePublished,true);
assert.equal(handoff.policy.noMemberBallotsEnabled,true);
assert.equal(handoff.policy.noPersonBelievabilityRating,true);
assert.equal(handoff.policy.noHumanSignoffCreatedByAutomation,true);
assert.equal(scorecard.criteria.length,5);
assert.deepEqual(scorecard.criteria.map(c=>[c.id,c.maxPoints]),
 rubric.criteria.map(c=>[c.id,c.maxPoints]),'Never alter agreed criterion weights by introducing a draft');
const sourceIds=new Set(scorecard.sourceRecords.map(s=>s.id));
assert.equal(sourceIds.size,scorecard.sourceRecords.length);
assert.equal(sourceIds.size,8,'Eight distinct documented or explicitly limited source records');
for(const s of scorecard.sourceRecords){
 assert(/^[a-z0-9][a-z0-9-]{3,80}$/.test(s.id));
 assert(s.url.startsWith('https://')&&s.url.length<300);
 assert(s.locator.length>=35,'Each source must have a traceable passage or article section');
 assert(s.establishes.length>=70&&s.doesNotEstablish.length>=50,'Show both evidential strength and scope limits');
 assert(s.independenceFamily.length>=10,'Source reuse/independence metadata is mandatory');
 assert(s.access.length>=22,'Do not imply that a blocked PDF or inaccessible original has been fully audited');
}
for(const c of scorecard.criteria){
 assert.equal(c.provisionalWorkingPoints,null,'Withdrawn compound number must not be silently reused');
 assert.equal(c.pointsStatus,'unassigned_pending_distinct_claim_unit_calibration');
 assert(c.finding.length>=90&&c.limits.length>=85&&c.nextAudit.length>=85,
  'Every proposed allocation needs substantive evidence, limitations, follow-up');
 assert(Array.isArray(c.sourceIds)&&c.sourceIds.length>=1&&c.sourceIds.every(s=>sourceIds.has(s)),
  'Every criterion must cite a known source');
}
assert.equal(scorecard.workingTotalPoints,null,'No active score permitted');
assert.equal(scorecard.withdrawnFirstPass.pointTotal,54,'Retain obsolete calculation only as labelled internal audit history');
assert.equal(scorecard.withdrawnFirstPass.prohibitedUse.includes('Do not display'),true);
assert.equal(scorecard.withdrawnFirstPass.initialAllocation.length,5);
assert.equal(scorecard.evidenceUnits.length,5);
assert.deepEqual(scorecard.evidenceUnits.map(x=>x.id),[
 'nimitz-visual-encounter','nimitz-radar-reports','nimitz-later-navy-video',
 'nimitz-extraordinary-kinematics','nimitz-object-origin'
]);
for(const unit of scorecard.evidenceUnits){
 assert.equal(unit.editorialScore,null);
 assert(unit.question.length>=50&&unit.finding.length>=60&&unit.limits.length>=80);
 assert(unit.sourceIds.length>=2&&unit.sourceIds.every(id=>sourceIds.has(id)));
}
assert.match(scorecard.evidenceUnits[1].finding,/Fravor testified/);
assert.match(scorecard.evidenceUnits[2].finding,/Navy infrared recording/);
assert.equal(scorecard.workingMaximumPoints,100);
assert.match(scorecard.workingTotalInterpretation,/No active numeric assessment/);
assert.match(scorecard.workingTotalInterpretation,/probability/);
const review=scorecard.humanEditorialReview;
for(const k of ['leadHumanSigned','secondHumanSigned','approvedForPublicScore',
 'approvedForCommunityVote','approvedForPortraitUse'])assert.equal(review[k],false);
assert.equal(review.leadHumanEditor,null);
assert.equal(review.independentSecondHumanEditor,null);
assert.equal(review.conflictOfInterestReview,'not_completed');
assert.equal(review.fullOriginalRecordAudit,'not_completed');
assert.equal(scorecard.reviewTasks.length,8);
const original=scorecard.sourceRecords.find(s=>s.id==='gpo-2023');
assert.equal(original.kind,'official_primary_testimony');
assert.match(original.doesNotEstablish,/acceleration/);
const second=scorecard.sourceRecords.find(s=>s.id==='cbs-dietrich-2021');
assert.match(second.doesNotEstablish,/second incident/);
const later=scorecard.sourceRecords.find(s=>s.id==='underwood-2019');
assert.match(later.establishes,/later infrared/);
const dod=scorecard.sourceRecords.find(s=>s.id==='dod-2020');
assert.match(dod.access,/403/,'Do not claim inaccessible original DoD release was fully audited');
const radar=scorecard.sourceRecords.find(s=>s.id==='knuth-model-2019');
assert.match(radar.doesNotEstablish,/Original radar plots/);
const navy=scorecard.sourceRecords.find(s=>s.id==='navy-foia-briefing');
assert.match(navy.access,/visual_retrieval_blocked/);
const alternative=scorecard.sourceRecords.find(s=>s.id==='west-alt-2019');
assert.match(alternative.doesNotEstablish,/conclusive/);
assert.equal(scorecard.releaseGate.includedInPublicSiteAllowlist,false);
assert.equal(scorecard.releaseGate.publicPointsAllowed,false);
assert.equal(scorecard.releaseGate.publishedPercentAllowed,false);
assert.equal(scorecard.releaseGate.communityVotingAllowed,false);
const person=publicPeople.people.find(p=>p.id==='david-fravor');
assert(person,'Source person is already a verified directory entry');
const claim=person.claimEvidence.find(c=>c.id===scorecard.claimId);
assert(claim,'Do not manufacture new person or claim record');
assert.equal(claim.status,'source_review_pending');
assert.equal(claim.ratingReadiness.publicationApproval,'withheld');
assert.equal(claim.sourceAccessCheck.secondEditorSignoff,'not_obtained');
assert.equal(claim.sourceAudit.reviewerSignoff,'not_obtained');
assert(!Object.hasOwn(claim,'score'),'Public claim must contain no score');
const privateName='who-m56-fravor-private-working-scorecard.json';
const privateReport='WHO_M56_FRAVOR_PRIVATE_EVIDENCE_REVIEW_2026-11-17.md';
for(const text of [build,whoHtml,whoJs,site]){
 assert(!text.includes(privateName),'Private scored draft may NOT be linked or copied to public reader');
 assert(!text.includes(privateReport),'Reviewer report may NOT be referenced by public site');
}
assert(!build.includes('who-m56-'),'No M56 private file may be in release allowlist');
assert(!build.includes('WHO_M56_'),'No M56 review notes may be in release allowlist');
console.log('M56 PASS: 8 properly labelled sources, 5 separate unscored evidentiary questions, withdrawn blended 54-point allocation preserved only for private audit, human signoff missing, no public score/votes.');
