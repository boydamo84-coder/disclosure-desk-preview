'use strict';
// M39 real Chrome: source tracker responsive, safe, and truthful. LOCAL ONLY.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    return u.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(base+'/sources.html#sourceVerification',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#ddVerificationList .dd-verification-card').first()
    .waitFor({state:'visible',timeout:15000});
   const cards=page.locator('#ddVerificationList .dd-verification-card');
   assert.equal(await cards.count(),2,'Both government research enquiries appear');
   const text=await page.locator('#sourceVerification').innerText();
   assert(text.includes('Source Verification Tracker'));
   assert(text.includes('National Archives'));
   assert(text.includes('Pentagon'));
   assert(text.includes('17 November 2026'));
   assert.match(text,/manually, not live government tracking/i);
   assert.match(text,/not\s+establish delivery|not establish delivery/i);
   assert.match(text,/no fees have been authorised/i);
   for(const item of await cards.all()){
    const state=item.locator('.dd-verification-state');
    assert.equal(await state.getAttribute('data-status'),'sent_unacknowledged');
    assert.match(await state.innerText(),/acknowledgement not verified/i);
    assert.match(await item.locator('.dd-verification-dates').innerText(),/17 November 2026/);
    assert((await item.locator('.dd-verification-timeline li').count())>=2);
    await item.locator('details > summary').click();
    assert.equal(await item.locator('details').getAttribute('open'),'');
    const sources=item.locator('.dd-verification-links a');
    assert((await sources.count())>=2);
    for(const l of await sources.all()){
     assert.equal(await l.getAttribute('rel'),'noopener noreferrer');
     const url=await l.getAttribute('href');assert(url.startsWith('https://'));
    }
   }
   assert.equal(await page.locator('#sourceGrid .entry').count(),13,'Archive directory preserved');
   assert.equal(await page.locator('input#archiveSearch').count(),1);
   assert.equal(await page.locator('select#countryFilter').count(),1);
   assert.equal(await page.locator('select#typeFilter').count(),1);
   const widthCheck=await page.evaluate(()=>{
    const root=document.getElementById('sourceVerification');
    const view=document.documentElement.clientWidth;
    const rect=root.getBoundingClientRect();
    const cards=[...root.querySelectorAll('.dd-verification-card')];
    return {view,left:rect.left,right:rect.right,cards:cards.map(x=>({
      left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right
    }))};
   });
   assert(widthCheck.left>=-2&&widthCheck.right<=widthCheck.view+2,
     'Source section fits viewport at '+width+': '+JSON.stringify(widthCheck));
   for(const card of widthCheck.cards)assert(card.left>=-2&&card.right<=widthCheck.view+2,
     'Tracker card fits viewport at '+width);
   // Who's Who retains public claim-review safety and links to the dated log.
   await page.goto(base+'/who-is-who.html',{waitUntil:'domcontentloaded'});
   const a=page.locator('#ddWhoSourceTracker a');
   await a.waitFor({state:'visible'});
   assert.equal(await a.getAttribute('href'),'/sources#sourceVerification');
   const callout=await page.locator('#ddWhoSourceTracker').innerText();
   assert.match(callout,/acknowledgement or answer has yet been verified/i);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,
     'Keep premium navigation, do not add a dock tab');
   assert.deepEqual(errors,[], 'No JavaScript errors '+width);
   await ctx.close();
  }
  // Fail closed when public status JSON is missing or malformed.
  const ctx=await browser.newContext({viewport:{width:393,height:850}});
  await ctx.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.pathname==='/data/public-source-verification.json')return route.fulfill({status:503,body:'Service unavailable'});
   return u.origin===base?route.continue():route.abort('blockedbyclient');
  });
  const page=await ctx.newPage();
  await page.goto(base+'/sources.html#sourceVerification',{waitUntil:'domcontentloaded'});
  await page.locator('.dd-verification-error').waitFor({state:'visible',timeout:15000});
  assert.match(await page.locator('.dd-verification-error').innerText(),/could not be loaded/i);
  assert.equal(await page.locator('.dd-verification-card').count(),0,'No fabricated status fallback');
  await ctx.close();
  console.log('M39 Chromium PASS: 2 dated agency enquiries, responsive at 320/393/820/1280, original links, no false receipt, Who’s Who callout, original dock and archive, offline data failure closed.');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
