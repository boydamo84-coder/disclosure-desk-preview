'use strict';
// M35: enforce historical document-version source lineage and video-copy distinctions.
// Green assertions DO NOT authenticate the alleged MJ-12 programme or anomalous flight.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const m35=read('data/who-m35-source-version-review.json');
const m34=read('data/who-m34-nimitz-mj12-primary-sources.json');
const m33=read('data/who-m33-navy-historical-source-audit.json');
const m29=read('data/who-editorial-handoff-m29.json');
const directory=read('data/public-people-directory.json');
const memo=fs.readFileSync(path.join(root,'docs/WHO_M35_NARA_REVISION_AND_MEDIA_LINEAGE_2026-11-16.md'),'utf8');
assert.equal(m35.schemaVersion,1);
assert.equal(m35.edition,'m35-nara-1987-vs-1988-mj12-edition-discovery-and-flir-access');
assert.equal(m35.previousEdition,m34.edition);
assert.equal(m35.status,'source_document_version_hypothesis_supported_not_officially_authenticated_no_deploy');
const records=m35.mj12.records;
assert.equal(records.length,4);
assert.deepEqual(records.map(x=>x.id),[
 'nara-mj12-report-1987','nara-mj12-report-1988-revised',
 'nara-mj12-revised-mufon-copy','nara-mj12-web-summary']);
assert.equal(new Set(records.map(x=>x.url)).size,4);
const [prior,revision,duplicate,live]=records;
assert.equal(prior.date,'1987-07-22');
assert.equal(prior.statement9,'Special Meeting July 16, 1954');
assert.equal(prior.url,m34.mj12.originalNaraReport.url);
assert.equal(prior.hostIsFederal,true);
assert.equal(prior.actualPageVisualChecked,false);
assert.equal(revision.date,'1988-05-09');
assert.equal(revision.statement9,'Special Meeting July 16, 1956');
assert(revision.title.includes('(revised)'));
assert(revision.ownRevisionNotice.includes('July 22, 1987'));
assert(revision.ownRevisionNotice.includes('underlined'));
assert(revision.documentProvenance.includes('1996-12-09'));
assert.equal(revision.hostIsFederal,false);
assert.equal(revision.actualPageVisualChecked,false);
assert(revision.sourceClass.includes('private_archival_host'));
assert.equal(duplicate.date,'1988-05-09');
assert.equal(duplicate.statement9,revision.statement9);
assert.equal(duplicate.hostIsFederal,false);
assert(duplicate.sourceFunction.includes('not_independent'));
assert.equal(live.url,m34.mj12.modernNara.url);
assert.equal(live.statement9,revision.statement9);
assert.equal(live.hostIsFederal,true);
assert(live.sourceFunction.includes('not_independent_second'));
const cmp=m35.mj12.comparison;
assert.deepEqual([cmp[1987],cmp[1988],cmp.current],['1954','1956','1956']);
assert(cmp.probableExplanation.includes('May 9 1988'));
assert(cmp.probableExplanation.includes('rather than necessarily'));
assert.equal(cmp.authoritativelyReconciled,false);
assert.equal(cmp.publicNARA1988OriginalConfirmed,false);
assert.equal(cmp.independentCaseEvidenceCount,0);
assert.equal(cmp.sameResearchFamilyAcrossAllFour,true);
assert(cmp.conclusionStatus.includes('not_custody_authenticated'));
assert.equal(cmp.yearDiscrepancyAffectsSubstantiveClaimVerdict,false);
assert(cmp.nextStep.includes('marked-up'));
for(const a of records)if(a.sha256!==undefined)assert.equal(a.sha256,null);
const media=m35.nimitz.originals;
assert.equal(media.length,4);
assert.deepEqual(media.map(x=>x.id),[
 'dod-2020-release','navair-flir-direct','navair-document-list','wikimedia-flir1-webm']);
assert.equal(new Set(media.map(x=>x.url)).size,4);
const [dod,original,index,webm]=media;
assert.equal(dod.releaseDate,'2020-04-27');
assert.equal(dod.videoHash,null);
assert.equal(dod.physicalObjectVerified,false);
assert.equal(original.url,m34.nimitz.navairVideo.url);
assert(original.status.includes('binary_download_failed'));
assert.equal(original.byteRetrieved,false);
assert.equal(original.videoHash,null);
assert.equal(original.originalCameraMaster,false);
assert.equal(original.rawRadar,false);
assert.equal(original.fullTelemetry,false);
assert.equal(original.objectIdentityDetermined,false);
assert(index.observation.includes('not proof of removal'));
assert(index.url.includes('navair.navy.mil/foia/documents'));
assert.equal(webm.format,'WebM VP9/Opus');
assert.equal(webm.nominalWidth,352);
assert.equal(webm.nominalHeight,264);
assert.equal(webm.durationSeconds,76);
assert.equal(webm.dateOfListedReplacementUpload,'2020-04-27');
assert.equal(webm.originalMP4HashEquivalent,false);
assert.equal(webm.originalCameraMaster,false);
assert.equal(webm.sourceIndependenceCount,0);
assert(webm.rights.includes('independent license check'));
assert(Object.values(m35.nimitz.lineageSafeguards).every(Boolean));
assert.equal(m35.navyDeck.originalBytesRetrieved,false);
assert.equal(m35.navyDeck.originalHash,null);
assert.equal(m35.navyDeck.houseSourceBinaryCompared,false);
assert.equal(m35.navyDeck.originalPageVisualAudit,false);
assert.equal(m35.navyDeck.noFalseIndependentHouseCopy,true);
assert.equal(directory.people.length,50);
assert.equal(m29.dockets.length,23);
assert.equal(directory.people.filter(p=>p.evidenceScope).length,27);
assert(m29.dockets.every(x=>x.fullOriginalInspected===false &&
 x.reviewerHandoff.independentSecondHumanSignoff==='not_obtained' &&
 x.reviewerHandoff.editorialPublicationPermission===false &&
 x.reviewerHandoff.communityVotingPermission===false));
assert(directory.people.flatMap(x=>x.claimEvidence||[]).every(c=>c.ratingReadiness.publicationApproval==='withheld'));
assert(Object.values(m35.reviewGate).every(Boolean));
const text=memo.replace(/[*]/g,'').toLowerCase();
for(const phrase of ['9 may 1988','22 july 1987','1954','1956','revision',
 'not obtained','not a second','webm','vp9','byte','not a numerical rating',
 'no netlify deployment','no mp4 bytes','not a new archival investigation']) {
 assert(text.includes(phrase.toLowerCase()),'Missing scope/provenance warning: '+phrase);
}
assert(!Object.hasOwn(m35,'humanEditorialScore'));
assert(!Object.hasOwn(m35,'memberBallots'));
console.log('M35 PASS: 1987 1954 -> apparent 1988 revised 1956 -> current 1956 with unconfirmed government custody; public MP4 != WebM transcode != 2004 camera master; 50 people/23 unsigned, 0 human approval, score/vote/portrait/deploy.');
