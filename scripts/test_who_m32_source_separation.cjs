'use strict';
// M32 source-lineage test. These assertions prevent provenance conflation.
// A successful test does NOT authenticate UAP claims or create human approval.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const m32=read('data/who-m32-immaculate-source-lineage.json');
const m31=read('data/who-m31-house-source-comparison.json');
const m29=read('data/who-editorial-handoff-m29.json');
const directory=read('data/public-people-directory.json');
const doc=fs.readFileSync(path.join(root,'docs/WHO_M32_IMMACULATE_SOURCE_LINEAGE_2026-11-16.md'),'utf8');
assert.equal(m32.schemaVersion,1);
assert.equal(m32.status,'research_only_no_claim_verification_or_editorial_signoff');
assert.equal(m32.primaryClaimId,'shellenberger-2024-immaculate-constellation');
assert.equal(directory.people.length,50);
assert.equal(directory.people.filter(p=>p.evidenceScope).length,27);
assert.equal(m29.dockets.length,23);
assert.equal(m31.records.length,7);
assert.equal(m29.dockets.reduce((n,d)=>n+d.bibliography.length,0),89);
assert.equal(m29.sourceGraph.repeatedPublicReferenceUrls.length,14);
assert.equal(m32.sources.length,5);
assert.equal(m32.components.length,3);
assert.equal(m32.comparisons.length,4);
assert.equal(new Set(m32.sources.map(s=>s.id)).size,5);
assert.equal(new Set(m32.sources.map(s=>s.url)).size,5,'Distinct original public URLs');
const byId=new Map(m32.sources.map(s=>[s.id,s]));
const expectedIds=['house-2024-event-index','shellenberger-212-page-submission',
'mace-12-page-unnamed-report','gpo-2024-hearing-transcript','odni-foia-2024-press-summary'];
for(const id of expectedIds)assert(byId.has(id),'Missing named source '+id);
for(const s of m32.sources){
 const u=new URL(s.url);
 assert.equal(u.protocol,'https:');
 assert(['docs.house.gov','www.govinfo.gov','archive.dni.gov'].includes(u.hostname),
 'Original government source only');
 assert(s.sourceRole.length>30,'Careful source relationship text required');
 if(s.pageCount!==null) assert.equal(typeof s.fullVisualAudit,'boolean','PDF image audit flag mandatory');
 else assert(s.fullVisualAudit===false||s.fullVisualAudit===undefined,'HTML record cannot claim a completed PDF visual audit');
}
assert.equal(byId.get('shellenberger-212-page-submission').pageCount,212);
assert.equal(byId.get('mace-12-page-unnamed-report').pageCount,12);
assert.equal(byId.get('odni-foia-2024-press-summary').pageCount,1);
assert(byId.get('mace-12-page-unnamed-report').url.endsWith('HHRG-118-GO12-20241113-SD003.pdf'));
assert.equal(byId.get('shellenberger-212-page-submission').fullVisualAudit,false);
assert.equal(byId.get('mace-12-page-unnamed-report').fullVisualAudit,false);
assert.equal(byId.get('odni-foia-2024-press-summary').fullVisualAudit,true);
const zones=new Map(m32.components.map(x=>[x.id,x]));
assert.deepEqual(zones.get('testimony-prose-and-endnotes').pdfPagesZeroBased,[0,17]);
assert.deepEqual(zones.get('navy-foia-correspondence-and-uaptf-slides').pdfPagesZeroBased,[18,34]);
assert.deepEqual(zones.get('uap-timeline-appendix').pdfPagesZeroBased,[35,211]);
let next=0;
for(const part of m32.components){
 const [start,end]=part.pdfPagesZeroBased;
 assert.equal(start,next,'Zones must not overlap or leave gaps');
 assert(start<=end&&end<212);
 next=end+1;
 assert.equal(part.parentSourceId,'shellenberger-212-page-submission');
 assert(part.limitation.length>80);
 assert.notEqual(part.status,'independent_case_verification');
}
assert.equal(next,212,'Source navigation zones cover PDF, not full visual audit');
const navy=zones.get('navy-foia-correspondence-and-uaptf-slides');
assert(navy.status.includes('not_immaculate_programme_records'));
const timeline=zones.get('uap-timeline-appendix');
assert(timeline.status.includes('not_an_independent_primary_source'));
assert(timeline.limitation.includes('MJ-12'));
assert(timeline.limitation.includes('PUBLIC DOMAIN'));
const gpo=byId.get('gpo-2024-hearing-transcript');
assert(gpo.reviewedTranscriptLineRanges.includes('1698-1737'));
assert(gpo.observed.includes('did not author'));
assert.equal(gpo.fullOralProceedingAudit,false);
const odni=byId.get('odni-foia-2024-press-summary');
assert(odni.observed.includes('6 November 2024'));
assert(odni.observed.includes('Sue Gough'));
assert(odni.sourceRole.includes('not_an_independent_programme_investigation'));
const pair=m32.comparisons.find(x=>x.id==='two-house-documents-distinct');
assert.deepEqual([pair.left,pair.right],['shellenberger-212-page-submission','mace-12-page-unnamed-report']);
const authorship=m32.comparisons.find(x=>x.id==='gpo-speaker-authorship');
assert(authorship.relation.includes('distanced_self_from_authorship'));
const denial=m32.comparisons.find(x=>x.id==='odni-contemporaneous-denial');
assert(denial.relation.includes('not_external_adjudication'));
assert(m32.comparisons.every(x=>x.underlyingIndependentEvidence===false));
assert(m32.unresolvedQuestions.length>=6);
assert(m32.unresolvedQuestions.some(x=>x.includes('redacted')));
assert(Object.values(m32.guardrails).every(x=>x===true),'All negative-authorization flags mandatory');
const orig=m29.dockets.find(x=>x.claimId===m32.primaryClaimId);
assert(orig&&orig.fullOriginalInspected===false);
assert.equal(orig.reviewerHandoff.independentSecondHumanSignoff,'not_obtained');
assert.equal(orig.reviewerHandoff.editorialPublicationPermission,false);
assert.equal(orig.reviewerHandoff.communityVotingPermission,false);
assert.equal(directory.people.find(x=>x.id===orig.personId).claimEvidence[0].ratingReadiness.publicationApproval,'withheld');
const normalizedDoc=doc.replace(/\\*/g,'').toLowerCase();
for(const phrase of ['212-page','12-page','ODNI','Sue Gough',
 'not a verdict','not a public rating','source', 'not a 212-page continuous',
 'not authentication','no Supabase','not a whole-file visual audit']){
 assert(normalizedDoc.includes(phrase.toLowerCase()),
 'Missing methodological guard: '+phrase);
}
assert(!('score' in m32) && !('rating' in m32) && !('votes' in m32));
console.log('M32 PASS: 5 government provenance nodes, 212/12/1-page source separation, 3 appendix zones, 4 no-corrob relationships, ODNI denial, 23/7 inherited unsigned records; NO RATINGS/VOTES/DEPLOY.');
