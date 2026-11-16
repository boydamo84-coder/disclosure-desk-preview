'use strict';
// M28d local real Chrome: four source-chain disclosures, original navigation,
// no score/vote controls, no outside network calls or user data access.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const people=[
 {id:'ross-coulthart',name:'Ross Coulthart',grade:/Independent broadcaster quoting another original/,needle:/not full direct examination of 7NEWS video/},
 {id:'jake-barber',name:'Jake Barber',grade:/Original newsroom clip redistributed by another website/,needle:/Yahoo hosts NewsNation material/},
 {id:'bob-lazar',name:'Bob Lazar',grade:/Third-party retyped interview, original master unaudited/,needle:/not an authenticated original TV recording/},
 {id:'larry-warren',name:'Larry Warren',grade:/Publisher video chapter titles\/metadata, NOT a watched transcript/,needle:/PDF page index 12/}
];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:865},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   for(const p of people){
    await page.goto(base+'/who-is-who.html?person='+p.id,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:30000});
    assert.equal((await page.locator('#profileName').innerText()).trim(),p.name);
    const host=page.locator('#profileEvidenceReviews');
    const outer=host.locator('.claim-review > .claim-evidence-details');
    assert.equal(await outer.count(),1,'One top level original evidence disclosure for '+p.name);
    await outer.locator(':scope > summary').click();
    const details=outer.locator('details[data-m28d-accesscheck]');
    assert.equal(await details.count(),1,'M28d source-access research is visible for '+p.name);
    await details.locator(':scope > summary').click();
    assert.equal(await details.getAttribute('open'),'','Source-access drawer expanded');
    const body=await details.innerText();
    assert.match(body,/NOT an approved UAP finding/);
    assert.match(body,/Independent human editor: not obtained/);
    assert.match(body,/Numeric scores, community votes and new portrait approvals: withheld/);
    assert.match(body,/complete video NOT reviewed|original TV tape NOT reviewed|Original broadcaster video NOT played/i);
    assert.match(body,p.grade);
    assert.match(body,p.needle);
    assert.equal(await details.locator('.claim-evidence-list li').count(),3,'Three clearly qualified source records');
    const links=await details.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
    assert.equal(links.length,4,'Original source plus three linked records');
    assert(links.every(x=>x.startsWith('https://')),'Original HTTPS links only');
    if(p.id==='larry-warren'){
     assert(links.some(x=>x.endsWith('briefing-guide-12-07-12.pdf')));
     assert(links.some(x=>x.endsWith('UfKwQgmHfII')));
    }
    if(p.id==='bob-lazar')assert.match(body,/502|unavailable/i);
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
      'Provenance-only record must not activate score or authenticated vote');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Original premium nav unchanged');
    const extent=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(extent.doc<=extent.viewport+4,'No horizontal overflow for '+p.name+' '+width+'px');
   }
   assert.deepEqual(errors,[],'No fatal browser JavaScript errors on '+width+'px');
   await ctx.close();
   console.log('M28d source provenance Chromium PASS: '+width+'px, four profiles, original links and zero rating controls');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
