'use strict';
/* Offline Adsterra DIRECT insertion QA: real Chromium + FAKE first-party ad tag.
 * Never issue a real impression or contact an advertiser from a test runner.
 */
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:820},serviceWorkers:'block'});
   const outsiders=[],popups=[],errors=[];
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===BASE)return route.continue();
    outsiders.push(url.href);return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();
   page.on('popup',p=>{popups.push(p.url());p.close().catch(()=>{})});
   page.on('pageerror',e=>errors.push(e.message));
   const entry=BASE+'/scripts/fixtures/ad-m04-direct-banner-test.html?dd_adsterra_direct_test=1';
   await page.goto(entry,{waitUntil:'domcontentloaded'});
   await page.locator('#dd-advertising-consent:not([hidden])').waitFor();
   assert.equal(await page.locator('.dd-adsterra-slot').count(),0);
   assert.equal(await page.locator('script[src*="bicea.org"]').count(),0);
   assert.deepEqual(await page.evaluate(()=>window.__ddMockAds||[]),[]);
   assert.equal(await page.evaluate(()=>window.DDAdsterraM02?.releaseEnabled),false);
   assert.equal(await page.evaluate(()=>window.DDAdsterraM02?.localTest),true);
   // 'No thanks' should have equal access and no vendor scripts.
   await page.locator('[data-dd-advertising-no]').click();
   assert.equal(await page.locator('.dd-adsterra-slot').count(),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('dd-site-advertising-consent-v1')),'declined');
   await page.evaluate(()=>localStorage.removeItem('dd-site-advertising-consent-v1'));
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('[data-dd-advertising-yes]').click();
   const expectedNews=width>=393?3:0;
   await page.waitForFunction(n=>(window.__ddMockAds||[]).length===n,expectedNews);
   assert.equal(await page.locator('#newsGrid > article[data-news-id]').count(),19);
   assert.equal(await page.locator('#newsGrid > .dd-adsterra-slot').count(),expectedNews);
   assert.equal(await page.locator('iframe').count(),0,'Publisher extra iframe must be absent: '+width);
   assert.equal(await page.locator('script[src*="bicea.org"]').count(),0,'Synthetic fixture must not touch real provider');
   const first=await page.evaluate(()=>window.__ddMockAds||[]);
   assert(first.every(a=>a.width===300&&a.height===250),'News dimensions mismatch: '+width);
   await page.locator('.nav [data-tab=archivePage]').click();
   const target=width>=1024?2:width>=393?2:0;
   await page.waitForFunction(n=>(window.__ddMockAds||[]).length===n,expectedNews+target);
   assert.equal(await page.locator('#newsGrid > .dd-adsterra-slot').count(),0);
   assert.equal(await page.locator('#archiveList > article[data-archive-id]').count(),26);
   assert.equal(await page.locator('#archiveList > .dd-adsterra-slot').count(),target);
   const after=await page.evaluate(()=>window.__ddMockAds||[]);
   const expectedSize=width>=1024?[728,90]:[320,50];
   if(target)assert(after.slice(-target).every(a=>a.width===expectedSize[0]&&a.height===expectedSize[1]));
   await page.locator('.nav [data-tab=researchStudio]').click();
   assert.equal(await page.locator('.dd-adsterra-slot').count(),0,'W.NE must be free of any ads');
   assert.equal(await page.locator('#researchStudio .dd-adsterra-slot').count(),0);
   // No third-party traffic or redirect can arise from the harmless local fake tag.
   assert.deepEqual(outsiders,[]);
   assert.deepEqual(popups,[]);
   assert.deepEqual(errors,[]);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,
     'Horizontal overflow at '+width+'px');
   assert.equal(new URL(page.url()).pathname,
      '/scripts/fixtures/ad-m04-direct-banner-test.html');
   await ctx.close();
   console.log('M04 DIRECT MOCK PASS '+width+'px: consent, original sizes, no extra iframe, no popup, W.NE protected');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
