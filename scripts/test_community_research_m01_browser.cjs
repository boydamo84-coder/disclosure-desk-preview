'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());return u.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(base+'/community-research.html',{waitUntil:'domcontentloaded'});
   await page.locator('#researchDemoCard').waitFor();
   assert.match(await page.locator('#researchReleaseStatus').innerText(),/submissions, voting and comments are not live/);
   assert.equal(await page.locator('#researchReader .feedback button:not([disabled])').count(),0);
   await page.locator('#readDemo').click();
   assert.equal(await page.locator('#researchReader').isVisible(),true);
   assert.match(await page.locator('#readerEyebrow').innerText(),/demonstration only/i);
   await page.locator('#closeReader').click();
   await page.locator('#researchSearch').fill('unrelated text');
   assert.equal(await page.locator('#researchDemoCard').isVisible(),false);
   await page.locator('#researchSearch').fill('');
   assert.equal(await page.locator('#researchDemoCard').isVisible(),true);
   await page.locator('#beginDraft').click();
   assert.equal(await page.locator('#researchComposer').isVisible(),true);
   await page.locator('#researchTitle').fill('Reviewing a source record <img src=x onerror=alert(1)>');
   await page.locator('#researchAbstract').fill('This is a test of the publication preview and disclosure of research limitations.');
   await page.locator('#researchBody').fill('Original research draft: '+('A careful investigation compares independent reports and their attributed references. ').repeat(6)+'<img src=x onerror=alert(1)>');
   await page.locator('#researchSources').fill('http://insecure.example/test');
   await page.locator('#researchOriginal').check();
   await page.locator('#researchConsent').check();
   await page.locator('#reviewDraft').click();
   assert.equal(await page.locator('#researchPreview').isVisible(),false,'Non-HTTPS references rejected');
   assert.match(await page.locator('#composeStatus').innerText(),/public HTTPS/i);
   await page.locator('#researchSources').fill('https://www.archives.gov/research/topics/uaps');
   await page.locator('#reviewDraft').click();
   assert.equal(await page.locator('#researchPreview').isVisible(),true);
   assert.equal(await page.locator('#previewSources a').count(),1);
   assert.equal(await page.locator('#previewPaperTitle').innerText(),'Reviewing a source record <img src=x onerror=alert(1)>');
   assert.equal(await page.locator('#researchPreview button:enabled').count(),2,'Only edit and return buttons active');
   assert.equal(await page.locator('#researchPreview button:disabled').count(),1,'Publish action disabled');
   await page.locator('#editDraft').click();
   await page.locator('#clearDraft').click();
   assert.equal(await page.locator('#researchBody').inputValue(),'','Temporary copy cleared without touching W.NE');
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
   assert(overflow.scroll<=overflow.view+2,'No horizontal overflow at '+width+': '+JSON.stringify(overflow));
   assert.deepEqual(errors,[],'No JS errors at '+width);
   await ctx.close();
  }
  // A real same-origin W.NE File-menu preview flow, with cloud-save stubs only.
  const ctx=await browser.newContext({viewport:{width:393,height:780}});
  await ctx.route('**/*',route=>{
   const u=new URL(route.request().url());return u.origin===base?route.continue():route.abort('blockedbyclient');
  });
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto(base+'/community-research.html',{waitUntil:'domcontentloaded'});
  await page.setContent('<!doctype html><html><body><div id="wne-file-menu"><p>PROTECT YOUR RESEARCH</p></div><button id="save">Save</button></body></html>');
  await page.evaluate(()=>{
   window.__saveChecks=0;
   window.wneSaveBeforeNavigation=async()=>{window.__saveChecks++;return true};
   window.WNECloudIntegration={
    verifiedOwner:async()=> 'owner-test-only',
    readSavedDocument:async()=>({bookTitle:'My private W.NE research',chapters:[
     {id:'s-1',title:'Nimitz methodology',html:'<h2>Research notes</h2><p>'+('This is original private research text, copied as plaintext only. ').repeat(5)+'</p><img src="https://example.com/private.jpg">'}
    ]})
   };
  });
  await page.addScriptTag({url:base+'/assets/community-test-config.js'});
  await page.addScriptTag({url:base+'/research/wne-community-publish.js'});
  assert.equal(await page.locator('#wneCommunityPublishMenu').count(),1,'W.NE File menu action installed on local only');
  await page.locator('#wneCommunityPublishMenu').click();
  assert.equal(await page.locator('#wneCommunityResearchDialog').isVisible(),true);
  assert.equal(await page.locator('#wneCommunitySection option').count(),1);
  await page.locator('#wneCommunityContinue').click();
  await page.waitForURL(base+'/community-research.html#compose',{timeout:20000});
  await page.locator('#researchComposer').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#researchComposer').isVisible(),true);
  assert.match(await page.locator('#researchTitle').inputValue(),/My private W.NE research/);
  assert.match(await page.locator('#researchBody').inputValue(),/original private research text/);
  assert.equal((await page.locator('#researchBody').inputValue()).includes('private.jpg'),false,'Image URLs not copied');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('dd-community-research-preview-copy-v1')),null,'One-use plaintext handoff cleared');
  assert.match(await page.locator('#composeStatus').innerText(),/unsent, plain-text copy/i);
  assert.equal(await page.locator('#researchOriginal').isChecked(),false,'Authorship requires fresh consent');
  assert.deepEqual(errors,[],'W.NE handoff must not throw in isolated Chrome');
  await ctx.close();
  console.log('PASS M01 real Chromium: 320/393/820/1280 layouts, explicit demo, safe paper preview, blocked voting, invalid URL, no XSS, W.NE saved-copy handoff and one-use cleanup.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
