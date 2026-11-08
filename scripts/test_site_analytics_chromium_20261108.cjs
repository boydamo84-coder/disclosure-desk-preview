'use strict';
// Isolated real Chromium GA4 consent tests. NO live Google Analytics or Supabase requests.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let count=0;
  const pass=async(name,fn)=>{await fn();count++;console.log('PASS ANALYTICS CHROME '+name)};
  for(const viewport of [{width:393,height:852},{width:1280,height:800}]){
   const context=await browser.newContext({viewport,deviceScaleFactor:viewport.width<500?2:1,
    isMobile:viewport.width<500,hasTouch:viewport.width<500});
   const google=[];
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE)return route.continue();
    if(u.hostname==='www.googletagmanager.com'&&u.pathname==='/gtag/js'){
      google.push(u.toString());
      return route.fulfill({status:200,contentType:'application/javascript',body:'/* synthetic GA tag, no network */'});
    }
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   await page.goto(BASE+'/privacy.html',{waitUntil:'domcontentloaded'});
   await page.locator('#dd-analytics-consent:not([hidden])').waitFor();
   await pass(viewport.width+'px first visit has no Google tag and offers equal choices',async()=>{
    assert.equal(google.length,0);
    assert.equal(await page.locator('#dd-analytics-consent [data-accept]').isVisible(),true);
    assert.equal(await page.locator('#dd-analytics-consent [data-decline]').isVisible(),true);
    assert.equal(await page.evaluate(()=>window.dataLayer?.length||0),0);
   });
   await page.locator('[data-decline]').click();
   await page.reload({waitUntil:'domcontentloaded'});
   await pass(viewport.width+'px decline persists and sends zero Google requests',async()=>{
    assert.equal(google.length,0);
    assert.equal(await page.locator('#dd-analytics-consent').isHidden(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('dd-site-analytics-consent-v1')),'declined');
    assert.equal(await page.evaluate(()=>window.dataLayer?.length||0),0);
   });
   await page.locator('[data-dd-analytics-open]').click();
   await page.locator('[data-accept]').click();
   await page.waitForFunction(()=>Array.from(window.dataLayer||[]).some(e=>e[0]==='event'&&e[1]==='page_view'));
   await pass(viewport.width+'px explicit approval sends ONLY sanitised public page event',async()=>{
    assert.equal(google.length,1);
    assert.match(google[0],/id=G-ZWJQMK8JSW$/);
    const data=await page.evaluate(()=>Array.from(window.dataLayer||[]).map(x=>Array.from(x)));
    const start=data.find(x=>x[0]==='consent'&&x[1]==='default');
    assert(start&&start[2].analytics_storage==='denied'&&start[2].ad_storage==='denied');
    assert(data.some(x=>x[0]==='consent'&&x[1]==='update'&&x[2].analytics_storage==='granted'));
    const cfg=data.find(x=>x[0]==='config');
    assert(cfg&&cfg[1]==='G-ZWJQMK8JSW'&&cfg[2].send_page_view===false);
    const events=data.filter(x=>x[0]==='event'&&x[1]==='page_view');
    assert.equal(events.length,1);
    assert.equal(events[0][2].page_path,'/privacy.html');
    assert(!JSON.stringify(events).includes('secret='));
   });
   await page.goto(BASE+'/?dd_tab=profilePage&private=very-secret',{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(500);
   await pass(viewport.width+'px landing on profile never counts private page or URL arguments',async()=>{
    const events=await page.evaluate(()=>Array.from(window.dataLayer||[])
      .map(x=>Array.from(x)).filter(x=>x[0]==='event'&&x[1]==='page_view'));
    assert.equal(events.length,0,'Private area must not emit pageview');
   });
   await page.locator('.nav .tab[data-tab="discover"]').click();
   await pass(viewport.width+'px permitted public navigation counted, URL stripped',async()=>{
    await page.waitForFunction(()=>Array.from(window.dataLayer||[]).some(x=>x[0]==='event'&&x[1]==='page_view'));
    const events=await page.evaluate(()=>Array.from(window.dataLayer||[]).map(x=>Array.from(x))
     .filter(x=>x[0]==='event'&&x[1]==='page_view'));
    assert.equal(events.length,1);
    assert.equal(events[0][2].page_path,'/site/news');
    assert.equal(events[0][2].page_location,BASE+'/site/news');
    assert(!JSON.stringify(events).includes('very-secret'));
   });
   await page.goto(BASE+'/privacy.html#analytics-settings',{waitUntil:'domcontentloaded'});
   await page.locator('[data-decline]').click();
   await pass(viewport.width+'px visitor can withdraw analytics at any time',async()=>{
    assert.equal(await page.evaluate(()=>localStorage.getItem('dd-site-analytics-consent-v1')),'declined');
    assert.equal(await page.locator('#dd-analytics-consent').isHidden(),true);
    const data=await page.evaluate(()=>Array.from(window.dataLayer||[]).map(x=>Array.from(x)));
    assert(data.some(x=>x[0]==='consent'&&x[1]==='update'&&x[2].analytics_storage==='denied'));
   });
   await page.goto(BASE+'/research/wne.html',{waitUntil:'domcontentloaded'});
   await pass(viewport.width+'px Research editor never includes analytics tag',async()=>{
    assert.equal(await page.locator('script[src*="analytics-consent"]').count(),0);
    assert.equal(await page.evaluate(()=>typeof window.DDAnalyticsConsent),'undefined');
   });
   await context.close();
  }
  console.log('PASS ANALYTICS TOTAL '+count+' offline Chromium assertions, consent-first with no live GA tracking');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL ANALYTICS CHROME:',e.stack||e);process.exitCode=1});
