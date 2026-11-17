'use strict';
// M55: REAL local Who -> Archive -> Who pages (not a DOM-only fixture).
// This runs only against the checked-out public website on localhost, with
// all third-party requests blocked. No real Android APK or external publishing.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const scenarios=[
 {person:'kevin-knuth',name:'Kevin Knuth',caseId:'featured-nimitz-2004'},
 {person:'david-fravor',name:'David Fravor',caseId:'featured-nimitz-2004'},
 {person:'larry-warren',name:'Larry Warren',caseId:'featured-rendlesham-1980'},
 {person:'nick-pope',name:'Nick Pope',caseId:'featured-rendlesham-1980'}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  // One canonical phone viewport for all four relationships, plus a narrow
  // phone regression on Knuth; avoid overloading inherited Chromium suite.
  for(const width of [393,320]){
   const context=await browser.newContext({viewport:{width,height:820},locale:'en-GB'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===base)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   const cases=width===393?scenarios:scenarios.slice(0,1);
   for(const {person,name,caseId}of cases){
    const entry=base+'/who-is-who.html?person='+person;
    await page.goto(entry,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:20000});
    assert.equal(await page.locator('#profileName').innerText(),name);
    const cited=page.locator('#profileRelatedCases .dd-person-case-link');
    assert.equal(await cited.count(),1,'One curated case relation per tested person');
    const link=cited.locator('a[href*="dd_archive_case="]').first();
    assert.equal(await link.count(),1,'Reader exposes a case archive route');
    const source=await link.getAttribute('href');
    assert(source.includes('dd_archive_case='+caseId),'Correct case id for '+person);
    await link.scrollIntoViewIfNeeded();
    await Promise.all([
     page.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('dd_tab')==='archivePage',{timeout:25000}),
     link.click({timeout:12000})
    ]);
    // Archive may remove the one-time dd_archive_case from the URL after
    // loading, but must retain dd_from=who during the contextual case visit.
    const current=new URL(page.url());
    assert.equal(current.searchParams.get('dd_from'),'who');
    const dialog=page.locator('#archiveCaseDialog');
    await dialog.waitFor({state:'visible',timeout:45000});
    await page.waitForFunction(id=>{
      const d=document.querySelector('#archiveCaseDialog');
      const b=document.querySelector('#archiveCaseBody');
      return Boolean(d?.open&&b?.dataset.archiveCaseId===id);
    },caseId,{timeout:45000});
    const back=page.locator('#ddWhoArchiveReturn');
    await back.waitFor({state:'visible',timeout:12000});
    assert.equal(await back.innerText(),'← Back to Who’s Who profile');
    const destination=await back.evaluate(b=>window.DDWhoArchiveReturn?.fromSession?.(
      document.querySelector('#archiveCaseBody')?.dataset.archiveCaseId));
    assert.deepEqual(destination,{href:'/who-is-who.html?person='+person,personId:person,caseId},
      'Matching case/identity return only');
    await Promise.all([
     page.waitForURL(url=>url.pathname==='/who-is-who.html'&&url.searchParams.get('person')===person,{timeout:20000}),
     back.click({timeout:12000})
    ]);
    await page.locator('#personProfile').waitFor({state:'visible',timeout:20000});
    assert.equal(await page.locator('#profileName').innerText(),name);
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Premium dock retained');
    const retained=await page.evaluate(()=>sessionStorage.getItem('dd-who-case-return-v1'));
    assert.equal(retained,null,'A used contextual return marker is consumed');
    const overflow=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth
    }));
    assert(overflow.scroll<=overflow.view+4,'No horizontal overflow '+width+'px '+person);
   }
   // A directly opened case with no Who-specific URL marker must never show
   // contextual return, even if browser session had previously used the flow.
   await page.goto(base+'/?dd_tab=archivePage&dd_archive_case=featured-nimitz-2004',
    {waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#archiveCaseDialog')?.open,
    null,{timeout:45000});
   assert.equal(await page.locator('#ddWhoArchiveReturnWrap').isVisible(),false,
     'Ordinary Archive visit cannot invent a Who-specific return');
   // Ignore unrelated optional/CDN errors, but flag errors in this feature.
   assert.equal(errors.filter(s=>/DDWhoArchiveReturn|who-archive-return/i.test(s)).length,0,
    'No errors in the contextual return module');
   await context.close();
  }
  console.log('M55 REAL WEBSITE CHROMIUM PASS: 4 Who↔Archive routes at 393px, Knuth 320px, exact case identity, contextual return and direct-Archive fail-closed. No third-party requests; Android hardware still untested.');
 }finally{await browser.close()}
})().catch(err=>{console.error('M55 website flow:',err);process.exitCode=1;});
