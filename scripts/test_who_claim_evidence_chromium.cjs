'use strict';
// Who's Who provisional claim evidence: local-only real Chromium QA.
// Never visits publisher URLs, talks to Supabase, modifies accounts, or enables voting.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const profiles=[
 {name:'George Knapp',kind:'claim',text:'September 2025',minSources:4},
 {name:'Christopher Mellon',kind:'claim',text:'October 2025',minSources:4},
 {name:'James Fox',kind:'claim',text:'Moment of Contact',minSources:4},
 {name:'Nick Pope',kind:'claim',text:'Rendlesham',minSources:4},
 {name:'Leslie Kean',kind:'claim',text:'June 2023',minSources:4},
 {name:'John Greenewald Jr.',kind:'work',text:'government',minSources:4},
 {name:'Mike Gold',kind:'policy',text:'NASA',minSources:4}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===BASE)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#peopleCards article.card').first().waitFor({timeout:30000});
   assert.equal(await page.locator('#peopleCards article.card').count(),50,'Directory retains 50 original people');
   const dock=page.locator('#ddWebSecondaryNav');
   await dock.waitFor({state:'visible'});
   assert.equal(await dock.locator('.tab').count(),14,'Keep original premium fourteen-tab nav');
   assert.equal(await dock.locator('.tab[aria-current="page"]').getAttribute('data-tab'),'peopleDirectory');
   let list=width===393?profiles:profiles.filter(p=>['George Knapp','James Fox','John Greenewald Jr.','Mike Gold'].includes(p.name));
   for(const test of list){
    await page.locator('#peopleSearch').fill(test.name);
    const cards=page.locator('#peopleCards article.card');
    const matching=cards.filter({has:page.getByRole('heading',{name:test.name,exact:true})});
    assert.equal(await matching.count(),1,'Search results include one exact named profile for '+test.name);
    await matching.locator('button').first().click();
    await page.locator('#personProfile').waitFor({state:'visible'});
    assert.equal(await page.locator('#profileName').innerText(),test.name);
    const host=page.locator('#profileEvidenceReviews');
    if(test.kind==='claim'){
     assert.equal(await host.locator('.claim-review').count(),1,test.name+' gets one specifically attributed claim');
     assert.match(await host.innerText(),/Not assessed/,'No editor-approved real score');
     assert.match(await host.innerText(),/Voting not open/,'No unapproved member vote');
     assert.match(await host.innerText(),new RegExp(test.text,'i'),'Exact claim is present in profile');
     const detail=host.locator('.claim-review .claim-evidence-details');
     await detail.locator('summary').click();
     await detail.locator('.claim-evidence-list li').first().waitFor({state:'visible'});
     assert.equal(await detail.locator('.claim-evidence-list li').count()>=test.minSources,true,
      'Readers can inspect '+test.minSources+' source locations');
     assert.equal(await detail.locator('a[href^="https://"]').count()>=test.minSources,true,
      'All source items expose original HTTPS links');
     assert.equal(await host.locator('[data-evidence-claim-id]').count(),0,
      'No community voting backend control for draft claim');
    }else if(test.kind==='policy'){
     assert.match(await host.innerText(),/Not applicable/,'Policy proposals never receive UAP-event scores');
     assert.equal(await host.locator('[data-evidence-claim-id]').count(),0);
    }else{
     assert.equal(await host.locator('.claim-review').count(),0,'FOIA archivist has no forced event claim');
     const work=host.locator('.claim-work-card');
     assert.equal(await work.count(),1);
     await work.locator('summary').click();
     await work.locator('.claim-evidence-list li').first().waitFor({state:'visible'});
     assert.equal(await work.locator('.claim-evidence-list li').count(),4,'Four inspectable FOIA/publisher records');
     const hrefs=await work.locator('.claim-evidence-list a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
     assert(hrefs.some(x=>x.includes('DODOIG-2023-000010.pdf')));
     assert(hrefs.some(x=>x.includes('DF-2022-00013-MDR_Log')));
     assert.equal(await host.locator('[data-evidence-claim-id]').count(),0);
    }
    let extent=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
    assert(extent.scroll<=extent.inner+4,'No horizontal mobile overflow at '+width+'px on '+test.name);
    await page.locator('#directoryBack').click();
    await page.locator('#directoryPage').waitFor({state:'visible'});
    assert.equal(await dock.locator('.tab[aria-current="page"]').getAttribute('data-tab'),'peopleDirectory');
   }
   assert.deepEqual(errors,[],'No fatal page script errors on '+width+'px');
   await ctx.close();
   console.log('Who evidence browser acceptance OK '+width+'px; '+list.length+' profiles');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
