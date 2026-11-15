'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'who-is-who.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/people-directory.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8'));

assert.match(html,/id="profileEvidenceReviews"/);
assert.match(html,/id="claimReviewMethod"/);
assert.match(html,/r2-claim-evidence-v1-20261115/);
assert.match(html,/Statements are attributed/);
assert.match(html,/secondary-editorial-nav\.js/);
assert.match(html,/source trail and editorial checks/);
assert.equal(data.people.length,50,'Existing Who’s Who directory must retain all 50 public profiles');
const candidates=data.people.filter(p=>Array.isArray(p.claimEvidence)&&p.claimEvidence.length);
assert.equal(candidates.length,3,'Only three explicitly attributed, unassessed test entries belong in this milestone');
for(const p of data.people){
 assert(!Object.hasOwn(p,'believability'),'No person-level believability rating permitted');
 for(const c of p.claimEvidence||[]){
  assert.equal(c.status,'source_review_pending');
  assert.equal(c.review,undefined,'Never silently ship person-specific score drafts');
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
const fns=vm.runInNewContext(snippet+';({publishedClaimReview,renderClaimEvidence,EVIDENCE_RUBRIC})',ctx,{timeout:1000});
assert.equal(fns.EVIDENCE_RUBRIC.reduce((n,r)=>n+r.max,0),100);
for(const p of candidates){host.innerHTML='';fns.renderClaimEvidence(p);assert.match(host.innerHTML,/Not assessed/);assert.doesNotMatch(host.innerHTML,/class="claim-score"/);}
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
  rationale:Object.fromEntries(['original','independent','direct','testable','alternatives'].map(k=>[k,'Fictional reasoning for the '+k+' criterion only']))
 }
};
assert(fns.publishedClaimReview(fictional));
host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[fictional]});
assert.match(host.innerHTML,/class="claim-score"/);assert.match(host.innerHTML,/72<small>/);
for(const mutation of [
 c=>{delete c.review.editorialChecks.secondEditorApproved},
 c=>{c.review.points.independent=31},
 c=>{c.review.rationale.direct='Too short'},
 c=>{c.sources[0].url='javascript:alert(1)'},
 c=>{c.review.reviewer=''},
 c=>{c.review.status='review_pending'}
]){
 const bad=JSON.parse(JSON.stringify(fictional));mutation(bad);
 assert.equal(fns.publishedClaimReview(bad),null,'Missing editorial gate must block numerical score');
 host.innerHTML='';fns.renderClaimEvidence({claimEvidence:[bad]});
 assert.match(host.innerHTML,/Not assessed/);assert.doesNotMatch(host.innerHTML,/class="claim-score"/);
}
console.log('Who’s Who source-first claim scoring and 50-profile preservation tests passed (NO deploy).');
