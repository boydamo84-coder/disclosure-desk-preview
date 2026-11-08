'use strict';
// Genuine Chromium layout/interaction for Research writing review, disposable text only.
// Browser cannot access the live site, real user accounts or the writing relay.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const source=fs.readFileSync('research/wne.html','utf8');
const match=/<style id="dd-research-review-navigation-v1">([\s\S]*?)<\/style>/.exec(source);
assert(match,'Use editor-owned review CSS, never duplicate styling in QA');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{font:14px system-ui;margin:0;background:#142737;color:#eee3d2}.wne-spell-wrap{padding:4px}'+
 '#wne-language-bar{display:none}.wne-spell-wrap.expanded #wne-language-bar{display:block}'+
 '#editor{color:#191d20;background:white;padding:26px;min-height:230px}'+
 '#wne-spell-panel{position:fixed;bottom:12px;left:12px;right:12px;z-index:40;'+
 'max-height:58dvh;overflow:auto;padding:15px;background:#253c4e;color:white;'+
 'border:1px solid #c5a779;border-radius:12px}#wne-spell-panel[hidden]{display:none}'+
 '</style><style>'+match[1]+'</style></head><body>'+
 '<section class="wne-spell-wrap" id="wne-spell-wrap"><button id="wne-spell-toggle" type="button">Writing checks</button>'+
 '<div id="wne-language-bar"><select id="wne-language"><option value="en-GB" selected>English UK</option>'+
 '<option value="en-US">English US</option></select><label><input id="wne-spellcheck" type="checkbox" checked>Spelling</label></div></section>'+
 '<div id="editor" contenteditable="true"><p>Ths is a sentnce.</p><p>More reporting text.</p></div>'+
 '<section id="wne-spell-panel" role="dialog" aria-label="Writing suggestions" hidden>'+
 '<h3 id="wne-spell-word">Writing suggestion</h3><p>Nothing changes without approval.</p>'+
 '<div id="wne-spell-choices"></div><button id="wne-spell-add" type="button">Add to dictionary</button>'+
 '<button id="wne-spell-dismiss" type="button">Close</button></section></body></html>';
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let passes=0;
  async function pass(label,fn){await fn();passes++;console.log('PASS REVIEW CHROME '+label)}
  for(const viewport of [{width:393,height:852},{width:852,height:393}]){
   const context=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'en-GB'});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/writer/live-spelling',async route=>{
    const req=route.request().postDataJSON();
    const found=[
     {word:'Ths',category:'Spelling',suggestions:['This'],message:'Possible typo'},
     {word:'sentnce',category:'Grammar',suggestions:['sentence'],message:'Review this grammar'},
    ].map(x=>({...x,start:req.text.indexOf(x.word),end:req.text.indexOf(x.word)+x.word.length}))
     .filter(x=>x.start>=0);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,matches:found})});
   });
   await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.setContent(html,{waitUntil:'domcontentloaded'});
   await page.addScriptTag({url:BASE+'/research/wne-research-live-spelling.js'});
   await page.waitForFunction(()=>!document.getElementById('wne-spell-review-next')?.disabled,{timeout:10000});
   await pass(viewport.width+'px review visible outside folded language options',async()=>{
    assert.equal(await page.locator('#wne-language-bar').isHidden(),true);
    assert.equal(await page.locator('#wne-spell-review').isVisible(),true);
    assert.equal(await page.locator('#wne-spell-review-next').isEnabled(),true);
    const rect=await page.locator('#wne-spell-review').boundingBox();
    assert(rect&&rect.x>=0&&rect.x+rect.width<=viewport.width+1,
      'Review strip must not overflow phone viewport');
    assert.match(await page.locator('#wne-spell-review-position').textContent(),/2 findings/);
   });
   const before=await page.locator('#editor').innerText();
   await page.locator('#wne-spell-review-next').click();
   await pass(viewport.width+'px first spelling finding, no keyboard or manuscript changes',async()=>{
    assert.match(await page.locator('#wne-spell-word').textContent(),/Spelling · Ths/);
    assert.match(await page.locator('#wne-spell-review-position').textContent(),/1 of 2/);
    assert.equal(await page.locator('#editor').innerText(),before);
    assert.notEqual(await page.evaluate(()=>document.activeElement?.id),'editor');
    assert.equal(await page.locator('#wne-spell-panel').isVisible(),true);
   });
   await page.locator('#wne-spell-review-next').click();
   await pass(viewport.width+'px next grammar finding and previous navigation',async()=>{
    assert.match(await page.locator('#wne-spell-word').textContent(),/Grammar · sentnce/);
    assert.match(await page.locator('#wne-spell-review-position').textContent(),/2 of 2/);
    await page.locator('#wne-spell-review-prev').click();
    assert.match(await page.locator('#wne-spell-word').textContent(),/Spelling · Ths/);
   });
   await page.locator('#wne-spell-dismiss').click();
   await pass(viewport.width+'px closing suggestion does not change user text',async()=>{
    assert.equal(await page.locator('#wne-spell-panel').isHidden(),true);
    assert.equal(await page.locator('#editor').innerText(),before);
    assert.match(await page.locator('#wne-spell-review-position').textContent(),/2 findings/);
    assert.deepEqual(errors,[]);
   });
   await page.locator('#wne-spell-review-next').click();
   await page.locator('#wne-spell-choices button').first().click();
   await pass(viewport.width+'px user-approved correction only',async()=>{
    assert.match(await page.locator('#editor p:first-child').innerText(),/^This is a sentnce\./);
    assert.equal(await page.locator('#editor p:nth-child(2)').innerText(),'More reporting text.');
   });
   await context.close();
  }
  console.log('PASS REVIEW CHROME TOTAL '+passes+' offline Chromium assertions, no live account requests.');
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL REVIEW CHROME:',error.stack||error);process.exitCode=1});
