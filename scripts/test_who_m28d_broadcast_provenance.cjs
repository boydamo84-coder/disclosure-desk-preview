'use strict';
// M28d provenance: confirms source accessibility and publication boundaries only.
// NO assessment of any individual's general credibility or of underlying event truth.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const d=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const reader=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const specs={
 'ross-coulthart':{url:'https://www.youtube.com/watch?v=x_9gTDXF9Vc',originalAccess:'original_broadcaster_video_not_played',first:'independent_broadcaster_attribution_transcript',pattern:/not full direct examination of 7NEWS video/i},
 'jake-barber':{url:'https://www.youtube.com/watch?v=PGOpHdHSjTE',originalAccess:'original_broadcaster_video_not_played',first:'same_publisher_syndicated_original_clip_description',pattern:/Yahoo hosts NewsNation material/i},
 'bob-lazar':{url:'https://raids.org/files/mys3/lazar8.htm',originalAccess:'historical_transcript_original_url_502_and_original_broadcast_not_played',first:'third_party_retyped_transcript_not_original_master',pattern:/not an authenticated original TV recording/i},
 'larry-warren':{url:'https://www.youtube.com/watch?v=21yW_XZR2LU',originalAccess:'original_publisher_title_chapters_only_full_video_not_reviewed',first:'publisher_video_chapter_metadata_only',pattern:/Chapter titles and publisher summaries/i}
};
assert.equal(d.people.length,50,'retain 50 public profiles');
assert.equal(d.people.filter(p=>p.claimEvidence?.length).length,23,'23 attributed claim records retained');
assert.equal(d.people.filter(p=>p.evidenceScope).length,27,'27 original public-work/role profiles retained');
const allEvidence=d.people.reduce((n,p)=>n+(p.claimEvidence||[]).reduce((m,c)=>m+(c.researchEvidence?.items?.length||0),0),0);
assert.equal(allEvidence,89,'Provisional original evidence bibliography unchanged');
assert.equal(d.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28OfficialHearingCheck).length,4);
assert.equal(d.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28bOriginalSourceCheck).length,4);
assert.equal(d.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28cFirstPartyCheck).length,4);
const selected=d.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28dBroadcastLineageCheck);
assert.deepEqual(selected.map(p=>p.id).sort(),Object.keys(specs).sort(),'Exactly four M28d records');
for(const p of selected){
 const e=specs[p.id],claim=p.claimEvidence[0],r=claim.sourceAudit.m28dBroadcastLineageCheck;
 assert.equal(r.status,'source_chain_access_comparison_not_full_original_audio_video_review');
 assert.equal(r.checkedAt,'2026-11-16');
 assert.equal(r.primaryRecord.url,e.url);
 assert.equal(r.primaryRecord.access,e.originalAccess,'Original master accessibility cannot be upgraded');
 assert.match(r.primaryRecord.observation,/not |could not |unable |no authenticated /i);
 assert(r.primaryRecord.observation.length>=95);
 assert(r.scope.length>=110&&r.lineage.length>=115&&r.missing.length>=120);
 assert.equal(r.checks.length,3);
 assert.equal(r.checks[0].access,e.first);
 assert.match(r.checks[0].limit,e.pattern);
 for(const s of r.checks){
  assert(s.url.startsWith('https://'),'Only original HTTPS source references');
  assert(s.locator.length>=45&&s.finding.length>=100&&s.limit.length>=110);
  assert(!s.access.includes('full_original_video_verified'),'No false original recording claims');
 }
 assert.equal(r.fullOriginalBroadcastReviewed,false);
 assert.equal(r.underlyingIncidentVerified,false);
 assert.equal(r.secondIndependentHumanEditor,'not_obtained');
 assert.equal(r.permissionToPublishScoreOrVotes,false);
 assert.equal(r.newPortraitRightsApproval,false);
 assert.equal(claim.sourceAccessCheck.fullOriginalReviewed,false);
 assert.equal(claim.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert.equal(claim.ratingReadiness.publicationApproval,'withheld');
 assert.notEqual(claim.sourceReviewApproved,true);
 assert(claim.review?.status!=='published');
 assert.equal(p.photoRightsAudit.finalRightsApproval,false);
}
const w=selected.find(p=>p.id==='larry-warren').claimEvidence[0].sourceAudit.m28dBroadcastLineageCheck;
assert.match(w.checks[2].locator,/PDF page index 12/);
assert.match(w.checks[2].finding,/DEFE 24\/1512/);
assert.match(w.checks[2].limit,/not direct confirmation of Larry Warren/i);
assert(w.checks.some(s=>s.url.endsWith('UfKwQgmHfII')),'Competing witness recorded without assumed adjudication');
const b=selected.find(p=>p.id==='bob-lazar').claimEvidence[0].sourceAudit.m28dBroadcastLineageCheck;
assert.match(b.checks[2].limit,/Do not use the archive website's arbitrary personal disclosure rating as a score/i);
assert.match(b.checks[0].finding,/S-4/);
const barber=selected.find(p=>p.id==='jake-barber').claimEvidence[0].sourceAudit.m28dBroadcastLineageCheck;
assert.match(barber.checks[2].limit,/before the alleged Barber disclosures/);
const ross=selected.find(p=>p.id==='ross-coulthart').claimEvidence[0].sourceAudit.m28dBroadcastLineageCheck;
assert.match(ross.lineage,/overlapping allegations/);
assert.match(reader,/function m28dBroadcastLineageHtml\(claim\)/);
assert.match(reader,/m28dBroadcastLineageHtml\(claim\)\+/);
assert.match(reader,/fullOriginalBroadcastReviewed!==false/);
assert.match(reader,/permissionToPublishScoreOrVotes!==false/);
assert.match(html,/m28d=broadcast-provenance/);
assert.match(html,/claim-m28d-check\{margin/);
console.log('M28d source gate PASS: 4 provenance-only dossiers, 12 sourced checks, original video limits honest, UK official page 13, no ratings/voting/images, NO DEPLOY');
