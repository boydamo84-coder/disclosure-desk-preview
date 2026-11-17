'use strict';
// M61: real Chromium test of the non-submitting M57 member evidence worksheet.
// No remote network, authenticated accounts, Supabase calls, stored votes or deployment.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const path='/scripts/fixtures/who-community-five-criteria-m57.html';
const caps=[25,30,25,10,10];

(async()=>{
 const browser=await chromium.launch({
  executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']
 });
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   const outside=[],sensitiveRequests=[],errors=[];
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==base){outside.push(url.origin);return route.abort('blockedbyclient')}
    if(/\/rest\/v1\/|\/rpc\/|\/auth\/v1\/|\/functions\/v1\//i.test(url.pathname)){
     sensitiveRequests.push(url.pathname);return route.abort('blockedbyclient');
    }
    return route.continue();
   });
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
   const fields=page.locator('#criteria fieldset');
   await fields.first().waitFor({state:'visible',timeout:10000});
   assert.equal(await fields.count(),5,'Five evidence criteria at '+width);
   const missing=fields.locator('input[type="checkbox"]');
   const sliders=fields.locator('input[type="range"]');
   assert.equal(await missing.count(),5);
   assert.equal(await sliders.count(),5);
   const result=page.locator('#result');
   assert.match(await result.innerText(),/No categories assessed yet/);
   assert.match(await result.innerText(),/different from zero points/);
   assert.match(await page.locator('main').innerText(),/No votes are being taken/);
   for(let i=0;i<5;i++){
    assert.equal(await missing.nth(i).isChecked(),true,'Missing defaults true');
    assert.equal(await sliders.nth(i).isDisabled(),true,'Slider disabled when unknown');
    assert.equal(await sliders.nth(i).getAttribute('max'),String(caps[i]));
    assert.match(await fields.nth(i).innerText(),/Not enough information to score/);
   }

   // A user may explicitly score zero; it is not missing and must not imply 0/100.
   await missing.first().uncheck();
   assert.equal(await sliders.first().isEnabled(),true);
   assert.equal(await sliders.first().inputValue(),'0');
   let message=await result.innerText();
   assert.match(message,/1 of 5 categories assessed; 0 \/ 25 points/);
   assert.match(message,/4 unanswered/);
   assert.match(message,/No overall total while incomplete/);
   assert.doesNotMatch(message,/Your personal worksheet:/);

   // Keyboard controls must be usable without dragging a touch slider.
   await sliders.first().press('End');
   assert.equal(await sliders.first().inputValue(),'25');
   assert.match(await result.innerText(),/25 \/ 25 points/);
   await missing.first().check();
   assert.equal(await sliders.first().isDisabled(),true);
   assert.match(await result.innerText(),/No categories assessed yet/);
   await missing.first().uncheck();
   assert.equal(await sliders.first().inputValue(),'25','Known score restored only after explicit re-answer');

   for(let i=1;i<5;i++){
    await missing.nth(i).uncheck();
    await sliders.nth(i).press('End');
    assert.equal(await sliders.nth(i).inputValue(),String(caps[i]));
   }
   message=await result.innerText();
   assert.match(message,/Your personal worksheet: 100 \/ 100 points/);
   assert.match(message,/not the likelihood an event occurred/);
   assert.match(message,/Nothing has been submitted/);

   await sliders.first().press('Home');
   assert.equal(await sliders.first().inputValue(),'0');
   assert.match(await result.innerText(),/Your personal worksheet: 75 \/ 100 points/);
   await missing.nth(1).check();
   message=await result.innerText();
   assert.match(message,/4 of 5 categories assessed; 45 \/ 70 points/);
   assert.match(message,/1 unanswered/);
   assert.match(message,/No overall total while incomplete/);
   assert.doesNotMatch(message,/75 \/ 100|Your personal worksheet:/);

   await page.locator('#reset').click();
   assert.match(await result.innerText(),/No categories assessed yet/);
   for(let i=0;i<5;i++){
    assert(await missing.nth(i).isChecked(),'Reset keeps unknown explicit');
    assert(await sliders.nth(i).isDisabled(),'Reset prevents accidental zero score');
    assert.equal(await sliders.nth(i).inputValue(),'0','Reset clears stale private entry');
   }
   const state=await page.evaluate(()=>({
    width:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth,
    storage:localStorage.length+sessionStorage.length,
    forms:document.forms.length,
    controls:[...document.querySelectorAll('#criteria input')].length
   }));
   assert(state.scroll<=state.width+3,'No horizontal overflow '+width+': '+JSON.stringify(state));
   assert.equal(state.storage,0,'No browser storage touched');
   assert.equal(state.forms,0,'No ballot submission form');
   assert.equal(state.controls,10);
   assert.deepEqual(sensitiveRequests,[],'No vote/auth endpoints requested');
   assert.deepEqual(outside,[],'No remote service requested');
   assert.deepEqual(errors,[],'No page errors '+width);
   await context.close();
  }
  console.log('M61 CHROMIUM PASS: 5 criteria at 320/393/820/1280; 0 vs unknown; keyboard input; full/partial totals; private reset; no submission/storage/network or horizontal overflow.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
