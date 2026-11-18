'use strict';
// M62 isolated real-Chrome source-first Who's Who regression. NO voting/accounts.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   const outbound=[],dbCalls=[],errors=[];
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin!==base){outbound.push(u.origin);return route.abort('blockedbyclient')}
    if(/dd_who_claim_rating|\/rest\/v1\/|\/rpc\//i.test(u.pathname)){
     dbCalls.push(u.pathname);return route.abort('blockedbyclient');
    }
    return route.continue();
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(base+'/who-is-who.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#peopleCards [data-person-id]').first().waitFor({state:'visible',timeout:20000});
   assert.equal(await page.locator('#peopleCards [data-person-id]').count(),57,
     'Fifty original + seven staged sourced profiles at '+width);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,
     'Premium 14-tab navigation retained');
   for(const person of ['david-fravor','sean-kirkpatrick','alex-dietrich']){
    await page.goto(base+'/who-is-who.html?person='+person,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:20000});
    const name=await page.locator('#profileName').innerText();
    assert(name.length>=5,person+' profile loaded');
    assert.equal(await page.locator('#profileEvidenceReviews .claim-dual').count(),0,'No dual rating panel');
    assert.equal(await page.locator('#profileEvidenceReviews [data-rating-save]').count(),0,'No old voting button');
    assert.equal(await page.locator('#profileEvidenceReviews [data-rating-slider]').count(),0,'No legacy slider');
    const body=await page.locator('#profileEvidenceReviews').innerText();
    assert(!body.includes('Disclosure Desk rating'),'No editorial rating copy');
    assert(!body.includes('Community rating'),'No old scalar vote copy');
    if(person==='david-fravor'){
     const evidence=page.locator('#profileEvidenceReviews .claim-review .claim-evidence-details');
     assert.equal(await evidence.count(),1,'Original claim dossier still present');
     await evidence.locator(':scope > summary').click();
     assert.match(await evidence.innerText(),/Research notes|source|original/i,
       'Original evidence/source review still readable');
     const links=page.locator('#profileEvidenceReviews a[href^="https://"]');
     assert((await links.count())>=2,'Primary evidence and coverage links still available');
     assert.match(body,/Community evidence worksheet:[\s\S]*Not open for submissions/i);
    }else{
     assert.match(body,/Source-first research:/,'Supplementary profile retains staged source status');
     assert((await page.locator('#profileSources a[href^="https://"]').count())>=1,
       'Source links retained for '+person);
    }
    const dims=await page.evaluate(()=>({view:document.documentElement.clientWidth,actual:document.documentElement.scrollWidth}));
    assert(dims.actual<=dims.view+3,'Profile fits '+width+': '+person+' '+JSON.stringify(dims));
    await page.locator('#directoryBack').click();
    await page.locator('#directoryPage').waitFor({state:'visible',timeout:10000});
   }
   assert.deepEqual(errors,[],'No page script errors '+width);
   assert.deepEqual(dbCalls,[],'No legacy vote API calls');
   assert.deepEqual(outbound,[],'No external service loaded on source-first profiles');
   await ctx.close();
  }
  console.log('M62 CHROME PASS: 57 profiles, Fravor original dossier, Sean/Dietrich sources, 14-tab nav, Back, no dual ratings or vote RPC, no overflow at 320/393/820/1280.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
