'use strict';
// M29 real Chromium on synthetic authenticated-like accounts and docs.
// Both Supabase and external requests are forbidden; no production writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
const writerSource=fs.readFileSync('research/wne.html','utf8');
const workspaceSource=fs.readFileSync('research/research-workspace.html','utf8');
const homeSource=workspaceSource.match(/<script id="dd-documents-home-js">([\s\S]*?)<\/script>/)?.[1];
assert.ok(homeSource,'M29 uses the exact staged Home JS');
assert.equal((writerSource.match(/data-dd-research-home-link/g)||[]).length,3);
assert.doesNotMatch(writerSource,/<a[^>]*href="\/home"/i);
const iframeHtml='<html><body><a id="legacyHome" data-dd-research-home-link href="#research-studio-home">Home</a>'+
 '<div id="editor" contenteditable="true">Unsaved synthetic writing</div><button id="save">Save</button>'+
 '<script>window.wneSaveBeforeNavigation=async function(reason){'+
 'window.parent.__fixture.calls.push({action:"save",reason:reason});'+
 'return window.parent.__fixture.saved;};<\/script>'+
 '<script src="/research/research-site-nav.js" defer><\/script></body></html>';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let count=0;
 function pass(label){count++;console.log('PASS M29 HOME '+label)}
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===393?852:800},
    isMobile:width===393,hasTouch:width===393,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(url.origin!==BASE)return route.abort('blockedbyclient');
     if(url.pathname==='/research/wne.html')return route.fulfill({status:200,contentType:'text/html',body:iframeHtml});
     return route.continue();
   });
   const page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded'});
   const fixture='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+
    '<button id="dd-documents-btn">Research Home</button>'+
    '<dialog id="dd-documents-dialog"><p id="dd-documents-status"></p>'+
    '<div id="dd-documents-list"></div><input id="dd-new-document-name">'+
    '<a id="restoreSingleLink" href="./restore-copy.html">Restore JSON</a>'+ 
    '<a id="restoreZipLink" href="./restore-library.html">Restore ZIP</a>'+ 
    '<button id="dd-create-document">New</button><button id="dd-close-documents">Close</button></dialog>'+
    '<button id="writerBtn">Editor</button><iframe id="writer" src="./wne.html?id='+A+'"></iframe></body></html>';
   await page.setContent(fixture);
   await page.evaluate(ids=>{
     window.__fixture={saved:false,calls:[]};
     window.DD_COMMUNITY_FEATURES={profileAvatars:false,privateChat:true};
     window.fetch=async(url,opts)=>{
       if(url!=='/api/library')throw Error('Unapproved network call: '+url);
       const arg=opts?.body?JSON.parse(opts.body):null;
       if(!arg)return {ok:true,json:async()=>({items:[
         {id:ids[0],title:'Synthetic A',active:true},{id:ids[1],title:'Synthetic B',active:false}
       ]})};
       window.__fixture.calls.push({action:arg.action,id:arg.id,title:arg.title});
       return {ok:true,json:async()=>arg.action==='create'?{id:ids[2]}:{ok:true}};
     };
   },[A,B,C]);
   await page.addScriptTag({content:homeSource});
   await page.addScriptTag({url:BASE+'/research/research-site-nav.js'});
   await page.frameLocator('#writer').locator('#legacyHome').waitFor({timeout:8000});

   await page.locator('#dd-documents-btn').click();
   await page.locator('#dd-documents-list button').nth(1).click();
   await page.waitForFunction(()=>document.querySelector('#dd-documents-status').textContent.includes('not confirmed saved'));
   assert.equal(await page.evaluate(()=>window.__fixture.calls.some(x=>x.action==='open')),false);
   assert.match(await page.locator('#writer').getAttribute('src'),new RegExp(A));
   assert.equal(await page.locator('#dd-documents-dialog').evaluate(el=>el.open),true);
   pass(width+'px denied save prevents switch; original report still open');

   await page.evaluate(()=>{window.__fixture.saved=true});
   await page.locator('#dd-documents-list button').nth(1).click();
   await page.waitForFunction(id=>document.querySelector('#writer').getAttribute('src').includes(id),B);
   assert.equal(await page.evaluate(id=>window.__fixture.calls.some(x=>x.action==='open'&&x.id===id),B),true);
   assert.equal(await page.locator('#dd-documents-dialog').evaluate(el=>el.open),false);
   pass(width+'px saved A before opening B');

   await page.locator('#dd-documents-btn').click();
   await page.locator('#dd-new-document-name').fill('Test research C');
   await page.evaluate(()=>{window.__fixture.saved=false});
   await page.locator('#dd-create-document').click();
   await page.waitForFunction(()=>document.querySelector('#dd-documents-status').textContent.includes('not confirmed saved'));
   assert.equal(await page.evaluate(()=>window.__fixture.calls.some(x=>x.action==='create')),false);
   assert.match(await page.locator('#writer').getAttribute('src'),new RegExp(B));
   pass(width+'px new document refused while B save unconfirmed');

   await page.evaluate(()=>{window.__fixture.saved=true});
   await page.locator('#dd-create-document').click();
   await page.waitForFunction(id=>document.querySelector('#writer').getAttribute('src').includes(id),C);
   assert.equal(await page.evaluate(()=>window.__fixture.calls.some(x=>x.action==='create')),true);
   pass(width+'px saved B before creating C');

   await page.evaluate(()=>{window.__fixture.saved=false});
   await page.frameLocator('#writer').locator('#legacyHome').click();
   await page.waitForFunction(()=>window.__fixture.calls.some(x=>x.action==='save'&&x.reason==='Disclosure Desk navigation to Research Studio Home'));
   assert.equal(await page.locator('#dd-documents-dialog').evaluate(el=>el.open),false);
   assert.match(page.url(),/guest-preview.html/);
   pass(width+'px iframe Home link stays put when save fails');

   await page.evaluate(()=>{window.__fixture.saved=true});
   await page.frameLocator('#writer').locator('#legacyHome').click();
   await page.locator('#dd-documents-dialog[open]').waitFor();
   assert.match(page.url(),/guest-preview.html/);
   pass(width+'px iframe Home link opens in-app panel with no /home 404');

   await page.locator('#dd-close-documents').click();
   await page.evaluate(()=>{
     document.querySelector('#writer').src='./wne.html';
     history.replaceState(null,'',location.pathname);
     sessionStorage.removeItem('wne-research-active-document');
     window.__fixture.calls.length=0;
     window.__fixture.saved=false;
   });
   await page.frameLocator('#writer').locator('#legacyHome').waitFor();
   await page.locator('#dd-documents-btn').click();
   await page.locator('#dd-new-document-name').fill('First research report');
   await page.locator('#dd-create-document').click();
   await page.waitForFunction(()=>window.__fixture.calls.some(x=>x.action==='create'));
   assert.equal(await page.evaluate(()=>window.__fixture.calls.some(x=>x.action==='save')),false);
   pass(width+'px first ever document creation is not blocked by empty editor');
   await page.locator('#dd-documents-btn').click();
   await page.evaluate(()=>{window.__fixture.saved=false});
   await page.locator('#restoreSingleLink').click();
   await page.waitForFunction(()=>document.querySelector('#dd-documents-status').textContent.includes('not confirmed saved'));
   assert.match(page.url(),/guest-preview.html/);
   assert.equal(await page.locator('#dd-documents-dialog').evaluate(el=>el.open),true);
   pass(width+'px JSON recovery link blocked until current report saved');
   await page.locator('#restoreZipLink').click();
   await page.waitForFunction(()=>document.querySelector('#dd-documents-status').textContent.includes('not confirmed saved'));
   assert.match(page.url(),/guest-preview.html/);
   pass(width+'px ZIP recovery link blocked until current report saved');
   await page.evaluate(()=>{window.__fixture.saved=true});
   await page.locator('#restoreSingleLink').click();
   await page.waitForURL('**/research/restore-copy.html',{timeout:10000});
   pass(width+'px confirmed save permits navigation to actual JSON recovery route');
   assert.deepEqual(errors,[],'Unhandled JS errors in Research fixture');
   await ctx.close();
  }
  console.log('PASS M29 HOME TOTAL '+count+' synthetic signed-in-like browser checks, no Supabase requests');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M29 HOME:',e.stack||e);process.exitCode=1});
