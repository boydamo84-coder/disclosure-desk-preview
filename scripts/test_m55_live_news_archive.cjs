'use strict';
// M55 regressions: the GitHub-updated feed is independent of Netlify publishing.
// No network, real accounts, storage, or deployment is used by this test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
function span(start,end){
 const from=html.indexOf(start);
 const to=html.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'Required application section: '+start);
 return html.slice(from,to);
}
const source=span('const DD_NEWS_REMOTES=[','function ddStoredNews()');
const loader=span('async function loadLiveNews(force=false){','\nconst caseConnections=');
const validatedUrl=url=>typeof url==='string'&&/^https:\/\//.test(url);
const calls=[],saved=new Map(),state={cache:null,remoteActive:null,remoteMain:null,remoteBundled:null};
const nodes=new Map();
const node=id=>{
 if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,classList:{add(){},remove(){}}});
 return nodes.get(id);
};
const ctx={
 console:{warn(){}},Date,AbortSignal,
 safePublicUrl:validatedUrl,
 DD_NEWS_CACHE_KEY:'m55-offline-test',
 feedBusy:false,feedLive:false,previewStories:[],
 localStorage:{setItem(k,v){saved.set(k,v)},getItem(k){return saved.get(k)||null}},
 ddStoredNews(){return state.cache},
 ddNewsRows(rows,label){calls.push({rows,label});ctx.feedLive=true},
 $:node,
 fetch:async url=>{
   const dataset=url.includes('/dev/mobile-video-performance-oct31/')?state.remoteActive:
    url.includes('/main/')?state.remoteMain:state.remoteBundled;
   if(dataset===null)throw Error('Offline fixture');
   return {ok:true,status:200,json:async()=>dataset};
 },
 stories:[],window:{dispatchEvent(){}},Event:class Event{}
};
vm.createContext(ctx);
vm.runInContext(source+'\n'+loader,ctx,{timeout:2000});
const origins=vm.runInContext('DD_NEWS_REMOTES.map(x=>x.url)',ctx);
assert.equal(origins.length,2);
assert.match(origins[0],/dev\/mobile-video-performance-oct31\/data\/news-alerts\.json$/);
assert.match(origins[1],/main\/data\/news-alerts\.json$/);
const item=(day,label)=>({headline:label,source:'Fixture news source',url:'https://example.com/'+day,date:day+'T12:00:00Z'});
async function check(){
 await vm.runInContext('loadLiveNews()',ctx,{timeout:2000});
 assert.equal(ctx.feedBusy,false);
 assert.equal(node('feedRefresh').disabled,false);
}
(async()=>{
 state.remoteActive=[item('2026-11-10','Fresh active GitHub')];
 state.remoteMain=[item('2026-11-01','Old main mirror')];
 await check();
 assert.equal(calls.at(-1).rows[0].headline,'Fresh active GitHub','New active feed beats old main mirror');
 assert.match(calls.at(-1).label,/GitHub active feed/);
 assert.equal(JSON.parse(saved.get('m55-offline-test')).rows[0].headline,'Fresh active GitHub');
 state.remoteActive=null;
 state.cache=null;ctx.feedLive=false;
 await check();
 assert.equal(calls.at(-1).rows[0].headline,'Old main mirror','Main is an available GitHub fallback');
 state.remoteActive=[item('2026-11-09','Older active')];
 state.remoteMain=[item('2026-11-08','Older main')];
 state.cache=[item('2026-11-10','Newer saved story')];
 await check();
 assert.equal(calls.at(-1).rows[0].headline,'Newer saved story','Never replace a fresher cache with stale upstream');
 state.remoteActive=null;state.remoteMain=null;state.cache=null;state.remoteBundled=[item('2026-10-24','Bundled local')];ctx.feedLive=false;
 await check();
 assert.equal(calls.at(-1).rows[0].headline,'Bundled local','Offline copy remains functional');
 assert.match(calls.at(-1).label,/Bundled offline news/);
 const archiveLoader=span('async function loadHistoricalArchive(){','\nfunction topStoryKey(');
 assert.ok(archiveLoader.indexOf("fetch('data/curated-historical-cases.json'")>=0);
 assert.ok(archiveLoader.indexOf("fetch('data/curated-historical-cases.json'")<archiveLoader.indexOf("fetch('data/historical-news-archive.json'"));
 assert.match(html,/ddShowArchiveData\(\[\],curated\)/);
 assert.match(html,/ddArchiveFullReady=true/);
 assert.match(html,/Retry full archive/);
 assert.match(html,/ddArchiveLoading=operation/);
 assert.match(html,/ddCompareSearchRows\(query,limit=90\)/);
 assert.doesNotMatch(loader,/\.netlify\/functions/);
 console.log('PASS M55: freshest GitHub source, GitHub fallback, cache no-downgrade, bundled fallback, curated archive, retry, bounded compare');
})().catch(error=>{console.error(error);process.exitCode=1});
