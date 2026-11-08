'use strict';
// Real Chromium mobile interaction test for the STAGED Research editor extensions.
// Local loopback origin only; blocks all nonlocal resources. Never logs into any
// account, touches Supabase, edits live research, or deploys a site.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const fs=require('node:fs');
const BASE='http://127.0.0.1:4173';
const html=fs.readFileSync('research/wne.html','utf8');
const section=/\<style id="dd-research-insert-menu-v1"\>([\s\S]*?)\<\/style\>/.exec(html);
const sized=/\<style id="dd-research-selection-size-v1"\>([\s\S]*?)\<\/style\>/.exec(html);
assert(section&&sized,'Use the real styles from the staged editor, not hand-authored CSS');
const baseCss='.formatbar{display:flex;gap:8px;align-items:center;overflow-x:auto;padding:10px;'+
 'background:#152a3b;color:#e1c38e}.formatbar>*{flex-shrink:0}'+
 '#editor{margin:24px 10px;padding:24px;min-height:210px;border:1px solid #697786;'+
 'color:#212c36;background:white;white-space:pre-wrap}body{margin:0;'+
 'font:14px system-ui;background:#172737}';
const fixture='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>'+baseCss+section[1]+sized[1]+'</style></head><body>'+
 '<div class="formatbar"><label for="size">Document size</label><select id="size"><option selected>12</option><option>16</option></select>'+
 '<button type="button" id="dd-insert-image">▧ Image</button>'+
 '<button type="button" id="dd-insert-comparison">▦ Compare</button></div>'+
 '<div id="editor" contenteditable="true"><p>Alpha bravo charlie</p><p>Delta echo</p></div>'+
 '</body></html>';
const browserOptions={executablePath:'/usr/bin/google-chrome',headless:true,
 args:['--no-sandbox','--disable-dev-shm-usage']};
(async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
  let passes=0;
  async function check(label,fn){await fn();passes++;console.log('PASS CHROMIUM '+label)}
  for(const viewport of [{width:393,height:852},{width:852,height:393}]){
   const context=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'en-GB'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===BASE
    ?route.continue():route.abort('blockedbyclient'));
   const page=await context.newPage();
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded'});
   await page.setContent(fixture,{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>{
    window.fixtureActions={image:0,compare:0,inputs:0};
    document.getElementById('dd-insert-image').addEventListener('click',()=>window.fixtureActions.image++);
    document.getElementById('dd-insert-comparison').addEventListener('click',()=>window.fixtureActions.compare++);
    document.getElementById('editor').addEventListener('input',()=>window.fixtureActions.inputs++);
   });
   await page.addScriptTag({url:BASE+'/research/research-insert-menu.js'});
   await page.addScriptTag({url:BASE+'/research/research-text-size.js'});
   await check(viewport.width+'px real editor controls mounted',async()=>{
    assert.equal(await page.locator('#dd-research-insert-trigger').count(),1);
    assert.equal(await page.locator('#dd-research-selected-size').count(),1);
    assert.equal(await page.locator('#dd-research-insert-menu [role=menuitem]').count(),2);
    assert.equal(await page.locator('#size').inputValue(),'12');
   });
   await page.evaluate(()=>{
    const t=document.querySelector('#editor p').firstChild;
    const r=document.createRange();r.setStart(t,6);r.setEnd(t,11);
    const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);
   });
   await page.locator('#dd-research-selected-size').click();
   await page.locator('#dd-research-selected-size').selectOption('16');
   await check(viewport.width+'px selected inline text persists, untouched neighbours and document font',async()=>{
    assert.equal(await page.locator('#editor p:first-child span[data-wne-font-size="16"]').textContent(),'bravo');
    assert.equal(await page.locator('#editor p:first-child').innerText(),'Alpha bravo charlie');
    assert.equal(await page.locator('#editor p:nth-child(2)').innerText(),'Delta echo');
    assert.equal(await page.locator('#size').inputValue(),'12');
    assert.equal(await page.evaluate(()=>window.fixtureActions.inputs),1);
    assert.equal(await page.locator('#editor span[data-wne-font-size="16"]').evaluate(el=>getComputedStyle(el).fontSize),'16px');
   });
   await page.locator('#dd-research-insert-trigger').click();
   await check(viewport.width+'px Insert menu opens above overflow',async()=>{
    assert.equal(await page.locator('#dd-research-insert-trigger').getAttribute('aria-expanded'),'true');
    const b=await page.locator('#dd-research-insert-menu').boundingBox();
    assert(b&&b.x>=0&&b.x+b.width<=viewport.width+1,'Menu off horizontal viewport');
    assert(b.y>=0&&b.y+b.height<=viewport.height+1,'Menu off vertical viewport');
   });
   await page.locator('#dd-insert-image').click();
   await check(viewport.width+'px Image original handler preserved',async()=>{
    assert.equal(await page.evaluate(()=>window.fixtureActions.image),1);
    assert.equal(await page.locator('#dd-research-insert-menu').isHidden(),true);
   });
   await page.locator('#dd-research-insert-trigger').click();
   await page.locator('#dd-insert-comparison').click();
   await check(viewport.width+'px Compare original handler preserved',async()=>{
    assert.equal(await page.evaluate(()=>window.fixtureActions.compare),1);
   });
   await page.locator('#dd-research-insert-trigger').click();
   await page.keyboard.press('Escape');
   await check(viewport.width+'px keyboard menu dismissal',async()=>{
    assert.equal(await page.locator('#dd-research-insert-menu').isHidden(),true);
    assert.deepEqual(pageErrors,[]);
   });
   await context.close();
  }
  console.log('PASS CHROMIUM TOTAL '+passes+' offline real browser assertions. Not physical Samsung/iPhone acceptance.');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL CHROMIUM:',e.stack||e);process.exitCode=1});
