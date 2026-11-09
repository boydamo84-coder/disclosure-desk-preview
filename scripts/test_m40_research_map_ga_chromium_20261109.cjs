'use strict';
// Milestone 40 — real Chromium, synthetic Research document and synthetic GA only.
// NO public deployment; NO real Supabase / Google Analytics requests.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173',DOC='11111111-1111-4111-8111-111111111111';
const documentFixture={version:2,bookTitle:'M40 disposable document',active:'m40-one',
 chapters:[{id:'m40-one',title:'Section 1',html:'<p>Synthetic report</p>'}],
 font:'Georgia',size:12,wne_structure:'sections'};
const fakeSupabase='(()=>{const doc='+JSON.stringify(documentFixture)+';const state={rev:1,saves:0};'+
 'window.supabase={createClient:()=>({'+
 'auth:{getUser:async()=>({data:{user:{id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}},error:null}),'+
 'getSession:async()=>({data:{session:null},error:null}),'+
 'onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},'+
 'from:()=>({select(){return this},eq(){return this},single:async()=>({data:{'+
 'id:"'+DOC+'",title:"M40 disposable document",content:doc,revision:state.rev},error:null})}),'+
 'rpc:async(name)=>{if(name!=="research_save_document")throw Error("Unexpected RPC");'+
 'state.rev++;state.saves++;return {data:[{saved_revision:state.rev}],error:null}}'+
 '})};})();';
async function main(){
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let passed=0;
 try{
  for(const width of [393,1280]){
   const height=width===393?852:900;
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:width===393,
    isMobile:width===393,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('/@supabase/'))
     return route.fulfill({status:200,contentType:'application/javascript',body:fakeSupabase});
    if(url.origin===BASE&&url.pathname==='/api/research/archive-search')
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      total:2,archiveCount:2,cases:[
       {id:'m40-a',title:'Alpha record',year:1976,location:'Belfast',source:'https://example.org/a'},
       {id:'m40-b',title:'Beta record',year:1980,location:'London',source:'https://example.org/b'}]})});
    if(url.origin===BASE&&url.pathname==='/api/research/boards')
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      boards:[{name:'Sample Board',id:'qa-board'}]})});
    if(url.origin===BASE&&url.pathname==='/api/research/boards/qa-board')
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      board:{name:'Sample Board',comparisons:[{title:'Saved pair',cases:[
       {title:'Board Alpha',location:'UK'},{title:'Board Beta',location:'USA'}]}]}})});
    return url.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/research/wne.html?id='+DOC,{waitUntil:'domcontentloaded',timeout:40000});
   await page.waitForFunction(()=>document.querySelector('#editor')?.isContentEditable&&
    document.getElementById('wne-m39-sticky-controls')&&
    document.querySelector('#dd-word-ribbon-v1 [data-ribbon=citations]'),null,{timeout:10000});
   await page.locator('#dd-word-ribbon-v1 [data-ribbon=insert]').click();
   await page.locator('#dd-word-context-v1 [data-action=compare]').click();
   await page.locator('#dd-comparison-dialog[open]').waitFor();
   const footer=await page.locator('#dd-comparison-dialog .dd-m40-dialog-footer').boundingBox();
   assert(footer&&footer.y+footer.height<=height+2,
    width+'px compare confirmation is below viewport '+JSON.stringify(footer));
   assert.equal(await page.locator('#dd-m40-advanced').evaluate(x=>x.open),false);
   await page.locator('#dd-compare-archive-tab').click();
   await page.locator('#dd-archive-query').fill('alpha');
   await page.locator('#dd-archive-results input[type=checkbox]').nth(1).waitFor({timeout:9000});
   await page.locator('#dd-archive-results input[type=checkbox]').nth(0).check();
   await page.locator('#dd-archive-results input[type=checkbox]').nth(1).check();
   await page.waitForFunction(()=>document.getElementById('dd-preview-message')?.textContent?.includes('Alpha record')&&
    document.getElementById('dd-preview-message')?.textContent?.includes('Beta record'));
   assert.equal(await page.locator('#dd-comparison-preview table').count(),1);
   await page.locator('#dd-comparison-confirm').click();
   assert.equal(await page.locator('#editor .dd-comparison-block').count(),1);
   passed++;console.log('PASS M40 '+width+'px Archive comparison auto-previews and inserts only on confirmation');
   await page.locator('#dd-word-context-v1 [data-action=compare]').click();
   await page.locator('#dd-compare-board').selectOption('qa-board');
   await page.locator('#dd-compare-item option[value="0"]').waitFor();
   await page.locator('#dd-compare-item').selectOption('0');
   await page.waitForFunction(()=>document.getElementById('dd-preview-message')?.textContent?.includes('Board Alpha'));
   assert.equal(await page.locator('#dd-preview-content table').count(),1);
   await page.locator('#dd-comparison-cancel').click();
   assert.equal(await page.locator('#editor .dd-comparison-block').count(),1);
   passed++;console.log('PASS M40 '+width+'px saved Board preview and cancellation protect report');
   await page.locator('#drawer').click();
   const layers=await page.evaluate(()=>{
    const sidebar=document.querySelector('.sidebar.open'),sticky=document.getElementById('wne-m39-sticky-controls');
    return {side:Number(getComputedStyle(sidebar).zIndex),
     sticky:Number(getComputedStyle(sticky).zIndex)};
   });
   assert(layers.side>layers.sticky,'Sections drawer below toolbar '+JSON.stringify(layers));
   await page.locator('#add').click();
   await page.waitForFunction(()=>document.getElementById('chapter-title')?.value==='Section 2');
   passed++;console.log('PASS M40 '+width+'px Sections above ribbon and new title Section 2');
   await page.locator('#dd-word-ribbon-v1 [data-ribbon=citations]').click();
   assert.equal(await page.locator('#dd-word-context-v1 .dd-m40-ribbon-action').count(),3);
   await page.locator('#dd-word-context-v1 .dd-m40-ribbon-action').nth(1).click();
   await page.locator('#dd-m40-cite-title').fill('Official synthetic report');
   await page.locator('#dd-m40-cite-url').fill('https://example.org/report');
   await page.locator('#dd-m40-cite-preview').getByText(/Will insert:/).waitFor();
   await page.locator('#dd-m40-cite-insert').click();
   await page.waitForFunction(()=>document.getElementById('editor')?.textContent?.includes('Official synthetic report.'));
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wne_research_references_v1')||'[]').length),1);
   await page.locator('#dd-word-context-v1 .dd-m40-ribbon-action').first().click();
   assert.equal(await page.locator('#dd-m40-cite-insert').isDisabled(),true,
    'Saved citation needs explicit choice');
   await page.locator('#dd-m40-cite-select').selectOption('0');
   await page.locator('#dd-m40-cite-preview').getByText('Official synthetic report').waitFor();
   await page.locator('#dd-m40-cite-close').click();
   passed++;console.log('PASS M40 '+width+'px dedicated Citations, preview, save and cancel');
   assert(!errors.some(e=>/M40|dd-comparison-dialog|dd-m40/i.test(e)),
    'New editor error(s): '+JSON.stringify(errors));
   await ctx.close();
  }
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.addInitScript(()=>{
   try{localStorage.setItem('dd-site-analytics-consent-v1','accepted')}catch(_){}
  });
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin===BASE&&['/privacy','/'].includes(url.pathname)){
    const html='<!doctype html><html><head><script defer src="/assets/analytics-consent.js"></script></head>'+
     '<body><nav class="nav"><button class="tab active" data-tab="discover">News</button></nav>'+
     '<p id="dd-analytics-device-status">Checking</p>'+
     '<button data-dd-analytics-open>Analytics preferences</button></body></html>';
    return route.fulfill({status:200,contentType:'text/html',body:html});
   }
   if(url.hostname==='www.googletagmanager.com')
    return route.fulfill({status:200,contentType:'application/javascript',body:'/* synthetic GA4 script */'});
   return url.origin===BASE?route.continue():route.abort('blockedbyclient');
  });
  const p=await context.newPage();
  await p.goto(BASE+'/privacy',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DDAnalyticsConsent?.getStatus()?.tagLoaded);
  const first=await p.evaluate(()=>window.dataLayer.map(x=>Array.from(x)).filter(x=>x[0]==='event'));
  assert.deepEqual(first.map(x=>x[2].page_path),['/privacy.html']);
  assert.match(await p.locator('#dd-analytics-device-status').innerText(),/Google tag loaded/);
  passed++;console.log('PASS M40 extensionless privacy URL reports canonical public page');
  await p.goto(BASE+'/?dd_tab=profilePage',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>!!window.DDAnalyticsConsent);
  const privateViews=await p.evaluate(()=>window.dataLayer?.filter(x=>x[0]==='event').length||0);
  assert.equal(privateViews,0,'Private deep link must never be misreported as News');
  passed++;console.log('PASS M40 private deep link produces no faux News analytics');
  await p.goto(BASE+'/?dd_tab=mapPage',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.DDAnalyticsConsent?.getStatus()?.tagLoaded);
  const maps=await p.evaluate(()=>window.dataLayer.map(x=>Array.from(x)).filter(x=>x[0]==='event'));
  assert.deepEqual(maps.map(x=>x[2].page_path),['/site/map']);
  passed++;console.log('PASS M40 public Map deep link measured correctly with opt-in');
  await context.close();
  console.log('PASS M40 TOTAL '+passed+' real Chromium checks. No live users, Google or Supabase.');
 }finally{await browser.close()}
}
main().catch(error=>{console.error('FAIL M40 Chromium:',error.stack||error);process.exitCode=1});
