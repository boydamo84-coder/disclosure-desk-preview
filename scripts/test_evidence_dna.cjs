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
// R2 M5: comparison is a review aid, never a verdict about human honesty.
for (const profile of drafts.cases) {
 const [first,second]=profile.claims;
 const compared=dna.compareClaims(profile,first.id,second.id);
 assert.equal(compared.valid,true,'Two cited claims can be inspected side by side');
 assert.equal(compared.status,'human-comparison-only');
 assert.equal(compared.contradictionEstablished,false,'Comparing wording cannot establish contradiction');
 assert.equal(compared.independentCorroborationEstablished,false,'Two citations cannot prove independence');
 assert.equal(compared.first.editorialStatus,'draft-needs-review');
 assert.equal(compared.second.editorialStatus,'draft-needs-review');
 assert(compared.first.citations[0].locator && compared.second.citations[0].context,
  'Both original locations and limitations remain available');
 assert.match(compared.caution,/not verbatim quotations/i);
 assert.equal(compared.sharedSourceUrls.length,profile.caseId==='featured-rendlesham-1980'?1:0,
  'Same archival webpage must be recognized without inferring independent verification');
 assert.equal(dna.compareClaims(profile,first.id,first.id).valid,false,'Cannot compare a claim to itself');
 assert.equal(dna.compareClaims(profile,first.id,'nonexistent').valid,false,'Unknown claim is rejected');
}
const uncited=structuredClone(drafts.cases[0]);
uncited.claims[0].citations=[];
assert.equal(dna.compareClaims(uncited,uncited.claims[0].id,uncited.claims[1].id).valid,false,
 'Uncited editorial claim cannot enter the comparison panel');
assert.equal(dna.compareClaims(broken,broken.claims[0].id,broken.claims[1].id).valid,false,
 'Misattributed/invalid citation blocks the radar');
assert(homepage.includes('dd-contradiction-radar')&&homepage.includes('ddRadarSideHtml(pair.first'),
 'Existing archive detail contains a source-linked two-column comparison, not a new tab');
// M6: researcher selection can cross case boundaries but never imply related events.
const picked=dna.compareSelections(drafts.cases,
 {caseId:'featured-rendlesham-1980',claimId:'rendlesham-record-scope'},
 {caseId:'featured-roswell-1947',claimId:'roswell-gao-review'});
assert.equal(picked.valid,true,'Cross-case statement selection supported');
assert.equal(picked.first.caseId,'featured-rendlesham-1980');
assert.equal(picked.second.caseId,'featured-roswell-1947');
assert.equal(picked.sharedSourceUrls.length,0,'Different source pages are not independent witnesses');
assert.equal(picked.contradictionEstablished,false);
assert.equal(picked.independentCorroborationEstablished,false);
assert.equal(dna.compareSelections(drafts.cases,
 {caseId:'featured-roswell-1947',claimId:'roswell-bluebook-records'},
 {caseId:'featured-roswell-1947',claimId:'roswell-bluebook-records'}).valid,false,'Self-comparison must be rejected');
assert.equal(dna.compareSelections(drafts.cases,
 {caseId:'featured-roswell-1947',claimId:'does-not-exist'},
 {caseId:'featured-rendlesham-1980',claimId:'rendlesham-record-scope'}).valid,false,'Unknown claims rejected');
assert.equal(dna.compareSelections([uncited,...drafts.cases.slice(1)],
 {caseId:'featured-rendlesham-1980',claimId:'rendlesham-record-scope'},
 {caseId:'featured-roswell-1947',claimId:'roswell-gao-review'}).valid,false,'Uncited selections blocked');
assert(homepage.includes('data-radar-pick="a"')&&homepage.includes('data-radar-pick="b"')&&
 homepage.includes('data-radar-compare')&&homepage.includes('ddRadarResultHtml(result)'),
 'Researcher comparison UI has two explicit selections and live results');
// M7: source-only graph: case -> editorial statement -> cited original page.
const onlyRend=dna.buildRelationshipGraph(drafts.cases,'featured-rendlesham-1980');
assert.equal(onlyRend.valid,true);
assert.equal(onlyRend.caseCount,1);
assert.equal(onlyRend.claimCount,2);
assert.equal(onlyRend.documentCount,1,'Shared National Archives page is one source, not two witnesses');
assert.equal(onlyRend.edges.filter(e=>e.relation==='catalogues-editorial-summary').length,2);
assert.equal(onlyRend.edges.filter(e=>e.relation==='cites-source-page').length,2);
assert.equal(onlyRend.independentWitnessCount,null);
assert.equal(onlyRend.verifiedCaseToCaseEdges,0);
const allPublic=dna.buildRelationshipGraph(drafts.cases,'all');
assert.equal(allPublic.valid,true);
assert.equal(allPublic.caseCount,2);
assert.equal(allPublic.claimCount,4);
assert.equal(allPublic.documentCount,3);
assert.equal(allPublic.nodes.length,9);
assert.equal(allPublic.edges.length,8);
assert(!allPublic.edges.some(e=>e.from.startsWith('case:')&&e.to.startsWith('case:')),
 'No invented relationship between distinct UAP incidents');
for(const edge of allPublic.edges.filter(e=>e.relation==='cites-source-page')){
 assert(edge.evidence?.url?.startsWith('https://')&&edge.evidence.locator,
  'Every claim-to-source link retains original URL and exact locator');
 assert.equal(edge.reviewStatus,'draft-needs-review','Citation link is not verified event evidence');
}
assert.equal(dna.buildRelationshipGraph(drafts.cases,'unknown-case').nodes.length,0);
const invalidGraph=dna.buildRelationshipGraph([broken],'all');
assert.equal(invalidGraph.valid,false,'Invalid provenance graph must fail closed');
assert.equal(invalidGraph.nodes.length,0);
assert(homepage.includes('dd-evidence-graph')&&homepage.includes('data-graph-mode')&&
 homepage.includes('ddEvidenceGraphHtml(control.value,record)')&&homepage.includes('Readable source relationship list'),
 'Native archive modal has visual graph, selectable scope and accessible source list');
console.log('PASS M7 graph: 2 public cases, 4 editorial claims, 3 unique source pages, 8 sourced/context edges; no fabricated connections');
console.log('PASS M6 selectable comparisons: cross-case citations, invalid/self/uncited rejection, no inferred case connection');
console.log('PASS Contradiction Radar comparison-only alpha: shared-source distinction, exact locators, no invented contradiction/independent witnesses');
console.log('PASS Evidence DNA claim profiles: '+drafts.cases.length+' curated cases with '+citationsChecked+' exact source pointers, draft-only status, no false corroboration');
console.log('PASS Evidence DNA R2: duplicates, source inventory, verified citation lineage, transitive dependencies, cycles, unreviewed relationships, no false witness count, real archive read-only and integration guards');
