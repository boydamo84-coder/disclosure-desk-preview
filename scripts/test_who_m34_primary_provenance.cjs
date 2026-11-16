'use strict';
// M34 STATIC source-provenance QA. Passing tests never authenticate extraordinary claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const m34=read('data/who-m34-nimitz-mj12-primary-sources.json');
const m33=read('data/who-m33-navy-historical-source-audit.json');
const m32=read('data/who-m32-immaculate-source-lineage.json');
const m29=read('data/who-editorial-handoff-m29.json');
const directory=read('data/public-people-directory.json');
const memo=fs.readFileSync(path.join(root,'docs/WHO_M34_NIMITZ_MJ12_PRIMARY_RECORDS_2026-11-16.md'),'utf8');
assert.equal(m34.schemaVersion,1);
assert.equal(m34.status,'research_only_unverified_unsigned_no_deploy');
assert.equal(m34.edition,'m34-nimitz-2020-media-release-and-mj12-1987-archive');
assert.equal(m34.navyOriginal.id,m33.navy.originalDocument.id);
assert.equal(m34.navyOriginal.url,m33.navy.originalDocument.url);
assert(m34.navyOriginal.url.endsWith('/NASA%20Brief%20Redacted.pdf'));
assert.equal(m34.navyOriginal.indexedListingDate,'2024-10-09');
assert(m34.navyOriginal.thisTurnAccess.includes('request_rejected'));
for(const key of ['originalPDFAccessible','originalBytesRetrieved','visualOriginalReviewed','houseCopyBytesCompared'])
 assert.equal(m34.navyOriginal[key],false);
assert.equal(m34.navyOriginal.originalSHA256,null);
assert.equal(m34.navyOriginal.sameSourceFamilyAsHouseAppendix,true);
const p=m34.nimitz.navyPublicAffairs;
assert.equal(p.headerDate,'2020-07-24');
assert.equal(p.documentPages,3);
assert.equal(p.htmlTextRead,true);
assert.equal(p.pdfScreenshotAvailable,false);
assert.equal(p.pdfSHA256,null);
assert.deepEqual(p.reportClaims.map(x=>x.id),['video-shared-aboard','2007-web-post','2009-review','original-vs-unclassified']);
assert(p.reportClaims.every(x=>x.kind.length>12&&x.claim.length>45));
const dod=m34.nimitz.dodVideoRelease;
assert.equal(dod.releaseDate,'2020-04-27');
assert.equal(dod.numberOfNavyVideos,3);
assert.equal(dod.yearOf2004Video,2004);
assert.equal(dod.yearOfOtherTwoVideos,2015);
assert(dod.assertion.includes('not a finding of extraordinary'));
const video=m34.nimitz.navairVideo;
assert(video.url.startsWith('https://www.navair.navy.mil/foia/'));
assert(video.url.endsWith('/1%20-%20FLIR.mp4'));
assert(video.urlListedIn.startsWith('https://media.defense.gov/'));
for(const key of ['releasedCopyBytesRetrieved','originalCameraMasterAccessible','completeSystemMetadataAccessible','raw2004RadarAccessible','nonhumanOriginEstablished','anomalousPerformanceEstablished'])
 assert.equal(video[key],false,key+' must not be overstated');
assert.equal(video.videoSHA256,null);
assert.equal(m34.mj12.originalNaraReport.date,'1987-07-22');
const archival=m34.mj12.originalNaraReport;
assert(archival.url.includes('reaganlibrary.archives.gov/public/2021-06/'));
assert.equal(archival.targetMemo,'Cutler to Twining memorandum dated 14 July 1954');
assert.equal(archival.accessibleText,true);
assert.equal(archival.pdfVisualScreenshotAvailable,false);
assert.equal(archival.pdfSHA256,null);
assert.deepEqual(archival.specificFindings.map(x=>x.key),
 ['record-book','security-stamp','july-meeting','cutler-travel','custody-distinction']);
assert(archival.specificFindings.every(x=>x.finding.length>45));
const nara=m34.mj12.modernNara;
assert.equal(nara.reviewDate,'2024-06-25');
assert.equal(nara.sameSourceAs1987Report,true);
assert.equal(nara.independentCorroboration,false);
assert.equal(nara.discrepancy.original1987Text,'Special Meeting July 16 1954');
assert.equal(nara.discrepancy.modernWebText,'Special Meeting July 16 1956');
assert(nara.discrepancy.status.includes('reconciliation'));
assert.equal(m34.mj12.scopeLimits.cutlerTwiningMemoExamined,true);
assert.equal(m34.mj12.scopeLimits.hillenkoetter1947MemoExamined,false);
assert.equal(m34.mj12.scopeLimits.som101ManualExamined,false);
assert.equal(directory.people.length,50);
assert.equal(m29.dockets.length,23);
assert.equal(directory.people.filter(x=>x.evidenceScope).length,27);
assert(m29.dockets.every(d=>d.fullOriginalInspected===false &&
 d.reviewerHandoff.independentSecondHumanSignoff==='not_obtained' &&
 d.reviewerHandoff.editorialPublicationPermission===false &&
 d.reviewerHandoff.communityVotingPermission===false));
assert(directory.people.flatMap(p=>p.claimEvidence||[]).every(c=>c.ratingReadiness.publicationApproval==='withheld'));
assert(m32.sources.find(s=>s.id==='shellenberger-212-page-submission').pageCount===212);
assert(Object.values(m34.releaseGate).every(x=>x===true));
const lower=memo.replace(/[*]/g,'').toLowerCase();
for(const phrase of ['2007','2009','27 april 2020','nara','1987','1954','1956',
 'not a claim verification','no original pdf byte hash','no object-speed finding','not a netlify deployment']){
 assert(lower.includes(phrase.toLowerCase()),'Missing safety or provenance note: '+phrase);
}
assert(!Object.hasOwn(m34,'editorialScore'));
assert(!Object.hasOwn(m34,'publishedRating'));
console.log('M34 PASS: official 2004 Navy FLIR release history, 3-page Navy press record, no original sensor hashes or speed assertions; 1987 NARA archival memo with 1954/1956 discrepancy and zero independent double-counting; 50 people, 23 unsigned claims; NO DEPLOY.');
