'use strict';
// R2 M8 — public person/case roles are source-attributed, NOT event validation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const dna=require('../assets/evidence-dna.js');
const roles=require('../assets/person-case-links.js');
const raw=JSON.parse(fs.readFileSync('data/public-person-case-links.json','utf8'));
const people=JSON.parse(fs.readFileSync('data/public-people-directory.json','utf8'));
const cases=JSON.parse(fs.readFileSync('data/curated-historical-cases.json','utf8'));
const claims=JSON.parse(fs.readFileSync('data/evidence-dna-claim-drafts.json','utf8'));
const valid=roles.parse(raw,{personIds:people.people.map(p=>p.id),caseIds:cases.map(c=>c.id)});
assert.equal(valid.valid,true,'Curated public ledger requires known people and case IDs');
assert.equal(valid.links.length,3,'Only three individually sourced, draft relationships');
assert.equal(roles.byCase(valid,'featured-rendlesham-1980').length,2);
assert.equal(roles.byCase(valid,'featured-nimitz-2004').length,1);
assert.equal(roles.byCase(valid,'featured-roswell-1947').length,0,'No invented Roswell person association');
assert.equal(roles.byPerson(valid,'david-fravor')[0].role,'firsthand-statement');
assert.equal(roles.byPerson(valid,'nick-pope')[0].role,'published-commentary');
assert.equal(roles.byPerson(valid,'larry-warren')[0].role,'retrospective-claim');
assert.equal(roles.byPerson(valid,'david-grusch').length,0);
for(const link of valid.links){
 const p=people.people.find(p=>p.id===link.personId);
 const sourceLinks=[...p.sources.map(x=>x.url),...p.milestones.map(x=>x.source),
  ...p.articles.map(x=>x.url)];
 assert(sourceLinks.includes(link.source.url),'Cited role source must also be present in the existing person profile: '+link.personId);
 assert.equal(link.eventVerified,false,'Never turn speaker/author identification into event authentication');
 assert.equal(link.reviewStatus,'editorial-draft','Human editorial review mandatory');
 assert(link.source.url.startsWith('https://')&&link.source.locator.length>=20);
 assert(link.context.length>=70,'Preserve important interpretation caveats');
}
const graph=dna.buildRelationshipGraph(claims.cases,'all',valid.links);
assert.equal(graph.valid,true);
assert.equal(graph.caseCount,3,'Nimitz added as documented public role case, not an invented claim');
assert.equal(graph.personCount,3);
assert.equal(graph.claimCount,4,'No new unsupported historical claims');
assert.equal(graph.documentCount,6,'Three previously cited sources plus three attribution sources');
assert.equal(graph.edges.length,14,'Eight original claim edges and six cited involvement/source edges');
assert.equal(graph.nodes.length,16);
assert.equal(graph.verifiedCaseToCaseEdges,0,'No two incidents connected just because a person is listed');
assert.equal(graph.independentWitnessCount,null);
assert.equal(graph.edges.filter(e=>e.relation==='attributed-public-involvement').length,3);
assert.equal(graph.edges.filter(e=>e.relation==='attribution-source-page').length,3);
for(const e of graph.edges.filter(e=>e.relation.startsWith('attributed')||e.relation==='attribution-source-page')){
 assert.equal(e.reviewStatus,'editorial-draft');
 assert(e.evidence.url.startsWith('https://')&&e.evidence.locator);
}
const nimitz=dna.buildRelationshipGraph(claims.cases,'featured-nimitz-2004',valid.links);
assert.equal(nimitz.caseCount,1);
assert.equal(nimitz.personCount,1);
assert.equal(nimitz.documentCount,1);
assert.equal(nimitz.claimCount,0,'No Nimitz claim is invented just to populate the graph');
const tampered=structuredClone(raw);
tampered.links[0].eventVerified=true;
assert.equal(roles.parse(tampered).valid,false,'Reject claims of verified event truth');
assert.equal(roles.parse(tampered).links.length,0,'Fail closed entirely on bad data');
const missing=structuredClone(raw);
missing.links[1].source.locator='';
assert.equal(roles.parse(missing).valid,false,'Reject links with no source locator');
const malicious=structuredClone(raw);
malicious.links[0].source.url='javascript:alert(1)';
assert.equal(roles.parse(malicious).valid,false,'Reject unsafe source URL');
const unknown=structuredClone(raw);
unknown.links[0].personId='person-not-in-directory';
assert.equal(roles.parse(unknown,{personIds:people.people.map(p=>p.id)}).valid,false);
const duplicate=structuredClone(raw);
duplicate.links.push(duplicate.links[0]);
assert.equal(roles.parse(duplicate).valid,false,'No duplicate edge inflation');
const home=fs.readFileSync('index.html','utf8');
const directory=fs.readFileSync('who-is-who.html','utf8');
const app=fs.readFileSync('assets/people-directory.js','utf8');
const bundle=fs.readFileSync('scripts/build_public_release.cjs','utf8');
for(const x of ["assets/person-case-links.js","data/public-person-case-links.json"])
 assert(bundle.includes(x.split('/')[1]),'Strict public package must explicitly allow '+x);
assert(home.includes('ddLoadPersonCaseLinks()')&&home.includes('dd-case-people')&&
 home.includes('ddPersonCaseLedger.links')&&home.includes('ddPendingArchiveCase'));
assert(directory.includes('person-case-links.js')&&app.includes('dd-person-case-link'));
console.log('PASS R2 M8: 3 cited attributable roles, 3 cases, 3 people, 6 original source pages, no fabricated event or witness conclusions');
