'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf("const DD_NEWS_CACHE_KEY=");
const end=html.indexOf('\n\nconst caseConnections=',start);
assert(start>=0&&end>start);
const source=html.slice(start,end);
const row=(id,hours=1,headline='UAP case '+id+' verified report')=>({id,headline,source:'Fixture publisher',url:'https://fixture.invalid/'+id,date:new Date(Date.now()-hours*3600000).toISOString(),sourceType:'publisher'});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
const response=rows=>({ok:true,json:async()=>rows});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(cached=null){
 const requests={bundle:deferred(),active:deferred(),mirror:deferred()};
 let writes=[],paints=[],status='',disabled=false;
 const ctx=vm.createContext({URL,AbortSignal,console:{warn(){}},Date,Event,window:{dispatchEvent(){}},localStorage:{
  getItem:()=>cached?JSON.stringify({rows:cached}):null,
  setItem:(key,value)=>writes.push(JSON.parse(value).rows)
 },safePublicUrl:x=>/^https:\/\//.test(x),fetch:url=>url.startsWith('data/')?requests.bundle.promise:url.includes('/dev/')?requests.active.promise:requests.mirror.promise,
  $:id=>id==='feedStatus'?{get textContent(){return status},set textContent(v){status=v},classList:{add(){},toggle(){}}}:{set disabled(v){disabled=v}},
  news(){paints.push('examples')},previewStories:[],feedBusy:false,feedLive:false,ddPendingNews:'',stories:[],updatedAt:null
 });
 vm.runInContext(source+'\n ddNewsRows=(rows,origin)=>{feedLive=true;stories=rows;updatedAt=rows[0].date;paints.push(rows[0].id);ddNewsSetStatus(origin)};',Object.assign(ctx,{paints}));
 return {requests,writes,paints,ctx,run:()=>vm.runInContext('loadLiveNews()',ctx),status:()=>status,disabled:()=>disabled};
}
(async()=>{
 const old=[row('old',24)],fresh=[row('fresh',1)],newer=[row('newer',0.5)];
 let h=harness(),task=h.run();assert(h.disabled());
 h.requests.bundle.resolve(response(old));await flush();assert.deepEqual(h.paints,['old']);assert.match(h.status(),/Bundled offline news.*checking/);
 h.requests.active.resolve(response(fresh));await flush();assert.deepEqual(h.paints,['old','fresh']);assert.equal(h.writes.at(-1)[0].id,'fresh');assert(h.disabled());
 h.requests.mirror.resolve(response(old));await task;assert.deepEqual(h.paints,['old','fresh']);assert.match(h.status(),/GitHub active feed.*updated/);assert(!h.disabled());
 h=harness(fresh);task=h.run();assert.deepEqual(h.paints,['fresh']);
 h.requests.mirror.resolve(response(fresh));await flush();assert.deepEqual(h.paints,['fresh']);
 h.requests.active.resolve(response(fresh));await task;assert.deepEqual(h.paints,['fresh']);assert.match(h.status(),/active feed.*updated/);
 h=harness(newer);task=h.run();h.requests.active.resolve(response(fresh));h.requests.mirror.resolve(response(old));await task;assert.deepEqual(h.paints,['newer']);assert.equal(h.writes.length,0);assert.match(h.status(),/Saved copy is newer/);
 h=harness();task=h.run();h.requests.active.resolve(response(newer));await flush();assert.deepEqual(h.paints,['newer']);h.requests.bundle.resolve(response(old));h.requests.mirror.resolve(response(fresh));await task;assert.deepEqual(h.paints,['newer']);
 h=harness();task=h.run();h.requests.bundle.resolve(response(old));h.requests.active.reject(Error('offline'));h.requests.mirror.reject(Error('offline'));await task;assert.deepEqual(h.paints,['old']);assert.match(h.status(),/Online update unavailable/);
 h=harness();task=h.run();h.requests.bundle.reject(Error('missing'));h.requests.active.reject(Error('offline'));h.requests.mirror.reject(Error('offline'));await task;assert.deepEqual(h.paints,['examples']);assert.match(h.status(),/NEWS UNAVAILABLE/);
 const ctx=vm.createContext({URL,Date});
 vm.runInContext(source,ctx);
 const catalogue=JSON.parse(fs.readFileSync('data/news-alerts.json','utf8'));
 ctx.catalogue=catalogue;
 const result=vm.runInContext('ddNewsDeduplicate(catalogue)',ctx);
 assert(result.length>0);assert(result.length<=catalogue.length);
 // Same event, separate numbered case, and exact duplicate URL.
 ctx.fixture=[row('a',1,'UAP case 1234 military pilot reports strange object'),row('b',2,'UAP case 1234 military pilot reports strange object'),row('c',3,'UAP case 5678 military pilot reports strange object'),{...row('duplicate',4),url:'https://fixture.invalid/a'}];
 const clusters=JSON.parse(JSON.stringify(vm.runInContext('ddNewsDeduplicate(fixture)',ctx)));
 assert.deepEqual(clusters.map(x=>x.id),['a','c']);assert.equal(clusters[0].relatedCoverage[0].id,'b');
 console.log('PASS M116 saved/bundled first, fast remote before slow mirror, cache immediately, freshness and offline fallbacks, no identical repaint, exact grouping');
})().catch(e=>{console.error(e);process.exitCode=1});
