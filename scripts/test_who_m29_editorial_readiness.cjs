'use strict';
// M29: evidence-editorial process is public read-only metadata, never approval.
// This is a source-independence graph, NOT a numerical person-credibility rating.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const who=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const m=JSON.parse(fs.readFileSync(path.join(root,'data/public-who-editorial-readiness-m29.json'),'utf8'));
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const builder=fs.readFileSync(path.join(root,'scripts/build_public_release.cjs'),'utf8');
const packageTest=fs.readFileSync(path.join(root,'scripts/test_who_public_package_boundary.cjs'),'utf8');
assert.equal(who.people.length,50);
const people=who.people.filter(p=>p.claimEvidence?.length);
const claims=people.map(p=>({p,c:p.claimEvidence[0]}));
assert.equal(claims.length,23);
assert.equal(who.people.filter(p=>p.evidenceScope).length,27);
assert.equal(who.people.reduce((s,p)=>s+(p.claimEvidence||[]).reduce((v,c)=>v+(c.researchEvidence?.items?.length||0),0),0),89);
assert.equal(m.version,1);
assert.equal(m.milestone,'M29');
assert.equal(m.checkedAt,'2026-11-16');
assert.equal(m.state,'public_read_only_editorial_handoff_not_approved');
assert.equal(m.rubric.status,'unweighted_editorial_readiness_checklist_not_a_scoring_formula');
assert.equal(m.rubric.numericWeightsApproved,false);
assert.equal(m.rubric.independentHumanDecisionRequired,true);
const criteria=['claim_scope','original_record','source_independence','competing_records',
'measurement_or_documentary_test','human_editorial_review','publication_safety'];
assert.deepEqual(m.rubric.dimensions.map(x=>x.key),criteria);
for(const x of m.rubric.dimensions){
 assert(x.label.length>=16&&x.required.length>=65);
 assert(!('points' in x)&&!('weight' in x)&&!('score' in x),'No unapproved scoring formula');
}
assert.deepEqual(m.publicationGates,{
 allClaimRatingsWithheld:true,allCommunityVotingWithheld:true,
 allPortraitRightsUnapproved:true,noAutomatedHumanSignoff:true,
 roleOnlyProfilesHaveNoIncidentPercentage:true
});
assert.equal(m.claims.length,23);
assert.equal(m.publications.length,17);
assert.equal(m.relationships.length,7);
assert.deepEqual(m.claims.map(x=>x.claimId).sort(),claims.map(x=>x.c.id).sort());
assert.deepEqual(m.claims.map(x=>x.personId).sort(),claims.map(x=>x.p.id).sort());
const byPerson=new Map(claims.map(x=>[x.p.id,x]));
for(const row of m.claims){
 const old=byPerson.get(row.personId);assert(old,'Unknown person in readiness');
 assert.equal(row.claimId,old.c.id);
 assert.equal(row.personName,old.p.name);
 assert.equal(row.originalSourceUrl,old.c.sourceAudit.original.url);
 assert.equal(row.reportedCaseLineage,old.c.sourceAudit.relatedSourceGroup);
 assert.equal(row.incidentScorePath,old.c.ratingReadiness.scorePath);
 assert.equal(row.claimCategory,old.c.ratingReadiness.claimType);
 assert.equal(row.sourceAccessStatus,old.c.sourceAccessCheck.status);
 assert.equal(row.nextHumanSourceCheck,old.c.ratingReadiness.requiredNextCheck);
 assert.equal(row.researchScope,'published_original_or_access_limited_first_pass_only');
 assert.deepEqual(row.rubricStatuses,Object.fromEntries(criteria.map((k,i)=>[k,i===0?'first_pass_only':'not_signed_off'])));
 assert.equal(row.assignment,'unassigned');
 assert.equal(row.secondHumanEditorSignoff,'not_obtained');
 assert.equal(row.publicationApproval,false);
 assert.equal(row.editorialScoreEnabled,false);
 assert.equal(row.communityVoteEnabled,false);
 assert.equal(row.portraitPermission,false);
 for(const k of ['reviewerName','reviewerEmail','reviewerId','approvalDate','score','points','voteCount']){
  assert(!(k in row),'No fake reviewer identity, rate or approval: '+k);
 }
 assert.equal(old.c.ratingReadiness.publicationApproval,'withheld');
 assert.equal(old.c.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert.equal(old.c.sourceAccessCheck.fullOriginalReviewed,false);
}
const pubs=new Map();
for(const f of m.publications){
 assert(!pubs.has(f.id),'Unique source family');
 pubs.set(f.id,f);
 assert(f.url.startsWith('https://'));
 assert.equal(new Set(f.personIds).size,f.personIds.length);
 assert(f.personIds.length>=1);
}
assert(m.claims.every(x=>pubs.has(x.sourceFamilyId)));
for(const [id,f] of pubs){
 const members=m.claims.filter(x=>x.sourceFamilyId===id);
 assert.deepEqual(f.personIds.slice().sort(),members.map(x=>x.personId).sort());
 assert(members.every(x=>x.originalSourceUrl===f.url));
}
const shared=m.publications.filter(x=>x.personIds.length>1);
assert.deepEqual(shared.map(x=>[x.id,x.personIds.length]).sort((a,b)=>a[0].localeCompare(b[0])),[
 ['council-bluffs-2022-one-coauthored-paper',2],
 ['us-house-2023-published-hearing',3],
 ['us-house-2024-published-hearing',4]
]);
const expectedRelations={
 'published-house-2023':['david-grusch','ryan-graves','david-fravor'],
 'published-house-2024':['tim-gallaudet','luis-elizondo','michael-shellenberger','mike-gold'],
 'nolan-vallee-same-paper':['garry-nolan','jacques-vallee'],
 'grusch-coverage-shared-sources':['david-grusch','ross-coulthart','leslie-kean'],
 'lazar-knapp-reporter-lineage':['bob-lazar','george-knapp'],
 'rendlesham-shared-event':['larry-warren','nick-pope'],
 'nimitz-model-and-sighting':['david-fravor','kevin-knuth']
};
assert.deepEqual(m.relationships.map(x=>x.id).sort(),Object.keys(expectedRelations).sort());
for(const rel of m.relationships){
 assert.deepEqual(rel.personIds.slice().sort(),expectedRelations[rel.id].slice().sort());
 assert(rel.description.length>=110&&rel.nextCheck.length>=95);
 assert.match(rel.description,/not |do not|cannot|ONE|not necessarily|rather than/i);
 assert.equal(new Set(rel.personIds).size,rel.personIds.length);
}
const n=m.claims.find(x=>x.personId==='garry-nolan'),v=m.claims.find(x=>x.personId==='jacques-vallee');
assert.equal(n.sourceFamilyId,v.sourceFamilyId);
assert.equal(n.originalSourceUrl,v.originalSourceUrl);
assert.equal(n.sourceFamilyId,'council-bluffs-2022-one-coauthored-paper');
const mellon=m.claims.find(x=>x.personId==='christopher-mellon'),gold=m.claims.find(x=>x.personId==='mike-gold');
for(const p of [mellon,gold])assert.equal(p.incidentScorePath,'not_applicable_to_incident_score');
for(const k of ['parseM29Readiness','m29EditorialReadinessHtml']){
 assert(js.includes('function '+k+'('),'Real UI parser and renderer present: '+k);
}
assert.match(js,/m29EditorialReadinessHtml\(person,claim\)\+/);
assert.match(js,/editorialM29=parseM29Readiness\(readiness,people\)/);
assert.match(js,/publicationApproval!==false/);
assert.match(js,/communityVoteEnabled!==false/);
assert.match(js,/secondHumanEditorSignoff!=='not_obtained'/);
assert.match(js,/m29=editorial-checklist|M29 ledger rejected/);
assert.match(html,/m29=editorial-checklist/);
assert.match(html,/claim-m29-readiness\{margin/);
assert(builder.includes("'public-who-editorial-readiness-m29.json'"));
assert(packageTest.includes("data/public-who-editorial-readiness-m29.json"));
console.log('M29 source/graph test PASS: 23/23 unsigned claims, 17 genuine publication URLs, 7 evidence-family links, 7 unweighted review dimensions, 27 role-only exclusions, no ratings/voting/portraits, NO DEPLOY.');
