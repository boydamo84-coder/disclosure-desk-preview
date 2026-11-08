'use strict';
// Milestone 28: clicks the highest-traffic anonymous workflows not already
// covered by the existing site smoke tests. Loopback only, no real credentials.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let passCount=0;
 const pass=t=>{passCount++;console.log('PASS M28 WORKFLOW '+t)};
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({
    viewport:{width,height:width===393?852:800},isMobile:width===393,hasTouch:width===393,
    locale:'en-GB',serviceWorkers:'block'
   });
   await ctx.route('**/*',route=>new URL(route.request().url()).origin===BASE?
     route.continue():route.abort('blockedbyclient'));
   const page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch{}});
   await page.goto(BASE+'/?dd_tab=discover',{waitUntil:'domcontentloaded',timeout:35000});
   await page.locator('#newsTopTab').click();
   assert.equal(await page.locator('#newsTopPanel').isVisible(),true);
   assert.equal(await page.locator('#newsTopTab').evaluate(e=>e.classList.contains('active')),true);
   pass(width+'px Top 100 news opens and has active selector');
   await page.locator('#newsReadTab').click();
   assert.equal(await page.locator('#newsReadPanel').isVisible(),true);
   assert.equal(await page.locator('#newsTopPanel').isVisible(),false);
   pass(width+'px Read news history replaces Top 100');
   await page.locator('#newsLatestTab').click();
   assert.equal(await page.locator('#newsReadPanel').isVisible(),false);
   assert.equal(await page.locator('#newsTopPanel').isVisible(),false);
   assert.equal(await page.locator('#newsLatestTab').evaluate(e=>e.classList.contains('active')),true);
   pass(width+'px Latest returns from history without stale panels');
   await page.locator('#newsArchiveTab').click();
   await page.locator('nav.nav .tab[data-tab="archivePage"][aria-current="page"]').waitFor({timeout:6500});
   pass(width+'px Full Archive chip navigates to actual Archive page');
   await page.locator('#ddArchiveSatelliteTab').click();
   assert.equal(await page.locator('#ddArchiveSatellitePanel').isVisible(),true);
   assert.equal(await page.locator('#ddArchiveCasesPanel').isVisible(),false);
   assert.equal(await page.locator('#ddArchiveSatelliteTab').getAttribute('aria-selected'),'true');
   pass(width+'px Satellite mode swaps content and ARIA state');
   await page.locator('#ddArchiveCasesTab').click();
   assert.equal(await page.locator('#ddArchiveCasesPanel').isVisible(),true);
   assert.equal(await page.locator('#ddArchiveSatellitePanel').isVisible(),false);
   pass(width+'px Case Files restores the other Archive pane');
   await page.locator('nav.nav .tab[data-tab="clips"]').click();
   await page.locator('#ddBrowseVideos').click();
   assert.equal(await page.locator('#ddBrowseVideos').evaluate(e=>e.classList.contains('dd-video-mode-active')),true);
   const searchFocused=await page.evaluate(()=>document.activeElement?.id==='clipSearch');
   assert.equal(searchFocused,true);
   pass(width+'px Video browse mode focuses search');
   // Swipe mode requires videos from the external catalogue, so only assert
   // handler selection here: fullscreen-media acceptance stays a live test gate.
   await page.locator('#ddSwipeVideos').click();
   assert.equal(await page.locator('#ddSwipeVideos').evaluate(e=>e.classList.contains('dd-video-mode-active')),true);
   pass(width+'px video swipe mode button is wired');
   assert.deepEqual(errors,[],'No unhandled JavaScript exceptions while testing workflows');
   await ctx.close();
  }
  console.log('PASS M28 WORKFLOW TOTAL '+passCount+' offline real-browser action checks');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M28 WORKFLOWS:',e.stack||e);process.exitCode=1});
