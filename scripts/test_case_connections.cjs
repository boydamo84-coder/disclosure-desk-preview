'use strict';
// Read-only Case Connections engine tests: real curated input and 12k synthetic entries.
// No private witness information, remote network, AI inference or deployment.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('../assets/case-connections.js');
const original=JSON.parse(fs.readFileSync('data/curated-historical-cases.json','utf8'));
const input=[
 {id:'a',title:'Triangular lights above Riverton',description:'Three unusual triangular lights moving silently',year:2004,kind:'Witness report',category:'Lights',city:'Riverton, Suffolk',lat:52.08,lon:1.43,url:'https://example.org/a'},
 {id:'b',title:'Riverton triangular lights reported',description:'Silent triangular lights recorded by different witness',year:2005,kind:'Witness report',category:'Lights',city:'Riverton, Suffolk',lat:52.11,lon:1.45,url:'https://example.org/b'},
 {id:'c',title:'Unusual light near coast',description:'Light above water during field work',year:2006,kind:'Witness report',category:'Lights',city:'Harbour, Suffolk',lat:52.1,lon:1.5,url:'https://example.org/c'},
 {id:'d',title:'Desert aircraft photograph',description:'Jet training sortie in desert',year:2004,kind:'Witness report',category:'Aircraft',city:'Other Place, Arizona',lat:33,lon:-111,url:'https://example.org/d'},
 {id:'e',title:'Archive management report',description:'Miscellaneous official paperwork',year:2004,kind:'Government records',category:'Administrative',url:'https://example.org/e'},
 {id:'f',title:'Triangular light reports from distant valley',description:'Multiple triangular lights observed moving silently',year:2017,kind:'Witness report',category:'Lights',url:'https://example.org/f'},
 {id:'g',title:'Triangular lights above Riverton',description:'Separate index of similar description',year:2004,kind:'Witness report',category:'Lights',city:'Riverton, Suffolk',url:'https://example.org/a'},
 {id:'h',title:'Generic archived notes',description:'Non specific archive description',year:2004,kind:'Government records',category:'Administration',country:'UK',url:'https://example.org/h'}
];
const indexed=engine.build(input);
assert.equal(indexed.size,input.length,'All public records indexed');
const all=indexed.search(input[0],{limit:20});
assert(all.some(x=>x.id==='b'&&x.nearby&&x.similar),'Combined source-locality and descriptive match');
assert(all.some(x=>x.id==='c'&&x.nearby),'Coordinates find nearby records with different titles');
assert(all.some(x=>x.id==='f'&&x.similar),'Similar descriptions are found without coordinates');
assert(all.some(x=>x.id==='g'),'Possible duplicates on same source URL must still be discoverable');
assert(!all.some(x=>x.id==='d'||x.id==='e'||x.id==='h'),'Same year alone is NOT a case connection');
assert(all.every(x=>Array.isArray(x.reasons)&&x.reasons.length),'Every suggestion explains match');
assert(indexed.search(input[0],{mode:'nearby'}).every(x=>x.nearby),'Nearby filter');
assert(indexed.search(input[0],{mode:'similar'}).every(x=>x.similar),'Similar filter');
assert(indexed.search(input[0],{mode:'time'}).every(x=>x.timeLinked),'Time filter requires another signal');
assert(indexed.search(input[3],{mode:'nearby'}).every(x=>x.distanceKm!==null||x.sameLocality),'No invented distances');
const nearby=indexed.search(input[0],{mode:'nearby'});
assert(nearby.some(x=>x.id==='b'&&x.distanceKm!==null&&x.distanceKm<10),'Haversine approx distance');
assert(indexed.search(input[4]).length===0,'Generic reports have no fabricated connections');
assert(engine.build(original).size===original.length,'Real curated cases are accepted');
for(const x of engine.build(original).search({id:'featured-rendlesham-1980'}))
 assert.notEqual(x.id,'featured-rendlesham-1980');
const big=[];
for(let i=0;i<12000;i++){
 big.push({id:'synthetic-'+i,title:'Public record '+i+' of unusual phenomenon '+(i%7===0?'triangular light':'nondescript document'),
  description:'Regional archive historical observation '+(i%7===0?'triangular lights':'incomplete files')+' '+(i%13===0?'Riverton':'anonymous'),
  year:1947+(i%70),kind:'Government records',category:'Historical reports',url:'https://example.org/record-'+i,
  ...(i%11===0?{lat:52+(i%20)*.02,lon:1+(i%30)*.02,city:'Test locality '+(i%20)}:{})});
}
const start=Date.now(),large=engine.build(big),msBuild=Date.now()-start;
assert.equal(large.size,12000);
const startQuery=Date.now();
const matches=large.search(big[77],{limit:40});
const msQuery=Date.now()-startQuery;
assert(matches.length<=40,'Result cap prevents runaway modal lists');
assert(matches.every(x=>x.id!=='synthetic-77'),'Self-match excluded');
assert(msBuild<15000 && msQuery<3000,'Indexed case search should remain bounded on 12k synthetic records');
console.log('PASS Case Connections: locality, distance, text similarity, date support, duplicates, no year-only false links, reason labels and full-index 12k load ('+msBuild+'ms build, '+msQuery+'ms query); public archive source-only.');
