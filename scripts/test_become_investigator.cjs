'use strict';
// Source-derived catalogue and rollover contract, not live network testing.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),stage=path.join(root,'.release-staging/public-site');
const {batch}=require('../assets/research-spotlight.js');
const data=JSON.parse(fs.readFileSync(path.join(stage,'data/research-spotlight.json'),'utf8'));
assert.deepEqual(data,require('./build_spotlight_catalogue.cjs')(root));
const source=require('../data/pursue-index.json');
const liveReleases=source.releases.map(x=>x.number).sort((a,b)=>b-a).slice(0,2);
assert.equal(data.historical.length,6);
assert.ok(data.pursue.length>=4&&data.pursue.length<=32);
assert.ok(fs.statSync(path.join(stage,'data/research-spotlight.json')).size<40000);
const used=new Set();
for(const item of data.pursue){
 const record=source.records.find(r=>'pursue-'+r.key===item.id);
 assert.ok(record&&record.identifier===item.identifier&&record.source===item.source);
 assert.equal(item.release,record.release);
 assert.equal(item.published,source.releases.find(r=>r.number===record.release).date);
 assert.ok(liveReleases.includes(item.release));
 assert.equal(new URL(item.href,'https://uapdisclosuredesk.com').searchParams.get('dd_archive_case'),item.id);
}
const epoch=Date.UTC(2026,10,27),period=172800000;
for(let slot=-3;slot<40;slot++){
 const t=epoch+slot*period,a=batch(data,t),b=batch(data,t+period);
 assert.equal(a.length,4);
 assert.equal(new Set(a.map(r=>r.id)).size,4);
 assert.deepEqual(a.map(r=>r.kind),['historical','pursue','historical','pursue']);
 assert.deepEqual(batch(data,t+period-1),a);
 assert.ok(!b.some(r=>a.some(x=>x.id===r.id)),'No shared items in consecutive batches');
 assert.ok(a.filter(r=>r.kind==='pursue').some(r=>r.release===liveReleases[0]),'Newest release is represented');
 a.forEach(r=>used.add(r.id));
}
assert.equal(used.size,data.historical.length+data.pursue.length);
assert.deepEqual(batch({version:2},epoch),[]);
assert.deepEqual(batch({version:1,historical:data.historical,pursue:data.pursue.slice(0,3)},epoch),[]);
const spoof=structuredClone(data);spoof.pursue[0].href='//unapproved.example/?dd_archive_case='+spoof.pursue[0].id;
assert.ok(!batch(spoof,epoch).some(r=>r.href.startsWith('//')));
const sample=fs.readFileSync(path.join(stage,'first-investigation.html'),'utf8');
assert.doesNotMatch(sample,/localStorage|sessionStorage|indexedDB|fetch\s*\(|supabase|cloud-boards/i);
assert.deepEqual([...sample.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]),['/assets/secondary-editorial-nav.js?v=investigator-nav01']);
for(const file of ['first-investigation.html','site-updates.html','rendlesham-forest-1980.html','roswell-1947.html','guide.html']){
 const html=fs.readFileSync(path.join(stage,file),'utf8');
 assert.ok(html.includes('/assets/secondary-editorial-nav.js?v=investigator-nav01')&&html.includes('/assets/secondary-editorial-nav.css?v=investigator-nav01'),'Shared site navigation on '+file);
}
for(const text of ['DEFE 24/1948/1','Evidence First','No account','Nothing saved','not an evidence score','/research/r3-lab/'])assert.ok(sample.includes(text),text);
const home=fs.readFileSync(path.join(stage,'index.html'),'utf8');
assert.ok(home.indexOf('id="ddSpotlight"')<home.indexOf('id="ddDiscoveryHeading"'));
assert.ok(home.includes('href="/first-investigation.html"'));
assert.ok(home.includes('href="/guide.html#evidence-first"'));
assert.ok(home.includes('href="/research/r3-lab/"'));
assert.ok(home.includes('id="ddJumpToNews"'));
console.log('PASS 43 consecutive UTC batches: four unique cards, two historical and two PURSUE, distinct adjacent sets, all sourced, newest release present, 32 KiB-scale public metadata; sample has no storage/network calls');
