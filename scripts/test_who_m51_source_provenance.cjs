'use strict';
// M51: access and provenance guard; source hosting DOES NOT validate an underlying claim.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const directory=JSON.parse(read('data/public-people-directory.json'));
const ui=read('assets/people-directory.js'),html=read('who-is-who.html');
const build=read('scripts/build_public_release.cjs');
const claims=directory.people.flatMap(p=>(p.claimEvidence||[]).map(c=>({person:p,claim:c})));
const groups=['agency_hosted','publisher_page','independent_archive','research_publication','video_platform'];
assert.equal(directory.people.length,50);
assert.equal(directory.people.filter(p=>p.evidenceScope).length,27);
assert.equal(claims.length,23);
let count=0;const byKind=Object.fromEntries(groups.map(g=>[g,0]));
for(const {person,claim} of claims){
 assert.equal(claim.status,'source_review_pending');
 assert.equal(claim.ratingReadiness.publicationApproval,'withheld');
 assert.equal(claim.ratingReadiness.secondEditor,'not_assigned');
 assert.equal(claim.sourceAudit.reviewerSignoff,'not_obtained');
 assert.equal(claim.researchEvidence.status,'research_draft');
 const links=claim.evidenceReviewSummary?.links;
 assert(Array.isArray(links)&&links.length>0,person.id+' has no links');
 assert.equal(new Set(links.map(x=>x.url)).size,links.length,person.id+' duplicate URLs');
 for(const l of links){
  assert(groups.includes(l.hostKind),person.id+' missing controlled hosting category');
  assert(l.title.trim().length>=18,person.id+' missing source title');
  assert(/^https:\/\/[^\s]+$/i.test(l.url),person.id+' unsafe URL');
  assert.equal(new URL(l.url).protocol,'https:');
  if(l.accessNote!==undefined){
   assert(typeof l.accessNote==='string'&&l.accessNote.trim().length>30&&l.accessNote.length<320,
     person.id+' malformed access limitation');
  }
  byKind[l.hostKind]++;count++;
 }
}
assert.equal(count,84,'84 links = M50 original 83 plus one clearly attributed alternative-host copy');
assert.deepEqual(byKind,{agency_hosted:33,publisher_page:21,independent_archive:15,research_publication:7,video_platform:8});
const get=id=>claims.find(x=>x.person.id===id)?.claim.evidenceReviewSummary.links;
const greer=get('steven-greer');
assert(greer.some(x=>x.url==='https://disclosureprojectarchive.net/items/show/6'&&x.hostKind==='independent_archive'&&x.accessNote.includes('Canonical')));
assert(!greer.some(x=>x.url.includes('www.disclosureprojectarchive.net/items/show/6')));
const gallaudet=get('tim-gallaudet');
assert(gallaudet.some(x=>x.url.startsWith('https://www.aaro.mil/')&&x.hostKind==='agency_hosted'&&x.accessNote.includes('403')));
assert(gallaudet.some(x=>x.url.includes('theblackvault.com/documentarchive/wp-content/uploads/2025/02/AARO_GoFast_')&&x.hostKind==='independent_archive'&&x.accessNote.includes('byte-for-byte')));
const fox=get('james-fox');
assert.equal(fox.filter(x=>x.url.includes('arquimedes.stm.jus.br')&&x.accessNote.includes('access may be restricted')).length,2);
assert(ui.includes('function evidenceReviewSummaryHtml(summary)'));
assert(ui.includes('Agency-hosted page or filing'));
assert(ui.includes('Archival or third-party host'));
assert(ui.includes('Video platform'));
assert(ui.includes('Source labels identify the hosting location, not proof'));
assert(ui.includes("esc(link.accessNote)"),'Access notes must be escaped in reader HTML');
assert(ui.includes("esc(hostKinds[link.hostKind]||'External source')"),'Source host labels must be escaped');
assert(ui.includes('target="_blank" rel="noopener noreferrer"'));
assert(html.includes('overflow-wrap:anywhere'));
assert(!build.includes("'WHO_M51_SOURCE_PROVENANCE_AUDIT_2026-11-17.md'"));
console.log('M51 PASS: 50/23/27 source directory, 84 source links with five accurate hosting-location labels, Greer canonical link, original plus clearly labelled AARO copy, STM access limitations; rating and voting gates intact.');
