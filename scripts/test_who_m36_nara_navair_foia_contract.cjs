'use strict';
// M36: historical source provenance and separate FOIA scopes.
// A passing test NEVER supplies case evidence, original bytes, human signoff or permission to publish.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const d=load('data/who-m36-nara-navair-foia-evidence.json');
const prior=load('data/who-m35-source-version-review.json');
const handoff=load('data/who-editorial-handoff-m29.json');
const publicDirectory=load('data/public-people-directory.json');
const memo=fs.readFileSync(path.join(base,'docs/WHO_M36_NARA_NAVAIR_PRIMARY_SOURCE_AUDIT_2026-11-16.md'),'utf8').replace(/[*]/g,'').toLowerCase();

assert.equal(d.schemaVersion,1);
assert.equal(d.edition,'m36-1988-revised-nara-scanned-pages-and-navair-foia-release-decision');
assert.equal(d.status,'research_only_scanned_private_revisions_and_official_navy_document_attribution_no_approval');
assert.deepEqual(d.researchThreads,['mj12_reference_report_version_history','nimitz_film_release_review']);

// "Old document" and "revised document" visually identifiable in the SAME third-party packet.
const n=d.mj12;
assert(n.scannedThirdPartyCollection.startsWith('https://projectaquarius.mufon.com/'));
assert.equal(n.scannedPdfOriginalHostIsNara,false);
assert.equal(n.scannedPageIndexIsZeroBased,true);
assert.equal(n.comparedVersionPages.length,2);
const [v87,v88]=n.comparedVersionPages;
assert.equal(v87.edition,'1987-07-22');
assert.deepEqual(v87.pdfPageIndices,[54,55,56]);
assert.equal(v87.headerImagePage,54);
assert.equal(v87.yearInItemNine,'1954');
assert.equal(v87.yearPage,55);
assert.equal(v87.visualPageRead,true);
assert.equal(v87.verifiedDirectNaraOriginal,false);
assert.equal(v88.edition,'1988-05-09');
assert.deepEqual(v88.pdfPageIndices,[57,58,59]);
assert.equal(v88.headerImagePage,57);
assert.equal(v88.yearInItemNine,'1956');
assert.equal(v88.yearPage,58);
assert.equal(v88.yearIsVisiblyUnderlined,true);
assert.equal(v88.visualPageRead,true);
assert.equal(v88.verifiedDirectNaraOriginal,false);
assert.equal(n.modernNara.itemNineYear,'1956');
assert.equal(n.modernNara.url,prior.mj12.records.find(x=>x.id==='nara-mj12-web-summary').url);
assert.equal(n.modernNara.separateIndependentInvestigation,false);
assert.equal(n.noConclusiveNaraCustodyCertification,true);
assert.equal(n.versionComparisonAuthenticatesMJ12Programme,false);
assert(n.supportedVersionInference.includes('1988'));
assert(n.supportedVersionInference.includes('1956'));
assert.equal(n.officialReferenceProcess.textualReferenceEmail,'archives2reference@nara.gov');
assert.equal(n.officialReferenceProcess.permissionStatus,'research_question_draft_only_not_sent');
assert(n.officialReferenceProcess.question.includes('May 1988'));
assert(n.officialReferenceProcess.question.includes('May 9 1988')||n.officialReferenceProcess.question.includes('9 May 1988'));

// Classification decision scope must never turn into a flight-speed/identity claim.
const first=d.navy.directlyViewedFirstPartyFOIA;
assert.equal(first.id,'navair-2018-eoir-review');
assert.equal(first.originatingDate,'2018-03-26');
assert.equal(new URL(first.url).hostname,'www.navair.navy.mil');
assert.deepEqual(first.viewedPdfPagesZeroBased,[0,1]);
assert.equal(first.sourceHostOfficialNAVAIR,true);
assert(first.documentText.includes('FLIR1 and GoFast'));
assert(first.documentText.includes('unclassified from'));
assert.equal(first.EOIRReviewConfirmsVideoNavyOrigin,false);
assert.equal(first.flightPhysicsTested,false);
assert.equal(first.aircraftPerformanceEstablished,false);
assert.equal(first.fullSecurityReviewAvailable,false);
assert.equal(first.redactionsPresent,true);
assert.equal(first.originalVideoBytesSupplied,false);
assert.equal(first.independentWitnessCountFromThisDocument,0);

// A FOIA response is evidence of scope of processing, not of extraordinary claims.
const response=d.navy.laterReleaseRecords;
assert.equal(response.recordCase,'DON-NAVY-2020-007231');
assert.equal(response.originatingDocumentDate,'2025-07-08');
assert.equal(response.originalFOIARequestDate,'2020-04-08');
assert.equal(new URL(response.sourceUrl).hostname,'documents2.theblackvault.com');
assert.equal(response.sourceHostOfficialNavy,false);
assert.equal(response.visuallyCheckedCoverAndSecondPage,true);
assert.equal(response.responsiveDisclosures.releasedEmailGroups,4);
assert.equal(response.responsiveDisclosures.releasedEmailPages,34);
assert.equal(response.responsiveDisclosures.withheldEmailItems,59);
assert.equal(response.responsiveDisclosures.withheldLegalMemoranda,3);
assert.equal(response.responsiveDisclosures.withheldPages,498);
assert.equal(response.responsiveDisclosures.referredToOSDDocuments,7);
assert.equal(response.responsiveDisclosures.referredToOSDPages,151);
assert(response.sourceCautions.some(x=>x.includes('not independently audited totals')));
assert(response.sourceCautions.some(x=>x.includes('no implication of extraterrestrial')));
assert(response.sourceCautions.some(x=>x.includes('later release status was not checked')));
assert.equal(response.anomalyConclusionFromFOIA,false);

const timeline=d.navy.releaseProcess;
assert.deepEqual(timeline.map(x=>x.id),[
'eoir-classification-2018','navy-foia-conversation-2019','website-test-2020',
'dod-release-2020','release-foia-response-2025']);
assert.deepEqual(timeline.map(x=>x.date),[
'2018-03-26','2019-06-12','2020-04-13','2020-04-27','2025-07-08']);
assert(timeline[1].limits.includes('do not invent a contradiction')||timeline[1].limits.includes('no manufactured contradiction'));
assert(timeline[2].supports.includes('test video'));
assert(timeline[3].limits.includes('not mean nonhuman'));
assert(timeline.every(x=>x.limits.length>45));

const missing=d.navy.missingOriginals;
assert.equal(missing.originalNAVAIRMP4Bytes,false);
assert.equal(missing.originalNAVAIRMP4SHA256,null);
assert.equal(missing.originalNavyNASADeckPDFBytes,false);
assert.equal(missing.houseToNavyDeckBinaryMatch,false);
assert.equal(missing.original2004SensorMaster,false);
assert.equal(missing.original2004PrincetonRadar,false);
assert.equal(missing.uncensoredOfficialReleaseDecisionRecord,false);
assert.equal(d.navy.thirdPartyMirrorsAreNotNewWitnesses,true);

// The important live safety gates remain closed and unchanged.
assert.equal(publicDirectory.people.length,50);
assert.equal(handoff.dockets.length,23);
assert.equal(publicDirectory.people.filter(p=>p.evidenceScope).length,27);
assert(handoff.dockets.every(x=>
 x.fullOriginalInspected===false &&
 x.reviewerHandoff.independentSecondHumanSignoff==='not_obtained' &&
 x.reviewerHandoff.editorialPublicationPermission===false &&
 x.reviewerHandoff.communityVotingPermission===false));
assert(publicDirectory.people.flatMap(p=>p.claimEvidence||[])
 .every(x=>x.ratingReadiness.publicationApproval==='withheld'));
for(const [key,value] of Object.entries(d.guardrails)){
 if(key.endsWith('NotEquivalentToUapOrigin')||key.endsWith('NotProofOfExtraordinaryClaims')||key==='versionsNotIndependentCorroboration'){
   assert.equal(value,true,key);
 } else {
   assert.equal(value,false,key);
 }
}
for(const part of ['1987','1988','underlined','1954','1956','26 march 2018','8 july 2025',
  '34 pages','498 pages','151 pages','not sent','without', 'not a verified mj-12 programme',
  'no netlify','no new original sha-256']) {
  assert(memo.includes(part),'Document must identify caveat: '+part);
}
console.log('M36 PASS: six visual archival scan pages (1987→1988 underlined 1956), 2018 Navy EO/IR classification, 2025 FOIA 34/498/151 page scopes, NARA request NOT SENT; 50 people, 23 unsigned dockets, no score/votes/portrait/deploy.');
