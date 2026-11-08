'use strict';
// Real offline Chromium: single-JSON Research recovery with fake signed-in A/B.
// No live credentials, no real Supabase traffic, and never updates source docs.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const sourceDoc={version:2,bookTitle:'Synthetic primary notebook',active:'one',
 font:'Georgia',size:12,chapters:[{id:'one',title:'Evidence',html:'<p>Preserve my first draft.</p>'}]};
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let n=0;
 const pass=t=>{n++;console.log('PASS M29 JSON RESTORE '+t)};
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===393?852:800},
    isMobile:width===393,hasTouch:width===393,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
     const u=new URL(route.request().url());
     return u.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   await ctx.addInitScript(ids=>{
     const state={A:ids[0],B:ids[1],owner:ids[0],other:ids[1],
       rows:[],reads:0,switchAt:0,failInsert:false};
     window.__restoreTest=state;
     window.supabase={createClient:()=>({
       auth:{getUser:async()=>{
         state.reads++;
         if(state.switchAt&&state.reads===state.switchAt)state.owner=state.other;
         return {data:{user:state.owner?{id:state.owner}:null},error:null};
       }},
       from(table){
         if(table!=='research_documents')throw Error('Unauthorized table: '+table);
         return {insert(row){
           state.rows.push(JSON.parse(JSON.stringify(row)));
           return {select(){return {single:async()=>state.failInsert?
             {data:null,error:{message:'Synthetic network timeout after upload'}}:
             {data:{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',title:row.title},error:null}
           }}};
         }};
       }
     })};
   },[A,B]);
   const page=await ctx.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/research/restore-copy.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>typeof window.DDResearchZipRestore?.validateDocument==='function'&&
       !!document.getElementById('backup')?.onchange);
   const upload=async doc=>page.locator('#backup').setInputFiles({
     name:'synthetic-research.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))
   });

   await upload({...sourceDoc,chapters:[{...sourceDoc.chapters[0],html:'<script>alert(1)</script>'}]});
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('unsafe'));
   assert.equal(await page.locator('#restore').isDisabled(),true);
   assert.equal(await page.evaluate(()=>window.__restoreTest.rows.length),0);
   pass(width+'px unsafe active HTML is rejected before any cloud insert');

   await upload(sourceDoc);
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Ready'));
   await page.locator('#restore').click();
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Recovered as a NEW'));
   const rows=await page.evaluate(()=>window.__restoreTest.rows);
   assert.equal(rows.length,1);assert.equal(rows[0].user_id,A);
   assert.match(rows[0].title,/Recovered Copy/);
   assert.equal(rows[0].content.chapters[0].html,sourceDoc.chapters[0].html);
   assert.equal(await page.locator('#restore').isDisabled(),true);
   pass(width+'px A restores only a NEW private copy; original draft unchanged');

   await page.evaluate(()=>{const s=window.__restoreTest;s.owner=s.B;s.reads=0;s.switchAt=0});
   await upload(sourceDoc);
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Ready'));
   await page.locator('#restore').click();
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Recovered as a NEW'));
   assert.equal(await page.evaluate(()=>window.__restoreTest.rows[1]?.user_id),B);
   assert.equal(await page.evaluate(()=>window.__restoreTest.rows[0]?.user_id),A);
   pass(width+'px switching to B never changes A copy ownership');

   await page.evaluate(()=>{const s=window.__restoreTest;s.owner=s.A;s.other=s.B;s.reads=0;s.switchAt=2});
   await upload(sourceDoc);
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Ready'));
   await page.locator('#restore').click();
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Account changed'));
   assert.equal(await page.evaluate(()=>window.__restoreTest.rows.length),2);
   pass(width+'px account changed during preflight stops before insert');

   await page.evaluate(()=>{const s=window.__restoreTest;s.owner=s.A;s.reads=0;s.switchAt=0;s.failInsert=true});
   await upload(sourceDoc);
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Ready'));
   await page.locator('#restore').click();
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Check Research Studio Home before retrying'));
   assert.equal(await page.locator('#restore').isDisabled(),true);
   assert.equal(await page.evaluate(()=>window.__restoreTest.rows.length),3);
   pass(width+'px ambiguous timeout prevents accidental duplicate immediate retry');

   await page.evaluate(()=>{const s=window.__restoreTest;s.owner=null;s.reads=0;s.switchAt=0;s.failInsert=false});
   await upload(sourceDoc);
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Ready'));
   await page.locator('#restore').click();
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Sign in'));
   assert.equal(await page.evaluate(()=>window.__restoreTest.rows.length),3);
   pass(width+'px signed-out state never inserts');
   assert.deepEqual(errors,[],'No unhandled JS errors in JSON restore fixture');
   await ctx.close();
  }
  console.log('PASS M29 JSON RESTORE TOTAL '+n+' synthetic two-account safety checks; no actual cloud requests');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M29 JSON RESTORE:',e.stack||e);process.exitCode=1});
