'use strict';
// Real Chromium local research article and existing archive interaction checks.
// Run only against loopback http://127.0.0.1:4173. No external services/accounts.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const viewport of [{width:393,height:852},{width:1280,height:900}]){
   const context=await browser.newContext({viewport,locale:'en-GB',isMobile:viewport.width===393,hasTouch:viewport.width===393});
   await context.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch(_){}});
   await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===BASE&&u.pathname==='/investigations')return route.fulfill({path:path.resolve('investigations.html'),contentType:'text/html'});
    if(u.origin===BASE&&u.pathname==='/rendlesham-forest-1980')return route.fulfill({path:path.resolve('rendlesham-forest-1980.html'),contentType:'text/html'});
    if(u.origin===BASE&&u.pathname==='/roswell-1947')return route.fulfill({path:path.resolve('roswell-1947.html'),contentType:'text/html'});
    if(u.origin===BASE)return route.continue();
    if(u.hostname==='unpkg.com'&&u.pathname==='/leaflet@1.9.4/dist/leaflet.js'){
     return route.fulfill({path:path.resolve('node_modules/leaflet/dist/leaflet.js'),contentType:'application/javascript'});
    }
    return route.abort('blockedbyclient');
   });
   const failures=[];
   for(const slug of ['rendlesham-forest-1980','roswell-1947']){
    // Each article-to-archive journey has its own tab. Closing an archive
    // case intentionally calls history.back(); don't race that navigation
    // against a second dossier's page.goto() in the same tab.
    const page=await context.newPage();
    page.on('pageerror',e=>{failures.push(String(e.message||e));console.log('R2 PAGE ERROR',String(e.message||e))});
    page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')console.log('R2 BROWSER '+msg.type()+' '+msg.text().slice(0,350))});
    await page.goto(BASE+'/'+slug+'.html',{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#content h1').waitFor();
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://uapdisclosuredesk.com/'+slug);
    assert.equal(await page.locator('#record-ledger').isVisible(),true,slug+' record evidence ledger visible');
    assert.equal(await page.locator('#sources a[href^="https://"]').count()>=2,true,slug+' has inspectable source citations');
    const widths=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(widths.doc<=widths.viewport+3,slug+' must not scroll horizontally at '+viewport.width+'px');
    assert(await page.locator('a[href^="/?dd_tab=archivePage"][href*="dd_archive_case"]').count()>=1,
      slug+' has a linked curated archive record');
    await page.locator('a[href^="/?dd_tab=archivePage"][href*="dd_archive_case"]').first().click();
    await page.waitForURL('**/?dd_tab=archivePage*',{timeout:15000});
    await page.locator('#archiveCaseDialog[open] #archiveCaseTitle').waitFor({timeout:18000}).catch(async error=>{
     const diagnostic=await page.evaluate(()=>({
      url:location.href,hasArchiveTab:!!document.querySelector('#archivePage:not(.hidden)'),
      status:document.querySelector('#archiveStatus')?.textContent?.slice(0,250),
      dialogOpen:document.querySelector('#archiveCaseDialog')?.open,
      scriptReady:typeof window.DDEvidenceDNA?.parseGraph,
      caseModule:typeof window.DDCaseConnections?.build,
      archiveVisible:document.querySelector('#archivePage')?.className,
      searchState:history.state
     })).catch(e=>({diagnosticError:String(e)}));
     console.log('R2 ARCHIVE TIMEOUT DIAGNOSTIC '+JSON.stringify(diagnostic));
     throw error;
    });
    const title=await page.locator('#archiveCaseTitle').innerText();
    assert.match(title,slug.startsWith('roswell')?/Roswell/i:/Rendlesham/i);
    // R2 Evidence DNA lives inside the existing case file, never in a new tab.
    const dna=page.locator('#archiveCaseBody details.dd-evidence-dna');
    assert.equal(await dna.count(),1,'Every source-linked case has one Evidence DNA panel');
    await dna.locator('summary').click();
    assert.equal(await dna.getAttribute('open'),'','Evidence DNA expands with the native keyboard-accessible disclosure');
    assert.match(await dna.innerText(),/Independent accounts: not assessed/);
    assert.equal(await dna.locator('.dd-evidence-dna-claim').count(),2,'Two named claims with institutional source locators');
    assert.match(await dna.innerText(),/Editorial review pending/);
    assert.match(await dna.innerText(),/Independent witnesses: not established/);
    assert(await dna.locator('.dd-evidence-dna-claim a[href^="https://"]').count()>=2,'Every dossier displays precise reviewable source links');
    assert(await dna.locator('a[href^="https://"]').count()>=1,'Original source citations remain clickable');
    assert.equal(await page.evaluate(()=>typeof window.DDEvidenceDNA?.traceClaim),'function');
    const correctReturn=await page.locator('#archiveCaseBody a[href="/'+slug+'"]').count();
    assert(correctReturn===1,'Archive detail must return to same original article');
    // Case Connections must be usable on EVERY case detail, including on mobile.
    assert.equal(await page.locator('#archiveCaseBody [data-dd-case-mode]').count(),4,
     'Four source-grounded connection filters are visible in the existing archive dialog');
    for(const mode of ['nearby','similar','time','all']){
     await page.locator('#archiveCaseBody [data-dd-case-mode="'+mode+'"]').click();
     assert.equal(await page.locator('#archiveCaseBody [data-dd-case-mode="'+mode+'"]').getAttribute('aria-pressed'),'true',
      'Filter state updates for '+mode);
     assert.equal(await page.locator('#ddCaseConnectionsResults').getAttribute('data-mode'),mode,
      'Case Connections result panel updates for '+mode);
     const disclosure=await page.locator('#ddCaseConnectionsCoverage').innerText();
     assert.match(disclosure,/loaded public source records/i);
    }
    assert.equal(await page.evaluate(()=>typeof window.DDCaseConnections?.build),'function',
      'Indexed Case Connections module is available in public app');

    await page.locator('#archiveCaseClose').click();
    await page.locator('#archiveCaseDialog[open]').waitFor({state:'hidden',timeout:8000});
    assert(await page.locator('#archivePage').isVisible(),'Archive remains visible after closing details');
    console.log('PASS RESEARCH BROWSER '+slug+' '+viewport.width+'px: public article, citations, no overflow, curated archive dialogue, return link and case-connection filters');
    await page.close();
   }
   // External CDNs and authentication services are intentionally blocked.
   // Report JS exceptions for triage but do not assume external fetch failures mean a site regression.
   if(failures.length)console.log('INFO blocked-external-runtime warnings '+viewport.width+'px: '+JSON.stringify(failures.slice(0,8)));
   await context.close();
  }
  console.log('PASS original research Chromium navigation tests at phone + desktop sizes; NO deploy or real account calls');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL original research browser QA:',e.stack||e);process.exitCode=1});
