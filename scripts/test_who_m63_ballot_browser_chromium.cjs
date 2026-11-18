'use strict';
// Real Chrome on an isolated synthetic fixture only. No network to production.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const fixture=base+'/scripts/fixtures/who-m63-member-ballot.html';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:860},locale:'en-GB'});
   const errors=[],outbound=[];
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin!==base){outbound.push(u.href);return route.abort('blockedbyclient')}
    if(/\/rest\/v1\/|\/rpc\/|\/auth\/v1\//.test(u.pathname)){outbound.push(u.pathname);return route.abort('blockedbyclient')}
    return route.continue();
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(fixture,{waitUntil:'domcontentloaded'});
   const fields=page.locator('#ballot fieldset');
   await fields.first().waitFor({state:'visible',timeout:12000});
   assert.equal(await fields.count(),5);
   const unknown=fields.locator('input[type=checkbox]'),sliders=fields.locator('input[type=range]');
   assert.equal(await unknown.count(),5);
   assert.equal(await sliders.count(),5);
   const status=page.locator('[data-assessment]');
   assert.match(await status.innerText(),/Not enough information is different from zero points/);
   for(let i=0;i<5;i++){assert(await unknown.nth(i).isChecked());assert(await sliders.nth(i).isDisabled())}
   await unknown.first().uncheck();
   assert.equal(await sliders.first().inputValue(),'0');
   assert.match(await status.innerText(),/1 of 5 assessed · 0 \/ 25/);
   assert.match(await status.innerText(),/No overall score while incomplete/);
   await sliders.first().press('End');
   assert.match(await status.innerText(),/1 of 5 assessed · 25 \/ 25/);
   await page.locator('[data-save]').click();
   await page.locator('[data-save]').filter({hasText:'Update my ballot'}).waitFor();
   assert.equal(await page.evaluate(()=>window.DDM63Fixture.log.length),1);
   const first=await page.evaluate(()=>window.DDM63Fixture.log[0]);
   assert.equal(first.kind,'create');
   assert.equal(first.answers.original,25);
   assert.equal(first.answers.independent,null);
   assert.equal(first.claim_version,1);
   assert.equal(first.user_id,undefined,'No user identity in simulated payload');
   assert.match(await status.innerText(),/1 of 5 assessed/);
   assert.equal(await page.locator('[data-withdraw]').isEnabled(),true);
   await page.selectOption('#viewer','beta');
   await page.locator('[data-save]').filter({hasText:'Save private ballot'}).waitFor();
   assert.match(await page.locator('[data-assessment]').innerText(),/All five criteria are unanswered/);
   assert.equal(await page.evaluate(()=>window.DDM63Fixture.total()),1);
   for(let i=0;i<5;i++)await fields.locator('input[type=checkbox]').nth(i).uncheck();
   assert.match(await page.locator('[data-assessment]').innerText(),/0 \/ 100/);
   await page.locator('[data-save]').click();
   await page.locator('[data-save]').filter({hasText:'Update my ballot'}).waitFor();
   assert.equal(await page.evaluate(()=>window.DDM63Fixture.total()),2,'Two independent fake member ballots');
   await page.selectOption('#viewer','alpha');
   await page.locator('[data-save]').filter({hasText:'Update my ballot'}).waitFor();
   assert.equal(await sliders.first().inputValue(),'25','Member A private vote restored');
   assert(await unknown.nth(1).isChecked(),'Member A unknown retained');
   await page.locator('[data-withdraw]').click();
   await page.locator('[data-save]').filter({hasText:'Save private ballot'}).waitFor();
   const latest=await page.evaluate(()=>window.DDM63Fixture.log.at(-1));
   assert.equal(latest.kind,'withdraw');
   assert(await page.locator('[data-withdraw]').isDisabled());
   assert.equal(await page.evaluate(()=>window.DDM63Fixture.total()),2,'Withdrawal preserves uniqueness history');
   await page.selectOption('#viewer','guest');
   await page.locator('#ballot .notice').waitFor();
   assert.match(await page.locator('#ballot').innerText(),/Sign in with a regular/);
   assert.equal(await page.locator('#ballot fieldset').count(),0);
   await page.selectOption('#viewer','anonymous');
   await page.locator('#ballot .notice').waitFor();
   assert.equal(await page.locator('#ballot fieldset').count(),0,'Anonymous-auth blocked');
   await page.selectOption('#viewer','beta');
   await page.locator('[data-save]').filter({hasText:'Update my ballot'}).waitFor();
   await page.selectOption('#version','2');
   await page.locator('[data-save]').filter({hasText:'Save private ballot'}).waitFor();
   assert.equal(await page.evaluate(()=>window.DDM63Fixture.total()),2,'Claim version isolated');
   await page.locator('#approved').uncheck();
   await page.locator('#ballot .notice').waitFor();
   assert.match(await page.locator('#ballot').innerText(),/not open for this claim and version/);
   assert.equal(await page.locator('[data-save]').count(),0);
   await page.locator('#approved').check();
   await page.locator('#showSnapshots').check();
   await page.locator('[data-save]').waitFor();
   assert.match(await page.locator('.aggregate').innerText(),/15 answered; 5 unknown/);
   const size=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
   assert(size.actual<=size.view+3,'No horizontal overflow '+width+': '+JSON.stringify(size));
   assert.deepEqual(outbound,[],'No live service or third party traffic');
   assert.deepEqual(errors,[],'No JS errors '+width);
   await ctx.close();
  }
  console.log('M63 CHROME PASS: 320/393/820/1280 private ballots, two synthetic accounts, anonymous/guest lockout, version isolation, 0 vs unknown, withdraw, aggregate privacy and no network.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
