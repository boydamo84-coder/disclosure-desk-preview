'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    return u.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error.message||error)));
   await page.goto(base+'/world-uap-programmes.html',{waitUntil:'domcontentloaded'});
   await page.locator('#programmeResults .programme-card').first().waitFor({state:'visible',timeout:15000});
   assert.equal(await page.locator('#programmeResults .programme-card').count(),23);
   assert.match(await page.locator('#resultsCount').innerText(),/23 entries total/);
   const sourceLinks=page.locator('#programmeResults .programme-card a[href^="https://"]');
   assert((await sourceLinks.count())>=23,'Every programme should point to an original public source');
   for(const link of (await sourceLinks.all()).slice(0,25)){
    assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
   }
   await page.locator('#programmeSearch').fill('France');
   assert((await page.locator('#programmeResults .programme-card').count())>=1);
   await page.locator('#programmeSearch').fill('definitely-not-a-country-0');
   assert.equal(await page.locator('#programmeResults .programme-card').count(),0);
   await page.locator('#programmeSearch').fill('');
   assert.equal(await page.locator('#programmeResults .programme-card').count(),23);
   const overflowing=await page.evaluate(()=>({
    w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth
   }));
   assert(overflowing.s<=overflowing.w+2,'Global archive horizontal overflow at '+width);
   await page.goto(base+'/sources.html#sourceVerification',{waitUntil:'domcontentloaded'});
   await page.locator('#ddVerificationList .dd-verification-card').first().waitFor({state:'visible',timeout:15000});
   assert.equal(await page.locator('#ddVerificationList .dd-verification-card').count(),5);
   const canadian=page.locator('[data-enquiry-id="canada-lac-reproduction-permissions"]');
   assert.match(await canadian.innerText(),/limited file-specific|file-specific/i);
   assert.match(await canadian.innerText(),/3 November 2026/);
   await canadian.locator('details > summary').click();
   assert.match(await canadian.innerText(),/UAR\/N66\/001-074/);
   assert.match(await canadian.innerText(),/online scope pending|internet|website/i);
   assert(!/no general licence or reproduction approval has been granted/i.test(await canadian.innerText()),
    'Stale Canadian licence claim reappeared');
   const sourceGeo=await page.evaluate(()=>{
    const view=document.documentElement.clientWidth;
    const root=document.getElementById('sourceVerification');
    const section=root.getBoundingClientRect();
    const offending=[...document.querySelectorAll('*')].map(el=>({
      tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className.slice(0,80):'',
      right:Math.round(el.getBoundingClientRect().right),
      left:Math.round(el.getBoundingClientRect().left)
    })).filter(el=>el.right>view+3).slice(0,15);
    return {w:view,s:document.documentElement.scrollWidth,sectionRight:section.right,
      sectionLeft:section.left,offending};
   });
   if(sourceGeo.s>sourceGeo.w+2)console.log('SOURCE OVERFLOW DIAGNOSTIC',width,JSON.stringify(sourceGeo));
   assert(sourceGeo.sectionLeft>=-2&&sourceGeo.sectionRight<=sourceGeo.w+2,
    'New tracker itself must fit '+width);
   assert(sourceGeo.s<=sourceGeo.w+2,'Full Sources page must fit '+width+' px');
   assert.deepEqual(errors,[],'Browser page JS errors at '+width);
   await ctx.close();
  }
  console.log('PASS RC1 Chromium: 23 global directory entries, original links, search, five source enquiries with corrected LAC licence, no overflow on four viewports');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
