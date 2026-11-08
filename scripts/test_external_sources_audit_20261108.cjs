'use strict';
// Public source-link QA, never downloads a third-party file or imports a case.
// Static invariants ensure the verified 2026 source references stay attributable.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('sources.html','utf8');
const list=JSON.parse(fs.readFileSync('data/international-source-registry.json','utf8'));
assert(Array.isArray(list.sources)&&list.sources.length>=6);
const gep=list.sources.find(x=>x.country==='Germany'&&x.sourceType==='research-organisation-dataset');
assert(gep);
assert.equal(gep.url,'https://zenodo.org/records/23906585');
assert.equal(gep.doi,'10.5281/zenodo.23906585');
assert.equal(gep.status,'licence-and-schema-review','new dataset cannot be auto-published before licence review');
assert.match(gep.note,/privacy validation/);
assert.match(html,/href="https:\/\/zenodo.org\/records\/23906585"/);
assert.match(html,/10\.5281\/zenodo\.23906585/);
console.log('PASS SOURCES verified November 2026 GEP dataset linked, licence gate retained');
assert.match(html,/href="https:\/\/www\.archives\.gov\/research\/topics\/uaps"/);
assert(!html.includes('href="https://www.archives.gov/uap"'));
console.log('PASS SOURCES direct National Archives UAP research page');
const links=[...html.matchAll(/<a\b[^>]*class="visit"[^>]*href="([^"]+)"/g)].map(m=>m[1]);
assert(links.length>=9,'Sources page must retain meaningful outbound sources');
for(const url of links){assert(/^https:\/\//.test(url),'Do not publish unsafe source scheme '+url)}
for(const x of list.sources){
 assert(x.url===null||/^https:\/\//.test(x.url),'Source discovery URLs are HTTPS or null');
 if(x.url===null)assert(x.status.includes('source-needed'),'Unverified source stays in discovery queue');
}
console.log('PASS SOURCES '+links.length+' HTTPS original links, unresolved source queues remain unverified');
