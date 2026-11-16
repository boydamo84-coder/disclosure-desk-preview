'use strict';
// M27 offline release gate: structured research completeness and publication veto.
// Checks repository/public reader data only. No web requests, account tokens,
// Supabase calls, scores, moderation writes, or production deployment.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const data = JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const reader = fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const page = fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const people = data.people;
assert.equal(people.length,50,'All 50 published directory entries must remain');
assert.equal(new Set(people.map(p=>p.id)).size,50,'Each profile needs a unique stable ID');
const claimPeople = people.filter(p=>Array.isArray(p.claimEvidence)&&p.claimEvidence.length);
const rolePeople = people.filter(p=>p.evidenceScope);
assert.equal(claimPeople.length,23,'All 23 provisional claim/recommendation reviews remain');
assert.equal(rolePeople.length,27,'All 27 non-claim profiles retain a source-backed non-score decision');
assert.equal(new Set([...claimPeople,...rolePeople].map(p=>p.id)).size,50,
 'Every directory profile must be classified without inventing a personal score');

let researchItemCount=0;
const itemIds=new Set(),itemUrls=new Set(),originalContainers=new Map();
for(const p of people){
 assert(p.photoRightsAudit && p.photoRightsAudit.finalRightsApproval===false,
  'Do not invent or approve image reuse permissions: '+p.id);
 assert(!Object.hasOwn(p,'believability')&&!Object.hasOwn(p,'score')&&
  !Object.hasOwn(p,'credibilityPercent'),'No personal credibility ratings: '+p.id);
 assert(p.claimEvidence?.length||p.roleEvidence||p.publicWorkEvidence,
  'Every profile needs a visible source reader: '+p.id);
 for(const c of p.claimEvidence||[]){
  const access=c.sourceAccessCheck,ready=c.ratingReadiness,audit=c.sourceAudit;
  assert(c.id&&c.statement,'Claim must be individually identifiable: '+p.id);
  assert.equal(ready?.status,'first_pass_triage','Triaged sources are not editorial scores: '+p.id);
  assert.equal(ready?.publicationApproval,'withheld','Numerical score blocked: '+p.id);
  assert.equal(access?.fullOriginalReviewed,false,'Do not invent a full original review: '+p.id);
  assert.equal(access?.secondEditorSignoff,'not_obtained','No independent human signoff: '+p.id);
  assert.equal(c.sourceReviewApproved,true===false,
   'Community voting must not be approved for a draft: '+p.id);
  assert(c.review?.status!=='published','No published points for draft: '+p.id);
  assert(!Object.hasOwn(c,'believability')&&!Object.hasOwn(c,'editorialScore'),
   'Claim is about source evidence, not personal credibility: '+p.id);
  const original=audit?.original?.url;
  assert(typeof original==='string'&&original.startsWith('https://'),
   'Trace original claim container: '+p.id);
  if(!originalContainers.has(original))originalContainers.set(original,[]);
  originalContainers.get(original).push(p.id);
  const items=c.researchEvidence?.items;
  assert(Array.isArray(items)&&items.length>=3,'Claim needs a readable source trail: '+p.id);
  for(const item of items){
   assert(typeof item.id==='string'&&!itemIds.has(item.id),'Unique evidence item: '+item?.id);
   itemIds.add(item.id);
   const u=new URL(item.url);
   assert.equal(u.protocol,'https:','Public HTTPS source link: '+item.id);
   assert(!u.username&&!u.password,'No embedded credentials in source links: '+item.id);
   assert(typeof item.locator==='string'&&item.locator.trim().length>=8,
    'Reader needs an inspectable source locator: '+item.id);
   assert(typeof item.reviewNote==='string'&&item.reviewNote.trim().length>=30,
    'Reader needs source limitations/context: '+item.id);
   assert.equal(item.access,'public','Only public evidence records: '+item.id);
   itemUrls.add(u.href);
   researchItemCount++;
  }
 }
 if(p.evidenceScope){
  assert(!p.claimEvidence?.length,'Institutional role alone is not an event claim: '+p.id);
  assert.equal(p.evidenceScope.status,'research_scope_draft','Unsigned role scope remains draft: '+p.id);
  assert.equal(p.evidenceScope.applicability,'not_applicable_to_documented_role',
   'Do not show zero as if professional activity failed a claim: '+p.id);
  assert(p.evidenceScope.sourceChecks.length>=2,'Public role source checks: '+p.id);
 }
}
assert.equal(researchItemCount,89,'M27 source index must retain all 89 evidence items');
assert.equal(itemUrls.size,59,'The 89 records currently reference 59 distinct URLs, not 89 independent witnesses');
assert.equal(originalContainers.size,17,'23 claim drafts share 17 original publication containers');
const duplicated=[...originalContainers.values()].filter(ids=>ids.length>1).map(ids=>ids.sort().join('|')).sort();
assert.deepEqual(duplicated,[
 ['david-fravor','david-grusch','ryan-graves'].sort().join('|'),
 ['luis-elizondo','michael-shellenberger','mike-gold','tim-gallaudet'].sort().join('|'),
 ['garry-nolan','jacques-vallee'].sort().join('|')
].sort(),'Keep hearing/shared-paper provenance explicit; no double-counting as independent evidence');

// This is a safety tripwire, not a substitute for full JS/Chromium and backend tests.
assert.match(reader,/readiness\.status!=='independently_approved'/);
assert.match(reader,/readiness\.publicationApproval!=='granted'/);
assert.match(reader,/readiness\.secondEditor!=='approved'/);
assert.match(reader,/originalAccess\.fullOriginalReviewed!==true/);
assert.match(reader,/originalAccess\.secondEditorSignoff!=='approved'/);
assert.match(reader,/claim\?\.sourceReviewApproved===true/);
assert.match(reader,/claim\?\.claimKind!=='public_claim'/);
assert.match(page,/id="profileEvidenceReviews"/);
assert.match(page,/id="claimReviewMethod"/);
console.log('M27 read-only gate PASS: 50 source panels; 23 unsigned claim reviews; '+
 '27 non-score roles; 89 evidence items / 59 link URLs; 17 original publication containers; '+
 '0 approved evidence percentages, 0 community voting approvals, 0 final portrait approvals. '+
 'NO DEPLOY; second-editor and backend voting security still pending.');
