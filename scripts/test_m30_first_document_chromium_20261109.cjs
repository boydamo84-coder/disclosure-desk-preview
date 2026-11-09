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
    const state={rows:[],calls:[],user:args.user,doc:args.doc,failCreate:false};
    window.__m30Fixture=state;
    window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:{id:state.user}},error:null}),
       getSession:async()=>({data:{session:null},error:null}),
       onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
     from(name){
      if(name!=='research_documents'&&name!=='investigation_boards')throw Error('unexpected table '+name);
      const q={
       select(){return this},eq(){return this},maybeSingle:async()=>({data:null,error:null}),
       order(){return this},limit(){return this},
       single:async()=>({data:null,error:{message:'No real cloud document'}})
      };return q;
     }
    })};
    const fetchNative=window.fetch.bind(window);
    window.fetch=async(input,opts)=>{
     const path=new URL(typeof input==='string'?input:input.url,location.href).pathname;
     if(path!=='/api/library')return fetchNative(input,opts);
     let payload=null;
     if(opts?.body)payload=JSON.parse(opts.body);
     state.calls.push(payload?.action||'list');
     if(!payload)return new Response(JSON.stringify({active_id:null,items:state.rows}),
       {status:200,headers:{'Content-Type':'application/json'}});
     if(payload.action==='create'){
      if(state.failCreate)return new Response(JSON.stringify({error:'Simulated cloud unavailable'}),
       {status:503,headers:{'Content-Type':'application/json'}});
      const row={id:state.doc,title:payload.title};
      state.rows.push(row);return new Response(JSON.stringify(row),
       {status:200,headers:{'Content-Type':'application/json'}});
     }
     if(payload.action==='open'){
      const row=state.rows.find(r=>r.id===payload.id);
      return new Response(JSON.stringify(row?{ok:true,id:row.id}:{error:'Not found'}),
       {status:row?200:404,headers:{'Content-Type':'application/json'}});
     }
     return new Response(JSON.stringify({error:'Not available'}),{status:400});
    };
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
