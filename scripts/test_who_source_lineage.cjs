'use strict';
// M22: source-container and claim-family lineage checks, not evidence scores.
// Shared records identify attribution paths, not independent event corroboration.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname,'../data/public-people-directory.json'),'utf8'));
const people = data.people;
assert.equal(people.length,50);
const claims = people.flatMap(p=>(p.claimEvidence||[]).map(c=>({person:p.name,personId:p.id,claim:c})));
assert.equal(claims.length,23);
assert.equal(claims.reduce((n,x)=>n+x.claim.researchEvidence.items.length,0),89);
const shared = new Map(), families = new Map();
for(const x of claims){
 const c=x.claim, audit=c.sourceAudit, access=c.sourceAccessCheck;
 assert(audit?.original?.url?.startsWith('https://'), 'Primary source URL must use HTTPS: '+x.person);
 assert.equal(access?.primaryUrl,audit.original.url,'Origin/access cross-reference: '+x.person);
 assert.equal(access?.fullOriginalReviewed,false,'Source access is not independently completed: '+x.person);
 assert.equal(access?.secondEditorSignoff,'not_obtained','No signed second reviewer: '+x.person);
 assert.equal(c.ratingReadiness?.publicationApproval,'withheld','Cannot publish unverified: '+x.person);
 assert(audit.independentEvidence?.length>120,'Independent evidence/circular-reference caution required: '+x.person);
 assert(audit.relatedSourceGroup,'Explicit research lineage ID required: '+x.person);
 if(!shared.has(audit.original.url))shared.set(audit.original.url,[]);
 shared.get(audit.original.url).push(x.personId);
 if(!families.has(audit.relatedSourceGroup))families.set(audit.relatedSourceGroup,[]);
 families.get(audit.relatedSourceGroup).push(x.personId);
}
function repeated(buckets){
 return [...buckets.entries()].filter(([,people])=>people.length>1)
  .map(([key,ids])=>({key,ids:[...ids].sort()}))
  .sort((a,b)=>a.key.localeCompare(b.key));
}
const actual = repeated(shared);
const expected = [
 {key:'https://www.govinfo.gov/content/pkg/CHRG-118hhrg53022/html/CHRG-118hhrg53022.htm',
  ids:['david-fravor','david-grusch','ryan-graves'].sort()},
 {key:'https://www.govinfo.gov/content/pkg/CHRG-118hhrg57440/html/CHRG-118hhrg57440.htm',
  ids:['luis-elizondo','michael-shellenberger','mike-gold','tim-gallaudet'].sort()},
 {key:'https://www.sciencedirect.com/science/article/pii/S0376042121000907',
  ids:['garry-nolan','jacques-vallee'].sort()}
].sort((a,b)=>a.key.localeCompare(b.key));
assert.deepEqual(actual,expected,'Repeated original publication containers must be explicit');
const related=repeated(families);
assert.deepEqual(
 related.map(x=>x.ids.join('|')).sort(),
 [
  ['ross-coulthart','leslie-kean'].sort().join('|'),
  ['larry-warren','nick-pope'].sort().join('|'),
  ['garry-nolan','jacques-vallee'].sort().join('|')
 ].sort(),
 'Shared reporting or case-family lines must not be mistaken for independent physical evidence'
);
assert.equal(shared.size,17,'23 profiles resolve to 17 distinct primary-source publication URLs');
const nol = claims.find(x=>x.personId==='garry-nolan').claim;
const val = claims.find(x=>x.personId==='jacques-vallee').claim;
assert.equal(nol.sourceAudit.relatedSourceGroup,val.sourceAudit.relatedSourceGroup);
assert.match(nol.sourceAudit.independentEvidence,/one coauthored study|same peer-reviewed article|same paper|same research sample|same publication/i);
console.log('M22 lineage: 23 claim/recommendation drafts, 17 unique publication URLs, 3 repeated publication containers, 3 shared case/reporting families; 0 approved scores. Source overlap is NOT independent confirmation.');
