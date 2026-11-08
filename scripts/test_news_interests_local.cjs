'use strict';
// Focused local-beta interest feed regression: no remote network and no fabricated stories.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('function localInterestMatches(rows,terms){');
const end=html.indexOf('\nasync function loadInterestNews(){',start);
assert.ok(start>0&&end>start,'Local sourced-news matcher must be defined before loader');
const helpers=html.slice(start,end);
assert.doesNotThrow(()=>new vm.Script(helpers));
function run(rows,terms){const context={rows,terms};vm.runInNewContext(helpers+'\nresult=localInterestMatches(rows,terms);',context,{timeout:1000});return context.result;}
const records=[
 {headline:'Non human intelligence discussed in latest congressional hearing',source:'Official witness summary',url:'https://example.org/1'},
 {headline:'Historic US aviation report',summary:'Unrelated weather observations',source:'Archive',url:'https://example.org/2'},
 {headline:'Crop circles revisited',summary:'Field investigation',source:'Publisher',url:'https://example.org/3'}
];
assert.deepEqual(Array.from(run(records,['Non human intelligence'])).map(x=>x.url),['https://example.org/1']);
assert.deepEqual(Array.from(run(records,['crop CIRCLES'])).map(x=>x.url),['https://example.org/3']);
assert.equal(run(records,['telepathy']).length,0);
assert.equal(run(records,[]).length,0,'No unspecified fallback categories');
assert.equal(run([],['NHI']).length,0);
assert.match(html,/const localHost=\['localhost','127\.0\.0\.1'\]\.includes\(location\.hostname\)/);
assert.match(html,/if\(localHost\)\{\s*interestStories=feedLive\?localInterestMatches\(stories,myInterests\):\[\]/);
assert.match(html,/Netlify extra-topic search does not run on 127\.0\.0\.1/);
assert.match(html,/feedLive=true;updatedAt=valid\.reduce/);
assert.match(html,/No additional stories were retrieved/);
assert.match(html,/No extra interests added yet/);
assert.match(html,/unknown_news_interests_v07/,'Same existing on-device storage must be retained');
assert.match(html,/function news\(\)\{/);
console.log('PASS: interests remain saved; localhost prioritises matching sourced news, no Netlify call, no invented additional stories.');
