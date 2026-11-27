'use strict';
// M11 QA: newly selected archive cases must start at the top, and Who’s Who must have a proper tab.
// All requests remain on loopback; neither Netlify nor user accounts are contacted.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:852},isMobile:width===393,hasTouch:width===393,locale:'en-GB'});
   await context.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch(_){}});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE)return route.continue();
    if(u.hostname==='unpkg.com'&&u.pathname==='/leaflet@1.9.4/dist/leaflet.js')
     return route.fulfill({path:path.resolve('node_modules/leaflet/dist/leaflet.js'),contentType:'application/javascript'});
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   try{
    await page.goto(BASE+'/?dd_tab=archivePage',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>typeof archiveCaseOpen==='function'&&typeof historicalRecords!=='undefined'&&
     historicalRecords.some(x=>String(x.id)==='featured-rendlesham-1980')&&
     historicalRecords.some(x=>String(x.id)==='featured-roswell-1947'),{timeout:20000});
    const dialog=page.locator('#archiveCaseDialog');
    const shell=dialog.locator('.evidence-shell');

    // Real archive list and in-dialog related-case actions call archiveCaseOpen.
    await page.evaluate(()=>archiveCaseOpen('featured-rendlesham-1980'));
    await dialog.locator('#archiveCaseTitle').waitFor();
    assert.match(await dialog.locator('#archiveCaseTitle').innerText(),/Rendlesham/i);
    let original=await shell.evaluate(el=>{el.scrollTop=el.scrollHeight;return {scroll:el.scrollTop,max:el.scrollHeight-el.clientHeight}});
    assert(original.max>=100&&original.scroll>100,'Case dialog can actually scroll at '+width+'px');
    await page.evaluate(()=>archiveCaseOpen('featured-roswell-1947'));
    await page.waitForTimeout(90); // also cover requestAnimationFrame after layout
    assert.match(await dialog.locator('#archiveCaseTitle').innerText(),/Roswell/i);
    const switched=await shell.evaluate(el=>({scroll:el.scrollTop,view:el.clientHeight}));
    assert(switched.scroll<=3,'New Roswell case must open at top, not previous case bottom: '+JSON.stringify(switched));

    // The same case updating in place (e.g. following) should not unexpectedly
    // jump back to the top; only a fresh record gets the reset.
    const beforeSame=await shell.evaluate(el=>{el.scrollTop=el.scrollHeight;return el.scrollTop});
    await page.evaluate(()=>archiveCaseOpen('featured-roswell-1947'));
    const afterSame=await shell.evaluate(el=>el.scrollTop);
    assert(beforeSame>100&&afterSame>=Math.min(beforeSame*0.65,100),
     'Re-rendering the same open case should preserve reading position');

    // Simulate the same entry point used by Case Connections buttons.
    await page.evaluate(()=>archiveCaseOpen('featured-rendlesham-1980'));
    await page.waitForTimeout(70);
    assert.match(await dialog.locator('#archiveCaseTitle').innerText(),/Rendlesham/i);
    assert(await shell.evaluate(el=>el.scrollTop)<=3,'Switching back to Rendlesham resets scroll');

    await page.locator('#archiveCaseClose').click();
    await dialog.waitFor({state:'hidden',timeout:10000});
    // Closing a case schedules history.back() asynchronously. The old test
    // immediately reopened another case before that popstate completed,
    // allowing the delayed popstate to close the newly opened case.
    await page.waitForFunction(()=>!history.state?.ddArchiveCaseId,{timeout:10000});
    await page.evaluate(()=>archiveCaseOpen('featured-roswell-1947'));
    await page.waitForTimeout(70);
    assert(await shell.evaluate(el=>el.scrollTop)<=3,'Re-opening after Close starts at top');
    await page.locator('#archiveCaseClose').click();
    await dialog.waitFor({state:'hidden',timeout:10000});
    await page.waitForFunction(()=>!history.state?.ddArchiveCaseId,{timeout:10000});

    // The missing Who's Who control must be a real labelled navigation entry,
    // not merely an off-screen article link.
    const nav=page.locator('.nav .tab[data-tab="peopleDirectory"]');
    assert.equal(await nav.count(),1,'Who’s Who has its own main navigation tab');
    assert.match(await nav.innerText(),/Who.s Who/);
    await nav.click();
    await page.waitForURL('**/who-is-who.html',{timeout:12000});
    assert.match(await page.locator('#content h1').innerText(),/Who.s Who in Disclosure/i);
    assert.equal(await page.locator('#directoryPage').isVisible(),true,'Full linked directory opens');
    assert.equal(await page.locator('header nav a[href="/"]').count(),1,'Return-to-home navigation stays available');
    console.log('PASS M11 '+width+'px: Archive case switching/reopening resets scroll, same-case reading retained, real Who’s Who tab opens directory');
   }finally{await page.close();await context.close()}
  }
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL M11 Archive/people navigation:',error.stack||error);process.exitCode=1});
