'use strict';
// Actual modules, isolated loopback Chromium and fictional accounts/catalogue only.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');const BASE='http://127.0.0.1:4173';
const css=[...fs.readFileSync('index.html','utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(x=>x[1]).join('\n')+fs.readFileSync('assets/community-polish.css','utf8');
const harness=String.raw`
window.DD_COMMUNITY_TEST_CONFIG={environment:'test',url:'https://example.invalid',publishableKey:'fictional'};
window.__mediaUser='member';window.__mediaListeners=[];window.__mediaRows=[];window.__mediaQueue=[];window.__mediaWait=null;
const answer=data=>({data,error:null});
const client={auth:{getUser:async()=>answer({user:window.__mediaUser?{id:window.__mediaUser,is_anonymous:false}:null}),onAuthStateChange:cb=>{window.__mediaListeners.push(cb);return answer({subscription:{unsubscribe(){}}})}},
from:()=>({select(){return this},eq:async()=>answer([])}),rpc:async(name,p)=>{
 if(name==='dd_media_catalogue')return answer(window.__mediaRows.slice());
 if(name==='dd_media_ranking')return answer([]);
 if(name==='dd_discussions_is_owner')return answer(window.__mediaUser==='owner');
 if(name==='dd_media_suggest'){
  if(window.__mediaWait)return await new Promise(resolve=>{window.__mediaResolve=resolve});
  if(window.__mediaRows.some(x=>x.public_url===p.p_url))return {data:null,error:{message:'This title or link is already added'}};
  const id='55555555-5555-4555-8555-555555555555';window.__mediaRows.push({id:'member-'+id,title:p.p_title,category:p.p_category,public_url:p.p_url,creator:'Community suggestion',source_kind:'member',created_at:'2026-11-10T00:00:00Z'});return answer(id);
 }
 if(name==='dd_media_report'){
  const row=window.__mediaRows.find(x=>x.id===p.p_id);window.__mediaRows=window.__mediaRows.filter(x=>x.id!==p.p_id);if(row)window.__mediaQueue=[{id:row.id,title:row.title,category:row.category,url:row.public_url,report_count:5}];
  return answer({reported:true,already_reported:false,hidden:true});
 }
 if(name==='dd_media_review_queue')return answer(window.__mediaQueue.slice());
 if(name==='dd_media_review'){
  const row=window.__mediaQueue.find(x=>x.id===p.p_id);if(!row)return answer(false);
  if(p.p_decision==='restore')window.__mediaRows.push({...row,public_url:row.url,source_kind:'member',creator:'Community suggestion',created_at:'2026-11-10T00:00:00Z'});
  window.__mediaQueue=[];return answer(true);
 }
 throw Error('Unexpected fictional RPC '+name);
}};window.supabase={createClient:()=>client};`;
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+' body{margin:0;padding:8px;box-sizing:border-box}#ddWatchReadMount{width:100%;min-width:0}.card{padding:12px}</style></head><body><section id="watchRead"><div id="ddWatchReadMount"></div></section><script>'+harness+'</script><script defer src="/assets/media-submissions.js"></script><script defer src="/assets/watch-read.js"></script></body></html>';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let count=0;
try{for(const width of [320,393,1280]){
 const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block'});
 await ctx.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===BASE&&u.pathname==='/__media-auto-qa')return route.fulfill({status:200,contentType:'text/html',body:html});return u.origin===BASE?route.continue():route.abort('blockedbyclient')});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(BASE+'/__media-auto-qa',{waitUntil:'domcontentloaded'});
 const add=page.locator('.dd-link-submission').first();await add.locator(':scope > summary').click();await add.getByLabel('What is it?').selectOption('books');await add.getByLabel('Public link').fill('https://example.org/fixture-book');await add.getByLabel('Title',{exact:true}).fill('Synthetic shared book');await add.getByRole('button',{name:'Add to catalogue',exact:true}).click();
 await add.getByText('Added to Watch & Read.',{exact:true}).waitFor();await page.locator('.dd-media-card').getByRole('link',{name:'Synthetic shared book',exact:true}).waitFor();assert.equal(await page.locator('.dd-media-card').count(),1);count++;
 await add.getByLabel('Public link').fill('https://example.org/fixture-book');await add.getByLabel('Title',{exact:true}).fill('Another title');await add.getByRole('button',{name:'Add to catalogue',exact:true}).click();await add.getByText('This title or link is already listed.',{exact:true}).waitFor();assert.equal(await add.getByLabel('Title',{exact:true}).inputValue(),'Another title');count++;
 await page.locator('.dd-media-card').getByRole('button',{name:'Report Synthetic shared book',exact:true}).click();const dialog=page.locator('.dd-media-report-dialog');await dialog.getByRole('button',{name:'Send report',exact:true}).click();await dialog.getByText('Report recorded. This title is now hidden for owner review.',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelectorAll('.dd-media-card').length===0);const box=await dialog.boundingBox();assert(box&&box.x>=0&&box.x+box.width<=width+1&&box.y+box.height<=900);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();count++;
 await page.evaluate(()=>{window.__mediaUser='owner';for(const cb of window.__mediaListeners)cb('SIGNED_IN',{user:{id:'owner'}})});
 const review=page.locator('.dd-link-submission').nth(1);await review.waitFor({state:'visible'});await review.locator(':scope > summary').click();await review.getByText('Synthetic shared book',{exact:true}).waitFor();await review.getByRole('button',{name:'Restore title',exact:true}).click();await page.locator('.dd-media-card').getByRole('link',{name:'Synthetic shared book',exact:true}).waitFor();await review.getByText('No reported titles awaiting review.',{exact:true}).waitFor();count++;
 await page.locator('.dd-media-card').getByRole('button',{name:'Report Synthetic shared book',exact:true}).click();await dialog.getByRole('button',{name:'Send report',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.dd-media-card').length===0);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await review.getByRole('button',{name:'Refresh reports',exact:true}).click();await review.getByRole('button',{name:'Remove title',exact:true}).click();await review.getByText('No reported titles awaiting review.',{exact:true}).waitFor();assert.equal(await page.locator('.dd-media-card').count(),0);count++;
 await page.evaluate(()=>{window.__mediaUser='member';for(const cb of window.__mediaListeners)cb('SIGNED_IN',{user:{id:'member'}});window.__mediaWait=true});
 assert.equal(await review.isVisible(),false);await add.getByLabel('Public link').fill('https://example.org/delayed');await add.getByLabel('Title',{exact:true}).fill('Delayed account receipt');await add.getByRole('button',{name:'Add to catalogue',exact:true}).click();await page.waitForFunction(()=>!!window.__mediaResolve);await page.evaluate(()=>{window.__mediaUser=null;for(const cb of window.__mediaListeners)cb('SIGNED_OUT',null);window.__mediaResolve({data:'55555555-5555-4555-8555-555555555555',error:null})});await page.waitForFunction(()=>!document.querySelector('.dd-link-submission button[type=submit]').disabled);assert.equal(await add.getByRole('status').innerText(),'');assert.equal(await review.isVisible(),false);count++;
 const geometry=await page.evaluate(()=>({visible:document.documentElement.clientWidth,actual:document.documentElement.scrollWidth}));assert(geometry.actual<=geometry.visible+2,JSON.stringify(geometry));assert.deepEqual(errors,[]);count++;console.log('PASS media auto '+width+'px: add, duplicate, report, restore, remove, sign-out race and geometry');await ctx.close();
}console.log('PASS media browser TOTAL '+count+' controlled checks; actual five-report threshold is tested in PostgreSQL');}finally{await browser.close()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
