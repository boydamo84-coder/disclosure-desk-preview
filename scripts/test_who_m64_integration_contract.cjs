'use strict';
// M64 code and data contract; no real account or Supabase network requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const mod=require('../assets/who-evidence-ballot-m64.js');
const people=JSON.parse(read('data/public-people-directory.json')).people;
const registry=JSON.parse(read('data/who-community-approvals-m64.json'));
const who=read('who-is-who.html'),dir=read('assets/people-directory.js');
const build=read('scripts/build_public_release.cjs'),config=read('assets/community-test-config.js');
assert.equal(people.length,50);
assert.equal(people.flatMap(p=>p.claimEvidence||[]).length,23);
assert.deepEqual(mod.caps.map(x=>[x.id,x.max]),[['original',25],['independent',30],['direct',25],['testable',10],['alternatives',10]]);
assert.deepEqual(mod.validateAnswers({}),{original:null,independent:null,direct:null,testable:null,alternatives:null});
assert.equal(mod.assess({original:0}).subtotal,0);
assert.equal(mod.assess({original:0}).assessedMaximum,25);
assert.equal(mod.assess({original:0}).total,null);
assert.equal(mod.assess({original:0}).unknown,4);
assert.equal(mod.assess({original:25,independent:30,direct:25,testable:10,alternatives:10}).total,100);
assert.equal(mod.assess({original:0,independent:0,direct:0,testable:0,alternatives:0}).total,0);
assert.match(mod.assessmentText(mod.assess({original:0})),/No overall score while incomplete/);
for(const bad of [{original:26},{independent:31},{direct:26},{testable:11},{alternatives:11},{independent:-1},{original:'20'},{testable:1.1},{foo:42}])
 assert.throws(()=>mod.validateAnswers(bad));
assert.equal(registry.schemaVersion,1);
assert.equal(registry.approvedClaims.length,0,'ZERO approved live claim versions');
assert.equal(mod.parseRegistry(registry).size,0);
const fravor=people.find(p=>/david fravor/i.test(p.name));
assert(fravor&&fravor.claimEvidence?.length);
const claim=fravor.claimEvidence.find(c=>c.id&&c.sources?.some(s=>s.kind==='primary'));
assert(claim);
const orig=claim.sources.find(s=>s.kind==='primary').url;
const r={claimId:claim.id,claimVersion:1,statement:claim.statement,originalSourceUrl:orig,
 status:'independently_approved_for_community_criteria',reviewedAt:'2026-11-18',
 leadEditor:'test-lead',independentEditor:'test-second',enabled:true};
assert.equal(mod.parseRegistry({schemaVersion:1,approvedClaims:[r]}).size,1,'Review must pass full gate');
assert(mod.sourceMatches(claim,r),'Exactly attributed original claim in independent registry');
assert(!mod.sourceMatches({...claim,statement:claim.statement+' changed'},r),'Claim text amendment requires version/signoff');
assert(!mod.sourceMatches(claim,{...r,originalSourceUrl:'https://other.example.org/incorrect'}));
assert(!mod.sourceMatches({...claim,claimKind:'policy_recommendation'},r),'No incident vote on policy');
assert(!mod.sourceMatches({...claim,ratingReadiness:{scorePath:'not_applicable_to_incident_score'}},r));
for(const invalid of [
 {...r,independentEditor:'test-lead'},
 {...r,enabled:false},{...r,status:'draft'},
 {...r,originalSourceUrl:'http://invalid.example'},
 {...r,reviewedAt:'not-a-date'},
 {...r,claimVersion:0},
 {...r,statement:'short'},
]){
 assert.equal(mod.parseRegistry({schemaVersion:1,approvedClaims:[invalid]}).size,0,
  'Unreviewed or stale approval must fail closed');
}
assert.equal(mod.enabled(),false,'Node cannot silently enable a user vote');
assert(/whoEvidenceBallots:false/.test(config),'Production/local known-host flag remains explicitly OFF');
assert(!/whoEvidenceBallots:enabled/.test(config));
assert(who.includes('/assets/who-evidence-ballot-m64.css'));
assert(who.includes('/assets/who-evidence-ballot-m64.js'));
assert(who.includes('/assets/community-test-config.js'));
assert(dir.includes('data-evidence-claim-id'));
assert(dir.includes('DDWhoEvidenceM64?.mountForPerson(person,host)'));
assert(build.includes('who-evidence-ballot-m64.js'));
assert(build.includes('who-evidence-ballot-m64.css'));
assert(build.includes('who-community-approvals-m64.json'));
assert(!build.includes('who-m63-vote-model.js')&&!build.includes('who-m63-member-ballot.html'));
assert(!who.includes('dd_who_claim_rating_set'));
assert(!who.includes('@supabase/supabase-js'),'Do not fetch third-party SDK while voting disabled');
assert(!/eval\s*\(|new Function\s*\(/.test(read('assets/who-evidence-ballot-m64.js')));
console.log('M64 CONTRACT PASS: 57 directory profiles retained, 23 dossiers, five criteria exact; approved registry empty; person-policy/changed-source blocked; live flag OFF; new assets public only as inert code.');
