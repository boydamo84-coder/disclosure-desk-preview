'use strict';
/* M68 real Chrome, first-party-only URLs; NO live Supabase, ads or external fetches. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:850},
     serviceWorkers:'block',locale:'en-GB'});
   const remote=[],errors=[];
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE)return route.continue();
    if(route.request().resourceType()!=='image')remote.push(u.href);
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('#ddWhoProgrammeCards .dd-who-programme-card').length===23);
   await page.waitForFunction(()=>document.querySelectorAll('#ddWhoOutreachDigest .dd-outreach-digest-card').length===5);
   assert.equal(await page.locator('#ddWhoProgrammeCards .dd-who-programme-card').count(),23);
   assert.equal(await page.locator('#ddWhoProgrammeLeads > li').count(),13,
     'Do not duplicate the already indexed Vatican as a pending programme');
   assert.equal(await page.locator('#ddWhoProgrammeCards .dd-who-programme-card[data-programme-id=vatican]').count(),1);
   assert.match(await page.locator('#ddWhoProgrammeCards [data-programme-id=vatican]').textContent(),/Vatican Observatory|Vatican/);
   assert.equal(await page.locator('#ddWhoOutreachDigest .dd-outreach-digest-card').count(),5);
   assert.equal(await page.locator('#ddWhoOutreachDigest .dd-outreach-digest-state[data-status=response_received]').count(),3);
   assert.equal(await page.locator('#ddWhoOutreachDigest .dd-outreach-digest-state[data-status=records_released]').count(),1);
   assert.equal(await page.locator('#ddWhoOutreachDigest .dd-outreach-digest-state[data-status=sent_unacknowledged]').count(),1);
   assert.equal(await page.locator('details.dd-m64-ballot').count(),0);
   assert.equal(await page.evaluate(()=>window.DD_COMMUNITY_FEATURES?.whoEvidenceBallots),false);
   await page.locator('#ddWhoInternationalVerified > summary').click();
   await page.locator('#ddWhoProgrammeSearch').fill('Vatican');
   assert.equal(await page.locator('#ddWhoProgrammeCards .dd-who-programme-card').count(),1);
   await page.locator('#ddWhoProgrammeSearch').fill('');
   assert.equal(await page.locator('#ddWhoProgrammeCards .dd-who-programme-card').count(),23);
   const worldUrl=await page.locator('a[href="/world-uap-programmes.html"]').first().getAttribute('href');
   assert.equal(worldUrl,'/world-uap-programmes.html');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false);
   await page.goto(BASE+'/world-uap-programmes.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('#programmeResults .programme-card').length===23);
   await page.waitForFunction(()=>document.querySelectorAll('#ddWorldOutreachDigest .dd-outreach-digest-card').length===5);
   assert.equal(await page.locator('#programmeResults .programme-card').count(),23);
   assert.equal(await page.locator('#ddWorldOutreachDigest .dd-outreach-digest-card').count(),5);
   assert.match(await page.locator('#ddWorldOutreach').innerText(),/Who we contacted/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false);
   await page.goto(BASE+'/sources.html#dd-source-enquiry-brazil-arquivo-nacional-sian',
      {waitUntil:'domcontentloaded'});
   await page.locator('#dd-source-enquiry-brazil-arquivo-nacional-sian').waitFor();
   assert.match(await page.locator('#dd-source-enquiry-brazil-arquivo-nacional-sian').innerText(),/Arquivo Nacional/);
   assert.equal(await page.locator('#ddVerificationList > article').count(),5);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false);
   assert.deepEqual(errors,[],'No page JS errors at '+width);
   assert.deepEqual(remote,[],'No outside scripts/API at '+width);
   await context.close();
   console.log('M68 CHROME PASS '+width+'px: 23 entries incl Vatican, 13 distinct leads, 5 enquiry statuses and sources deep links, no vote/API or overflow');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('M68 CHROME FAILURE:',e.stack||e);process.exitCode=1});
