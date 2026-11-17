'use strict';
// M50: every claim-specific reader explanation provides inspectable sources,
// while approval, voting, and personal-believability gates remain closed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const directory = JSON.parse(read('data/public-people-directory.json'));
const people = directory.people;
const claims = people.flatMap(p => (p.claimEvidence || []).map(c => ({person:p,claim:c})));
const ui = read('assets/people-directory.js');
const build = read('scripts/build_public_release.cjs');

assert.equal(people.length, 50, 'Fifty Who profiles must stay intact');
assert.equal(people.filter(p => p.evidenceScope).length, 27, 'Twenty-seven role-only profiles must stay intact');
assert.equal(claims.length, 23, 'Twenty-three claim dossiers must stay intact');
assert.equal(new Set(people.map(p => p.id)).size, 50);

let linkCount=0;
const allDomains = new Set();
for (const {person,claim} of claims) {
 const s=claim.evidenceReviewSummary;
 assert(s && typeof s.finding==='string' && s.finding.length>=50, person.id+' missing finding');
 assert(typeof s.remaining==='string' && s.remaining.length>=45, person.id+' missing remaining evidence');
 assert(Array.isArray(s.links) && s.links.length>=1, person.id+' missing directly linked evidence');
 assert.equal(new Set(s.links.map(x=>x.url)).size,s.links.length,person.id+' duplicate source');
 for (const link of s.links) {
  assert(typeof link.title==='string' && link.title.trim().length>=18,person.id+' poor title');
  assert(typeof link.url==='string' && /^https:\/\/[^\s]+$/i.test(link.url),person.id+' unsafe link');
  allDomains.add(new URL(link.url).hostname);
  linkCount++;
 }
 assert.equal(claim.status,'source_review_pending',person.id+' claim wrongly approved');
 assert.equal(claim.ratingReadiness.publicationApproval,'withheld',person.id+' rating wrongly approved');
 assert.equal(claim.ratingReadiness.secondEditor,'not_assigned',person.id+' second editor falsely signed');
 assert.equal(claim.sourceAudit.reviewerSignoff,'not_obtained',person.id+' source signoff falsely obtained');
 assert.equal(claim.researchEvidence.status,'research_draft',person.id+' research wrongly finalized');
}
assert.equal(linkCount,83,'M50 must retain all 83 transparent evidence links');
const eight=['mick-west','steven-greer','christopher-mellon','james-fox','mike-gold','tim-gallaudet','michael-shellenberger','leslie-kean'];
for(const id of eight){
 const c=claims.find(x=>x.person.id===id)?.claim;
 assert(c && c.evidenceReviewSummary.links.length>=2,'Missing M50 additions for '+id);
}
assert(ui.includes('function evidenceReviewSummaryHtml(summary)'), 'Evidence summary renderer absent');
assert(ui.includes('evidenceReviewSummaryHtml(claim.evidenceReviewSummary)'), 'Summary not used in expandable evidence');
assert(ui.includes('rel="noopener noreferrer"'), 'External-link hardening absent');
assert(ui.includes('View original evidence sources (review pending)'), 'Source-only pending label absent');
assert(!build.includes("'WHO_M50_COMPLETE_SUMMARY_LINKS_2026-11-17.md'"),'Internal research note entered public build');
console.log('M50 PASS: 50 profiles, 23 of 23 linked claim summaries, 83 source links across '+allDomains.size+' hosts; no claim score/vote approval or independent editor signoff; source links displayed only in existing evidence reader.');
