'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const {publicationDraft}=require('../docs/community-research/publication-draft.js');
const {publicTextPayload}=require('../research/community-publication-preview.js');
const core={title:'Example',abstract:'Summary',category:'Case analysis',sections:[{title:'Public section',text:'Public content',privateNote:'DO NOT EXPORT'}],citations:[{title:'Source',url:'https://example.org/record'}],privateBoard:'DO NOT EXPORT'};
assert.ok(!JSON.stringify(publicationDraft(core)).includes('DO NOT EXPORT'));
assert.throws(()=>publicationDraft({...core,sections:[]}),/sections/);
assert.throws(()=>publicationDraft({...core,citations:[{title:'Bad',url:'javascript:alert(1)'}]}),/HTTPS/);
assert.throws(()=>publicationDraft({...core,citations:[{title:'Bad',url:'https://127.0.0.1/private'}]}),/HTTPS/);
assert.deepEqual(publicationDraft({...core,citations:[...core.citations,...core.citations]}).citations,core.citations);
assert.ok(fs.readFileSync('assets/community-test-config.js','utf8').includes('researchPublishing:false'));
const payload=publicTextPayload(core,true);
assert.deepEqual(Object.keys(payload),['title','abstract','category','body_text','references_text','consent']);
assert.equal(payload.body_text,'Public section\nPublic content');
assert.equal(payload.references_text,'Source | https://example.org/record');
assert.ok(!JSON.stringify(payload).includes('DO NOT EXPORT'));
assert.throws(()=>publicTextPayload(core,false),/consent/);
assert.throws(()=>publicTextPayload({...core,sections:Array.from({length:3},()=>({title:'Long',text:'x'.repeat(45000)}))},true),/size limit/);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,1280]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const external=[];await page.route(/^https?:\/\//,r=>{external.push(r.request().url());return r.abort()});
   await page.goto(pathToFileURL(path.resolve('docs/community-research/library-preview.html')).href);
   assert.equal(await page.locator('#library article').count(),2);
   await page.locator('#search').fill('chronology');assert.equal(await page.locator('#library article').count(),1);
   await page.getByRole('button',{name:'Like · 0',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Like · 1',exact:true}).getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Dislike · 0',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Like · 0',exact:true}).getAttribute('aria-pressed'),'false');
   await page.getByRole('button',{name:'Save to sample Board'}).click();
   assert.ok(await page.getByRole('button',{name:'Remove from sample Board'}).isVisible());
   await page.locator('#library summary').click();
   await page.getByRole('textbox',{name:'Sample comment'}).fill('Test local comment');
   await page.getByRole('button',{name:'Add local comment'}).click();
   assert.match(await page.locator('#library summary').innerText(),/1/);
   await page.locator('#wne').click();
   await page.locator('#title').fill('Test report');await page.locator('#abstract').fill('Test abstract');
   await page.locator('#preview').click();assert.match(await page.locator('#status').innerText(),/permission/);
   await page.locator('#consent').check();await page.locator('#preview').click();
   assert.match(await page.locator('#status').innerText(),/disabled/);
   await page.locator('#close').click();
   await page.locator('#search').fill('chronology');
   for(let i=1;i<=5;i++){
    await page.locator('#flagMember').selectOption(String(i));
    await page.getByRole('button',{name:'Flag sample'}).click();
    if(i===1){await page.getByRole('button',{name:'Flag sample'}).click();assert.match(await page.locator('#flagStatus').innerText(),/Already flagged/);}
    assert.equal(await page.locator('#library article').count(),i===5?0:1);
   }
   await page.locator('#moderation > summary').click();
   await page.getByRole('button',{name:'Restore sample'}).click();
   assert.match(await page.locator('#moderationQueue [role="status"]').innerText(),/reason/);
   await page.getByRole('textbox',{name:'Moderation reason'}).fill('Checked sample evidence');
   await page.getByRole('button',{name:'Restore sample'}).click();
   assert.equal(await page.locator('#library article').count(),1);
   for(let i=1;i<=5;i++){await page.locator('#flagMember').selectOption(String(i));await page.getByRole('button',{name:'Flag sample'}).click();}
   await page.getByRole('textbox',{name:'Moderation reason'}).fill('Sample removal');
   await page.getByRole('button',{name:'Remove sample'}).click();
   assert.equal(await page.locator('#library article').count(),0);
   assert.match(await page.locator('#moderationAudit').innerText(),/reject/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(external,[]);
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:393,height:900}});
  await page.route('**/*',r=>r.request().url()==='http://127.0.0.1:8765/'?r.fulfill({contentType:'text/html',body:'<div id="wne-file-menu"></div>'}):r.abort());
  await page.goto('http://127.0.0.1:8765/');
  const installFixture=async(target,account='sample-a')=>{
   await target.evaluate(account=>{window.DDCommunityReceiptFixture=true;window.DDCommunityReceiptFixtureAccount=account;window.wneCaptureDocument=()=>({bookTitle:'Test book',chapters:[{title:'Public section',html:'<p>Public text</p><p hidden>PRIVATE SECRET</p>'},{title:'Private chapter',html:'DO NOT EXPORT'}]})},account);
   await target.addScriptTag({path:path.resolve('research/community-publication-preview.js')});
  };
  const reopen=async(account='sample-a')=>{
   await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.evaluate(account=>{window.DDCommunityReceiptFixtureAccount=account;document.getElementById('wne-file-menu').hidden=false},account);
   await page.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
  };
  const storageKey='dd.community.receipt.fixture.pending.v1';
  const pending=target=>target.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);
  await installFixture(page);
  await page.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
  await page.getByLabel('Abstract / summary').fill('Public abstract');
  await page.getByLabel('Public section',{exact:true}).check();
  await page.getByRole('button',{name:'Generate public preview'}).click();
  const confirm=page.getByRole('button',{name:'Confirm reviewed public copy'});
  assert.equal(await confirm.isEnabled(),false);
  await page.getByText('I have permission to publish',{exact:false}).click();
  await confirm.click();
  await page.getByText('Public copy confirmed locally.',{exact:false}).waitFor();
  assert.equal(await page.getByText('PRIVATE SECRET',{exact:true}).count(),0);
  assert.equal(await page.getByText('DO NOT EXPORT',{exact:true}).count(),0);
  const send=page.getByRole('button',{name:'Simulate one submission'});
  const reconcile=page.getByRole('button',{name:'Check simulated receipt'});
  assert.equal(await send.isVisible(),true);
  await page.getByLabel('Sample result').selectOption('unknown');
  await send.click();
  await page.getByText('Sample 1: outcome unknown.',{exact:false}).waitFor();
  assert.equal(await send.isEnabled(),false);
  assert.equal(await confirm.isEnabled(),false);
  assert.equal(await page.getByLabel('Abstract / summary').isEnabled(),false);
  const initialPending=await pending(page);
  assert.deepEqual(Object.keys(initialPending).sort(),['account','id','number','state','version']);
  assert.equal(initialPending.account,'sample-a');
  assert.equal(initialPending.state,'unknown');
  assert.ok(!JSON.stringify(initialPending).includes('Public text'));
  assert.ok(!JSON.stringify(initialPending).includes('Public abstract'));
  await reconcile.click();
  await page.getByText('Sample 1: outcome unknown.',{exact:false}).waitFor();
  assert.deepEqual(await pending(page),initialPending);
  await reopen('sample-b');
  await page.getByText('A different sample account has an unresolved attempt.',{exact:false}).waitFor();
  assert.equal(await send.isEnabled(),false);
  assert.equal(await reconcile.isVisible(),false);
  assert.equal(await page.getByText('Sample 1: outcome unknown.',{exact:false}).count(),0);
  assert.deepEqual(await pending(page),initialPending);
  await reopen('sample-a');
  await page.getByText('Sample 1: outcome unknown.',{exact:false}).waitFor();
  await page.reload();
  await installFixture(page);
  await page.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
  await page.getByText('Sample 1: outcome unknown.',{exact:false}).waitFor();
  assert.equal(await send.isEnabled(),false);
  assert.equal(await page.getByLabel('Abstract / summary').isEnabled(),false);
  assert.deepEqual(await pending(page),initialPending);
  // Recreate a browser context from its persisted origin state (not an Android device test).
  const restarted=await browser.newContext({viewport:{width:393,height:900},storageState:await page.context().storageState()});
  try{
   const restoredPage=await restarted.newPage();
   await restoredPage.route('**/*',r=>r.request().url()==='http://127.0.0.1:8765/'?r.fulfill({contentType:'text/html',body:'<div id="wne-file-menu"></div>'}):r.abort());
   await restoredPage.goto('http://127.0.0.1:8765/');
   await installFixture(restoredPage);
   await restoredPage.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
   await restoredPage.getByText('Sample 1: outcome unknown.',{exact:false}).waitFor();
   assert.deepEqual(await pending(restoredPage),initialPending);
   assert.equal(await restoredPage.getByRole('button',{name:'Simulate one submission'}).isEnabled(),false);
  }finally{await restarted.close()}
  await page.getByLabel('Sample result').selectOption('received');
  await reconcile.click();
  await page.getByText('Sample 1: simulated receipt received.',{exact:false}).waitFor();
  assert.equal(await send.isEnabled(),false);
  assert.equal(await reconcile.isVisible(),false);
  assert.equal(await pending(page),null);
  await page.getByLabel('Abstract / summary').fill('Updated abstract');
  // Reload deliberately loses the old selected text and consent; fresh review is required.
  await page.getByLabel('Public section',{exact:true}).check();
  assert.equal(await confirm.isVisible(),false);
  assert.equal(await send.isVisible(),false);
  await page.getByRole('button',{name:'Generate public preview'}).click();
  await page.getByText('I have permission to publish',{exact:false}).click();
  await confirm.click();
  await page.getByLabel('Sample result').selectOption('rejected');
  await send.click();
  await page.getByText('Sample 2: simulated rejection.',{exact:false}).waitFor();
  assert.equal(await send.isEnabled(),false);
  assert.equal(await pending(page),null);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(key=>{localStorage.setItem(key,'bad fixture state');document.getElementById('wne-file-menu').hidden=false},storageKey);
  await page.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
  await page.getByText('Sample receipt storage is unavailable or inconsistent.',{exact:false}).waitFor();
  assert.equal(await send.isEnabled(),false);
  assert.equal(await page.getByLabel('Abstract / summary').isEnabled(),false);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(()=>{delete window.DDCommunityReceiptFixture;document.getElementById('wne-file-menu').hidden=false});
  // The ordinary preview must neither read nor clear the fixture's storage marker.
  await page.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
  await page.getByLabel('Abstract / summary').fill('Normal local preview');
  await page.getByLabel('Public section',{exact:true}).check();
  await page.getByRole('button',{name:'Generate public preview'}).click();
  await page.getByText('I have permission to publish',{exact:false}).click();
  await confirm.click();
  assert.equal(await send.count(),0);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),storageKey),'bad fixture state');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(key=>{
   localStorage.removeItem(key);
   window.DDCommunityReceiptFixture=true;
   document.getElementById('wne-file-menu').hidden=false;
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k===key)throw Error('Sample storage unavailable');return original.call(this,k,v)};
  },storageKey);
  await page.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
  await page.getByLabel('Abstract / summary').fill('Storage failure test');
  await page.getByLabel('Public section',{exact:true}).check();
  await page.getByRole('button',{name:'Generate public preview'}).click();
  await page.getByText('I have permission to publish',{exact:false}).click();
  await confirm.click();
  await send.click();
  await page.getByText('Sample receipt storage is unavailable or inconsistent.',{exact:false}).waitFor();
  assert.equal(await send.isEnabled(),false);
  assert.equal(await pending(page),null);
  assert.equal(await page.getByText('simulated receipt received.',{exact:false}).count(),0);
  await page.close();
  // Same storage origin, same browser context; both tabs review before either acts.
  const tabContext=await browser.newContext({viewport:{width:393,height:900}});
  try{
   const tabA=await tabContext.newPage(),tabB=await tabContext.newPage();
   const fixtureRoute=async target=>target.route('**/*',r=>r.request().url()==='http://127.0.0.1:8765/'?r.fulfill({contentType:'text/html',body:'<div id="wne-file-menu"></div>'}):r.abort());
   for(const tab of [tabA,tabB]){
    await fixtureRoute(tab);await tab.goto('http://127.0.0.1:8765/');await installFixture(tab);
   }
   const prepare=async tab=>{
    await tab.getByRole('menuitem',{name:/Preview Community Research publication/}).click();
    await tab.getByLabel('Abstract / summary').fill('Shared sample');
    await tab.getByLabel('Public section',{exact:true}).check();
    await tab.getByRole('button',{name:'Generate public preview'}).click();
    await tab.getByText('I have permission to publish',{exact:false}).click();
    await tab.getByRole('button',{name:'Confirm reviewed public copy'}).click();
   };
   const sampleSend=tab=>tab.getByRole('button',{name:'Simulate one submission'});
   const sampleCheck=tab=>tab.getByRole('button',{name:'Check simulated receipt'});
   const choose=(tab,value)=>tab.getByLabel('Sample result').selectOption(value);
   for(const tab of [tabA,tabB]){await prepare(tab);await choose(tab,'unknown')}
   await Promise.all([sampleSend(tabA).click(),sampleSend(tabB).click()]);
   for(const tab of [tabA,tabB]){
    await tab.getByText('Sample 1: outcome unknown.',{exact:false}).waitFor();
    assert.equal(await sampleSend(tab).isEnabled(),false);
   }
   const shared=await pending(tabA);
   assert.deepEqual(await pending(tabB),shared);
   assert.equal(await tabA.evaluate(()=>localStorage.getItem('dd.community.receipt.fixture.generation.v1')),shared.id);
   // Both tabs reconcile the same pending sample; only one may clear it.
   for(const tab of [tabA,tabB])await choose(tab,'received');
   await Promise.all([sampleCheck(tabA).click(),sampleCheck(tabB).click()]);
   const terminal=tab=>tab.locator('fieldset p[role="status"]').filter({hasText:/simulated receipt received|storage is unavailable or inconsistent/});
   await Promise.all([terminal(tabA).waitFor(),terminal(tabB).waitFor()]);
   const results=await Promise.all([terminal(tabA).innerText(),terminal(tabB).innerText()]);
   assert.equal(results.filter(x=>x.includes('simulated receipt received')).length,1);
   assert.equal(await pending(tabA),null);
   // Reopen both and prove an already-resolved immediate outcome invalidates a
   // stale review in the other tab, even though the pending marker is gone.
   for(const tab of [tabA,tabB]){
    await tab.getByRole('button',{name:'Close',exact:true}).click();
    await tab.evaluate(()=>{document.getElementById('wne-file-menu').hidden=false});
    await prepare(tab);await choose(tab,'received');
   }
   await sampleSend(tabA).click();
   await tabA.getByText('simulated receipt received.',{exact:false}).waitFor();
   assert.equal(await pending(tabA),null);
   const after=await tabA.evaluate(()=>localStorage.getItem('dd.community.receipt.fixture.generation.v1'));
   await sampleSend(tabB).click();
   await tabB.getByText('A different sample attempt changed since review.',{exact:false}).waitFor();
   assert.equal(await sampleSend(tabB).isVisible(),false);
   assert.equal(await tabB.getByRole('button',{name:'Confirm reviewed public copy'}).isVisible(),false);
   assert.equal(await tabB.evaluate(()=>localStorage.getItem('dd.community.receipt.fixture.generation.v1')),after);
   assert.equal(await pending(tabB),null);
  }finally{await tabContext.close()}
  console.log('PASS W.NE local confirmation, private text exclusion, stale-preview invalidation, restart/account isolation and same-origin concurrent fixture protection');
  console.log('PASS local library interactions, consent preview, narrow layout and no network; public flag remains off');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
