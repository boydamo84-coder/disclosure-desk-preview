'use strict';
// M30: Adversarial SOURCE-LINEAGE contract. A green test is NOT a factual claim
// verification, score, legal-rights clearance or independent human signoff.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const handoff = JSON.parse(fs.readFileSync(path.join(root,'data/who-editorial-handoff-m29.json'),'utf8'));
const directory = JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const docs = fs.readFileSync(path.join(root,'docs/WHO_M30_EDITORIAL_PROVENANCE_AND_HANDOVER_2026-11-16.md'),'utf8');
const people = directory.people;
const dossiers = handoff.dockets;
const keyed = new Map(dossiers.map(d=>[d.personId,d]));
const byClaim = new Map(dossiers.map(d=>[d.claimId,d]));
assert.equal(people.length,50);
assert.equal(dossiers.length,23);
assert.equal(keyed.size,23);
assert.equal(byClaim.size,23);
assert.equal(people.filter(p=>p.evidenceScope).length,27);
assert.equal(handoff.status,'research_handoff_readonly_no_human_approval');

// Conservative locator canonicaliser: identifies only obvious same-URL aliases.
// It DOES NOT deduce underlying witness, publication, sensor, or material identity.
function canonicalLocator(value) {
 const u=new URL(value);
 assert.equal(u.protocol,'https:','Public sources must remain HTTPS');
 u.hash='';
 u.hostname=u.hostname.toLowerCase();
 if(u.port==='443')u.port='';
 u.pathname=u.pathname.replace(/\/+$/,'') || '/';
 for(const k of [...u.searchParams.keys()]){
  if(/^utm_/i.test(k) || /^(fbclid|gclid)$/i.test(k))u.searchParams.delete(k);
 }
 u.searchParams.sort();
 return u.toString();
}
const hearing='https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm';
assert.equal(canonicalLocator(hearing),canonicalLocator(hearing+'?utm_source=example#page-11'));
assert.equal(canonicalLocator('https://example.org/a/'),canonicalLocator('https://EXAMPLE.org/a/?fbclid=tracking#note'));
assert.notEqual(canonicalLocator('https://example.org/a'),canonicalLocator('https://example.org/b'));

// Recompute observed exact-URL overlap; references are NOT evidence independence.
const exact = new Map(), normalized = new Map();
let referenceCount=0;
for(const d of dossiers) {
 const p=people.find(x=>x.id===d.personId);
 const claim=p?.claimEvidence?.find(c=>c.id===d.claimId);
 assert(claim,'Must match a known actual, attributed claim');
 assert.equal(d.claimText,claim.statement);
 assert.equal(d.originalSourceUrl,claim.sourceAudit.original.url);
 assert.equal(d.fullOriginalInspected,false);
 assert.equal(claim.sourceAccessCheck.fullOriginalReviewed,false);
 assert.equal(claim.ratingReadiness.publicationApproval,'withheld');
 assert.equal(claim.review,undefined);
 assert.equal(d.reviewerHandoff.status,'unassigned_requires_independent_human');
 assert.equal(d.reviewerHandoff.leadEditor,null);
 assert.equal(d.reviewerHandoff.independentSecondEditor,null);
 assert.equal(d.reviewerHandoff.signedDecisionDate,null);
 assert.equal(d.reviewerHandoff.independentSecondHumanSignoff,'not_obtained');
 assert.equal(d.reviewerHandoff.editorialPublicationPermission,false);
 assert.equal(d.reviewerHandoff.communityVotingPermission,false);
 assert.equal(d.reviewerHandoff.newPortraitRightsPermission,false);
 for(const state of Object.values(d.checklist)) assert.equal(state,'requires_separate_editorial_recheck');
 assert.deepEqual(d.bibliography.map(x=>x.url),claim.researchEvidence.items.map(x=>x.url));
 for(const b of d.bibliography){
  const ident=canonicalLocator(b.url);
  referenceCount++;
  if(!exact.has(b.url))exact.set(b.url,new Set());
  if(!normalized.has(ident))normalized.set(ident,new Set());
  exact.get(b.url).add(d.claimId);
  normalized.get(ident).add(d.claimId);
 }
}
assert.equal(referenceCount,89);
assert.equal(exact.size,59);
const literalReuses=[...exact].filter(([,ids])=>ids.size>1);
assert.equal(literalReuses.length,14);
assert.equal(handoff.sourceGraph.repeatedPublicReferenceUrls.length,14);
for(const [url,ids] of literalReuses){
 const actual=handoff.sourceGraph.repeatedPublicReferenceUrls.find(x=>x.url===url);
 assert(actual,'Repeated URL missing its provenance warning');
 assert.deepEqual([...ids].sort(),actual.claimIds.slice().sort());
}
assert(normalized.size<=exact.size,'Alias normalization may collapse URL references, never invent sources');

// A hearing URL does not make 3 speakers a single individual or 3 independent
// sensor datasets; both tempting inferences are prohibited.
const hearingDossiers=['david-grusch','ryan-graves','david-fravor'].map(id=>keyed.get(id));
assert(hearingDossiers.every(Boolean));
for(const d of hearingDossiers)assert(d.bibliography.some(b=>b.url===hearing));
assert.equal(new Set(hearingDossiers.map(d=>d.claimId)).size,3);
assert.equal(exact.get(hearing).size,6,'One congressional page is reused in six distinct dossiers');
assert(hearingDossiers.every(d=>d.fullOriginalInspected===false));

// A shared DOI + publisher URL + source family are one paper; not independent
// Nolan / Vallée lab replications because two individual profiles cite them.
const council=handoff.sourceGraph.sharedResearchFamilies.find(
 g=>g.familyId==='council-bluffs-1977-one-paper-100788');
assert(council);
assert.deepEqual(council.claimIds.slice().sort(),
 [keyed.get('garry-nolan').claimId,keyed.get('jacques-vallee').claimId].sort());
for(const id of council.claimIds){
 const urls=byClaim.get(id).bibliography.map(b=>b.url);
 assert(urls.some(u=>u.includes('10.1016/j.paerosci.2021.100788')));
 assert(urls.some(u=>u.includes('sciencedirect.com/science/article/pii/S0376042121000907')));
}
assert.equal(handoff.sourceGraph.sharedResearchFamilies.length,3);
const gruschFamily=handoff.sourceGraph.sharedResearchFamilies.find(g=>
 g.familyId==='grusch-coulthart-2023-recovery-reporting-not-independent');
assert(gruschFamily?.claimIds.includes(keyed.get('leslie-kean').claimId));
assert(gruschFamily?.claimIds.includes(keyed.get('ross-coulthart').claimId));
const rendlesham=handoff.sourceGraph.sharedResearchFamilies.find(g=>
 g.familyId==='rendlesham-1980-distinct-nights-halt-warren-claims');
assert(rendlesham?.claimIds.includes(keyed.get('larry-warren').claimId));
assert(rendlesham?.claimIds.includes(keyed.get('nick-pope').claimId));

// Scope/chronology: broad 2024 institutional review cannot AUTOMATICALLY refute
// a later, case-specific Jan 2025 claim. A reference's 'challenges' stance is
// a research pointer, not human approval or adjudication.
const barber=keyed.get('jake-barber');
assert(barber);
assert(barber.bibliography.some(b=>b.url.includes('3701297')));
assert.equal(barber.fullOriginalInspected,false);
const policy=['christopher-mellon','mike-gold'].map(id=>keyed.get(id));
assert(policy.every(d=>d?.suitability==='not_applicable_to_incident_evidence_score'));
assert.equal(dossiers.filter(d=>d.suitability==='not_applicable_to_incident_evidence_score').length,2);

// The proposed operations are documented without inventing an automated private
// review platform, real reviewer, publication clearance or source monitoring.
for(const phrase of ['30 days','90 days','180 days','source-change ledger',
 'second human','No live publish','Event 116282','Event 117721']) {
 assert(docs.toLowerCase().includes(phrase.toLowerCase()),'Missing operational guard '+phrase);
}
assert.equal(handoff.policy.noPersonBelievabilityRating,true);
assert.equal(handoff.policy.noClaimScorePublished,true);
assert.equal(handoff.policy.noMemberBallotsEnabled,true);
assert.equal(handoff.policy.noHumanSignoffCreatedByAutomation,true);
console.log('M30 PASS: 23 unsigned dossiers, 89 references, 59 literal URLs, 14 shared URLs; 3 protected research families, 2 unscoreable policy records, synthetic URL-alias and chronology counterexamples; NO SCORES, NO VOTES, NO DEPLOY.');
