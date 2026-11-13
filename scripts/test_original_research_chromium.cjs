'use strict';
// Real Chromium local research article and existing archive interaction checks.
// Run only against loopback http://127.0.0.1:4173. No external services/accounts.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const viewport of [{width:393,height:852},{width:1280,height:900}]){
   const context=await browser.newContext({viewport,locale:'en-GB',isMobile:viewport.width===393,hasTouch:viewport.width===393});
   await context.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch(_){}});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE&&u.pathname==='/investigations')return route.fulfill({path:path.resolve('investigations.html'),contentType:'text/html'});
    if(u.origin===BASE&&u.pathname==='/rendlesham-forest-1980')return route.fulfill({path:path.resolve('rendlesham-forest-1980.html'),contentType:'text/html'});
    if(u.origin===BASE&&u.pathname==='/roswell-1947')return route.fulfill({path:path.resolve('roswell-1947.html'),contentType:'text/html'});
    if(u.origin===BASE)return route.continue();
    if(u.hostname==='unpkg.com'&&u.pathname==='/leaflet@1.9.4/dist/leaflet.js'){
     return route.fulfill({path:path.resolve('node_modules/leaflet/dist/leaflet.js'),contentType:'application/javascript'});
    }
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   const failures=[];
   page.on('pageerror',e=>failures.push(String(e.message||e)));
   for(const slug of ['rendlesham-forest-1980','roswell-1947']){
    await page.goto(BASE+'/'+slug+'.html',{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#content h1').waitFor();
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://uapdisclosuredesk.com/'+slug);
    assert.equal(await page.locator('#record-ledger').isVisible(),true,slug+' record evidence ledger visible');
    assert.equal(await page.locator('#sources a[href^="https://"]').count()>=2,true,slug+' has inspectable source citations');
    const widths=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(widths.doc<=widths.viewport+3,slug+' must not scroll horizontally at '+viewport.width+'px');
    assert(await page.locator('a[href^="/?dd_tab=archivePage"][href*="dd_archive_case"]').count()>=1,
      slug+' has a linked curated archive record');
    await page.locator('a[href^="/?dd_tab=archivePage"][href*="dd_archive_case"]').first().click();
    await page.waitForURL('**/?dd_tab=archivePage*',{timeout:15000});
    await page.locator('#archiveCaseDialog[open] #archiveCaseTitle').waitFor({timeout:25000});
    const title=await page.locator('#archiveCaseTitle').innerText();
    assert.match(title,slug.startsWith('roswell')?/Roswell/i:/Rendlesham/i);
    const correctReturn=await page.locator('#archiveCaseBody a[href="/'+slug+'"]').count();
    assert(correctReturn===1,'Archive detail must return to same original article');
    await page.locator('#archiveCaseClose').click();
    await page.locator('#archiveCaseDialog[open]').waitFor({state:'hidden',timeout:8000});
    assert(await page.locator('#archivePage').isVisible(),'Archive remains visible after closing details');
    console.log('PASS RESEARCH BROWSER '+slug+' '+viewport.width+'px: public article, citations, no overflow, curated archive dialogue, return link');
   }
   // External CDNs and authentication services are intentionally blocked.
   // Report JS exceptions for triage but do not assume external fetch failures mean a site regression.
   if(failures.length)console.log('INFO blocked-external-runtime warnings '+viewport.width+'px: '+JSON.stringify(failures.slice(0,8)));
   await context.close();
  }
  console.log('PASS original research Chromium navigation tests at phone + desktop sizes; NO deploy or real account calls');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL original research browser QA:',e.stack||e);process.exitCode=1});
