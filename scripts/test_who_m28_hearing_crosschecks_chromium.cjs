'use strict';
// M28 local Chromium source-reader checks; no external links, accounts or data writes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const people=[
 {id:'tim-gallaudet',name:'Tim Gallaudet',passages:2,contrasts:2,pattern:/13,000 feet/},
 {id:'luis-elizondo',name:'Luis Elizondo',passages:2,contrasts:0,pattern:/possessed UAP technologies/},
 {id:'michael-shellenberger',name:'Michael Shellenberger',passages:3,contrasts:0,pattern:/not the author/},
 {id:'mike-gold',name:'Mike Gold',passages:2,contrasts:0,pattern:/not for NASA/}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   for(const p of people){
    await page.goto(base+'/who-is-who.html?person='+p.id,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:25000});
    assert.equal((await page.locator('#profileName').innerText()).trim(),p.name);
    const host=page.locator('#profileEvidenceReviews'),outer=host.locator('.claim-review > .claim-evidence-details');
    assert.equal(await outer.count(),1,'One outer evidence detail, no selector collisions: '+p.name);
    await outer.locator('summary').first().click();
    const m28=outer.locator('details[data-m28-crosscheck]');
    assert.equal(await m28.count(),1,'M28 source review visible in '+p.name+' record');
    await m28.locator('summary').click();
    assert.equal(await m28.getAttribute('open'),'','M28 details expanded');
    const text=await m28.innerText();
    assert.match(text,/Source-passage check only/);
    assert.match(text,/independently verified/);
    assert.match(text,p.pattern);
    assert.equal(await m28.locator('h5').count(),p.contrasts?2:1);
    const sourceLinks=await m28.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
    assert.equal(sourceLinks.length,1+p.contrasts,'Original GPO link plus exact contrasting source links');
    assert(sourceLinks[0].includes('govinfo.gov/content/pkg/CHRG-118hhrg57440/html/'));
    assert(sourceLinks.slice(1).every(url=>url.includes('aaro.mil/Portals/136/')));
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
     'Unsigned claim cannot display percentage or real community voting control');
    if(p.id==='mike-gold')assert.match(await host.innerText(),/Not applicable/);
    const size=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,inner:innerWidth}));
    assert(size.doc<=size.inner+4,'No reader horizontal overflow on '+width+'px, '+p.name);
   }
   assert.deepEqual(errors,[],'No uncaught JS exceptions on '+width+'px');
   await context.close();
   console.log('M28 evidence reader PASS: '+width+'px, four attributed hearings, source links and disabled voting');
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
