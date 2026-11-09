'use strict';
// M30 observed Samsung first-document failure reproduction: real workspace JS,
// fictional authenticated cloud, localhost Chromium only. No real Supabase calls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const uuid='11111111-1111-4111-8111-111111111111';
const writer=fs.readFileSync('research/wne.html','utf8');
const workspace=fs.readFileSync('research/research-workspace.html','utf8');
assert.doesNotMatch(writer,/W\.NE could not connect to its local Python server|wne_server_v07\.py/);
assert.match(writer,/location\.replace\('\.\/research-workspace\.html\?dd_home=1'\)/);
assert.match(workspace,/id="dd-first-document"/);
assert.match(workspace,/id="writer"[^>]*src="about:blank"[^>]*hidden/);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let total=0;
 const pass=label=>{total++;console.log('PASS M30 FIRST DOCUMENT '+label)};
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===393?852:800},
    isMobile:width===393,hasTouch:width===393,serviceWorkers:'block'});
   let iframeRequests=0;
   await ctx.route('**/*',route=>{
    const uri=new URL(route.request().url());
    if(uri.origin!==base)return route.abort('blockedbyclient');
    if(uri.pathname==='/research/wne.html'){
     iframeRequests++;
     return route.fulfill({status:200,contentType:'text/html',
      body:'<!doctype html><title>Mock cloud editor</title><p id="loaded">Opened a synthetic cloud document</p>'});
    }
    return route.continue();
   });
   await ctx.addInitScript(args=>{
    // Let the real hosted wne-cloud-bridge.js handle /api/library. Mock only
    // the Supabase client it calls, with a fictional owner and transient rows.
    const state={rows:[],calls:[],user:args.user,doc:args.doc,failCreate:false};
    window.__m30Fixture=state;
    window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:{id:state.user}},error:null}),
       getSession:async()=>({data:{session:null},error:null}),
       onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
     from(name){
      if(name!=='research_documents'&&name!=='investigation_boards')throw Error('unexpected table '+name);
      const query={
       filter:null,max:100,
       select(){return this},
       eq(column,value){this.filter={column,value};return this},
       order(){return this},
       limit(n){this.max=n;return this},
       values(){
        const items=state.rows.filter(row=>!this.filter||row[this.filter.column]===this.filter.value);
        return items.slice(0,this.max);
       },
       then(resolve,reject){return Promise.resolve({data:this.values(),error:null}).then(resolve,reject)},
       maybeSingle:async function(){return {data:this.values()[0]||null,error:null}},
       single:async function(){
        state.calls.push('open');
        const row=this.values()[0];
        return row?{data:row,error:null}:{data:null,error:{message:'No owner document'}};
       },
       insert(data){
        state.calls.push('create');
        if(state.failCreate)return {select:()=>({single:async()=>({data:null,error:{message:'Simulated cloud failure'}})})};
        const row={id:state.doc,...data,revision:1,updated_at:'2026-11-09T00:00:00Z'};
        state.rows.push(row);
        return {select:()=>({single:async()=>({data:{id:row.id,title:row.title},error:null})})};
       }
      };
      return query;
     }
    })};
   },{user:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',doc:uuid});
   const page=await ctx.newPage();
   const alerts=[];page.on('dialog',d=>{alerts.push(d.message());return d.dismiss()});
   await page.goto(base+'/research/research-workspace.html',{waitUntil:'domcontentloaded',timeout:35000});
   await page.locator('#dd-documents-dialog[open]').waitFor({timeout:7000});
   assert.equal(iframeRequests,0,'Writer must not load without cloud ID');
   assert.equal(await page.locator('#writer').getAttribute('src'),'about:blank');
   assert.equal(await page.locator('#writer').isHidden(),true);
   assert.equal(await page.locator('#dd-first-document').isVisible(),true);
   assert.equal(await page.locator('#dd-documents-list').innerText().then(x=>/No documents saved yet/.test(x)),true);
   assert.equal(alerts.length,0,'No legacy Python or cloud popup for new account');
   pass(width+'px first-time account sees Home, no Writer boot or Python warning');

   await page.locator('#dd-new-document-name').fill('M30 Synthetic first report');
   await page.locator('#dd-create-document').click();
   await page.waitForFunction(id=>document.getElementById('writer').getAttribute('src').includes(id),uuid);
   assert.equal(iframeRequests,1,'Writer only loads AFTER new document exists');
   assert.equal(await page.locator('#dd-first-document').isHidden(),true);
   assert.equal(await page.locator('#writer').isVisible(),true);
   assert.equal(await page.locator('#dd-documents-dialog').evaluate(el=>el.open),false);
   const calls=await page.evaluate(()=>window.__m30Fixture.calls);
   assert.deepEqual(calls.filter(x=>x==='create'||x==='open'),['create','open']);
   pass(width+'px creating first cloud report activates editor exactly once');

   // A new independent tab with a confirmed cloud document should directly
   // load its editor, without replacing it with the first-time Home panel.
   const second=await ctx.newPage();
   const dialogs=[];second.on('dialog',d=>{dialogs.push(d.message());return d.dismiss()});
   await second.goto(base+'/research/research-workspace.html?id='+uuid,{waitUntil:'domcontentloaded'});
   await second.waitForFunction(()=>document.getElementById('writer')?.getAttribute('src')?.includes('id='));
   assert.equal(await second.locator('#writer').isVisible(),true);
   assert.equal(await second.locator('#dd-first-document').isHidden(),true);
   assert.equal(await second.locator('#dd-documents-dialog').evaluate(el=>el.open),false);
   assert.equal(dialogs.length,0);
   pass(width+'px existing document opens editor without first-time prompt');
   await ctx.close();
  }
  console.log('PASS M30 FIRST DOCUMENT TOTAL '+total+' real Chromium no-deploy checks');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M30 FIRST DOCUMENT',e.stack||e);process.exitCode=1});
