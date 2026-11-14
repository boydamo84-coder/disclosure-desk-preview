'use strict';
// M12.1: real Chromium comparison with the original index.html editorial dock.
// Runs entirely on loopback: no live site, accounts, Netlify or external resources.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const injection=fs.readFileSync('android-test/app/src/main/assets/editorial-secondary-nav.js','utf8');
const getItems=()=>Array.from(document.querySelectorAll('nav.nav .nav-inner .tab')).map(button=>[
 button.dataset.tab,button.querySelector('.ico')?.textContent||'',
 button.textContent.replace(button.querySelector('.ico')?.textContent||'','').trim()
]);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,820]){
   const context=await browser.newContext({viewport:{width,height:850}});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   const home=await context.newPage();
   await home.goto(BASE+'/',{waitUntil:'domcontentloaded'});
   const reference=await home.evaluate(getItems);
   assert.equal(reference.length,14,'Compare against all 14 actual website tabs including Discuss and Chat');
   const page=await context.newPage();
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
   await page.locator('#peopleCards article.card').first().waitFor();
   assert.equal(await page.evaluate(injection),true,'APK-only injected nav initializes');
   assert.equal(await page.evaluate(injection),true,'Repeated injection does not duplicate nav');
   assert.equal(await page.locator('#ddAndroidEditorialNav').count(),1);
   assert.deepEqual(await page.evaluate(getItems),reference,
    'Who\'s Who must show the very same website dock tab order, icons and labels');
   assert.equal(await page.locator('#ddAndroidEditorialNav .tab[aria-current="page"]').getAttribute('data-tab'),
    'peopleDirectory','Who\'s Who is the selected tab');
   assert.equal(await page.locator('#ddAndroidEditorialNav').evaluate(e=>getComputedStyle(e).position),'fixed');
   const next=page.locator('#ddAndroidNavNext');
   await next.waitFor({state:'visible'});
   await next.click();
   await page.waitForFunction(()=>document.querySelector('#ddAndroidEditorialNav .nav-inner').scrollLeft>5);
   await page.locator('#ddAndroidNavPrev').waitFor({state:'visible',timeout:5000});
   assert.equal(await page.locator('#ddAndroidNavPrev').isVisible(),true,'Backward arrow shown after scrolling');
   await page.locator('#ddAndroidNavPrev').click();
   await page.locator('#peopleSearch').focus();
   assert.equal(await page.locator('#ddAndroidEditorialNav').isVisible(),false,'Keyboard focus hides the dock');
   await page.locator('h1').click();
   await page.locator('#ddAndroidEditorialNav').waitFor({state:'visible'});
   assert.equal(await page.locator('#ddAndroidEditorialNav').isVisible(),true,'Dock restored after typing');
   await page.locator('#peopleSearch').fill('Mick West');
   await page.locator('#peopleSearch').press('Tab');
   await page.locator('#peopleCards button').click();
   await page.locator('#personProfile').waitFor({state:'visible'});
   await page.locator('#ddAndroidEditorialNav [data-tab="peopleDirectory"]').click();
   await page.locator('#directoryPage').waitFor({state:'visible'});
   assert.equal(new URL(page.url()).searchParams.has('person'),false,
    'Who\'s Who tab returns from profile to directory, not out of app');
   await page.locator('#ddAndroidEditorialNav [data-tab="mapPage"]').click();
   await page.waitForURL('**/?dd_tab=mapPage',{timeout:18000});
   assert.equal(new URL(page.url()).searchParams.get('dd_tab'),'mapPage',
    'Secondary dock maps to the existing app internal tab router');
   await home.close();await page.close();await context.close();
  }
  console.log('PASS M12.1 393/820px Chromium: exact home nav parity, arrows, profile return, Map router and keyboard focus; no deployment');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M12.1 editorial nav:',e.stack||e);process.exitCode=1});
