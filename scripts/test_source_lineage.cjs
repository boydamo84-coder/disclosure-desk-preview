'use strict';
// R2 M9: source-to-source reference != reused reporting != independent witness.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const dna=require('../assets/evidence-dna.js');
const drafts=JSON.parse(fs.readFileSync('data/evidence-dna-claim-drafts.json','utf8'));
const people=JSON.parse(fs.readFileSync('data/public-person-case-links.json','utf8'));
const roles=require('../assets/person-case-links.js').parse(people);
assert.equal(roles.valid,true);
const roswell=drafts.cases.find(c=>c.caseId==='featured-roswell-1947');
const rendlesham=drafts.cases.find(c=>c.caseId==='featured-rendlesham-1980');
assert(roswell&&rendlesham);
const parsed=dna.parseGraph(roswell);
assert.equal(parsed.valid,true,'Source-linked Roswell draft passes document-precise provenance rules');
assert.equal(parsed.edges.length,1,'Exactly one original-source confirmed public reference');
assert.equal(parsed.edges[0].relation,'mentions','NARA text references GAO, not a proven repost');
assert.equal(parsed.edges[0].status,'reviewed','The reference wording has been checked in NARA');
assert.equal(parsed.edges[0].from,'nara-bluebook-roswell');
assert.equal(parsed.edges[0].to,'gao-roswell-1995');
const audit=dna.sourceLineageAudit(roswell);
assert.equal(audit.valid,true);
assert.equal(audit.documents.length,2);
assert.equal(audit.reviewedReferenceCount,1);
assert.equal(audit.reviewedDependencyCount,0,'A mention is NOT evidence of copied reporting');
assert.equal(audit.copyingEstablished,false);
assert.equal(audit.unreviewedCandidateCount,0);
assert.equal(audit.unresolvedDocuments.length,2,'Both documents lack proven original-report chains');
assert.equal(audit.independentWitnessCount,null,'Do not invent corroborating eyewitnesses');
assert.equal(audit.firstHandDocuments.length,0);
assert.match(audit.caution,/not establish copied reporting|not.*copied/i);
assert.equal(audit.reviewedReferences[0].evidence.url,
 'https://www.archives.gov/research/military/air-force/ufos');
assert.match(audit.reviewedReferences[0].evidence.locator,/The Roswell Incident/);
assert.match(audit.reviewedReferences[0].evidence.context,/NOT evidence/i);
assert.equal(dna.traceClaim(roswell,'roswell-bluebook-records').reviewedDependencyCount,0,
 "NARA’s checked GAO mention is not an upstream derivation");
const original=dna.sourceLineageAudit(rendlesham);
assert.equal(original.valid,true);
assert.equal(original.reviewedReferenceCount,0);
assert.equal(original.reviewedDependencyCount,0);
assert.equal(original.unresolvedDocuments.length,1);
const graph=dna.buildRelationshipGraph(drafts.cases,'all',roles.links);
assert.equal(graph.nodes.length,16,'Existing M8 graph nodes remain intact');
assert.equal(graph.edges.length,15,'One exact checked reference in addition to M8 edges');
assert.equal(graph.reviewedSourceReferences,1);
assert.equal(graph.reviewedReuseDependencies,0);
const mention=graph.edges.find(e=>e.relation==='mentions');
assert(mention&&mention.reviewStatus==='reviewed');
assert.match(mention.evidence.locator,/The Roswell Incident/);
assert(graph.nodes.some(n=>n.id===mention.from&&n.type==='document'));
assert(graph.nodes.some(n=>n.id===mention.to&&n.type==='document'));
assert.equal(graph.verifiedCaseToCaseEdges,0);
assert.equal(graph.independentWitnessCount,null);
assert.equal(dna.buildRelationshipGraph(drafts.cases,'featured-roswell-1947').reviewedSourceReferences,1,
 'Only the Roswell case has the checked NARA→GAO source reference');
assert.equal(dna.buildRelationshipGraph(drafts.cases,'featured-rendlesham-1980').reviewedSourceReferences,0,
 'Rendlesham source references stay explicitly unassessed');

// Synthetic: only literal reviewed re-use can create a real dependency chain.
const example={schemaVersion:1,documents:[
 {id:'original',title:'Original scanned note',url:'https://example.org/scan',originStatus:'unassessed'},
 {id:'middle',title:'Later report',url:'https://example.org/middle',originStatus:'unassessed'},
 {id:'new',title:'Newsletter',url:'https://example.org/new',originStatus:'unassessed'}
],claims:[{id:'synthetic',text:'A synthetic description of source re-use, not an event',documentIds:['new','middle','original'],
 citations:[{documentId:'new',url:'https://example.org/new',locator:'para 4',context:'synthetic data'}]}],
 edges:[
  {from:'new',to:'middle',relation:'repeats',status:'reviewed',
   evidence:{url:'https://example.org/new',locator:'Newsletter: source credit, paragraph 4'}},
  {from:'middle',to:'original',relation:'derived_from',status:'reviewed',
   evidence:{url:'https://example.org/middle',locator:'Bibliography: note 2'}},
  {from:'new',to:'original',relation:'mentions',status:'proposed'}
]};
const reviewed=dna.sourceLineageAudit(example);
assert.equal(reviewed.valid,true);
assert.equal(reviewed.reviewedDependencyCount,2);
assert.equal(reviewed.reviewedReferenceCount,0);
assert.equal(reviewed.unreviewedCandidateCount,1);
assert.equal(reviewed.copyingEstablished,true,'Only attributed reviewed reuse/derivation is tracked');
assert.equal(reviewed.independentWitnessCount,null);
const tampered=structuredClone(example);
tampered.edges[0].evidence.url='https://example.org/unrelated';
assert.equal(dna.sourceLineageAudit(tampered).valid,false,'Third party cannot masquerade as document citing the source');
const missing=structuredClone(example);
missing.edges[0].evidence.locator='';
assert.equal(dna.parseGraph(missing).valid,false,'No reviewed relationship without page/section locator');
const noDocs=dna.sourceLineageAudit({schemaVersion:2,documents:[],claims:[],edges:[]});
assert.equal(noDocs.valid,false);
assert.equal(noDocs.reviewedReferences.length,0);
const home=fs.readFileSync('index.html','utf8');
assert(home.includes('dd-source-lineage-desk')&&home.includes('ddSourceLineageHtml(lineageAudit)'));
assert(home.includes('data-lineage-summary')&&home.includes('Independent witnesses: unknown'));
assert(home.includes('data.reviewedSourceReferences')&&home.includes('data.reviewedReuseDependencies'));
console.log('PASS R2 M9 source lineage: 1 exact checked NARA reference to GAO, 0 copied-report dependencies, 2 unassessed Roswell origins, 0 inferred witnesses; synthetic reviewed chains, bad citations and source graph invariants');
