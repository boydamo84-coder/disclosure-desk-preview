'use strict';
// M31 NON-DEPLOY contract: attribution/source classification != claim verification.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'data/who-m31-house-source-comparison.json'),'utf8'));
const handoff=JSON.parse(fs.readFileSync(path.join(root,'data/who-editorial-handoff-m29.json'),'utf8'));
const people=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8')).people;
const memo=fs.readFileSync(path.join(root,'docs/WHO_M31_PRIMARY_HEARING_COMPARISON_2026-11-16.md'),'utf8');
const expected=[
 ['david-fravor','fravor-2023-house-2004-encounter',3],
 ['ryan-graves','graves-2023-house-aviation-safety',5],
 ['david-grusch','grusch-2023-house-claims-briefing',3],
 ['tim-gallaudet','gallaudet-2024-navy-safety-email',7],
 ['luis-elizondo','elizondo-2024-advanced-uap-claims',3],
 ['michael-shellenberger','shellenberger-2024-immaculate-constellation',212],
 ['mike-gold','gold-2024-nasa-uap-research-proposals',5]
];
assert.equal(source.schemaVersion,1);
assert.equal(source.status,'source_research_only_no_editorial_approval');
assert.equal(source.records.length,7);
assert.equal(source.recordCount,7);
assert.equal(new Set(source.records.map(x=>x.claimId)).size,7);
assert.equal(source.hearingIndexes.length,2);
assert.deepEqual(source.hearingIndexes.map(x=>x.eventId),[116282,117721]);
assert.equal(source.addenda.length,2);
assert.equal(people.length,50);
assert.equal(handoff.dockets.length,23);
assert.equal(people.filter(x=>x.evidenceScope).length,27);
assert.equal(handoff.dockets.reduce((n,x)=>n+x.bibliography.length,0),89);
const docketById=new Map(handoff.dockets.map(d=>[d.claimId,d]));
for(const [personId,claimId,pages] of expected){
 const c=source.records.find(x=>x.personId===personId);
 assert(c, 'Missing attribution for '+personId);
 assert.equal(c.claimId,claimId);
 assert.equal(c.writtenPages,pages);
 assert.equal(c.oralTranscriptUrl,source.hearingIndexes.find(e=>e.eventId===(pages===3&&personId==='david-fravor'||personId==='ryan-graves'||personId==='david-grusch'?116282:117721)).transcript);
 assert(c.writtenUrl.startsWith('https://docs.house.gov/meetings/GO/'));
 assert(c.writtenUrl.endsWith('.pdf'));
 assert(/^[0-9]+[–-][0-9]+$/.test(c.oralLines));
 assert(c.writtenLocators.length>=2);
 assert(c.observationClass.length>30);
 assert(c.comparison.length>100);
 assert(c.missingUnderlying.length>50);
 assert(c.opposingEvidenceScope.length>70);
 assert.equal(c.reviewStatus,'source_excerpt_comparison_only_unapproved');
 assert.equal(c.fullWrittenVisualAudit,false);
 assert.equal(c.fullOralTranscriptReviewed,false);
 assert.equal(c.fullUnderlyingClaimVerification,false);
 assert.equal(c.secondHumanReview,false);
 assert.equal(c.editorialScore,null);
 assert.equal(c.communityVotingEnabled,false);
 assert.equal(c.personBelievabilityMetric,null);
 const original=docketById.get(claimId);
 assert(original,'Record must correspond to M29 existing docket');
 assert.equal(original.personId,c.personId);
 assert.equal(original.fullOriginalInspected,false);
 assert.equal(original.reviewerHandoff.independentSecondHumanSignoff,'not_obtained');
 assert.equal(original.reviewerHandoff.editorialPublicationPermission,false);
 assert.equal(original.reviewerHandoff.communityVotingPermission,false);
 assert.equal(people.find(p=>p.id===personId).claimEvidence[0].ratingReadiness.publicationApproval,'withheld');
}
const fravor=source.records.find(x=>x.personId==='david-fravor');
assert(fravor.observationClass.includes('other_aircrew_video'));
const graves=source.records.find(x=>x.personId==='ryan-graves');
assert(graves.observationClass.includes('secondhand_near_miss'));
const grusch=source.records.find(x=>x.personId==='david-grusch');
assert(grusch.observationClass.includes('secondhand'));
const gold=source.records.find(x=>x.personId==='mike-gold');
assert(gold.observationClass.includes('not_incident_claim'));
assert.equal(docketById.get(gold.claimId).suitability,'not_applicable_to_incident_evidence_score');
const shell=source.records.find(x=>x.personId==='michael-shellenberger');
assert.equal(shell.writtenPages,212);
assert(shell.writtenMaterialReadScope.includes('selected_'));
assert(shell.comparison.includes('not a full appendix audit'));
const elizondo=source.addenda.find(x=>x.repositoryAttachmentOwner==='luis-elizondo');
assert(elizondo);
assert.equal(elizondo.actualNamedAuthor,'Matthew Ford');
assert.equal(elizondo.actualDocumentDate,'2024-11-18');
assert.equal(elizondo.repositoryUploadDate,'2024-11-20');
assert(elizondo.relationship.includes('third_party_'));
assert(!elizondo.actualNamedAuthor.toLowerCase().includes('elizondo'));
const gallaudet=source.addenda.find(x=>x.repositoryAttachmentOwner==='tim-gallaudet');
assert(gallaudet);
assert.match(gallaudet.documentTitle,/UAP Disclosure Fund Expert Letter/);
assert(gallaudet.relationship.includes('external_advocacy_letter'));
assert(source.independentCounterevidence.length===2);
const goFast=source.independentCounterevidence.find(x=>x.id==='aaro-2025-gofast-performance');
assert(goFast);
assert.equal(goFast.publicationDate,'2025-02-06');
assert(goFast.scope.includes('5–92 mph'));
assert(goFast.scope.includes('unidentified'));
assert(goFast.claimIds.includes('gallaudet-2024-navy-safety-email'));
assert(!goFast.claimIds.includes('fravor-2023-house-2004-encounter'));
const historic=source.independentCounterevidence.find(x=>x.id==='aaro-2024-historical-review');
assert(historic);
assert.equal(historic.publicationDate,'2024-03-08');
assert(historic.scope.includes('predates'));
assert(historic.claimIds.includes('shellenberger-2024-immaculate-constellation'));
for(const v of Object.values(source.policy))assert.equal(v,true);
for(const word of ['Matthew Ford','UAP Disclosure Fund','Go Fast','not a full','not score','not a verdict','212']) {
 assert(memo.toLowerCase().includes(word.toLowerCase()),'Missing M31 limitation: '+word);
}
assert(!Object.prototype.hasOwnProperty.call(source,'approvedScores'));
console.log('M31 PASS: 7 attributed House witness originals + 2 correctly named third-party addenda, oral comparisons, AARO scope/chronology, no score/vote/portrait/human signoff or production change.');
