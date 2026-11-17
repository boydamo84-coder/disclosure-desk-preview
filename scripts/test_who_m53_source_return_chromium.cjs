'use strict';
// M53 local-only desktop-Chromium mobile-width simulation.
// External publisher popup is intercepted and served synthetic HTML; NO real publisher contact,
// Android hardware, Play Store or Netlify is used.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const profileUrl=base+'/who-is-who.html?person=kevin-knuth';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820]){
   const context=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===base)return route.continue();
    if(url.hostname==='www.mdpi.com'&&url.pathname==='/1099-4300/21/10/939')
      return route.fulfill({status:200,contentType:'text/html',
       body:'<!doctype html><title>Isolated publisher navigation fixture</title><h1>External citation fixture</h1>'});
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(String(err.message||err)));
   await page.goto(profileUrl,{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#personProfile').waitFor({state:'visible',timeout:15000});
   assert.equal(await page.locator('#profileName').innerText(),'Kevin Knuth');
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14);
   const related=page.locator('#profileRelatedCases .dd-person-case-link');
   assert.equal(await related.count(),1,'Knuth has one attributable Nimitz association');
   assert.match(await related.innerText(),/later quantitative study, not a 2004 eyewitness/i);
   assert.match(await related.innerText(),/no independently retrieved original 2004 sensor track/i);
   const detail=page.locator('#profileEvidenceReviews .claim-review .claim-evidence-details');
   await detail.locator(':scope > summary').click();
   const external=detail.locator('.claim-evidence-summary a[href="https://www.mdpi.com/1099-4300/21/10/939"]');
   assert.equal(await external.count(),1);
   assert.equal(await external.getAttribute('target'),'_blank');
   assert.equal(await external.getAttribute('rel'),'noopener noreferrer');
   const originalUrl=page.url();
   const [popup]=await Promise.all([
    page.waitForEvent('popup',{timeout:10000}),
    external.click()
   ]);
   await popup.waitForLoadState('domcontentloaded',{timeout:10000});
   assert.match(await popup.locator('h1').innerText(),/External citation fixture/);
   assert.equal(page.url(),originalUrl,'Publisher link must not replace original profile tab');
   assert.equal(await page.locator('#personProfile').isVisible(),true);
   assert.equal(await detail.getAttribute('open'),'','Evidence accordion remains open');
   await popup.close();
   await page.bringToFront();
   assert.equal(page.url(),originalUrl,'Returning from external tab retains profile');
   const archive=related.locator('a[href*="dd_archive_case="]').first();
   assert.equal(await archive.count(),1,'Nimitz case route present');
   await archive.evaluate(a=>a.addEventListener('click',e=>e.preventDefault(),{once:true}));
   await archive.click();
   const saved=await page.evaluate(()=>{
    const item=sessionStorage.getItem('dd-who-case-return-v1');
    const parsed=item?JSON.parse(item):null;
    const link=document.querySelector('#profileRelatedCases a[href*="dd_archive_case="]');
    return {parsed,href:link?.getAttribute('href'),scroll:window.scrollY};
   });
   assert.equal(saved.parsed?.personId,'kevin-knuth','Archive departure remembers profile');
   assert.equal(saved.parsed?.caseId,'featured-nimitz-2004','Archive departure is tied to Nimitz');
   assert.equal(saved.parsed?.page,'/who-is-who.html?person=kevin-knuth');
   assert(Math.abs(saved.parsed.y-saved.scroll)<10,'Return scroll anchor captured on click');
   assert(saved.href.includes('dd_from=who'),'Archive link marks contextual Who return');
   // Reload the source profile to simulate recreating a previously opened Who view.
   // This does not assert real Android app/browser external-intent behaviour.
   await page.reload({waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#personProfile').waitFor({state:'visible',timeout:15000});
   await page.waitForFunction(()=>!sessionStorage.getItem('dd-who-case-return-v1'),null,{timeout:7000});
   assert.equal(await page.locator('#profileName').innerText(),'Kevin Knuth');
   await page.locator('#directoryBack').click();
   await page.locator('#directoryPage').waitFor({state:'visible',timeout:7000});
   assert.equal(new URL(page.url()).searchParams.has('person'),false);
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14);
   assert.deepEqual(errors,[],'No page script errors at '+width+': '+JSON.stringify(errors));
   await context.close();
  }
  console.log('M53 Chromium PASS: sourced Knuth Nimitz association, safe external citation popup, retained Who profile, stored Archive return marker, reload return and 14-tab Back at 320/393/820px. NOT a hardware Android test.');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1;});
