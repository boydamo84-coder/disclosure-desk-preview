'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(html,/id="profileEvidenceReviews"/);
assert.match(html,/id="claimReviewMethod"/);
assert.match(html,/r2-evidence-ledger-v4-20261115/);
assert.match(html,/claim-role-card/);
assert.match(html,/original-source role records/);
assert.match(html,/View evidence &amp; scoring breakdown/);
assert.match(html,/claim-evidence-details/);
assert.match(html,/Community rating/);
assert.match(html,/Scientific and policy recommendations are Not applicable/);
assert.match(home,/Seven source-linked profiles now contain/);
assert.match(home,/27 source-backed NASA and congressional role cards/);
assert.match(html,/community-test-config\.js/);
assert.match(html,/supabase-js@2\.119\.0/);
assert.match(home,/id="ddR3ReleaseAnnouncement"/);
assert.match(home,/Who's Who — how the two ratings work/);
assert.match(home,/once voting has passed its account-security/);
assert.match(html,/Statements are attributed/);
assert.match(html,/secondary-editorial-nav\.js/);
assert.match(html,/source trail and editorial checks/);
assert.equal(data.people.length,50,'Existing Who’s Who directory must retain all 50 public profiles');
const roleEntries=data.people.filter(p=>p.roleEvidence);
assert.equal(roleEntries.length,27,'17 NASA (16 members and a designated coordinator) plus 10 congressional roles');
assert.equal(roleEntries.reduce((n,p)=>n+p.roleEvidence.sources.length,0),56,
 'All 27 role records must keep 56 openable official reference entries');
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='institutional_role').length,17);
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='legislative_role').length,7);
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='legislative_action').length,2);
assert.equal(roleEntries.filter(p=>p.roleEvidence.kind==='congressional_oversight').length,1);
assert.equal(data.people.find(p=>p.id==='jen-buss').roleEvidence.officialListedName,'Jennifer Buss');
assert.match(data.people.find(p=>p.id==='daniel-evans').roleEvidence.title,/coordinat/);
assert.match(data.people.find(p=>p.id==='jared-moskowitz').roleEvidence.description,/not one of the named task-force members/);
assert.match(data.people.find(p=>p.id==='chuck-schumer').roleEvidence.description,/eventual enacted law/);
for(const p of roleEntries){
 const role=p.roleEvidence;
 assert.equal(role.status,'official_source_crosscheck');
 assert.match(role.eventDate,/^\d{4}-\d{2}-\d{2}$/);
 assert(role.title.length>=12&&role.description.length>=60);
 assert(role.sources.length>=2);
 for(const e of role.sources){
  assert(e.url.startsWith('https://'));
  assert(e.title.length>=8&&e.note.length>=25&&e.locator.length>=6);
  assert.match(e.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
 }
}

const candidates=data.people.filter(p=>Array.isArray(p.claimEvidence)&&p.claimEvidence.length);
assert.equal(candidates.length,7,'Three 2023 and four 2024 witness notes must be present, still unassessed');
assert.equal(candidates.reduce((n,p)=>n+(p.claimEvidence[0].researchEvidence?.items?.length||0),0),27,
 'Seven witness/research notes must retain twenty-seven provisional source/context entries');
const advisory=data.people.find(p=>p.id==='mike-gold');
assert.equal(advisory.claimEvidence[0].claimKind,'policy_recommendation');
assert.equal(data.people.filter(p=>p.claimEvidence?.some(c=>c.claimKind==='policy_recommendation')).length,1);
assert.deepEqual(candidates.map(p=>p.id).sort(),[
 'david-fravor','david-grusch','luis-elizondo','michael-shellenberger',
 'mike-gold','ryan-graves','tim-gallaudet'
]);
for(const p of data.people){
 assert(!Object.hasOwn(p,'believability'),'No person-level believability rating permitted');
 for(const c of p.claimEvidence||[]){
  assert.equal(c.status,'source_review_pending');
  assert.match(c.id,/^[a-z0-9-]+$/);
  assert.notEqual(c.sourceReviewApproved,true);
  assert.equal(c.review,undefined,'Never silently ship person-specific score drafts');
  assert.equal(c.researchEvidence?.status,'research_draft');
  assert.match(c.researchEvidence.editorialNote,/\w/);
  assert(c.researchEvidence.items.length>=3);
  for(const e of c.researchEvidence.items){
   assert.match(e.id,/^[a-z0-9][a-z0-9-]+$/);
   assert.equal(e.access,'public');
   assert(e.url.startsWith('https://'));
   assert(e.locator.length>=3&&e.reviewNote.length>=25);
   assert.match(e.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
  }
  assert(Array.isArray(c.sources)&&c.sources.some(s=>s.kind==='primary'&&s.url.startsWith('https://')));
 }
}
const start=js.indexOf('const EVIDENCE_RUBRIC='),end=js.indexOf('function openPerson(');
assert(start>=0&&end>start);
const snippet=js.slice(start,end);
const host={innerHTML:''};
const safeUrl=value=>{try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const esc=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const validLinks=v=>Array.isArray(v)?v.filter(x=>x&&safeUrl(x.url)).slice(0,30):[];
const ctx={safeUrl,esc,validLinks,$:()=>host};
const fns=vm.runInNewContext(snippet+';({publishedClaimReview,publishedEvidenceTrail,draftEvidenceTrailHtml,renderPublicRoleEvidence,communityClaimEligible,renderClaimEvidence,EVIDENCE_RUBRIC})',ctx,{timeout:1000});
assert.equal(fns.EVIDENCE_RUBRIC.reduce((n,r)=>n+r.max,0),100);
for(const person of roleEntries){
 const sourceHtml=fns.renderPublicRoleEvidence(person);
 assert.match(sourceHtml,/Inspect original role &amp; legislative records/);
 assert.match(sourceHtml,/Read official source/);
 assert.match(sourceHtml,/Not an incident evidence score/);
 assert.doesNotMatch(sourceHtml,/class="claim-score"/);
 assert.doesNotMatch(sourceHtml,/data-rating-save/);
 for(const s of person.roleEvidence.sources){
  assert(sourceHtml.includes(esc(s.title)),'Every public source is in reader-facing HTML');
  assert(sourceHtml.includes(esc(s.locator)),'Reader sees original-page locator');
 }
 host.innerHTML='';
 fns.renderClaimEvidence(person);
 assert.match(host.innerHTML,/Read official source/);
 assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
 assert.doesNotMatch(host.innerHTML,/data-rating-save/);
}
const intactRole=JSON.parse(JSON.stringify(roleEntries[0]));
intactRole.roleEvidence.sources[0].url='javascript:alert(1)';
assert.equal(fns.renderPublicRoleEvidence(intactRole),'',
 'A role with an invalid source fails closed rather than showing partial citations');
const escapedRole=JSON.parse(JSON.stringify(roleEntries[0]));
escapedRole.roleEvidence.title='<img src=x onerror=alert(1)>';
assert.match(fns.renderPublicRoleEvidence(escapedRole),/&lt;img/);
assert.doesNotMatch(fns.renderPublicRoleEvidence(escapedRole),/<img/);
host.innerHTML='';fns.renderClaimEvidence(data.people.find(p=>p.id==='mike-gold'));
assert.match(host.innerHTML,/PUBLIC RESEARCH RECOMMENDATION/);
assert.match(host.innerHTML,/Not applicable/);
assert.match(host.innerHTML,/Read official source/);

for(const p of candidates){
 host.innerHTML='';fns.renderClaimEvidence(p);
 if(p.id==='mike-gold'){
  assert.match(host.innerHTML,/PUBLIC RESEARCH RECOMMENDATION/);
  assert.match(host.innerHTML,/Not applicable/);
  assert.doesNotMatch(host.innerHTML,/Voting not open/);
 }else{
  assert.match(host.innerHTML,/Not assessed/);
  assert.match(host.innerHTML,/Voting not open/);
 }
 assert.match(host.innerHTML,/Research notes — NOT a completed evidence review/);
 assert.match(host.innerHTML,/Read original source/);
 assert.match(host.innerHTML,/Link consulted/);
 assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
 assert.doesNotMatch(host.innerHTML,/data-rating-save/);
}
const tamperedDraft=JSON.parse(JSON.stringify(candidates[0].claimEvidence[0]));
tamperedDraft.researchEvidence.items.push({
 id:'bad-link',type:'primary',stance:'supports',access:'public',
 url:'javascript:alert(1)',title:'Unsafe injected script',locator:'Page 3',
 reviewNote:'This is a synthetic unsafe link and must not appear in public HTML.',checkedAt:'2026-11-15'
});
const blockedHtml=fns.draftEvidenceTrailHtml(tamperedDraft);
assert.doesNotMatch(blockedHtml,/Unsafe injected script/);
assert.doesNotMatch(blockedHtml,/javascript:alert/);
assert.equal(fns.publishedClaimReview(tamperedDraft),null);
host.innerHTML='';fns.renderClaimEvidence(data.people.find(p=>p.id==='mick-west'));assert.match(host.innerHTML,/Not assessed/);assert.doesNotMatch(host.innerHTML,/class="claim-score"/);

const fictional={
 statement:'Fictional evidence review example (this is not a statement by a real person)',
 date:'2026-11-15', context:'Synthetic test only.',
 sources:[{kind:'primary',label:'Fictional record',url:'https://example.org/fictional-record'}],
 review:{
  status:'published',methodology:'dd-claim-evidence-v1',reviewer:'Sample Review Editor',
  reviewedAt:'2026-11-15',
  editorialChecks:{sourceVerified:true,claimContextChecked:true,contraryEvidenceReviewed:true,secondEditorApproved:true},
  points:{original:25,independent:18,direct:17,testable:7,alternatives:5},
  rationale:Object.fromEntries(['original','independent','direct','testable','alternatives'].map(k=>[k,'Fictional reasoning for the '+k+' criterion only'])),
  revision:'2026-demo-v1',
  scopeNote:'Synthetic exercise: review of fictional testimony and technical examples only.',
  limitations:'These are fictional references and therefore prove nothing about any real UAP report.',
  evidenceTrail:[
   {id:'original-record',type:'primary',stance:'context',access:'public',
    url:'https://example.org/fictional-record',title:'Fictional written testimony',
    locator:'Page 2, paragraph 4',checkedAt:'2026-11-15',
    reviewNote:'This is imaginary source text used only to test the primary-record attribution flow.'},
   {id:'supporting-record',type:'records',stance:'supports',access:'public',
    url:'https://example.org/fictional-data',title:'Fictional measurement dataset',
    locator:'Table 3',checkedAt:'2026-11-15',
    reviewNote:'This fabricated dataset merely exercises the display of an independently checkable document.'},
   {id:'alternative-analysis',type:'analysis',stance:'alternative',access:'public',
    url:'https://example.org/fictional-analysis',title:'Fictional competing analysis',
    locator:'Section 5',checkedAt:'2026-11-15',
    reviewNote:'This invented alternative shows that sources challenging a proposed inference can be consulted.'}
  ],
  criterionSources:{
   original:['original-record'],
   independent:['supporting-record'],
   direct:['supporting-record'],
   testable:['original-record'],
   alternatives:['alternative-analysis']
  }
 }
};
assert(fns.publishedClaimReview(fictional));
host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[fictional]});
assert.match(host.innerHTML,/class="claim-score"/);assert.match(host.innerHTML,/72<small>/);
assert.match(host.innerHTML,/View evidence &amp; scoring breakdown/);
assert.match(host.innerHTML,/Inspect original evidence/);
assert.match(host.innerHTML,/Fictional competing analysis/);
assert.match(host.innerHTML,/Table 3/);
assert.match(host.innerHTML,/Evidence considered/);
assert.match(host.innerHTML,/Disclosure Desk rating/);
assert.match(host.innerHTML,/Community rating/);
assert.match(host.innerHTML,/Voting not open/);
const unscoreablePolicy={
 ...fictional,id:'synthetic-policy-example',status:'source_verified',
 sourceReviewApproved:true,claimKind:'policy_recommendation'
};
assert.equal(fns.publishedClaimReview(unscoreablePolicy),null,
 'Even an editor-labelled published review must never score a policy recommendation');
assert.equal(fns.communityClaimEligible(unscoreablePolicy),false);
host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[unscoreablePolicy]});
assert.match(host.innerHTML,/PUBLIC RESEARCH RECOMMENDATION/);
assert.match(host.innerHTML,/Not applicable/);
assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
assert.doesNotMatch(host.innerHTML,/data-rating-save/);
const eligibleFictional={...fictional,id:'fictional-example-2026',status:'source_verified',sourceReviewApproved:true};
assert(fns.communityClaimEligible(eligibleFictional));
host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[eligibleFictional]});
assert.match(host.innerHTML,/data-evidence-claim-id="fictional-example-2026"/);
assert.match(host.innerHTML,/data-rating-save/);
assert(!fns.communityClaimEligible({...eligibleFictional,sourceReviewApproved:false}));
assert(!fns.communityClaimEligible({...eligibleFictional,id:'javascript:alert(1)'}));

for(const mutation of [
 c=>{delete c.review.editorialChecks.secondEditorApproved},
 c=>{c.review.points.independent=31},
 c=>{c.review.rationale.direct='Too short'},
 c=>{c.sources[0].url='javascript:alert(1)'},
 c=>{c.review.reviewer=''},
 c=>{c.review.status='review_pending'},
 c=>{delete c.review.evidenceTrail},
 c=>{c.review.criterionSources.independent=['not-in-evidence']},
 c=>{c.review.evidenceTrail[0].access='restricted'},
 c=>{c.review.evidenceTrail[0].url='javascript:alert(1)'},
 c=>{c.review.evidenceTrail[0].reviewNote='Too short'},
 c=>{c.review.limitations='Insufficient'}
]){
 const bad=JSON.parse(JSON.stringify(fictional));mutation(bad);
 assert.equal(fns.publishedClaimReview(bad),null,'Missing editorial gate must block numerical score');
 host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[bad]});
 assert.match(host.innerHTML,/Not assessed/);assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
}
console.log('Who’s Who: 50 profiles, 7 research claims, 27 roles and 83 item-source references; no personal or premature event scores (NO DEPLOY).');
