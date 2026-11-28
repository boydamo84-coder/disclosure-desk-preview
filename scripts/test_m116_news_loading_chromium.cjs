'use strict';
// Exercise the exact staged Android site with two held online feeds.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const wait=()=>{let release;const promise=new Promise(resolve=>release=resolve);return {promise,release}};
const row=(id,hours)=>({id,headline:'UAP case '+id+' official report',source:'QA publisher',url:'https://fixture.invalid/news/'+id,date:new Date(Date.now()-hours*3600000).toISOString(),category:'UAP',sourceType:'publisher'});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(['/usr/bin/google-chrome','/usr/bin/chromium'].find(x=>fs.existsSync(x))),args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const cached of [false,true]){
   const ctx=await browser.newContext({viewport:{width:393,height:850},reducedMotion:'reduce'});
   const old=[row('1001',24)],fresh=[row('1002',1)],active=wait(),mirror=wait();
   if(cached)await ctx.addInitScript(rows=>localStorage.setItem('dd_online_news_cache_v1',JSON.stringify({rows})),old);
   await ctx.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.origin===base){
     if(u.pathname==='/data/news-alerts.json')return route.fulfill({json:old});
     return route.continue();
    }
    if(u.hostname==='raw.githubusercontent.com'&&u.pathname.endsWith('/data/news-alerts.json')){
     await (u.pathname.includes('/dev/')?active.promise:mirror.promise);
     return route.fulfill({json:fresh,headers:{'access-control-allow-origin':'*'}}).catch(()=>{});
    }
    if(u.hostname==='unpkg.com'&&u.pathname==='/leaflet@1.9.4/dist/leaflet.js'&&fs.existsSync('node_modules/leaflet/dist/leaflet.js'))return route.fulfill({path:'node_modules/leaflet/dist/leaflet.js',contentType:'application/javascript'});
    return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#newsGrid article[data-news-id]')?.dataset.newsId==='1001',null,{timeout:8000});
    assert.match(await page.locator('#feedStatus').textContent(),cached?/Saved GitHub news.*checking/:/Bundled offline news.*checking/);
    assert(await page.locator('#feedRefresh').isDisabled());
    active.release();
    await page.waitForFunction(()=>document.querySelector('#newsGrid article[data-news-id]')?.dataset.newsId==='1002',null,{timeout:6000});
    assert(await page.locator('#feedRefresh').isDisabled(),'mirror remains held but fresh article is visible');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dd_online_news_cache_v1')).rows[0].id),'1002');
    await page.locator('#newsGrid article[data-news-id]').evaluate(n=>n.dataset.m116Marker='kept');
    mirror.release();
    await page.waitForFunction(()=>!document.getElementById('feedRefresh').disabled);
    assert.equal(await page.locator('#newsGrid article[data-news-id]').getAttribute('data-m116-marker'),'kept');
    assert.match(await page.locator('#feedStatus').textContent(),/GitHub active feed.*updated/);
    assert.deepEqual(errors.filter(x=>/SyntaxError|ReferenceError|is not defined|Cannot access/i.test(x)),[]);
   }finally{active.release();mirror.release();await ctx.close()}
  }
 }finally{await browser.close()}
 console.log('PASS M116 real Chromium: cold bundled/warm saved feed before held network, first fresh result before slow mirror, stable card identity, immediate cache');
})().catch(e=>{console.error(e);process.exitCode=1});
