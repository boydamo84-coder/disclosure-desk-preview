'use strict';
// Exercise the actual staged-profile loader and publication renderer, including
// duplicate, malformed and unsafe supplementary records. No accounts or network.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const main=JSON.parse(read('data/public-people-directory.json')).people;
const extra=JSON.parse(read('data/public-people-directory-additions-m58.json'));
const js=read('assets/people-directory.js');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{try{const u=new URL(String(v));return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}};
const render=js.slice(js.indexOf('const PUBLIC_ROLE_KINDS='),js.indexOf('function renderEvidenceScope('));
const merge=js.slice(js.indexOf('const STAGED_PROFILE_IDS='),js.indexOf("$('peopleSearch').addEventListener"));
const f=vm.runInNewContext(render+merge+';({appendStagedProfiles,renderPublicWorkEvidence,renderPublicRoleEvidence})',{safeUrl,esc},{timeout:2000});
const newIds=['robert-bigelow','john-lear','james-lacatski','j-allen-hynek','stanton-friedman','alex-dietrich'];
const original=JSON.stringify(main);
const all=f.appendStagedProfiles(main,extra);
assert.equal(all.length,57);
assert.equal(new Set(all.map(p=>p.id)).size,57);
assert.equal(JSON.stringify(main),original,'Loader must not modify the base directory');
assert.equal(main.flatMap(p=>p.claimEvidence||[]).length,23);
assert.equal(extra.additionalPeopleCount,7);
for(const id of newIds){
 const p=all.find(p=>p.id===id);assert(p,'Missing '+id);
 const html=f.renderPublicWorkEvidence(p);
 assert(html.includes('<article'),'Actual source-reader rendering required');
 assert.equal((html.match(/Open cited publication or archive/g)||[]).length,p.publicWorkEvidence.sources.length);
 assert(!/data-rating-save|data-evidence-claim-id|class="claim-score"|0–100/.test(html));
 assert.equal(p.photo,null);assert.equal(p.claimEvidence,undefined);
 assert(p.biography.length>=4&&p.milestones.length>=4);
 for(const source of p.publicWorkEvidence.sources){
  assert(safeUrl(source.url));assert(source.locator.length>=5);assert(source.note.length>=45);
 }
 assert.equal(p.profileResearchReview.independentHumanSignoff,false);
}
const only=person=>({schemaVersion:1,people:[person]});
const good=extra.people.find(p=>p.id==='alex-dietrich');
const clone=()=>JSON.parse(JSON.stringify(good));
assert.equal(f.appendStagedProfiles(main,null).length,50);
assert.equal(f.appendStagedProfiles(main,{schemaVersion:2,people:extra.people}).length,50);
assert.equal(f.appendStagedProfiles(main,{schemaVersion:1,people:[good,good]}).length,51,'Duplicate must not inflate count');
for(const change of [
 p=>p.id='unreviewed-person',p=>p.id='david-fravor',p=>p.name='',
 p=>p.sources[0].url='javascript:alert(1)',p=>p.milestones[0].source='https://user:pass@example.com',
 p=>p.biography=[],p=>p.photo={url:'https://example.com/photo.jpg'},
 p=>p.profileResearchReview.status='unreviewed',p=>p.claimEvidence=[],p=>p.score=80,
 p=>p.publicWorkEvidence.sources[0].url='http://example.com',
 p=>p.publicWorkEvidence.sources[0].note='',
]){const p=clone();change(p);assert.equal(f.appendStagedProfiles(main,only(p)).length,50,'Invalid record admitted');}
const escaped=clone();escaped.name='<img src=x onerror=alert(1)>';
escaped.publicWorkEvidence.title='<img src=x onerror=alert(1)> source';
const html=f.renderPublicWorkEvidence(escaped);
assert(!html.includes('<img'),'Source labels must remain escaped');
assert(html.includes('&lt;img'));
const learner=extra.people.find(p=>p.id==='john-lear');
assert(learner.biography.some(s=>s.includes('no transcript')));
assert(extra.people.find(p=>p.id==='james-lacatski').biography.some(s=>s.includes('factual accuracy')));
assert(good.context.includes('same encounter'));
const audit=JSON.parse(read('data/who-m60-profile-source-audit.json'));
assert.equal(audit.profiles.length,6);
assert.equal(audit.sourceCount,Object.keys(audit.sources).length);
assert(audit.sources.northwestern.access.includes('403'));
assert(audit.sources.dietrich_cbs.access.includes('limited'));
console.log('M60 PASS: 57 staged profiles, six populated source readers, original 50/23 preserved, unsafe/duplicate/unreviewed entries rejected, no editorial scores or submissions.');
