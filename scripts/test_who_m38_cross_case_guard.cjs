'use strict';
// M38 no-deploy evidence-lineage contract: coincidence of page count != identity of a FOIA referral.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const d=load('data/who-m38-osd-151-cross-case-audit.json');
const m37=load('data/who-m37-osd-referral-provenance.json');
const m36=load('data/who-m36-nara-navair-foia-evidence.json');
const handoff=load('data/who-editorial-handoff-m29.json');
const dir=load('data/public-people-directory.json');
const doc=fs.readFileSync(path.join(root,'docs/WHO_M38_151_PAGE_FOIA_CROSS_CASE_2026-11-16.md'),'utf8');
assert.equal(d.schemaVersion,1);
assert.equal(d.status,'research_only_no_referral_disposition_authenticated_no_emails_sent_no_deploy');
assert.equal(d.parentEdition,m37.edition);
assert.equal(d.crossCaseRegisters.length,3);
const cases=new Map(d.crossCaseRegisters.map(x=>[x.id,x]));
assert.equal(cases.size,3);
const navy=cases.get('navy-2020-007231');
const osd19=cases.get('osd-19-f-1420');
const osd20=cases.get('osd-20-f-1095');
assert(navy&&osd19&&osd20);
assert.equal(navy.foiaCase,'DON-NAVY-2020-007231');
assert.equal(navy.dateOfRequest,'2020-04-08');
assert.equal(navy.dateOfDecision,'2025-07-08');
assert.deepEqual(navy.visuallyInspectedPagesZeroBased,[0,1]);
assert.equal(navy.originalLetterUrl,m36.navy.laterReleaseRecords.sourceUrl);
assert.deepEqual(navy.describedNumbers,{
 releasedEmailGroups:4,releasedPages:34,withheldEmails:59,withheldLegalMemos:3,
 withheldPages:498,referredDocuments:7,referredPages:151
});
assert.equal(navy.dispositionOf151Referral,'NOT_LOCATED_IN_PUBLIC_SOURCES_CHECKED_AS_OF_2026_11_16');
assert.equal(navy.referralResponseNumberKnown,false);
assert.equal(navy.specificReferralContactFromNavyLetter,'osd.mc-alex.oatsd-pclt.mbx.pcld-correspondence@mail.mil');
assert.equal(navy.firstPartyContactAsOf2025NotVerifiedCurrent,true);
assert.equal(navy.newsCannotProveStillPending2026,true);
assert.equal(navy.appealPresentOutcomeNotVerified,true);
assert.equal(navy.missingDispositionMustNotBeReportedAsRefusal,true);
assert.equal(osd19.foiaCase,'19-F-1420');
assert.equal(osd19.dateOfRequest,'2019-06-25');
assert.equal(osd19.dateOfDecision,'2025-07-01');
assert.equal(osd19.originalResponsePages,154);
assert.equal(osd19.publishedDownloadLabelPages,156);
assert.equal(osd19.newsStoryCallsPages,151);
assert.equal(osd19.pdfExtractedTextRead,true);
assert(osd19.pdfScreenshotAttempt.includes('19_875_896_byte'));
assert.equal(osd19.originalDocumentHashSHA256,null);
assert.equal(osd19.scanNotVisuallyChecked,true);
assert.equal(osd19.isDocumentaryProofThat151NavyReferralClosed,false);
assert.equal(osd19.sameUnderlyingSevenDocumentsDemonstrated,false);
assert.equal(osd19.countsExplanationUnverified,true);
assert.equal(osd19.publishedUnderSeparateRequestBeforeNavyLetter,true);
assert.equal(osd19.exhibitsContext.notScientificOrObjectIdentityProof,true);
assert.equal(osd19.exhibitsContext.doNotTreatPressInterpretationAsOfficialFinding,true);
assert.equal(osd20.foiaCase,'20-F-1095');
assert.equal(osd20.dateOfRequest,'2020-05-16');
assert.equal(osd20.dateOfDecision,'2025-06-18');
assert.equal(osd20.originalResponsePages,263);
assert.equal(osd20.mentionsNavy007231,true);
assert.equal(osd20.sameAs151ReferralProven,false);
assert.equal(osd20.originalDocumentHashSHA256,null);
assert.equal(d.evidenceComparisons.length,3);
assert(d.evidenceComparisons.every(x=>cases.has(x.left)&&cases.has(x.right)));
assert(d.evidenceComparisons.every(x=>x.sharedDocumentsVerified===false&&x.referredSevenDocumentClosureProven===false));
assert(d.evidenceComparisons.some(x=>x.id==='count-is-not-identity'));
assert(d.evidenceComparisons.some(x=>x.id==='additional-263-case'));
const sources=new Map(d.relatedSources.map(s=>[s.id,s]));
assert.equal(sources.size,5);
assert(sources.get('osd-foia-official-contact-2026').value.endsWith('@mail.mil'));
assert(sources.get('nara-college-park-current-reference').value==='archives2reference@nara.gov');
assert(sources.get('nara-mj12-current-1956').value==='1956');
assert(sources.get('1988-revised-source-on-third-party-pdf').verified.includes('not_official_custody'));
assert(sources.get('osd-foia-official-contact-2026').verified.includes('direct_open_403'));
assert.equal(d.originalDataAccess.originalNavyMP4Downloaded,false);
assert.equal(d.originalDataAccess.originalNavyMP4SHA256,null);
assert.equal(d.originalDataAccess.originalNavyNASADeckDownloaded,false);
assert.equal(d.originalDataAccess.originalNavyNASADeckSHA256,null);
assert.equal(d.originalDataAccess.original2004RadarRecordsInspected,false);
assert.equal(d.originalDataAccess.may1988NARACertifiedRevisionObtained,false);
assert.equal(d.outreach.length,2);
assert(d.outreach.every(x=>x.mode==='draft_only'&&x.sent===false));
assert(d.outreach.every(x=>x.noOriginalRequesterIdentityClaim===true));
assert(d.outreach[0].body.includes('DON-NAVY-2020-007231'));
assert(d.outreach[0].body.includes('19-F-1420'));
assert(d.outreach[0].body.includes('20-F-1095'));
assert(d.outreach[1].body.includes('1988'));
assert(d.outreach[1].body.includes('underlined'));
assert(Object.values(d.guardrails).every(x=>x===true));
assert.equal(dir.people.length,50);
assert.equal(handoff.dockets.length,23);
assert.equal(dir.people.filter(p=>p.evidenceScope).length,27);
assert(handoff.dockets.every(x=>x.fullOriginalInspected===false &&
 x.reviewerHandoff.independentSecondHumanSignoff==='not_obtained' &&
 x.reviewerHandoff.editorialPublicationPermission===false &&
 x.reviewerHandoff.communityVotingPermission===false));
assert(dir.people.flatMap(p=>p.claimEvidence||[]).every(c=>c.ratingReadiness.publicationApproval==='withheld'));
const prose=doc.replace(/[*]/g,'').toLowerCase();
for(const part of ['19-f-1420','20-f-1095','don-navy-2020-007231',
'154 pages','156 pages','151 pages','263','498','june 2019','april 2020',
'not proof','not sent','no netlify','no community votes']){
 assert(prose.includes(part.toLowerCase()),'M38 memo must preserve nuance: '+part);
}
assert(!Object.hasOwn(d,'publishedClaimScores')&&!Object.hasOwn(d,'publishedVotes'));
console.log('M38 PASS: distinct Navy/OSD case identities; 151 referral vs reported 151 + printed 154 / file 156; no original referral closure, 263 separate; NARA revision unconfirmed, 2 unsent enquiries; 50/23/27 readonly, NO DEPLOY.');
