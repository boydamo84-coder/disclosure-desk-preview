'use strict';
/* Real Chromium GA4 retirement QA, standalone local server only, no live account. */
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let checks=0;
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:860},
    serviceWorkers:'block'});
   await context.addInitScript(()=>{
    try{localStorage.setItem('dd-site-analytics-consent-v1','accepted')}catch(_){}
   });
   const unexpected=[];
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(/(?:googletagmanager|google-analytics|analytics\.google)\.com$/i.test(u.hostname)
       ||u.pathname.includes('/bicea.org/22/')){
     unexpected.push(u.href);return route.abort('blockedbyclient');
    }
    return u.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   for(const route of ['/privacy.html','/','/guide.html','/sources.html',
      '/who-is-who.html','/research-edition.html']){
    await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:45000});
    assert.equal(await page.locator('script[src*="analytics-consent"]').count(),0,
      width+'px legacy script persists on '+route);
    assert.equal(await page.locator('#dd-analytics-consent').count(),0,
      width+'px old GA consent prompt persists on '+route);
    assert.equal(await page.locator('[data-dd-analytics-open]').count(),0,
      width+'px old GA preferences persist on '+route);
    assert.equal(await page.evaluate(()=>typeof window.DDAnalyticsConsent),'undefined');
    assert.equal(await page.evaluate(()=>typeof window.gtag),'undefined');
    assert.equal(unexpected.length,0,'Vendor/GA tracking on '+route+': '+JSON.stringify(unexpected));
    checks++;
   }
   await page.goto(BASE+'/privacy.html#advertising-settings',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#advertising-settings').count(),1);
   assert.equal(await page.locator('[data-dd-advertising-open]').count(),1);
   assert.equal(await page.locator('#dd-advertising-consent').count(),0,
      'Provider remains disabled in staged candidate');
   checks++;
   await context.close();
  }
  console.log('GA4 RETIREMENT CHROMIUM PASS '+checks+' checks over 320/393/820/1280px; no Google Analytics or Adsterra vendor requests');
 }finally{await browser.close();}
})().catch(e=>{console.error('FAIL GA4 retirement Chromium:',e.stack||e);process.exitCode=1});
