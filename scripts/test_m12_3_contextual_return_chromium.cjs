'use strict';
// M12.3 private Android context return acceptance; no Netlify, real accounts,
// outside requests or changes to the public index.html document.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const injected=fs.readFileSync('android-test/app/src/main/assets/research-return-nav.js','utf8');
async function localOnly(ctx){
 await ctx.route('**/*',route=>{
  try{
   const u=new URL(route.request().url());
   if(u.origin!==BASE)return route.abort('blockedbyclient');
   // Reproduce Android's explicit EmbeddedWebsiteRoutes clean-path allowlist.
   if(u.pathname==='/rendlesham-forest-1980')
    return route.fulfill({path:path.resolve('rendlesham-forest-1980.html'),contentType:'text/html'});
   if(u.pathname==='/roswell-1947')
    return route.fulfill({path:path.resolve('roswell-1947.html'),contentType:'text/html'});
   return route.continue();
  }catch{return route.abort('blockedbyclient')}
 });
}
async function profileReturn(page,person,label){
 await page.waitForURL(url=>url.pathname==='/who-is-who.html'&&url.searchParams.get('person')===person,
  {timeout:18000});
 await page.locator('#personProfile').waitFor({state:'visible',timeout:12000});
 assert.equal(await page.locator('#profileName').textContent(),label);
}
async function testArchive(ctx,width){
 const page=await ctx.newPage();
 await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
 const card=page.locator('#peopleCards [data-person-id="david-fravor"]');
 await card.locator('button').waitFor();
 await card.scrollIntoViewIfNeeded();
 const dirY=await page.evaluate(()=>Math.round(scrollY));
 assert(dirY>150,'Source person card needs a meaningful directory scroll position');
 await card.locator('button').click();
 await profileReturn(page,'david-fravor','David Fravor');
 const caseLink=page.locator('#profileRelatedCases a[href*="dd_archive_case=featured-nimitz-2004"]');
 await caseLink.scrollIntoViewIfNeeded();
 const personY=await page.evaluate(()=>Math.round(scrollY));
 const contextBefore=await page.evaluate(()=>history.state?.ddDirectoryReturn);
 assert.equal(contextBefore?.personId,'david-fravor');
 assert.equal(contextBefore?.y,dirY,'Source directory position copied into person history');
 await caseLink.click();
 await page.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('dd_tab')==='archivePage');
 assert.equal(new URL(page.url()).searchParams.get('dd_from'),'who','Link carries explicit trusted origin marker');
 await page.locator('#archiveCaseDialog[open] #archiveCaseTitle').waitFor({state:'visible',timeout:18000});
 assert.match(await page.locator('#archiveCaseTitle').innerText(),/Nimitz/i);
 assert.equal(await page.evaluate(injected),true,'Contextual return is enabled only from an explicit person link');
 await page.locator('#archiveCaseBody [data-dd-research-return="who"] button').waitFor();
 assert.match(await page.locator('#archiveCaseBody [data-dd-research-return="who"] button').textContent(),/Back to David Fravor/);
 // This is the *exact* function invoked before default dialog handling
 // by Android's OnBackInvokedCallback in MainActivity.
 assert.equal(await page.evaluate(()=>window.DDResearchReturn.handleBack()),true);
 await profileReturn(page,'david-fravor','David Fravor');
 await page.waitForFunction(target=>Math.abs(scrollY-target)<=85,personY,{timeout:12000});
 assert(Math.abs(await page.evaluate(()=>Math.round(scrollY))-personY)<=85,
  'Profile returns to the precise related-case section');
 await page.locator('#directoryBack').click();
 await page.locator('#directoryPage').waitFor({state:'visible'});
 await page.waitForFunction(y=>Math.abs(scrollY-y)<=45,dirY,{timeout:12000});
 assert.equal(await card.evaluate(el=>el.classList.contains('dd-returned-card')),true,
  'Original person is highlighted after the full Directory→Person→Archive→Person→Directory trip');
 await page.close();
 console.log('PASS M12.3 '+width+'px Archive: context Back, related-case source scroll and original directory card');
}
async function testDossier(ctx){
 const page=await ctx.newPage();
 await page.goto(BASE+'/who-is-who.html?person=larry-warren',{waitUntil:'domcontentloaded'});
 await page.locator('#personProfile').waitFor({state:'visible'});
 const dossier=page.locator('#profileRelatedCases a[href="/rendlesham-forest-1980"]');
 await dossier.waitFor({state:'visible'});
 await dossier.scrollIntoViewIfNeeded();
 const y=await page.evaluate(()=>Math.round(scrollY));
 await dossier.click();
 await page.waitForURL(url=>url.pathname.includes('/rendlesham-forest-1980'));
 assert.equal(new URL(page.url()).searchParams.get('dd_from'),'who');
 assert.equal(await page.evaluate(injected),true);
 const button=page.locator('[data-dd-research-return="who"] button');
 await button.waitFor({state:'visible',timeout:10000});
 assert.match(await button.innerText(),/Back to Larry Warren/);
 await button.click();
 await profileReturn(page,'larry-warren','Larry Warren');
 await page.waitForFunction(target=>Math.abs(scrollY-target)<=80,y,{timeout:10000});
 await page.close();
 console.log('PASS M12.3 dossier return: visible labelled source route and original profile section');
}
async function testNoHijack(ctx){
 const cases=[
  '/?dd_tab=archivePage&dd_archive_case=featured-nimitz-2004',
  '/?dd_tab=archivePage&dd_archive_case=featured-nimitz-2004&dd_from=who',
  '/rendlesham-forest-1980?dd_from=who'
 ];
 for(const url of cases){
  const page=await ctx.newPage();
  await page.goto(BASE+url,{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(injected),false,'No contextual return without matching same-tab trusted source: '+url);
  assert.equal(await page.locator('[data-dd-research-return="who"]').count(),0);
  await page.close();
 }
 console.log('PASS M12.3 origin safety: ordinary and forged Archive/dossier visits keep ordinary Back');
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,820]){
   const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
   await localOnly(ctx);
   // Ordering matters: ordinary first (separate tab sessionStorage), then linked tests.
   await testNoHijack(ctx);
   await testArchive(ctx,width);
   if(width===393)await testDossier(ctx);
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M12.3 return navigation:',e.stack||e);process.exitCode=1});
