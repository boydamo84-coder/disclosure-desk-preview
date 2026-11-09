'use strict';
// The FIRST actual full Writer HTML browser test.
// Real Chromium parses original research/wne.html, not an extracted CSS fixture.
// Reproduces Samsung v0.1 symptom: literal ribbon JS printed below document,
// dead File/Insert/Review/View buttons, and save safety mistakenly treated as success.
// No live account, cloud write or network access outside loopback.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const HTML=fs.readFileSync('research/wne.html','utf8');
const BASE='http://127.0.0.1:4173';
const DOC='11111111-1111-4111-8111-111111111111';
const count=re=>(HTML.match(re)||[]).length;
assert.equal(count(/<style\b/gi),count(/<\/style>/gi),'All stylesheet tags must be closed');
assert.equal(count(/<script\b/gi),count(/<\/script>/gi),'All script tags must be closed');
assert.equal(count(/<\/body>/gi),1,'Writer must close its body exactly once');
assert.equal(count(/<\/html>/gi),1,'Writer must close its HTML exactly once');
const ribbonAt=HTML.indexOf('<script id="dd-word-ribbon-bootstrap-v1">');
const endBodyAt=HTML.indexOf('</body>');
assert(ribbonAt>0&&endBodyAt>ribbonAt,'The editor must NOT close before installing the Word ribbon');
assert(HTML.lastIndexOf('<script',endBodyAt)>ribbonAt,'All late Research scripts must remain inside HTML body');
assert.doesNotMatch(HTML.slice(endBodyAt),/<style\b|<script\b/i,'No style/script belongs after closing HTML');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let passed=0;const pass=(name)=>{passed++;console.log('PASS SAMSUNG WRITER FIX '+name)};
 try {
  for(const viewport of [{width:393,height:852},{width:1280,height:800}]){
   const context=await browser.newContext({viewport,hasTouch:viewport.width===393,
    isMobile:viewport.width===393,serviceWorkers:'block'});
   // The actual hosted cloud bridge and Auth guard execute. Only their
   // Supabase client is replaced by a fictional isolated fixture: NO network
   // to production accounts, no credentials and no real cloud writes.
   const fakeSupabase = '(()=>{'+
    'const doc='+JSON.stringify({version:2,bookTitle:'Synthetic W.NE QA',active:'qa-1',
       chapters:[{id:'qa-1',title:'Test section',html:'<p>Safe test text</p>'}],
       font:'Georgia',size:12})+';'+
    'const state={rev:1,saves:0};window.__m32Cloud=state;'+
    'window.supabase={createClient:()=>({'+
    'auth:{getUser:async()=>({data:{user:{id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}},error:null}),'+
    'getSession:async()=>({data:{session:null},error:null}),'+
    'onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},'+
    'from:(name)=>({select(){return this},eq(){return this},'+
    'single:async()=>({data:{id:"'+DOC+'",title:"Synthetic W.NE QA",'+
    'content:doc,revision:state.rev,updated_at:"2026-11-09T01:00:00Z"},error:null})}),'+
    'rpc:async(name,args)=>{if(name!=="research_save_document")throw Error("Wrong RPC");'+
    'if(args.p_expected_revision!==state.rev)throw Error("Revision mismatch");'+
    'state.rev++;state.saves++;return {data:[{saved_revision:state.rev}],error:null};}'+
    '})};})();';
   await context.route('**/*',r=>{
    const u=new URL(r.request().url());
    if(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('/@supabase/'))
      return r.fulfill({status:200,contentType:'application/javascript',body:fakeSupabase});
    if(u.origin!==BASE)return r.abort('blockedbyclient');
    return r.continue();
   });
   const page=await context.newPage();
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message||e).slice(0,300)));
   const alerts=[];
   page.on('dialog',d=>{alerts.push(d.message());return d.dismiss()});
   await page.goto(BASE+'/research/wne.html?id='+DOC,{waitUntil:'domcontentloaded',timeout:40000});
   try {await page.locator('#dd-word-ribbon-v1[role="tablist"]').waitFor({timeout:5500})}
   catch(error){
     const debug=await page.evaluate(()=>({
       title:document.title,ready:document.readyState,
       status:document.querySelector('#status')?.textContent,
       isEditorPresent:!!document.querySelector('#editor'),
       hasFormatBar:!!document.querySelector('.formatbar'),
       hasTablist:!!document.querySelector('#dd-word-ribbon-v1'),
       ribbonScript:!!document.querySelector('script#dd-word-ribbon-bootstrap-v1'),
       ribbonScriptInDom:document.querySelector('script#dd-word-ribbon-bootstrap-v1')?.textContent.length,
       writerTail:document.body?.innerText.slice(-350),
       headCount:document.head?.children.length,
       scriptCount:document.scripts.length,
       bodyMarkupEnds:document.body?.outerHTML.slice(-350)
     }));
     console.log('M32 FULL PAGE BROWSER DEBUG',JSON.stringify(debug));
     console.log('M32 BROWSER ERRORS',JSON.stringify(pageErrors));
     throw error;
   }
   const dom=await page.evaluate(()=>({
    htmlEnds:document.documentElement.outerHTML.slice(-230),
    bodyText:document.body.innerText,
    ribbonButtons:[...document.querySelectorAll('#dd-word-ribbon-v1 [role=tab]')].map(x=>x.textContent.trim()),
    status:document.querySelector('#status')?.textContent,
    codeLeaks:[...document.body.querySelectorAll('*')].filter(x=>x.children.length===0&&
      (x.textContent||'').includes("const toolbar=document.querySelector('.formatbar')"))
      .filter(x=>{const st=getComputedStyle(x),r=x.getBoundingClientRect();
        return st.display!=='none'&&st.visibility!=='hidden'&&r.width>0&&r.height>0})
      .map(x=>x.tagName).slice(0,8)
   }));
   assert.deepEqual(dom.ribbonButtons,['File','Home','Insert','Review','View']);
   assert.deepEqual(dom.codeLeaks,[],'Raw JavaScript was rendered below document!');
   assert(!dom.bodyText.includes("const toolbar=document.querySelector('.formatbar')"),
    'The source code must never appear as visible document text');
   pass(viewport.width+'px: real Writer page parses; no raw source text below document');

   // A correctly parsed ribbon is not enough. The actual full Writer must
   // finish its cloud-document boot and expose the guarded save function.
   try{
     await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Saved to cloud')
       &&document.getElementById('editor')?.getAttribute('contenteditable')==='true'
       &&typeof window.wneSaveBeforeNavigation==='function',null,{timeout:7000});
   }catch(error){
     const state=await page.evaluate(()=>({
       status:document.querySelector('#status')?.textContent,
       editability:document.querySelector('#editor')?.getAttribute('contenteditable'),
       bridge:document.documentElement.dataset.wneBridge,
       saveHook:typeof window.wneSaveBeforeNavigation
     }));
     throw Error('Writer did not initialise cloud save: '+JSON.stringify(state)+
       ' Dialogs: '+JSON.stringify(alerts.slice(0,5))+' JS errors: '+JSON.stringify(pageErrors.slice(0,7))+' / '+error.message);
   }
   pass(viewport.width+'px: real Writer initialises document and save guard');

   await page.locator('#dd-word-ribbon-v1 [data-ribbon="insert"]').click();
   assert.equal(await page.locator('#dd-word-ribbon-v1 [data-ribbon="insert"]').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#dd-word-context-v1 [data-action="image"]').isVisible(),true);
   assert.equal(await page.locator('#dd-word-context-v1 [data-action="compare"]').isVisible(),true);
   pass(viewport.width+'px: Insert opens actionable tools');

   await page.locator('#dd-word-ribbon-v1 [data-ribbon="review"]').click();
   assert.equal(await page.locator('#dd-word-context-v1 [data-action="writing"]').isVisible(),true);
   pass(viewport.width+'px: Review opens writing checks');

   await page.locator('#dd-word-ribbon-v1 [data-ribbon="view"]').click();
   assert.equal(await page.locator('#dd-word-context-v1 [data-action="sections"]').isVisible(),true);
   pass(viewport.width+'px: View opens section tools');

   await page.locator('#dd-word-ribbon-v1 [data-ribbon="home"]').click();
   assert.equal(await page.locator('#dd-word-context-v1').isHidden(),true);
   pass(viewport.width+'px: Home restores uncluttered editor toolbar');

   await page.locator('#dd-word-ribbon-v1 [data-ribbon="file"]').click();
   assert.equal(await page.locator('#wne-file-menu').isVisible(),true);
   assert.equal(await page.locator('#dd-word-file-advanced').count(),1);
   pass(viewport.width+'px: File opens menu with advanced recovery collapsed');

   // Write only fictional test text to the in-browser synthetic Supabase
   // account. Require a confirmed revision through the real W.NE bridge.
   await page.locator('#dd-word-ribbon-v1 [data-ribbon="home"]').click();
   await page.locator('#editor').fill('WNE M32 synthetic save confirmation');
   assert.equal(await page.evaluate(()=>window.wneSaveBeforeNavigation('M32 fake account save')),true);
   const saved=await page.evaluate(()=>({writes:window.__m32Cloud?.saves,
     status:document.querySelector('#status')?.textContent}));
   assert(saved.writes>=1,'No synthetic cloud revision was acknowledged');
   assert.match(saved.status,/Saved to cloud/);
   pass(viewport.width+'px: typed synthetic text saves with confirmed revision');
   assert(!alerts.some(a=>/Save successful|successfully saved/i.test(a)));
   await context.close();
  }
  console.log('PASS SAMSUNG WRITER FIX TOTAL '+passed+
   ' full-source mobile and desktop real-Chromium checks (cloud intentionally offline)');
 }finally {await browser.close()}
})().catch(e=>{console.error('FAIL SAMSUNG WRITER FIX',e.stack||e);process.exitCode=1});
