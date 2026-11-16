'use strict';
// M29: REVIEW QUEUE IS DRAFT ONLY. It never assigns points or signs anyone's work.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const m29=JSON.parse(fs.readFileSync(path.join(root,'data/who-editorial-handoff-m29.json'),'utf8'));
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const builder=fs.readFileSync(path.join(root,'scripts/build_public_release.cjs'),'utf8');
const baseline=[
 ['original',25],['independent',30],['direct',25],['testable',10],['alternatives',10]
];
assert.equal(m29.schemaVersion,1);
assert.equal(m29.status,'research_handoff_readonly_no_human_approval');
assert.equal(m29.policy.noPersonBelievabilityRating,true);
assert.equal(m29.policy.noClaimScorePublished,true);
assert.equal(m29.policy.noMemberBallotsEnabled,true);
assert.equal(m29.policy.noHumanSignoffCreatedByAutomation,true);
assert.equal(m29.policy.caseFamiliesAreNotProofOfIndependence,true);
assert.equal(m29.proposedRubric.status,'criteria_defined_no_scores_assigned');
assert.equal(m29.proposedRubric.maxTotalPoints,100);
assert.deepEqual(m29.proposedRubric.criteria.map(x=>[x.id,x.maxPoints]),baseline);
assert(m29.proposedRubric.criteria.every(x=>x.reviewEvidence.length>60&&x.blocker.length>50));
const people=data.people;
assert.equal(people.length,50);
const claimPeople=people.filter(x=>x.claimEvidence?.length);
assert.equal(claimPeople.length,23);
assert.equal(people.filter(x=>x.evidenceScope).length,27);
assert.equal(claimPeople.reduce((sum,p)=>sum+p.claimEvidence[0].researchEvidence.items.length,0),89);
assert.equal(m29.dockets.length,23);
const claimIds=new Set(),originalItems=new Map(),originalFamily=new Map();
for(const p of claimPeople){
 const claim=p.claimEvidence[0];
 for(const item of claim.researchEvidence.items){
  const key=item.url,set=originalItems.get(key)||new Set();set.add(claim.id);originalItems.set(key,set);
 }
 const fam=claim.sourceAudit.relatedSourceGroup,set=originalFamily.get(fam)||new Set();
 set.add(claim.id);originalFamily.set(fam,set);
}
assert.equal(originalItems.size,59,'59 distinct cited public URLs');
let references=0,policyDockets=0;
for(const d of m29.dockets){
 assert(!claimIds.has(d.claimId),'No repeated handoff claims');
 claimIds.add(d.claimId);
 const person=people.find(x=>x.id===d.personId);
 const c=person?.claimEvidence?.[0];
 assert(c,'A valid known claim with a real person ID');
 assert.equal(c.id,d.claimId);
 assert.equal(d.claimText,c.statement);
 assert.equal(d.originalSourceUrl,c.sourceAudit.original.url);
 assert.equal(d.sourceLineageGroup,c.sourceAudit.relatedSourceGroup);
 assert.equal(d.primarySourceAccessStatus,c.sourceAccessCheck.status);
 assert.equal(d.fullOriginalInspected,false);
 assert.equal(d.firstPassCoverage,'m28_selected_original_or_explicitly_limited_source_review_complete');
 assert.equal(d.suitability,c.ratingReadiness.scorePath==='not_applicable_to_incident_score'?
  'not_applicable_to_incident_evidence_score':'requires_separate_method_review');
 if(d.suitability==='not_applicable_to_incident_evidence_score')policyDockets++;
 assert.deepEqual(d.linkedClaimsSameResearchFamily.slice().sort(),
  [...(originalFamily.get(d.sourceLineageGroup)||[])].filter(id=>id!==d.claimId).sort());
 assert.equal(d.bibliography.length,c.researchEvidence.items.length);
 references+=d.bibliography.length;
 for(const [i,e] of d.bibliography.entries()){
  const orig=c.researchEvidence.items[i];
  assert.equal(e.id,orig.id);
  assert.equal(e.url,orig.url);
  assert.equal(e.title,orig.title);
  assert.equal(e.type,orig.type);
  assert.equal(e.stance,orig.stance);
  assert.equal(e.sourceOccurrences,originalItems.get(e.url).size);
  assert.deepEqual(e.reusedAcrossClaims.slice().sort(),[...originalItems.get(e.url)].filter(id=>id!==d.claimId).sort());
  assert(e.url.startsWith('https://'));
 }
 assert.deepEqual(d.contextualOrContraryReferenceIds,
  d.bibliography.filter(x=>['alternative','challenges'].includes(x.stance)).map(x=>x.id));
 assert.deepEqual(d.sameUrlReferenceReuses.map(x=>x.id),
  d.bibliography.filter(x=>x.reusedAcrossClaims.length>0).map(x=>x.id));
 for(const status of Object.values(d.checklist))assert.equal(status,'requires_separate_editorial_recheck');
 const e=d.reviewerHandoff;
 assert.equal(e.status,'unassigned_requires_independent_human');
 assert.equal(e.leadEditor,null);
 assert.equal(e.independentSecondEditor,null);
 assert.equal(e.signedDecisionDate,null);
 assert.equal(e.humanConflictOfInterestAssessment,'not_completed');
 assert.equal(e.independentSecondHumanSignoff,'not_obtained');
 assert.equal(e.editorialPublicationPermission,false);
 assert.equal(e.communityVotingPermission,false);
 assert.equal(e.newPortraitRightsPermission,false);
 assert.equal(c.ratingReadiness.publicationApproval,'withheld');
 assert.equal(c.sourceAccessCheck.fullOriginalReviewed,false);
 assert.equal(c.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert(!c.review,'No real score review present');
}
assert.equal(references,89);
assert.equal(policyDockets,2,'Policy/research proposals remain not applicable to incident scoring');
const familyExpected=[...originalFamily.entries()].filter(([,set])=>set.size>1);
assert.equal(familyExpected.length,3);
assert.equal(m29.sourceGraph.sharedResearchFamilies.length,3);
for(const group of m29.sourceGraph.sharedResearchFamilies){
 const members=originalFamily.get(group.familyId);
 assert(members&&members.size>1,'No invented shared-study connections');
 assert.deepEqual(group.claimIds.slice().sort(),[...members].sort());
 assert.match(group.meaning,/not independent/i);
}
const over=[...originalItems.entries()].filter(([,set])=>set.size>1);
assert.equal(over.length,14);
assert.equal(m29.sourceGraph.repeatedPublicReferenceUrls.length,over.length);
for(const [url,set] of over){
 const entry=m29.sourceGraph.repeatedPublicReferenceUrls.find(x=>x.url===url);
 assert(entry);
 assert.deepEqual(entry.claimIds.slice().sort(),[...set].sort());
 assert.match(entry.meaning,/not an additional independent source/i);
}
const canon=m29.sourceGraph.sharedResearchFamilies.find(x=>x.familyId==='council-bluffs-1977-one-paper-100788');
assert(canon&&canon.claimIds.length===2);
assert(canon.claimIds.some(x=>x.startsWith('nolan-')));
assert(canon.claimIds.some(x=>x.startsWith('vallee-')));
const frag=m29.dockets.find(x=>x.personId==='david-fravor');
assert(frag.sameUrlReferenceReuses.some(x=>x.id==='fravor-house-transcript'));
assert(m29.dockets.some(x=>x.personId==='leslie-kean'&&x.linkedClaimsSameResearchFamily.length===1));
assert.match(js,/function m29EditorialHandoffHtml\(claim\)/);
assert.match(js,/m29EditorialHandoffHtml\(claim\)\+/);
assert.match(js,/parseM29EditorialQueue\(reviewQueue,people\)/);
assert.match(js,/editorialPublicationPermission!==false/);
assert.match(js,/no score|no approval|NOT an editorial verdict/i);
assert.match(html,/m29=review-handoff/);
assert.match(html,/claim-m29-docket\{margin/);
assert.match(builder,/'who-editorial-handoff-m29\.json'/);
console.log('M29 source contract PASS: 23/23 unsigned handoff dockets, 89 original references / 59 URLs, 14 shared URLs, 3 related research families, 2 policy Not Applicable, proposed 25/30/25/10/10 framework with zero approved scores or votes; NO DEPLOY.');
