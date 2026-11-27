'use strict';
// Source contract plus all boundary cases: no network, user data or deploy.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const a=html.indexOf('function ddNewsPageSlice('),b=html.indexOf('function ddRenderNewsPager(',a);
assert.ok(a>0&&b>a);
const ctx={};vm.createContext(ctx);vm.runInContext('const DD_NEWS_PAGE_SIZE=30;'+html.slice(a,b),ctx);
const slice=vm.runInContext('ddNewsPageSlice',ctx);
const rows=Array.from({length:77},(_,i)=>({id:'report-'+i}));
for(const count of [0,1,29,30,31,60,77,521]){
 const source=Array.from({length:count},(_,i)=>i);let covered=[];
 const total=Math.max(1,Math.ceil(count/30));
 for(let page=1;page<=total;page++){
  const p=slice(source,page);assert.equal(p.count,total);assert.equal(p.page,page);assert.ok(p.items.length<=30);
  covered.push(...p.items);
 }
 assert.deepEqual(covered,source);
 assert.equal(slice(source,900).page,total);
 assert.equal(slice(source,-3).page,1);
}
assert.equal(slice(rows,2).items[0].id,'report-30');
assert.equal(slice(rows,3).items.length,17);
assert.match(html,/<div class="news-sticky-controls" id="newsStickyControls">[^]*?id="ddLatestNewsPagerTop"[^]*?<\/nav><\/div><div class="feed-controls">/);
assert.ok(html.includes('id="ddLatestNewsPager"'));
assert.match(html,/#newsStickyControls #ddLatestNewsPagerTop\{\s*grid-column:1 \/ -1!important;grid-row:3!important;/);
assert.match(html,/const matched=combined\.filter\(s=>/);
assert.match(html,/const page=ddNewsPageSlice\(matched,ddNewsPages.latest\)/);
assert.match(html,/const results=page.items;/);
assert.match(html,/ddNewsPages.latest=Math.floor\(targetIndex\/DD_NEWS_PAGE_SIZE\)\+1/);
assert.match(html,/url.searchParams.set\('page',String\(ddNewsPages\[view\]\)\)/);
assert.match(html,/history.pushState\(\{\.\.\.state,ddSiteHop:true\}/);
assert.match(html,/if\(previous==='discover'\)ddRestoreNewsUrl\(\)/);
console.log('PASS news pagination: 30-card slices, zero/exact/final/out-of-range cases, entire catalogue searched, sticky controls and shared URLs');
