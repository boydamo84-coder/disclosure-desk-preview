'use strict';
// M18: actual Chromium QA for the compact writing suggestion popup (no external calls).
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const source=fs.readFileSync('research/wne.html','utf8');
const found=/<style id="dd-research-review-navigation-v1">([\s\S]*?)<\/style>/.exec(source);
assert(found,'Load the exact staged Research Studio review CSS');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>body{font:14px system-ui;margin:0;background:#142737;color:#eee3d2}.wne-spell-wrap{padding:4px}'+
 '#wne-language-bar{display:none}.wne-spell-wrap.expanded #wne-language-bar{display:block}'+
 '#editor{color:#191d20;background:white;padding:26px;min-height:230px}'+
 '#wne-spell-panel{position:fixed;bottom:12px;left:12px;right:12px;z-index:40;'+
 'max-height:58dvh;overflow:auto;padding:15px;background:#253c4e;color:white;'+
 'border:1px solid #c5a779;border-radius:12px}#wne-spell-panel[hidden]{display:none}'+
 '</style><style>'+found[1]+'</style></head><body>'+
 '<section class="wne-spell-wrap" id="wne-spell-wrap"><button id="wne-spell-toggle" type="button">Writing checks <span>⌄</span></button>'+
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
  const check=async(label,fn)=>{await fn();passes++;console.log('PASS COMPACT REVIEW CHROME '+label)};
  for(const viewport of [{width:393,height:852},{width:852,height:393},{width:1280,height:800}]){
   const isMobile=viewport.width<1000;
   const context=await browser.newContext({viewport,deviceScaleFactor:isMobile?2:1,isMobile,hasTouch:isMobile,locale:'en-GB'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===BASE?
    route.continue():route.abort('blockedbyclient'));
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/writer/live-spelling',async route=>{
    const req=route.request().postDataJSON();
    const words=[{word:'Ths',category:'Spelling',suggestions:['This'],message:'Possible typo'},
     {word:'sentnce',category:'Grammar',suggestions:['sentence'],message:'Grammar review'}];
    const matches=words.map(item=>({...item,start:req.text.indexOf(item.word),
     end:req.text.indexOf(item.word)+item.word.length})).filter(item=>item.start>=0);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,matches})});
   });
   await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded'});
   await page.setContent(html,{waitUntil:'domcontentloaded'});
   await page.addScriptTag({url:BASE+'/research/wne-research-live-spelling.js'});
   await page.waitForFunction(()=>document.querySelector('#wne-spell-count')?.textContent.includes('2 findings'),
    null,{timeout:10000});
   const before=await page.locator('#editor').innerText();
   await check(viewport.width+'px no permanently visible review strip',async()=>{
    assert.equal(await page.locator('#wne-language-bar').isHidden(),true);
    assert.equal(await page.locator('#wne-spell-review').isHidden(),true);
    assert.equal(await page.locator('#wne-spell-panel').isHidden(),true);
    assert.match(await page.locator('#wne-spell-toggle').innerText(),/2 findings/);
    assert.equal(await page.locator('#wne-spell-review-prev').textContent(),'‹');
    assert.equal(await page.locator('#wne-spell-review-next').textContent(),'›');
   });
   // Click real word coordinates, as an actual touch pointer would.
   await page.evaluate(()=>{
    const editor=document.getElementById('editor'),t=editor.querySelector('p').firstChild;
    const r=document.createRange();r.setStart(t,1);r.setEnd(t,2);
    const box=r.getBoundingClientRect();
    editor.dispatchEvent(new MouseEvent('click',{bubbles:true,
     clientX:box.left+box.width/2,clientY:box.top+box.height/2}));
   });
   await check(viewport.width+'px click underlined word opens suggestion, without edits',async()=>{
    assert.equal(await page.locator('#wne-spell-panel').isVisible(),true);
    assert.match(await page.locator('#wne-spell-word').textContent(),/Spelling · Ths/);
    assert.match(await page.locator('#wne-spell-review-position').textContent(),/1 \/ 2/);
    assert.equal(await page.locator('#editor').innerText(),before);
    const rect=await page.locator('#wne-spell-panel').boundingBox();
    assert(rect&&rect.x>=0&&rect.x+rect.width<=viewport.width+1,'Suggestion popup overflows viewport');
   });
   await page.locator('#wne-spell-review-next').click();
   await check(viewport.width+'px tiny arrow goes to grammar without focusing editor',async()=>{
    assert.match(await page.locator('#wne-spell-word').textContent(),/Grammar · sentnce/);
    assert.match(await page.locator('#wne-spell-review-position').textContent(),/2 \/ 2/);
    assert.notEqual(await page.evaluate(()=>document.activeElement?.id),'editor');
    assert.equal(await page.locator('#editor').innerText(),before);
   });
   await page.locator('#wne-spell-review-prev').click();
   await check(viewport.width+'px previous arrow returns to spelling finding',async()=>{
    assert.match(await page.locator('#wne-spell-word').textContent(),/Spelling · Ths/);
    assert.match(await page.locator('#wne-spell-review-position').textContent(),/1 \/ 2/);
   });
   await page.locator('#wne-spell-dismiss').click();
   await check(viewport.width+'px dismiss hides popup but never changes writing',async()=>{
    assert.equal(await page.locator('#wne-spell-panel').isHidden(),true);
    assert.equal(await page.locator('#editor').innerText(),before);
    assert.deepEqual(errors,[]);
   });
   // Reopen and approve one correction; no background changes allowed.
   await page.evaluate(()=>{
    const editor=document.getElementById('editor'),t=editor.querySelector('p').firstChild;
    const r=document.createRange();r.setStart(t,1);r.setEnd(t,2);const box=r.getBoundingClientRect();
    editor.dispatchEvent(new MouseEvent('click',{bubbles:true,
     clientX:box.left+box.width/2,clientY:box.top+box.height/2}));
   });
   await page.locator('#wne-spell-choices button').first().click();
   await check(viewport.width+'px only approved replacement modifies word',async()=>{
    assert.match(await page.locator('#editor p:first-child').innerText(),/^This is a sentnce\./);
    assert.equal(await page.locator('#editor p:nth-child(2)').innerText(),'More reporting text.');
   });
   await context.close();
  }
  console.log('PASS COMPACT REVIEW TOTAL '+passes+' offline Chromium assertions, NO live sign-in, NO Netlify.');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL COMPACT REVIEW:',e.stack||e);process.exitCode=1});
