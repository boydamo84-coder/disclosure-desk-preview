'use strict';
// M40 real Chromium: policy examples and actual Who profiles must never yield event percentages.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(base+'/who-is-who.html',{waitUntil:'domcontentloaded',timeout:30000});
   const guide=page.locator('#ddPolicyReviewGuide');
   await guide.waitFor({state:'visible'});
   assert.match(await guide.locator('h2').innerText(),/Different claims need different evidence/);
   assert.equal(await guide.locator('details').count(),2);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,
     'Original premium 14-tab dock preserved');
   for(const [id,name,source,personId] of [
    ['ddPolicyGold','Mike Gold','oversight.house.gov','mike-gold'],
    ['ddPolicyMellon','Christopher Mellon','christopherkmellon.substack.com','christopher-mellon']]){
    const details=guide.locator('#'+id);
    await details.locator('summary').click();
    assert.equal(await details.getAttribute('open'),'');
    assert.match(await details.innerText(),/No incident evidence score/i);
    assert.match(await details.innerText(),/Unresolved:/);
    const links=details.locator('a[target="_blank"]');
    assert((await links.count())>=2);
    assert((await links.first().getAttribute('href')).includes(source));
    for(const link of await links.all()){
     assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
     assert((await link.getAttribute('href')).startsWith('https://'));
    }
    assert.equal(await details.locator('a[href="/who-is-who?person='+personId+'"]').count(),1);
   }
   const geom=await guide.evaluate(el=>{
    const r=el.getBoundingClientRect(),view=document.documentElement.clientWidth;
    const cards=[...el.querySelectorAll('details')].map(c=>{
     const b=c.getBoundingClientRect();return {left:b.left,right:b.right};
    });
    return {left:r.left,right:r.right,view,cards};
   });
   assert(geom.left>=-2&&geom.right<=geom.view+2,'Policy guide within view: '+JSON.stringify(geom));
   for(const c of geom.cards)assert(c.left>=-2&&c.right<=geom.view+2,'Card fits '+width);
   // Never display scores or vote controls when opening the actual two profile records.
   for(const personId of ['mike-gold','christopher-mellon']){
    await page.goto(base+'/who-is-who.html?person='+personId,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:15000});
    const review=page.locator('#profileEvidenceReviews');
    await review.locator('.claim-review').waitFor({state:'visible',timeout:15000});
    assert.equal(await review.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0);
    assert.match(await review.innerText(),/not applicable/i);
   }
   assert.deepEqual(errors,[],'No browser errors at '+width+': '+JSON.stringify(errors));
   await ctx.close();
  }
  console.log('M40 Chromium PASS: 2 original-linked policy examples, 50-profile Who reader, true N/A instead of incident score, 14-tab dock, 320/393/820/1280 viewport.');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
