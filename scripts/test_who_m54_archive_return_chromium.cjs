'use strict';
// M54 isolated real Chromium on desktop emulating mobile widths.
// Local synthetic HTML fixture checks the shipped return module; it does NOT
// claim to be an Android WebView, full Archive page or actual external intent.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:820},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===base&&url.pathname==='/who-is-who.html'&&url.searchParams.get('person')==='kevin-knuth')
     return route.fulfill({status:200,contentType:'text/html',
      body:'<!doctype html><title>Who return fixture</title><h1>Returned to Kevin Knuth profile</h1>'});
    if(url.origin===base)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();
   await page.goto(base+'/assets/who-archive-return.js',{waitUntil:'domcontentloaded'});
   await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">'+
     '<main style="max-width:95%;margin:auto;padding:8px;background:#101d2b;color:#f0d8ad">'+
     '<dialog id="archiveCaseDialog" open><h2>Archive case return fixture</h2>'+
     '<div id="ddWhoArchiveReturnWrap" hidden><button type="button" id="ddWhoArchiveReturn" hidden>← Back to Who’s Who profile</button></div>'+
     '<p>Evidence case information</p></dialog></main>');
   await page.addScriptTag({url:base+'/assets/who-archive-return.js'});
   const original={
    personId:'kevin-knuth',personName:'Kevin Knuth',target:'archive',
    caseId:'featured-nimitz-2004',page:'/who-is-who.html?person=kevin-knuth',
    savedAt:Date.now()-1000,y:400
   };
   const result=await page.evaluate(marker=>{
    history.replaceState(null,'','/?dd_tab=archivePage&dd_from=who');
    sessionStorage.setItem('dd-who-case-return-v1',JSON.stringify(marker));
    return window.DDWhoArchiveReturn.update(
     document.querySelector('#ddWhoArchiveReturn'),'featured-nimitz-2004');
   },original);
   assert.equal(result,true,'Valid Who Nimitz context enables Back');
   assert.equal(await page.locator('#ddWhoArchiveReturnWrap').isVisible(),true);
   assert.equal(await page.locator('#ddWhoArchiveReturn').isVisible(),true);
   let visible=await page.evaluate(()=>window.DDWhoArchiveReturn.update(
    document.querySelector('#ddWhoArchiveReturn'),'featured-rendlesham-1980'));
   assert.equal(visible,false,'Unrelated case must hide return');
   assert.equal(await page.locator('#ddWhoArchiveReturnWrap').isVisible(),false);
   await page.evaluate(()=>history.replaceState(null,'','/?dd_tab=archivePage'));
   visible=await page.evaluate(()=>window.DDWhoArchiveReturn.update(
    document.querySelector('#ddWhoArchiveReturn'),'featured-nimitz-2004'));
   assert.equal(visible,false,'No dd_from marker means no contextual Back');
   await page.evaluate(()=>history.replaceState(null,'','/?dd_tab=archivePage&dd_from=who'));
   await page.evaluate(()=>window.DDWhoArchiveReturn.update(
    document.querySelector('#ddWhoArchiveReturn'),'featured-nimitz-2004'));
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
   assert(overflow.scroll<=overflow.view+3,'No horizontal overflow: '+JSON.stringify({width,...overflow}));
   await Promise.all([page.waitForURL(base+'/who-is-who.html?person=kevin-knuth',{timeout:12000}),
    page.locator('#ddWhoArchiveReturn').click()]);
   assert.equal(await page.locator('h1').innerText(),'Returned to Kevin Knuth profile');
   await ctx.close();
  }
  console.log('M54 isolated Chromium PASS: hidden/visible contextual Archive Back, case mismatch, direct visits, safe internal destination, responsive 320/393/820/1280. NOT an Android hardware or complete Archive-page check.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
