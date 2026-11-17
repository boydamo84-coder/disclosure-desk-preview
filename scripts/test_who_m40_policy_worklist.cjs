'use strict';
// M40: triage ORIGINAL SOURCE NEEDS, not people, conclusions or a numerical believability score.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d=JSON.parse(read('data/who-m40-policy-source-worklist.json'));
const prior=JSON.parse(read('data/who-editorial-handoff-m29.json'));
const directory=JSON.parse(read('data/public-people-directory.json'));
const html=read('who-is-who.html');
const builder=read('scripts/build_public_release.cjs');
assert.equal(d.schemaVersion,1);
assert.equal(d.edition,'m40-policy-and-source-review-worklist');
assert.equal(d.state,'internal_research_triage_only_no_claim_scoring_or_human_signoff_no_deploy');
assert.equal(d.sourceRegister,'data/who-editorial-handoff-m29.json');
assert.equal(d.checkedAt,'2026-11-17');
assert.equal(d.totalDossiers,23);
assert.equal(prior.dockets.length,23);
assert.equal(directory.people.length,50);
assert.equal(directory.people.filter(p=>p.evidenceScope).length,27);
assert.equal(d.worklist.length,23);
assert.deepEqual(d.lanes,{
 policy_and_records_review:2,
 original_source_access_blocked:5,
 partial_original_audit:2,
 independent_correspondence_needed:14
});
assert.equal(new Set(d.worklist.map(w=>w.claimId)).size,23);
const lanes=Object.fromEntries(Object.keys(d.lanes).map(k=>[k,0]));
for(const [i,w] of d.worklist.entries()){
 const old=prior.dockets[i];
 assert.equal(w.personId,old.personId);
 assert.equal(w.claimId,old.claimId);
 assert.equal(w.claimType,old.claimType);
 assert.equal(w.originalSourceUrl,old.originalSourceUrl);
 assert.equal(w.originalSourceAccess,old.primarySourceAccessStatus);
 assert.equal(w.sourceLineageFamily,old.sourceLineageGroup);
 assert.deepEqual(w.reusedFamilyClaims,old.linkedClaimsSameResearchFamily);
 assert(w.unresolvedMethod.length>100);
 assert(Object.hasOwn(lanes,w.reviewLane));lanes[w.reviewLane]++;
 assert.equal(w.notApplicableToIncidentScore,w.reviewLane==='policy_and_records_review');
 assert.equal(w.originalFullyInspected,false);
 assert.equal(w.independentSecondHumanSignoff,'not_obtained');
 assert.equal(w.editorialPublicationPermission,false);
 assert.equal(w.communityVotingPermission,false);
 assert.equal(w.noNumericalScoreGenerated,true);
 assert.equal(w.sourceStatusOnlyNotAnAssessmentOfPerson,true);
 assert.equal(old.reviewerHandoff.independentSecondHumanSignoff,'not_obtained');
 assert.equal(old.reviewerHandoff.editorialPublicationPermission,false);
 assert.equal(old.reviewerHandoff.communityVotingPermission,false);
}
assert.deepEqual(lanes,d.lanes);
assert.equal(d.policyCases.length,2);
const policy=new Map(d.policyCases.map(p=>[p.claimId,p]));
assert.equal(policy.size,2);
const gold=policy.get('gold-2024-nasa-uap-research-proposals');
const mellon=policy.get('mellon-2025-uap-records-overclassification-assertion');
assert(gold&&mellon);
for(const p of d.policyCases){
 const w=d.worklist.find(w=>w.claimId===p.claimId);
 assert(w&&w.notApplicableToIncidentScore&&w.reviewLane==='policy_and_records_review');
 assert.equal(p.suitability,'policy_only_not_applicable_to_event_evidence_score');
 assert.equal(p.incidentScore,null);assert.equal(p.personBelievabilityScore,null);
 assert.equal(p.policyApproval,'withheld');
 assert(p.unverified.length>=3&&p.editorialNextAction.length>100);
 assert(p.originalSource.url.startsWith('https://'));
}
assert.equal(gold.personId,'mike-gold');
assert.equal(gold.originalSource.url,'https://oversight.house.gov/wp-content/uploads/2024/11/Written-Testimony-Gold.pdf');
assert.deepEqual(gold.originalSource.visuallyCheckedPdfPagesZeroBased,[0,2,3]);
assert(gold.originalSource.verifiedStatements.includes('speaking_on_own_behalf_not_NASA_or_Redwire'));
assert(gold.originalSource.verifiedStatements.includes('search_NASA_archived_imagery_with_AI_or_ML'));
assert(gold.originalSource.verifiedStatements.includes('develop_dedicated_measurement_instruments_if_resources_allow'));
assert(gold.hearing.url.includes('govinfo.gov'));
assert(gold.hearing.limitation.includes('not independent')||gold.hearing.limitation.includes('NOT independent'));
assert.equal(mellon.personId,'christopher-mellon');
assert.equal(mellon.originalSource.date,'2025-10-14');
assert(mellon.originalSource.url.includes('christopherkmellon.substack.com'));
assert(mellon.sourceIndependentAgencyFacts.some(x=>x.url==='https://www.archives.gov/research/topics/uaps/rg-615'));
assert(mellon.sourceIndependentAgencyFacts.some(x=>x.url==='https://www.archives.gov/records-mgmt/memos/ac-04-2025'));
assert(mellon.sourceIndependentAgencyFacts.some(x=>x.url==='https://www.archives.gov/press/press-releases/2025/nr25-07'));
assert(mellon.interpretation.includes('does')||mellon.interpretation.includes('neither'));
assert(Object.values(d.safety).every(Boolean));
assert(html.includes('id="ddPolicyReviewGuide"'));
assert(html.includes('id="ddPolicyGold"'));
assert(html.includes('id="ddPolicyMellon"'));
assert(html.includes('/who-is-who?person=mike-gold'));
assert(html.includes('/who-is-who?person=christopher-mellon'));
assert(html.includes('not</strong> be graded as proof'));
assert(html.includes('no member voting'));
assert(html.includes('target="_blank"')&&html.includes('rel="noopener noreferrer"'));
assert(!builder.includes("'who-m40-policy-source-worklist.json'"));
assert(!builder.includes("'WHO_M40_POLICY_RECORDS_SOURCE_TRIAGE_2026-11-17.md'"));
assert(prior.dockets.every(x=>x.reviewerHandoff.independentSecondHumanSignoff==='not_obtained'));
assert(directory.people.flatMap(p=>p.claimEvidence||[]).every(c=>c.ratingReadiness.publicationApproval==='withheld'));
console.log('M40 PASS: all 23 dossier source-work lanes 2/5/2/14, Gold/Mellon firsthand policy scopes, no incident/person scores, no votes, no human signoffs, 50 profiles and premium Who guide staged only.');
