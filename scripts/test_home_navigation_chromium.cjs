'use strict';
// Real user section navigation without third-party API/account calls.
// Run via the existing R1 localhost-only Chromium runner.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:840}});
   await context.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch(_){}});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin==='http://127.0.0.1:4173')return route.continue();
    if(url.hostname==='unpkg.com'&&url.pathname==='/leaflet@1.9.4/dist/leaflet.js')
     return route.fulfill({path:require('node:path').resolve('node_modules/leaflet/dist/leaflet.js'),contentType:'application/javascript'});
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage(),exceptions=[];
   page.on('pageerror',e=>exceptions.push(e.message));
   await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
   await page.locator('#ddSiteHome').waitFor();
   assert.equal(await page.locator('#discover').isVisible(),true,'First landing shows Home');
   assert.equal(await page.locator('#ddSiteBack').isVisible(),false,'Home does not show useless Back');
   await page.locator('.nav .tab[data-tab="archivePage"]').click();
   assert.equal(await page.locator('#archivePage').isVisible(),true,'Archive tab opens');
   assert.equal(await page.locator('#ddSiteBack').isVisible(),true,'Back appears for deep sections');
   await page.goBack({waitUntil:'domcontentloaded'});
   await page.locator('#discover').waitFor({state:'visible'});
   assert.equal(await page.locator('#archivePage').isVisible(),false,'Native browser Back returns Home');
   await page.locator('[data-go="about"]').first().click();
   assert.equal(await page.locator('#about').isVisible(),true,'About opens from Home quick links');
   await page.locator('#ddSiteHome').click();
   assert.equal(await page.locator('#discover').isVisible(),true,'Header logo always returns Home');
   await page.locator('[data-go="resources"]').first().click();
   assert.equal(await page.locator('#resources').isVisible(),true,'Resources opens');
   await page.locator('#ddSiteBack').click();
   await page.locator('#discover').waitFor({state:'visible'});
   assert.equal(await page.locator('#ddSiteBack').isVisible(),false,'Header Back returns Home');
   const dangerous=exceptions.filter(x=>/SyntaxError|ReferenceError|is not defined|Cannot access/i.test(x));
   assert.deepEqual(dangerous,[],'No fatal navigation runtime exception: '+dangerous.join(', '));
   console.log('PASS Home navigation '+width+'px: clickable logo, section deep link, native Back, header Back, no fatal JS errors');
   await context.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL home navigation',e.stack||e);process.exitCode=1});
