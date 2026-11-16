'use strict';
// M28c real Chromium reader regression: original sources, no private votes, no deploy.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const specs=[
 {id:'david-grusch',name:'David Grusch',kind:/Information attributed to another source/,needle:/not personally witnessed alleged bodies/,references:1},
 {id:'ryan-graves',name:'Ryan Graves',kind:/Explicit firsthand-evidence limitation/,needle:/Graves answered no/,references:1},
 {id:'david-fravor',name:'David Fravor',kind:/First-person visual testimony/,needle:/different crew subsequently filmed/,references:1},
 {id:'christopher-mellon',name:'Christopher Mellon',kind:/Signed personal perspective/,needle:/National Archives UAP Records Collection/,references:2}
];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:860},locale:'en-GB'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   for(const p of specs){
    await page.goto(base+'/who-is-who.html?person='+p.id,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:30000});
    assert.equal((await page.locator('#profileName').innerText()).trim(),p.name);
    const host=page.locator('#profileEvidenceReviews');
    const outer=host.locator('.claim-review > .claim-evidence-details');
    assert.equal(await outer.count(),1,'Exactly one original evidence disclosure: '+p.name);
    await outer.locator(':scope > summary').click();
    const panel=outer.locator('details[data-m28c-sourcecheck]');
    assert.equal(await panel.count(),1,'M28c exact source panel displays: '+p.name);
    await panel.locator(':scope > summary').click();
    assert.equal(await panel.getAttribute('open'),'','Reader panel expands');
    const body=await panel.innerText();
    assert.match(body,/not independently verified UAP events/);
    assert.match(body,/Independent human editor: not obtained/);
    assert.match(body,/Scores, community voting and new portrait approvals remain withheld/);
    assert.match(body,p.kind);
    assert.match(body,p.needle);
    assert.equal(await panel.locator('.claim-evidence-list li').count(),p.name==='Christopher Mellon'?4:3);
    const links=await panel.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
    assert.equal(links.length,p.references,'Original publisher plus administrative NARA where appropriate');
    assert(links.every(url=>url.startsWith('https://')));
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
      'Unapproved claim never renders scores or active voting controls');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Original premium nav not replaced');
    const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
    assert(metrics.scroll<=metrics.inner+4,'No horizontal overflow '+width+'px '+p.name);
   }
   assert.deepEqual(errors,[],'No uncaught JS errors at '+width+'px');
   await context.close();
   console.log('M28c original-source browser acceptance OK at '+width+'px, '+specs.length+' profiles');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
