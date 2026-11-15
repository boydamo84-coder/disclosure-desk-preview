'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(html,/id="profileEvidenceReviews"/);
assert.match(html,/id="claimReviewMethod"/);
assert.match(html,/r2-evidence-ledger-v7-20261115/);
assert.match(html,/claim-role-card/);
assert.match(html,/claim-work-card/);
assert.match(home,/all <strong>50 Who's Who people have an expanded source reader/);
assert.match(html,/original-source role records/);
assert.match(html,/View evidence &amp; scoring breakdown/);
assert.match(html,/claim-evidence-details/);
assert.match(html,/Community rating/);
assert.match(html,/Scientific and policy recommendations are Not applicable/);
assert.match(home,/Eighteen source-linked profiles now contain/);
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
const workEntries=data.people.filter(p=>p.publicWorkEvidence);
assert.equal(workEntries.length,17,'17 remaining named people must have original-publication source trails');
assert.equal(workEntries.reduce((n,p)=>n+p.publicWorkEvidence.sources.length,0),37,
 '17 publisher and research source cards must include 37 directly inspectable source entries');
assert.equal(new Set(data.people.filter(p=>p.roleEvidence||p.publicWorkEvidence||p.claimEvidence?.length).map(p=>p.id)).size,50,
 'All 50 original profiles must now have an expanded source reader');
for(const p of workEntries){
 const work=p.publicWorkEvidence;
 assert.equal(work.status,'research_links_indexed');
 assert(work.title.length>=12&&work.description.length>=65&&work.openQuestions.length>=80);
 assert(work.sources.length>=2);
 for(const src of work.sources){
  assert(src.url.startsWith('https://'));
  assert(src.title.length>=12&&src.locator.length>=5&&src.note.length>=45);
  assert.match(src.indexedAt,/^\d{4}-\d{2}-\d{2}$/);
 }
}
assert.match(data.people.find(p=>p.id==='larry-warren').publicWorkEvidence.openQuestions,/Halt/);
assert.equal(data.people.find(p=>p.id==='larry-warren').publicWorkEvidence.sources.length,5);

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
assert.equal(candidates.length,18,'Twelve earlier drafts plus six further public statement and technical model drafts remain unassessed');
assert.equal(candidates.reduce((n,p)=>n+(p.claimEvidence[0].researchEvidence?.items?.length||0),0),66,
 'Eighteen claim drafts must retain sixty-six provisional evidence/context entries');
const newCaseIds=['bob-lazar','jake-barber','larry-warren','mick-west','avi-loeb'];
for(const caseId of newCaseIds){
 const person=data.people.find(p=>p.id===caseId);
 assert.equal(person.claimEvidence?.length,1,`${caseId}: exactly one review-pending event or analysis claim`);
 assert.equal(person.claimEvidence[0].status,'source_review_pending');
 assert.equal(person.claimEvidence[0].researchEvidence?.status,'research_draft');
 assert(person.claimEvidence[0].researchEvidence.items.length>=3);
 assert(person.publicWorkEvidence,'Retain original publications panel alongside claim-specific review');
 assert(!person.claimEvidence[0].review,'No real numeric review allowed before separate editorial sign-off');
}
assert(data.people.find(p=>p.id==='avi-loeb').claimEvidence[0].researchEvidence.items.some(e=>e.stance==='challenges'),'Loeb chemistry must include independent 2025 chemical critique');
assert(data.people.find(p=>p.id==='larry-warren').claimEvidence[0].researchEvidence.items.some(e=>/Halt/i.test(e.title)),'Rendlesham opposing account preserved');
assert(data.people.find(p=>p.id==='mick-west').claimEvidence[0].researchEvidence.items.some(e=>e.stance==='challenges'),'Gimbal alternate interpretation preserved');
assert(data.people.filter(p=>p.claimEvidence?.some(c=>c.review?.status==='published')).length===0,'Never display a real-person editorial percentage before review');
const newNextIds=['ross-coulthart','jeremy-corbell','steven-greer','garry-nolan','jacques-vallee','kevin-knuth'];
for(const caseId of newNextIds){
 const person=data.people.find(p=>p.id===caseId);
 assert.equal(person.claimEvidence?.length,1,`${caseId}: one specifically attributed source review`);
 assert.equal(person.claimEvidence[0].status,'source_review_pending');
 assert.equal(person.claimEvidence[0].researchEvidence?.status,'research_draft');
 assert(person.claimEvidence[0].researchEvidence.items.length>=3);
 assert(person.publicWorkEvidence,'Keep existing professional source reader');
 assert(!person.claimEvidence[0].review,'No signed off editorial percentage may be included');
}
const nolanClaim=data.people.find(p=>p.id==='garry-nolan').claimEvidence[0];
const valleeClaim=data.people.find(p=>p.id==='jacques-vallee').claimEvidence[0];
assert.equal(nolanClaim.sources[0].url,valleeClaim.sources[0].url,'Shared journal paper must match: not independent reproductions');
assert(nolanClaim.researchEvidence.editorialNote.includes('duplicate Jacques Vallée') || nolanClaim.researchEvidence.editorialNote.includes('same'), 'Nolan review must explicitly prevent duplicated study');
assert(valleeClaim.researchEvidence.editorialNote.includes('Nolan'), 'Vallée review identifies same study');
assert(data.people.find(p=>p.id==='ross-coulthart').claimEvidence[0].researchEvidence.items.some(s=>s.stance==='challenges'),'Original Australian critique not omitted');
assert(data.people.find(p=>p.id==='jeremy-corbell').claimEvidence[0].researchEvidence.items.some(s=>s.reviewNote.includes('did not')||s.reviewNote.includes('not establish')),'Navy video provenance versus technology must be distinguished');
assert(data.people.find(p=>p.id==='kevin-knuth').claimEvidence[0].researchEvidence.items.some(s=>s.url.includes('mdpi.com/1099-4300')),'Original accessible journal paper required');
assert(!data.people.some(p=>(p.claimEvidence||[]).some(c=>c.review?.status==='published')),'No real scores are released');
const advisory=data.people.find(p=>p.id==='mike-gold');
assert.equal(advisory.claimEvidence[0].claimKind,'policy_recommendation');
assert.equal(data.people.filter(p=>p.claimEvidence?.some(c=>c.claimKind==='policy_recommendation')).length,1);
assert.deepEqual(candidates.map(p=>p.id).sort(),[
 'avi-loeb','bob-lazar','david-fravor','david-grusch','garry-nolan','jacques-vallee','jake-barber','jeremy-corbell','kevin-knuth','larry-warren','luis-elizondo','michael-shellenberger','mick-west','mike-gold','ross-coulthart','ryan-graves','steven-greer','tim-gallaudet'
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
const fns=vm.runInNewContext(snippet+';({publishedClaimReview,publishedEvidenceTrail,draftEvidenceTrailHtml,renderPublicRoleEvidence,renderPublicWorkEvidence,communityClaimEligible,renderClaimEvidence,EVIDENCE_RUBRIC})',ctx,{timeout:1000});
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
for(const person of workEntries){
 const htmlWork=fns.renderPublicWorkEvidence(person);
 assert.match(htmlWork,/Inspect original publications &amp; source trail/);
 assert.match(htmlWork,/NOT an approved case assessment/);
 assert.match(htmlWork,/Open cited publication or archive/);
 assert.doesNotMatch(htmlWork,/class="claim-score"/);
 assert.doesNotMatch(htmlWork,/data-rating-save/);
 for(const src of person.publicWorkEvidence.sources){
  assert(htmlWork.includes(esc(src.title)));
  assert(htmlWork.includes(esc(src.locator)));
  assert(htmlWork.includes(esc(src.note)));
 }
 host.innerHTML='';fns.renderClaimEvidence(person);
 assert.match(host.innerHTML,/Not assessed/);
 assert.match(host.innerHTML,/Open cited publication or archive/);
 assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
 assert.doesNotMatch(host.innerHTML,/data-rating-save/);
}
const invalidWork=JSON.parse(JSON.stringify(workEntries[0]));
invalidWork.publicWorkEvidence.sources[0].url='javascript:alert(1)';
assert.equal(fns.renderPublicWorkEvidence(invalidWork),'',
 'Work source records with one invalid source fail closed, not rendered as verified');
const injectedWork=JSON.parse(JSON.stringify(workEntries[0]));
injectedWork.publicWorkEvidence.title='<img src=x onerror=alert(1)>';
assert.match(fns.renderPublicWorkEvidence(injectedWork),/&lt;img/);
assert.doesNotMatch(fns.renderPublicWorkEvidence(injectedWork),/<img/);
const inheritedKindWork=JSON.parse(JSON.stringify(workEntries[0]));
inheritedKindWork.publicWorkEvidence.kind='constructor';
assert.equal(fns.renderPublicWorkEvidence(inheritedKindWork),'',
 'Inherited JavaScript prototype names are not valid source-category kinds');
const inheritedSource=JSON.parse(JSON.stringify(workEntries[0]));
inheritedSource.publicWorkEvidence.sources[0].sourceClass='toString';
assert.equal(fns.renderPublicWorkEvidence(inheritedSource),'',
 'Inherited JavaScript prototype names are not source classes');
const inheritedRole=JSON.parse(JSON.stringify(roleEntries[0]));
inheritedRole.roleEvidence.kind='constructor';
assert.equal(fns.renderPublicRoleEvidence(inheritedRole),'',
 'Inherited property names are not official NASA/congressional role types');
const emptyLinksWork=JSON.parse(JSON.stringify(workEntries[0]));
emptyLinksWork.publicWorkEvidence.sources=[];
assert.equal(fns.renderPublicWorkEvidence(emptyLinksWork),'');
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
console.log('Who’s Who: 50 expanded profiles, 27 role cards, 18 draft claims, 17 work records, 159 source entries, zero personal or premature event scores (NO DEPLOY).');
