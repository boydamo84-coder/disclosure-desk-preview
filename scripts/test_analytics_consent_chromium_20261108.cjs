'use strict';
// Real Chromium QA for opt-in GA4. All non-loopback requests are intercepted.
// Uses fake public content, never accounts, messages, research or actual Analytics.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let passes=0;
  const check=async(label,fn)=>{await fn();passes++;console.log('PASS GA4 CHROME '+label)};
  for(const viewport of [{width:393,height:852},{width:1280,height:800}]){
   const context=await browser.newContext({viewport,isMobile:viewport.width<600,
    hasTouch:viewport.width<600,locale:'en-GB'});
   const google=[];
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===BASE)return route.continue();
    google.push(url.href);
    // Mock the tag bootstrap, no calls to the real Google endpoints.
    if(url.hostname==='www.googletagmanager.com')
     return route.fulfill({status:200,contentType:'application/javascript',body:'/* fake tag */'});
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   const fixture='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
    '<body><nav class="nav"><button class="tab active" data-tab="discover">News</button>'+
    '<button class="tab" data-tab="archivePage">Archive</button>'+
    '<button class="tab" data-tab="chatPage">Private Chat</button></nav>'+
    '<button type="button" data-dd-analytics-open>Analytics preferences</button>'+
    '<p>Disposable public QA fixture. No private data.</p></body></html>';
   await page.goto(BASE+'/index.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.setContent(fixture,{waitUntil:'domcontentloaded'});
   await page.addScriptTag({url:BASE+'/assets/analytics-consent.js'});
   await check(viewport.width+'px initial analytics opt-in without tag',async()=>{
    assert.equal(await page.locator('#dd-analytics-consent').isVisible(),true);
    assert.equal(await page.locator('script[src*="googletagmanager.com"]').count(),0);
    assert.equal(google.filter(u=>/google(analytics|tagmanager)\.com/.test(u)).length,0);
    assert.equal(await page.evaluate(()=>localStorage.getItem('dd-site-analytics-consent-v1')),null);
    const box=await page.locator('#dd-analytics-consent').boundingBox();
    assert(box&&box.x>=0&&box.x+box.width<=viewport.width+1);
   });
   await page.locator('[data-decline]').click();
   await check(viewport.width+'px reject creates no Google Analytics request',async()=>{
    assert.equal(await page.locator('#dd-analytics-consent').isHidden(),true);
    assert.equal(await page.locator('script[src*="googletagmanager.com"]').count(),0);
    assert.equal(await page.evaluate(()=>localStorage.getItem('dd-site-analytics-consent-v1')),'declined');
   });
   await page.locator('[data-dd-analytics-open]').click();
   await page.locator('#dd-analytics-consent [data-accept]').click();
   await check(viewport.width+'px explicit acceptance starts GA4 for public News only',async()=>{
    assert.equal(await page.locator('script[src*="googletagmanager.com"]').count(),1);
    assert.equal(await page.evaluate(()=>localStorage.getItem('dd-site-analytics-consent-v1')),'accepted');
    const entries=await page.evaluate(()=>window.dataLayer.map(x=>Array.from(x)));
    assert.equal(entries.filter(a=>a[0]==='event'&&a[1]==='page_view').length,1);
    assert.equal(entries.find(a=>a[0]==='config')[1],'G-ZWJQMK8JSW');
    assert.equal(entries.find(a=>a[0]==='event')[2].page_path,'/site/news');
    assert.equal(entries.find(a=>a[0]==='event')[2].page_location,BASE+'/site/news');
   });
   await page.evaluate(()=>{
    document.querySelector('.tab.active').classList.remove('active');
    document.querySelector('[data-tab="archivePage"]').classList.add('active');
    dispatchEvent(new CustomEvent('dd-public-section-change',{detail:{section:'archivePage'}}));
    dispatchEvent(new CustomEvent('dd-public-section-change',{detail:{section:'chatPage'}}));
   });
   await check(viewport.width+'px public navigation measured, private tab not tracked',async()=>{
    const entries=await page.evaluate(()=>window.dataLayer.map(x=>Array.from(x)).filter(a=>a[0]==='event'));
    assert.deepEqual(entries.map(x=>x[2].page_path),['/site/news','/site/archive']);
    assert.equal(entries.some(x=>JSON.stringify(x).includes('chatPage')),false);
   });
   await page.locator('[data-dd-analytics-open]').click();
   await page.locator('#dd-analytics-consent [data-decline]').click();
   await check(viewport.width+'px consent withdrawal stops subsequent pageviews',async()=>{
    await page.evaluate(()=>dispatchEvent(new CustomEvent('dd-public-section-change',{detail:{section:'mapPage'}})));
    const events=await page.evaluate(()=>window.dataLayer.map(x=>Array.from(x)));
    assert.equal(events.filter(x=>x[0]==='event'&&x[1]==='page_view').length,2);
    assert.equal(await page.evaluate(()=>localStorage.getItem('dd-site-analytics-consent-v1')),'declined');
   });
   await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded'});
   await page.setContent('<!doctype html><title>Private editor</title><p>Private content must not be tracked.</p>');
   await page.addScriptTag({url:BASE+'/assets/analytics-consent.js'});
   await check(viewport.width+'px Research pages not tracked even if script added accidentally',async()=>{
    assert.equal(await page.locator('#dd-analytics-consent').count(),0);
    assert.equal(await page.locator('script[src*="googletagmanager.com"]').count(),0);
   });
   await context.close();
  }
  console.log('PASS GA4 CHROME TOTAL '+passes+' real Chromium consent checks. No live Google endpoint used.');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL GA4 CHROME:',e.stack||e);process.exitCode=1});
