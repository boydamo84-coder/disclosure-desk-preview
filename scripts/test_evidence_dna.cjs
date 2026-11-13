'use strict';
// R2 Evidence DNA source lineage tests. Offline, no account, no Web or deploy.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const dna=require('../assets/evidence-dna.js');
const curated=JSON.parse(fs.readFileSync('data/curated-historical-cases.json','utf8'));
const src=curated.find(r=>r.id==='featured-rendlesham-1980');
assert(src,'Real curated source record is available');
const real=dna.analyse(src);
assert.equal(real.state,'source-inventory-only','Do not invent claim chains for existing source catalogue');
assert.equal(real.trace,null);
assert.match(real.caution,/No source-to-source dependency has been verified/);
assert(real.inventory.items.length>=1,'Real public source references are kept');
assert.equal(dna.canonicalUrl('https://example.org/article/?utm_source=social&part=5#note'),
 'https://example.org/article?part=5','Remove tracking but preserve meaningful query');
assert.equal(dna.canonicalUrl('javascript:alert(1)'),null,'Reject unsafe URL scheme');
const repeated=dna.sourceInventory({
 id:'c',title:'Example',url:'https://example.org/one?utm_campaign=x',
 sources:[
  {title:'Original again',url:'https://example.org/one#section',type:'Source archive'},
  {title:'Other record',url:'https://example.org/two',type:'Publisher link'}
 ]
});
assert.equal(repeated.citations,3);
assert.equal(repeated.items.length,2);
assert.equal(repeated.duplicateReferences,1,'Repeated URLs are not additional evidence');
function doc(id,originStatus='unassessed',originEvidence=null){
 return {id,title:'Document '+id,url:'https://example.org/'+id,originStatus,originEvidence};
}
const valid={
 schemaVersion:1,documents:[
 doc('original','documented-firsthand',{url:'https://example.org/original',locator:'scan p. 2'}),
 doc('article-b'),doc('article-c'),doc('independent','documented-firsthand',{url:'https://example.org/independent',locator:'record 45'})
 ],
 claims:[{id:'claim-1',text:'Synthetic claim about three source reports',documentIds:['article-c','article-b','original']}],
 edges:[
 {from:'article-c',to:'article-b',relation:'derived_from',status:'reviewed',evidence:{url:'https://example.org/article-c',locator:'paragraph 4'}},
 {from:'article-b',to:'original',relation:'repeats',status:'reviewed',evidence:{url:'https://example.org/article-b',locator:'reference 7'}},
 {from:'article-c',to:'independent',relation:'quotes',status:'proposed'}
 ]
};
assert.equal(dna.parseGraph(valid).valid,true);
const trace=dna.traceClaim(valid,'claim-1');
assert.equal(trace.valid,true);
assert.equal(trace.documentCount,3);
assert.equal(trace.reviewedDependencyCount,2,'Transitive dependencies traced');
assert.equal(trace.originCount,1,'Several publications have one explicitly documented source origin');
assert.deepEqual(trace.documentedOriginIds,['original']);
assert.equal(trace.independentWitnessCount,null,'Even a documented original is NOT an independently verified witness count');
assert.equal(trace.status,'traceable');
assert.equal(trace.evidenceEdges.length,2);
const unknown=structuredClone(valid);
unknown.documents[0].originStatus='unassessed';
const unresolved=dna.traceClaim(unknown,'claim-1');
assert.equal(unresolved.originCount,0);
assert.equal(unresolved.status,'partially-unresolved');
assert.deepEqual(unresolved.unresolvedDocuments,['original']);
const missing=structuredClone(valid);
missing.edges[0].evidence.locator='';
assert.equal(dna.parseGraph(missing).valid,false,'Reviewed dependency MUST link to passage/section');
assert.equal(dna.traceClaim(missing,'claim-1').valid,false,'No independence inference from invalid graph');
const proposed=structuredClone(valid);
proposed.edges[0].status='proposed';
const proposedTrace=dna.traceClaim(proposed,'claim-1');
assert(proposedTrace.unresolvedDocuments.includes('article-c'),'Proposed relationship must NOT be traced as verified');
const cycle=structuredClone(valid);
cycle.edges.push({from:'original',to:'article-c',relation:'derived_from',status:'reviewed',
 evidence:{url:'https://example.org/original',locator:'p. 2'}});
const cyc=dna.traceClaim(cycle,'claim-1');
assert.equal(cyc.status,'ambiguous-cycle');
assert.equal(cyc.originCount,null,'Cycle cannot produce confirmed origin count');
const wrong=structuredClone(valid);
wrong.claims[0].documentIds.push('document-never-indexed');
assert.equal(dna.parseGraph(wrong).valid,false);
const add=dna.analyse(src,valid);
assert.equal(add.state,'claim-lineage');
assert.equal(add.claims[0].result.originCount,1);
const homepage=fs.readFileSync('index.html','utf8');
const bundler=fs.readFileSync('scripts/build_public_release.cjs','utf8');
assert(homepage.includes('assets/evidence-dna.js?v=r2-alpha01'),'Public case window loads Evidence DNA module');
assert(homepage.includes('ddEvidenceDNAHtml(r)+'),'Every case detail offers provenance view');
assert(homepage.includes("Independent accounts: not assessed"),'No false corroboration label');
assert(bundler.includes("'evidence-dna.js'"),'Module is explicitly allowed in strict website packaging');
const drafts=JSON.parse(fs.readFileSync('data/evidence-dna-claim-drafts.json','utf8'));
assert.equal(drafts.version,1);
assert.equal(drafts.visibility,'public-editorial-draft');
assert.equal(drafts.cases.length,2,'Only explicitly curated draft case profiles published');
let citationsChecked=0;
for(const profile of drafts.cases){
 const sourceRecord=curated.find(r=>r.id===profile.caseId);
 assert(sourceRecord,'Draft claim graph may only reference a real curated archive case');
 const parsed=dna.parseGraph(profile);
 assert.equal(parsed.valid,true,'Claim graph valid: '+profile.caseId+' '+parsed.issues.join(','));
 assert(profile.claims.length>=2,'At least two source-anchored claims per curated dossier');
 assert.equal(profile.edges.length,0,'No fabricated reviewed source independence');
 for(const claim of parsed.claims){
  assert.equal(claim.editorialStatus,'draft-needs-review','Never imply signed-off editorial proof');
  assert(claim.citations.length>0,'Each claim has an original source citation');
  const result=dna.traceClaim(profile,claim.id);
  assert.equal(result.independentWitnessCount,null,'Citations never imply independent witnesses');
  assert.equal(result.reviewedDependencyCount,0,'No provenance relationship is invented');
  for(const cite of claim.citations){
   assert.equal(cite.reviewStatus,'draft-needs-review');
   assert(cite.locator.length>15,'A precise source section locator is required');
   assert(cite.context.length>30,'Cite the limits of what source proves');
   const citedDocument=profile.documents.find(d=>d.id===cite.documentId);
   assert(citedDocument,'Citation must identify a graph document');
   assert.equal(dna.canonicalUrl(cite.url),dna.canonicalUrl(citedDocument.url));
   citationsChecked++;
  }
 }
 const analysis=dna.analyse(sourceRecord,profile);
 assert.equal(analysis.state,'claim-lineage');
 assert.equal(analysis.claims.length,profile.claims.length);
}
const broken=structuredClone(drafts.cases[0]);
broken.claims[0].citations[0].url='https://example.org/not-the-original';
assert.equal(dna.parseGraph(broken).valid,false,'Wrong source-document link must be rejected');
const missingLocator=structuredClone(drafts.cases[0]);
missingLocator.claims[0].citations[0].locator='';
assert.equal(dna.parseGraph(missingLocator).valid,false,'No made-up source locator');
assert(homepage.includes("data/evidence-dna-claim-drafts.json"),'Archive loader includes dedicated public draft case profiles');
assert(bundler.includes("'evidence-dna-claim-drafts.json'"),'Strict public package explicitly includes the tiny review dataset');
console.log('PASS Evidence DNA claim profiles: '+drafts.cases.length+' curated cases with '+citationsChecked+' exact source pointers, draft-only status, no false corroboration');
console.log('PASS Evidence DNA R2: duplicates, source inventory, verified citation lineage, transitive dependencies, cycles, unreviewed relationships, no false witness count, real archive read-only and integration guards');
