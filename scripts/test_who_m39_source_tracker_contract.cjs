'use strict';
// M39 source verification: safe PUBLIC status evidence, not account/email/FOIA automation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const d=JSON.parse(read('data/public-source-verification.json'));
const m38=JSON.parse(read('data/who-m38-osd-151-cross-case-audit.json'));
const queue=JSON.parse(read('data/who-editorial-handoff-m29.json'));
const people=JSON.parse(read('data/public-people-directory.json'));
const html=read('sources.html'),who=read('who-is-who.html'),script=read('assets/source-verification.js');
const builder=read('scripts/build_public_release.cjs');
assert.equal(d.schemaVersion,1);
assert.equal(d.edition,'source-m40-public-outreach-register');
assert.equal(d.publicationStatus,'candidate_not_deployed');
assert.equal(d.lastUpdated,'2026-11-18');
assert(d.methodology.includes('manually')||d.methodology.includes('manual'));
assert.equal(d.records.length,5);
assert.deepEqual(d.records.map(x=>x.id),[
 'osd-151-pages','germany-gep-case-data','brazil-arquivo-nacional-sian',
 'canada-lac-reproduction-permissions','nara-mj12-revision'
]);
const titles=new Set(),links=new Set();
for(const r of d.records){
 assert(!titles.has(r.title));titles.add(r.title);
 assert(['response_received','sent_unacknowledged'].includes(r.status));
 assert(r.dateSent===null||/^\\d{4}-\\d{2}-\\d{2}$/.test(r.dateSent));
 assert(/^\\d{4}-\\d{2}-\\d{2}$/.test(r.lastVerified));
 assert(r.statusDetail.length>70&&r.evidenceRequirement.length>55&&r.question.length>65);
 assert(r.timeline.length>=1&&r.timeline.length<=12);
 assert(r.timeline.every(x=>/^\\d{4}-\\d{2}-\\d{2}$/.test(x.date)));
 assert(r.publicSources.length>=1);
 for(const src of r.publicSources){
  const url=new URL(src.url);assert.equal(url.protocol,'https:');
  assert(!url.username&&!url.password);
  assert(['official','mirror'].includes(src.hostType));
  assert(src.purpose.length>35);links.add(url.href);
 }
}
const osd=d.records.find(x=>x.id==='osd-151-pages'),nara=d.records.find(x=>x.id==='nara-mj12-revision');
assert.equal(osd.originalCase,'DON-NAVY-2020-007231');
assert.equal(osd.publicSources[0].url,m38.crossCaseRegisters[0].originalLetterUrl);
assert(osd.sourceWarning.includes('19-F-1420')&&osd.sourceWarning.includes('20-F-1095'));
assert.equal(nara.originalCase,'NARA Military Reference Branch, Reference Report on MJ-12');
assert(nara.publicSources.some(x=>x.hostType==='official'));
assert(nara.publicSources.some(x=>x.hostType==='mirror'));
assert(nara.sourceWarning.includes('Neither')&&nara.sourceWarning.includes('authenticates'));
assert.equal(d.disclosure.noFeeAuthorised,true);
assert.equal(d.disclosure.noFormalFOIAFilingEstablished,true);
assert.equal(d.disclosure.outgoingMailAcceptedNotAgencyReceipt,true);
assert.equal(d.disclosure.agencyResponseConfirmed,true);
assert.equal(d.disclosure.automaticInboxPolling,false);
assert.equal(d.disclosure.publicSenderAddress,false);
assert.equal(d.disclosure.privateMessageIdsPublished,false);
assert.equal(d.disclosure.personalBelievabilityScores,false);
assert.equal(d.disclosure.extraordinaryUAPConclusion,false);
assert.equal(d.disclosure.claimSpecificPercentagesPublished,false);
assert.equal(d.disclosure.ownerApprovalRequiredForLiveDeploy,true);
assert.equal(Object.hasOwn(d,'emails'),false);
assert.equal(Object.hasOwn(d,'messageIds'),false);
assert(!/garyboyd@|boyddigitalstudios@gmail.com|1a1e890/i.test(JSON.stringify(d)),'No personal mail IDs or addresses in public feed');
assert(html.includes('id="sourceVerification"'));
assert(html.includes('id="ddVerificationList"'));
assert(html.includes('id="ddVerificationUpdated"'));
assert(html.includes('assets/source-verification.js'));
assert(html.includes('does <strong>not</strong> establish delivery'));
assert(html.includes('Germany')||html.includes('five public archive'));
assert(html.includes('No fees have been authorised'));
assert(who.includes('id="ddWhoSourceTracker"'));
assert(who.includes('href="/sources#sourceVerification"'));
assert(!html.includes('We received a response'));
assert(d.records.find(x=>x.id==='osd-151-pages').timeline.some(x=>x.kind==='response'));
assert(d.records.filter(x=>x.dateSent===null).length===3);
assert(d.records.find(x=>x.id==='germany-gep-case-data').statusDetail.includes('declined'));
assert(d.records.find(x=>x.id==='brazil-arquivo-nacional-sian').statusDetail.includes('SIAN'));
assert(d.records.find(x=>x.id==='canada-lac-reproduction-permissions').statusDetail.includes('work-by-work'));
assert(builder.includes("'public-source-verification.json'"));
assert(builder.includes("'source-verification.js'"));
assert(script.includes('textContent=String(text)'));
assert(script.includes('new URL(String(url))'));
assert(script.includes('noopener noreferrer'));
assert(script.includes('sent_unacknowledged'));
assert(script.includes('agencyResponseConfirmed!==true'));
assert(script.includes("fetch('/data/public-source-verification.json'"));
assert(!/\binnerHTML\s*=|insertAdjacentHTML/.test(script),'Untrusted JSON must never be parsed as HTML');
assert.equal(queue.dockets.length,23);
assert.equal(people.people.length,50);
assert.equal(people.people.filter(p=>p.evidenceScope).length,27);
assert(queue.dockets.every(d=>d.reviewerHandoff.independentSecondHumanSignoff==='not_obtained'&&
 d.reviewerHandoff.editorialPublicationPermission===false&&
 d.reviewerHandoff.communityVotingPermission===false));
console.log('M40 PASS: 5 public source enquiries with dated and unknown-date provenance, WHS reply, three international outreach records, no formal FOIA assumption, no fees or private email, staged only.');
