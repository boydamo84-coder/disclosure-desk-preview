'use strict';
// M60: related reporting stays available, but repeated coverage of the same
// event appears as ONE news card. Local-only fixtures, no live API/deployment.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const begin=html.indexOf('function ddNewsHeadlineKey(headline){');
const end=html.indexOf('function ddNewsRows(rows,origin){',begin);
assert(begin>=0&&end>begin,'M60 website event-cluster helper present');
const ctx={Date};
vm.createContext(ctx);
vm.runInContext(html.slice(begin,end),ctx);
const cluster=vm.runInContext('ddNewsDeduplicate',ctx);
const row=(id,headline,source,date='2026-11-10T03:00:00Z')=>({
 id,headline,source,date,url:'https://example.org/ufo/'+id,category:'UAP'
});
const input=[
 row('trump1','Trump says Air Force pilots saw a strange UFO beyond their F-22','Publisher 1'),
 row('trump2','Trump shares very strange revelations from Air Force pilots about UFOs','Publisher 2'),
 row('trump3','Trump tells interviewer that pilots saw UAP flying faster than F-22 jets','Publisher 3'),
 row('different','Pentagon publishes separate declassified UFO investigation files','Publisher 4')
];
const first=cluster(input);
assert.equal(first.length,2,'the Trump pilot event shows one main News card');
assert.equal(first[0].id,'trump1','existing first card and vote/comment ID remain');
assert.equal(first[0].relatedCoverage.length,2,'two alternate publishers retained');
assert.equal(first[0].relatedCoverage[1].url,input[2].url,'original URL is preserved');
assert.equal(first[0].relatedCoverage[0].source,'Publisher 2','original attribution preserved');
assert.equal(cluster(first).length,2,'already-grouped news remains grouped without duplication');
assert.equal(cluster(first)[0].relatedCoverage.length,2,'repeated rendering retains all links');
const distinct=[
 row('pr124','Video - DOW-UAP-PR124, Unresolved UAP Report, Pacific Ocean, 2019','Official'),
 row('pr125','Video - DOW-UAP-PR125, Unresolved UAP Report, Pacific Ocean, 2019','Official'),
 row('fourth','Department of War Publishes Fourth Release of UAP Files','Official'),
 row('second','Department of War Publishes Second Release of UAP Files','Official'),
 row('otherpilot','Commercial airline pilots photograph strange UFO over Ohio','Publisher 5')
];
assert.equal(cluster(distinct).length,5,'distinct official video IDs, batches and unrelated pilot cases stay separate');
assert.equal(cluster([
 row('month1','Trump reports new Air Force pilot UFO testimony','Publisher A','2026-09-10T03:00:00Z'),
 row('month2','Trump reports new Air Force pilot UFO testimony','Publisher B','2026-11-10T03:00:00Z')
]).length,2,'new coverage months later is not suppressed');
assert.match(html,/function ddNewsCoverageHTML\(story\)/,'News cards expose alt reporting');
assert.match(html,/ddNewsCoverageHTML\(s\)/,'more coverage must render in each News card');
assert.match(html,/relatedCoverage:Array\.isArray\(x\.relatedCoverage\)/,'source metadata crosses the feed-mapping boundary');
assert.match(html,/window\.ddNewsTickerRows=deduped/,'ticker sees grouped primary stories only');
console.log('PASS M60: event-level News groups; publishers and original links retained; separate official files and novel reporting safe (NO DEPLOY)');
