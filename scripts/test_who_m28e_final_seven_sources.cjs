'use strict';
// M28e final-seven provenance test; source-coverage is NOT incident verification.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const reader=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const sharedUrl='https://www.sciencedirect.com/science/article/pii/S0376042121000907';
const expected={
 'jeremy-corbell':{url:'https://transcripts.cnn.com/show/ebo/date/2021-05-31/segment/01',grade:'original_publisher_broadcast_transcript_full_audiovisual_not_reviewed',size:3},
 'george-knapp':{url:'https://oversight.house.gov/wp-content/uploads/2025/09/George-Knapp-Written-Testimony.pdf',grade:'official_original_pdf_selected_pages_visually_checked',size:4},
 'steven-greer':{url:'https://abcnews.go.com/Technology/story?id=98572&page=1',grade:'contemporaneous_original_newsroom_article_not_press_conference_master',size:3},
 'jacques-vallee':{url:sharedUrl,grade:'publisher_indexed_abstract_direct_article_403_shared_study',size:3},
 'garry-nolan':{url:sharedUrl,grade:'publisher_indexed_abstract_direct_article_403_shared_study',size:3},
 'james-fox':{url:'https://filmschoolradio.com/the-program-director-james-fox/',grade:'original_film_director_publisher_pages_full_film_not_played',size:3},
 'nick-pope':{url:'https://nickpope.net/wpte19/rendlesham-forest/',grade:'author_page_search_indexed_live_redirect_inaccessible',size:3}
};
assert.equal(data.people.length,50);
assert.equal(data.people.filter(p=>p.claimEvidence?.length).length,23);
assert.equal(data.people.filter(p=>p.evidenceScope).length,27);
assert.equal(data.people.reduce((n,p)=>n+(p.claimEvidence||[]).reduce((m,c)=>m+(c.researchEvidence?.items?.length||0),0),0),89);
const earlier=['m28OfficialHearingCheck','m28bOriginalSourceCheck','m28cFirstPartyCheck','m28dBroadcastLineageCheck'];
for(const key of earlier)assert.equal(data.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.[key]).length,4,
  'Existing M28a–d original research preserved: '+key);
const seven=data.people.filter(p=>p.claimEvidence?.[0]?.sourceAudit?.m28eFinalSevenSourceCheck);
assert.deepEqual(seven.map(p=>p.id).sort(),Object.keys(expected).sort(),
  'M28e exactly seven remaining dossiers');
for(const person of seven){
 const c=person.claimEvidence[0],r=c.sourceAudit.m28eFinalSevenSourceCheck,x=expected[person.id];
 assert.equal(r.status,'targeted_publication_or_indexed_access_comparison_not_editorially_approved');
 assert.equal(r.checkedAt,'2026-11-16');
 assert.equal(r.primaryUrl,x.url);
 assert.equal(r.accessGrade,x.grade);
 assert.equal(r.passages.length,x.size);
 assert(r.sourceTitle.length>=32&&r.sourceMethod.length>=105);
 assert(r.scope.length>=115&&r.sourceLineage.length>=115);
 assert(r.missingEvidence.length>=110);
 for(const q of r.passages){
  assert(q.locator.length>=45,'Specific accessible passage or indexed record locator');
  assert(q.finding.length>=105&&q.limit.length>=115,'Attributed source finding plus limit');
  assert(/^[a-z_]+$/.test(q.kind));
 }
 assert.equal(r.fullUnderlyingClaimVerification,false);
 assert.equal(r.secondIndependentHumanEditor,'not_obtained');
 assert.equal(r.permissionToPublishScoreOrCommunityVote,false);
 assert.equal(r.permissionToApproveNewPortrait,false);
 assert.equal(c.ratingReadiness.publicationApproval,'withheld');
 assert.equal(c.sourceAccessCheck.secondEditorSignoff,'not_obtained');
 assert.equal(c.sourceAccessCheck.fullOriginalReviewed,false);
 assert.notEqual(c.sourceReviewApproved,true);
 assert(c.review?.status!=='published');
 assert.equal(person.photoRightsAudit.finalRightsApproval,false);
}
assert.equal(data.people.filter(p=>
 p.claimEvidence?.[0]&&(
 earlier.some(k=>p.claimEvidence[0].sourceAudit?.[k])||
 p.claimEvidence[0].sourceAudit?.m28eFinalSevenSourceCheck
 )).length,23,'All 23 claim dossiers now have targeted original/access-level source pass');
const n=seven.find(p=>p.id==='garry-nolan').claimEvidence[0].sourceAudit.m28eFinalSevenSourceCheck;
const v=seven.find(p=>p.id==='jacques-vallee').claimEvidence[0].sourceAudit.m28eFinalSevenSourceCheck;
assert.equal(n.primaryUrl,v.primaryUrl,'Nolan/Vallée use same publisher URL');
assert.equal(n.sourceLineageGroup,v.sourceLineageGroup,'Shared specimen provenance');
assert.equal(n.sourceLineageGroup,'council-bluffs-1977-one-paper-100788');
assert.match(n.sourceLineage,/ONE study/);
assert.match(v.sourceLineage,/ONE empirical study/);
assert.match(n.sourceMethod,/403/);assert.match(v.sourceMethod,/403/);
assert.match(n.passages[1].finding,/terrestrial/);
assert.match(v.passages[1].finding,/terrestrial/);
const knapp=seven.find(p=>p.id==='george-knapp').claimEvidence[0].sourceAudit.m28eFinalSevenSourceCheck;
assert.match(knapp.passages[0].finding,/not a whistleblower or UFO eyewitness/);
assert.match(knapp.passages[2].finding,/not completed/);
assert.match(knapp.sourceMethod,/pages 1, 3, 5 and 7/);
const corbell=seven.find(p=>p.id==='jeremy-corbell').claimEvidence[0].sourceAudit.m28eFinalSevenSourceCheck;
assert.match(corbell.passages[0].limit,/not a calibrated fourteen-track dataset/);
const greer=seven.find(p=>p.id==='steven-greer').claimEvidence[0].sourceAudit.m28eFinalSevenSourceCheck;
assert.match(greer.passages[1].limit,/not 400 independently published sworn depositions/);
const fox=seven.find(p=>p.id==='james-fox').claimEvidence[0].sourceAudit.m28eFinalSevenSourceCheck;
assert.match(fox.passages[1].finding,/1966/);
assert.match(fox.passages[2].finding,/20 January 1996/);
const pope=seven.find(p=>p.id==='nick-pope').claimEvidence[0].sourceAudit.m28eFinalSevenSourceCheck;
assert.match(pope.passages[0].finding,/before he joined/);
assert.match(pope.sourceMethod,/inaccessible/);
assert.match(reader,/function m28eFinalSevenSourceHtml\(claim\)/);
assert.match(reader,/m28eFinalSevenSourceHtml\(claim\)\+/);
assert.match(reader,/permissionToPublishScoreOrCommunityVote!==false/);
assert.match(reader,/secondIndependentHumanEditor!=='not_obtained'/);
assert.match(html,/m28e=seven-originals/);
assert.match(html,/claim-m28e-check\{margin/);
console.log('M28e PASS: final 7 original/publication source access audits, 22 passages, 23/23 research pass complete, ONE Nolan/Vallee study, 27 nonscore roles, NO rating approval/vote/portrait/deploy.');
