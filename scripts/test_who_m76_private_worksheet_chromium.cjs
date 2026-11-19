'use strict';
/* M76 browser QA: real interactive source-linked person profile at 4 widths.
   No live Supabase or external host requests allowed. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:900},
    serviceWorkers:'block',locale:'en-GB'});
   const remote=[],api=[],errors=[];
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(/\/(?:auth|rest)\/v1\//.test(u.pathname))api.push(u.href);
    if(u.origin===BASE)return route.continue();
    if(route.request().resourceType()!=='image')remote.push(u.href);
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(String(e.message)));
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#peopleCards [data-person-id="david-fravor"] button');
   assert.equal(await page.evaluate(()=>window.DD_COMMUNITY_FEATURES?.whoEvidenceBallots),false);
   await page.locator('#peopleCards [data-person-id="david-fravor"] button').click();
   assert.equal(await page.locator('#profileEvidenceReviews .dd-private-worksheet').count(),1,
    'One own claim worksheet, not a rating for Fravor himself');
   assert.match(await page.locator('#profileName').innerText(),/David Fravor/);
   const details=page.locator('#profileEvidenceReviews .dd-private-worksheet');
   await details.locator('summary').click();
   const fields=details.locator('select');
   assert.equal(await fields.count(),5);
   assert.equal(await details.locator('[role=status]').innerText().then(x=>x.includes('All five criteria')),true);
   await fields.nth(0).selectOption('0');
   assert.match(await details.locator('[role=status]').innerText(),/1 of 5 criteria assessed/);
   assert.match(await details.locator('[role=status]').innerText(),/0 \/ 25/);
   assert.match(await details.locator('[role=status]').innerText(),/No overall score/);
   await fields.nth(1).selectOption('30');
   await fields.nth(2).selectOption('25');
   await fields.nth(3).selectOption('10');
   await fields.nth(4).selectOption('10');
   assert.match(await details.locator('[role=status]').innerText(),/75 \/ 100/);
   assert.match(await details.locator('[role=status]').innerText(),/not a truth probability/);
   await details.getByRole('button',{name:'Clear my answers'}).click();
   assert.match(await details.locator('[role=status]').innerText(),/All five criteria/);
   for(let i=0;i<5;i++)assert.equal(await fields.nth(i).inputValue(),'');
   await fields.nth(0).selectOption('13');
   await page.locator('#directoryBack').click();
   await page.locator('#peopleCards [data-person-id="david-fravor"] button').click();
   assert.equal(await page.locator('.dd-private-worksheet select').first().inputValue(),'',
    'Back to directory and reopen must discard prior personal answers');
   await page.locator('#directoryBack').click();
   await page.locator('#peopleCards [data-person-id="david-grusch"] button').click();
   assert.equal(await page.locator('#profileEvidenceReviews .dd-private-worksheet').count(),0,
    'Institutional allegations are read-only, not auto-scored as direct incidents');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false,
    'No horizontal mobile overflow');
   assert.deepEqual(api,[],'No remote vote, login or Supabase REST call');
   assert.deepEqual(remote,[],'No outside JS/API resource');
   assert.deepEqual(errors,[],'No browser JavaScript errors');
   await context.close();
   console.log('M76 CHROME PASS '+width+'px: real Fravor profile, private five-criterion worksheet, zero/Unknown, 75/100 full, clear/reopen, Grusch excluded, no remote traffic/overflow');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('M76 CHROME FAILURE',e.stack||e);process.exitCode=1});
