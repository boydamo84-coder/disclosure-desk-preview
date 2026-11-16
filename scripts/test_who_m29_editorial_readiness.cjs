'use strict';
// M29: zero signed reviews, no fabricated points, original-source lineage map.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const d=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const people=d.people, all=people.filter(p=>p.claimEvidence?.length);
assert.equal(people.length,50);
assert.equal(all.length,23,'Exactly 23 claim/recommendation editorial packets');
assert.equal(people.filter(p=>p.evidenceScope).length,27);
assert.equal(all.reduce((sum,p)=>sum+p.claimEvidence[0].researchEvidence.items.length,0),89);
const allowedReviewKeys=['m28OfficialHearingCheck','m28bOriginalSourceCheck','m28cFirstPartyCheck','m28dBroadcastLineageCheck','m28eFinalSevenSourceCheck'];
const rubric=['original','independent','direct','testable','alternatives'];
const steps=['primaryRecordFullyAuthenticated','witnessOrPublicationLineageAudited','independentCorroborationEstablished',
 'contraryRecordsEvaluated','methodAndSourceUncertaintyReviewed','qualifiedIndependentHumanEditorSigned',
 'editorialPublicationApprovalGranted','authenticatedCommunityVotingSecurityVerified'];
const scopes={
 incident_evidence_review_pending:'incident_and_sensor_observations',
 documentary_source_review_pending:'published_reporting_or_programme_claim',
 method_specific_review_pending:'published_scientific_or_interpretive_method',
 not_applicable_to_incident_score:'public_policy_or_records_only'
};
const original=x=>x.claimEvidence[0].sourceAudit.original.url;
const group=x=>x.claimEvidence[0].sourceAudit.relatedSourceGroup;
const uniqueSources=new Set(all.map(original));
assert.equal(uniqueSources.size,17,'17 distinct publication URLs, not 23 independently authenticated observations');
assert.equal(new Set(all.map(group)).size,20,'20 indexed families, includes three shared pairs');
const foundEdges=new Set();
for(const p of all){
 const c=p.claimEvidence[0],v=c.m29EditorialPreparation;
 assert(v,'M29 missing '+p.id);
 assert.equal(v.status,'research_compiled_human_editor_not_assigned');
 assert.equal(v.preparedAt,'2026-11-16');
 assert.equal(v.claimId,c.id);
 assert.equal(v.rubricVersion,'dd-claim-evidence-v1-draft-human-review');
 assert.equal(v.claimedScope,scopes[c.ratingReadiness.scorePath]);
 assert(allowedReviewKeys.includes(v.researchReviewRef),'One M28 source audit must be cited');
 assert(c.sourceAudit[v.researchReviewRef], 'Audit ref must exist');
 assert.equal(v.primarySource.url,original(p));
 assert.equal(v.primarySource.reviewStatus,c.sourceAccessCheck.status);
 assert.equal(v.primarySource.publicationContainerNotEventProof,true);
 assert.equal(v.sourceFamilyId,group(p));
 assert.equal(v.publicationEvidenceItemCount,c.researchEvidence.items.length);
 assert.equal(v.countedIndependentConfirmations,null,'Do not invent a count of confirmed independent sources');
 const sameOriginal=all.filter(q=>q.id!==p.id&&original(q)===original(p)).map(q=>q.id).sort();
 const sameGroup=all.filter(q=>q.id!==p.id&&group(q)===group(p)).map(q=>q.id).sort();
 assert.deepEqual(v.samePublicationContainerPeers,sameOriginal);
 assert.deepEqual(v.sameClaimFamilyPeers,sameGroup);
 assert.deepEqual(Object.keys(v.criteriaReview).sort(),rubric.slice().sort());
 assert(rubric.every(k=>v.criteriaReview[k]==='independent_editor_review_not_completed'));
 assert.deepEqual(Object.keys(v.checklist).sort(),steps.slice().sort());
 assert(steps.every(k=>v.checklist[k]===false));
 assert.equal(v.editorialSignoff.firstHumanEditor,'not_signed');
 assert.equal(v.editorialSignoff.independentSecondHumanEditor,'not_assigned');
 assert.equal(v.editorialSignoff.signedAt,null);
 assert.equal(v.editorialSignoff.approvalRecordUrl,null);
 assert.equal(v.publicationGate,'withheld');
 assert.equal(v.permissionToPublishNumericEvidenceRating,false);
 assert.equal(v.permissionToAcceptCommunityVotes,false);
 assert.equal(v.permissionToPublishNewPortrait,false);
 assert(v.note.length>175);
 assert.equal(c.ratingReadiness.publicationApproval,'withheld');
 assert.equal(c.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert.equal(c.sourceAccessCheck.fullOriginalReviewed,false);
 assert.notEqual(c.sourceReviewApproved,true);
 assert(c.review?.status!=='published');
 assert.equal(p.photoRightsAudit.finalRightsApproval,false);
 for(const edge of v.relatedClaimCautions){
  const target=all.find(q=>q.id===edge.personId);
  assert(target&&target.id!==p.id,'Editorial graph must link to existing other claim dossier');
  assert(['overlapping_original_reporting','same_broadcaster_interview_chain','same_case_different_evidence_stream',
   'same_historical_case_distinct_sources','one_shared_study'].includes(edge.type));
  assert(edge.note.length>115);
  assert(target.claimEvidence[0].m29EditorialPreparation.relatedClaimCautions.some(y=>
   y.personId===p.id&&y.type===edge.type&&y.note===edge.note),'Graph edges must be symmetrical');
  foundEdges.add([p.id,target.id].sort().join('|'));
 }
}
assert.equal(foundEdges.size,7,'Seven explicit related-claim/overlap notes, not seven new corroborations');
const check=(id)=>all.find(p=>p.id===id).claimEvidence[0].m29EditorialPreparation;
const n=check('garry-nolan'),v=check('jacques-vallee');
assert.equal(n.primarySource.url,v.primarySource.url);
assert.deepEqual(n.samePublicationContainerPeers,['jacques-vallee']);
assert.deepEqual(v.sameClaimFamilyPeers,['garry-nolan']);
assert(n.relatedClaimCautions.some(e=>e.personId==='jacques-vallee'&&e.type==='one_shared_study'));
const g=check('david-grusch');
assert.deepEqual(g.samePublicationContainerPeers,['david-fravor','ryan-graves']);
assert(g.relatedClaimCautions.some(x=>x.personId==='leslie-kean'));
assert(g.relatedClaimCautions.some(x=>x.personId==='ross-coulthart'));
for(const id of ['christopher-mellon','mike-gold'])
 assert.equal(check(id).claimedScope,'public_policy_or_records_only');
assert.equal(all.filter(p=>p.claimEvidence[0].m29EditorialPreparation.claimedScope==='public_policy_or_records_only').length,2);
for(const [key,n] of [['m28OfficialHearingCheck',4],['m28bOriginalSourceCheck',4],['m28cFirstPartyCheck',4],['m28dBroadcastLineageCheck',4],['m28eFinalSevenSourceCheck',7]])
 assert.equal(all.filter(p=>p.claimEvidence[0].sourceAudit[key]).length,n);
assert.match(js,/function m29EditorialReadinessHtml\(claim\)/);
assert.match(js,/m29EditorialReadinessHtml\(claim\)\+/);
assert.match(js,/m29EditorialPreparation\.publicationGate!=='approved_after_dual_human_review'/);
assert.match(js,/Physical-incident evidence percentage: Not applicable/);
assert.match(js,/permissionToAcceptCommunityVotes!==false/);
assert.match(js,/Independent second editor: not assigned/);
assert.match(html,/m29=editorial-queue/);
assert.match(html,/claim-m29-queue\{margin/);
console.log('M29 QA PASS: 23/23 unscored human-editor queue, 17 original publication containers, 20 families, 7 two-way caution links; 0 signed approvals, 0 counted corroborations, 2 policy N/A, 27 role-only, NO DEPLOY');
