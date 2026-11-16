'use strict';
// M37 -- static document-provenance contracts, NOT an assertion about UAP origin.
// A source-reference match is not a FOIA case disposition or independent corroboration.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const d=load('data/who-m37-osd-referral-provenance.json');
const m36=load('data/who-m36-nara-navair-foia-evidence.json');
const m29=load('data/who-editorial-handoff-m29.json');
const directory=load('data/public-people-directory.json');
const doc=fs.readFileSync(path.join(root,'docs/WHO_M37_OSD_REFERRAL_AND_NARA_FINDING_AID_2026-11-16.md'),'utf8');
assert.equal(d.schemaVersion,1);
assert.equal(d.edition,'m37-distinguish-osd-20-f-1095-from-navy-007231-referred-151-pages');
assert.equal(d.parentEdition,m36.edition);
assert.equal(d.status,'research_only_no_verified_referral_resolution_or_human_editorial_approval');
assert.equal(d.foiaTracks.length,3);
assert.equal(new Set(d.foiaTracks.map(x=>x.id)).size,3);
const cases=new Map(d.foiaTracks.map(x=>[x.id,x]));
const navy=cases.get('navy-release-process-007231');
const osd=cases.get('osd-spokesperson-20-f-1095');
const custody=cases.get('navy-video-custody-007330');
assert(navy&&osd&&custody);
assert.equal(navy.caseNumber,'DON-NAVY-2020-007231');
assert.equal(navy.respondedOn,'2025-07-08');
assert.deepEqual(navy.seenAsPdfScreenshotPagesZeroBased,[0,1]);
assert.equal(navy.sourceUrl,m36.navy.laterReleaseRecords.sourceUrl);
assert.deepEqual(navy.responsiveCounts,{
 partiallyReleasedEmailGroups:4,partiallyReleasedPages:34,
 fullyWithheldEmailItems:59,fullyWithheldLegalMemos:3,fullyWithheldPages:498,
 referredDocumentsToOSD:7,referredPagesToOSD:151
});
assert.equal(navy.publicStatusOf151Pages,'NOT_VERIFIED_AS_OF_M37');
assert(navy.lastGroundedPublicStatus.includes('2025-07-09'));
assert(navy.lastGroundedPublicStatus.includes('no later case-specific decision'));
assert(navy.cannotInfer.some(t=>t.includes('263-page')));
assert.equal(osd.caseNumber,'20-F-1095');
assert.equal(osd.requestAgency,'Office of the Secretary of Defense/Joint Staff');
assert.equal(osd.originalRequestDate,'2020-05-16');
assert.equal(osd.receivedOn,'2020-05-18');
assert.equal(osd.respondedOn,'2025-06-18');
assert.equal(osd.responsivePages,263);
assert(osd.pdfScreenshotAttempt.includes('FAILED_pdf_42mb'));
assert.equal(osd.pdfExtractedTextReviewed,true);
assert.equal(osd.documentOriginalFederalHostConfirmed,false);
assert.equal(osd.mentionsOtherCaseNumber,navy.caseNumber);
assert.equal(osd.sameAsSevenReferredDocumentsConfirmed,false);
assert.equal(osd.equalsReferred151Pages,false);
assert.equal(osd.independentFromReferralDisposition,true);
assert(osd.specificMentionContext.includes('2020-10-14'));
assert(osd.note.includes('not proof'));
assert.equal(custody.caseNumber,'DON-NAVY-2020-007330');
assert.equal(custody.surfacedInsideFoiaCase,osd.caseNumber);
assert.equal(custody.date,'2020-06-16');
assert(custody.exactIndexLines.includes('2630-2643'));
assert(custody.requestFocus.includes('Gimbal'));
assert.equal(custody.establishes2004CameraMasterChain,false);
assert.equal(custody.provesNoRecordsExistAnywhereInDoD,false);
assert.equal(custody.separateFOIARequestNotAdditionalIndependentSighting,true);
assert.equal(d.matchedComparisons.length,3);
assert(d.matchedComparisons.every(x=>cases.has(x.left)&&cases.has(x.right)));
assert(d.matchedComparisons.every(x=>x.isResponseTo151Referral===false));
assert(d.matchedComparisons.some(x=>x.conclusion.includes('263_page_OSD_release')));
const archive=d.archivalResearch.officialGuide;
assert.equal(archive.url,'https://www.reaganlibrary.gov/public/archives/textual/topics/operamaj.pdf');
assert.equal(archive.screenshotPdfPageZeroBased,0);
assert.equal(archive.extractedDisplayDate,'6/1/2026');
assert.equal(archive.visualFooterDate,'2/12/2024');
assert(archive.documentDateReconciliationStatus.includes('DISAGREE_UNVERIFIED'));
assert.equal(archive.officialArchiveFindingAidNotProgrammeAuthentication,true);
assert.deepEqual(archive.whiteHouseOfficeOfRecordsManagement.FE010_01,['094780','502752','517937']);
assert.deepEqual(archive.whiteHouseOfficeOfRecordsManagement.OS,['052606','055537','157693','495613']);
assert.deepEqual(archive.whiteHouseOfficeOfRecordsManagement.PR014_08,['446832']);
assert.equal(archive.whiteHouseScienceAdvisor.racBox,16);
assert.equal(archive.whiteHouseScienceAdvisor.name,'George A. Keyworth III');
assert.deepEqual(archive.whiteHouseScienceAdvisor.folders,['U & V Miscellaneous (1)','U & V Miscellaneous (2)']);
assert.equal(archive.doesNotDirectlyReferenceMay1988Revision,true);
assert.equal(d.archivalResearch.revisedMJ12.may1988RevisedScanVisualFoundInPrivateArchive,true);
assert.equal(d.archivalResearch.revisedMJ12.revisedReportDirectGovernmentHostedCopyFound,false);
assert.equal(d.archivalResearch.revisedMJ12.naraConfirmationObtained,false);
assert.equal(d.archivalResearch.revisedMJ12.yearChangeDisclosesNothingAboutTruthOfMJ12Programme,true);
assert.equal(d.outreachDrafts.length,2);
assert(d.outreachDrafts.every(x=>x.status==='DRAFT_ONLY_NOT_SENT'));
assert(d.outreachDrafts.some(x=>x.id==='osd-seven-document-referral'));
assert(d.outreachDrafts.some(x=>x.id==='nara-1988-version-and-guide'));
assert(Object.values(d.guardrails).every(x=>x===true));
for(const [key,value] of Object.entries(d.noOriginalsRecovered)){
  if(key==='originalPDFHashes')assert.equal(value,null);
  else assert.equal(value,false,key+' must remain unresolved');
}
assert.equal(directory.people.length,50);
assert.equal(m29.dockets.length,23);
assert.equal(directory.people.filter(p=>p.evidenceScope).length,27);
assert(m29.dockets.every(x=>
  x.fullOriginalInspected===false &&
  x.reviewerHandoff.independentSecondHumanSignoff==='not_obtained' &&
  x.reviewerHandoff.editorialPublicationPermission===false &&
  x.reviewerHandoff.communityVotingPermission===false));
assert(directory.people.flatMap(p=>p.claimEvidence||[]).every(c=>c.ratingReadiness.publicationApproval==='withheld'));
const text=doc.replace(/[*]/g,'').toLowerCase();
for(const needle of ['20-f-1095','don-navy-2020-007231','don-navy-2020-007330',
 '151 pages','263 responsive pages','498 pages','whorm','rac box 16',
 'not verified','unsent','no deploy','no netlify','not government authentication']){
 assert(text.includes(needle),'Missing provenance/permission guard: '+needle);
}
assert(!Object.hasOwn(d,'editorialRating'));
assert(!Object.hasOwn(d,'publishedMemberVotes'));
console.log('M37 PASS: three separate Navy/OSD FOIA requests, 151/263 NOT conflated, 8 official WHORM case identifiers, document dates scoped, 2 unsent inquiries; 50 people/23 unapproved claims, no public scores, votes, privacy/production mutation or deploy.');
