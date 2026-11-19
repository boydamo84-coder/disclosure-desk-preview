'use strict';
// M76 private worksheet is NOT a ballot and creates no server-side scores.
const assert=require('node:assert/strict'),fs=require('node:fs');
const w=require('../assets/who-private-worksheet-m76.js');
const read=p=>fs.readFileSync(p,'utf8');
const rows=JSON.parse(read('data/public-people-directory.json')).people;
const all=rows.flatMap(x=>x.claimEvidence||[]);
const eligible=all.filter(w.eligible);
assert.equal(rows.length,50,'M76 uses 50 original source-first research profiles');
assert.equal(all.length,23,'Original attributed source dossiers preserved');
assert.equal(eligible.length,5,'Initial worksheet only for five incident/observation claims');
assert(eligible.some(x=>x.id==='fravor-2023-house-2004-encounter'));
for(const c of all.filter(x=>x.ratingReadiness?.claimType!=='incident_or_observation'))
 assert.equal(w.eligible(c),false,'No numerical policy, technical, person or reporting judgement');
assert.equal(w.eligible({...eligible[0],sources:[{kind:'primary',url:'javascript:alert(1)'}]}),false);
assert.equal(w.eligible({...eligible[0],claimKind:'policy_recommendation'}),false);
assert.deepEqual(w.criteria.map(x=>x.max),[25,30,25,10,10]);
assert.equal(w.assess({}).total,null);
assert.equal(w.assess({}).unknown,5);
assert.equal(w.assess({original:0}).points,0);
assert.equal(w.assess({original:0}).answered,1);
assert.equal(w.assess({original:0}).maximum,25);
assert.equal(w.assess({original:0}).total,null);
assert.equal(w.assess({original:0}).unknown,4);
assert.equal(w.assess({original:0,independent:30,direct:25,testable:10,alternatives:10}).total,75);
assert.equal(w.assess({original:0,independent:0,direct:0,testable:0,alternatives:0}).total,0);
assert.equal(w.assess({original:null,independent:0}).unknown,4);
assert.match(w.report(w.assess({original:0})),/No overall score while incomplete/);
assert.match(w.report(w.assess({})),/No overall score/);
assert.match(w.report(w.assess({original:25,independent:30,direct:25,testable:10,alternatives:10})),/100 \/ 100/);
for(const bad of [{original:26},{independent:31},{testable:11},{direct:-1},{original:'0'},{alternatives:0.5},{wrong:1},null,[]])
 assert.throws(()=>w.assess(bad));
const js=read('assets/who-private-worksheet-m76.js');
const html=read('who-is-who.html');
const people=read('assets/people-directory.js');
const builder=read('scripts/build_public_release.cjs');
const cfg=read('assets/community-test-config.js');
const ad=read('assets/site-adsterra-m02.js');
for(const name of ['fetch(','XMLHttpRequest','navigator.sendBeacon','localStorage','sessionStorage','indexedDB','WebSocket','createClient(','form.submit('])
 assert(!js.includes(name),'Worksheet cannot make network or storage requests: '+name);
assert(html.includes('/assets/who-private-worksheet-m76.js?v=m76-local-only'));
assert(html.indexOf('who-private-worksheet-m76.js')<html.indexOf('/assets/people-directory.js?v='));
assert(people.includes('window.DDWhoPrivateWorksheetM76?.mountForPerson(person,host)'));
assert(builder.includes("'who-private-worksheet-m76.js'"));
assert(!html.includes('who-evidence-ballot-m64.js'),'Do not ship M64 client voting');
assert(!builder.includes('who-community-approvals-m64.json'),'Do not ship claim approval registry');
assert(cfg.includes('whoEvidenceBallots:false'));
assert(ad.includes('const RELEASE_ENABLED=false;'));
console.log('M76 PASS: 5/23 source-backed incidents eligible for PRIVATE worksheet, zero≠Unknown, partial no total, no network/storage/votes/ads');
