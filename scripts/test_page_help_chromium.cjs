'use strict';
// Contextual guide, native popup, tour and standalone public pages on loopback.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await context.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch(_){}});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/?dd_tab=archivePage',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#archivePage > .dd-help-bar button').waitFor({timeout:12000});
   assert.equal(await page.locator('#discover > .dd-help-bar button').count(),1,'News has top help icon');
   assert.equal(await page.locator('#researchStudio > .dd-help-bar button').count(),1,'W.NE tab has contextual help');
   assert.equal(await page.locator('#discussionsPage > .dd-help-bar button').count(),1,'Discussions has contextual help');
   assert.equal(await page.locator('#chatPage > .dd-help-bar button').count(),1,'Chat has contextual help');
   await page.locator('#archivePage > .dd-help-bar button').click();
   const dialog=page.locator('#ddPageHelpDialog');
   assert.equal(await dialog.isVisible(),true,'Archive guide popup visible');
   assert.match(await dialog.locator('#ddPageHelpTitle').innerText(),/Evidence Archive/);
   assert.match(await dialog.innerText(),/Source Lineage Desk/);
   assert.equal(await dialog.locator('#ddPageHelpGuide').getAttribute('href'),'/guide#archive');
   await page.keyboard.press('Escape');
   assert.equal(await dialog.isVisible(),false,'Escape closes popup');
   assert.equal(await page.locator('#archivePage > .dd-help-bar button').evaluate(el=>document.activeElement===el),true,'Help restores focus');
   await page.locator('#archivePage > .dd-help-bar button').click();
   assert.equal(await dialog.locator('#ddPageHelpTour').isVisible(),true,'Popup provides a contextual guided tour');
   await dialog.locator('#ddPageHelpTour').click();
   assert.equal(await page.locator('#appTourDialog').isVisible(),true,'Existing tour opens without navigation away');
   assert.match(await page.locator('#tourProgress').innerText(),/Follow the Evidence/i);
   await page.locator('#tourClose').click();
   assert.equal(await page.locator('#appTourDialog').isVisible(),false);
   await page.waitForTimeout(100);
   assert.equal(await page.locator('#archivePage').isVisible(),true,'Tour closes onto original Archive tab');
   const guide=await context.newPage();
   await guide.goto(BASE+'/guide.html',{waitUntil:'domcontentloaded'});
   assert.equal(await guide.locator('#source-lineage').count(),1);
   assert.equal(await guide.locator('#people').count(),1);
   await guide.locator('header .dd-help-trigger').click();
   assert.match(await guide.locator('#ddPageHelpTitle').innerText(),/How-to guide/);
   await guide.locator('.dd-help-close').click();
   const people=await context.newPage();
   await people.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded'});
   await people.locator('header .dd-help-trigger').click();
   assert.match(await people.locator('#ddPageHelpTitle').innerText(),/Who's Who/);
   assert.equal(await people.locator('#ddPageHelpGuide').getAttribute('href'),'/guide#people');
   await people.locator('.dd-help-done').click();
   const widths=await Promise.all([page,guide,people].map(p=>p.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}))));
   for(const result of widths)assert(result.document<=result.viewport+4,
    'Page help must not introduce horizontal overflow at '+width+'px');
   assert.deepEqual(errors.filter(x=>/ReferenceError|SyntaxError|DDPageHelp/.test(x)),[],'No fatal app help errors');
   await people.close();await guide.close();await page.close();await context.close();
   console.log('PASS M10 Chromium '+width+'px: contextual icon, keyboard popup, manual tour, guide contents and Who’s Who profile; original tab and focus restored');
  }
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL M10 page help Chromium:',error.stack||error);process.exitCode=1});
