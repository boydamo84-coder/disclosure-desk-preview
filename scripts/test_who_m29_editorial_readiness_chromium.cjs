'use strict';
// M29 real Chrome: all unsigned, no numeric percentages/votes,
// source-family links and fail-closed altered/missing public handoff ledger.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const cases=[
 {id:'david-fravor',name:'David Fravor',family:/us-house-2023-published-hearing/,
  relations:['Kevin Knuth','Ryan Graves','David Grusch'],rolePolicy:false},
 {id:'garry-nolan',name:'Garry Nolan',family:/council-bluffs-2022-one-coauthored-paper/,
  relations:['Jacques Vallée'],rolePolicy:false},
 {id:'leslie-kean',name:'Leslie Kean',family:/original-leslie-kean/,
  relations:['David Grusch','Ross Coulthart'],rolePolicy:false},
 {id:'nick-pope',name:'Nick Pope',family:/original-nick-pope/,
  relations:['Larry Warren'],rolePolicy:false},
 {id:'christopher-mellon',name:'Christopher Mellon',family:/original-christopher-mellon/,
  relations:[],rolePolicy:true}
];
const wait=async(page,id)=>{
 await page.goto(base+'/who-is-who.html?person='+id,{waitUntil:'domcontentloaded'});
 await page.locator('#personProfile').waitFor({state:'visible',timeout:30000});
};
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
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
   for(const t of cases){
    await wait(page,t.id);
    assert.equal((await page.locator('#profileName').innerText()).trim(),t.name);
    const host=page.locator('#profileEvidenceReviews');
    const details=host.locator('.claim-review > details[data-m29-readiness]');
    assert.equal(await details.count(),1,'M29 rubric available for '+t.name);
    await details.locator(':scope > summary').click();
    assert.equal(await details.getAttribute('open'),'','Rubric expands');
    const body=await details.innerText();
    assert.match(body,/No human editor is assigned, no criterion is signed off/);
    assert.match(body,/Member voting: withheld/);
    assert.match(body,/Independent human editor|Human sign-off/);
    assert.match(body,t.family);
    assert.equal(await details.locator('.claim-m29-criteria > li').count(),7,
     'Seven unweighted human review gates');
    assert.equal(await details.locator('.claim-m29-relations > li').count(),
     t.id==='david-fravor'?2:t.relations.length?1:0);
    for(const other of t.relations){
     assert(body.includes(other),'Source connection to '+other+' for '+t.name);
     assert(await details.getByRole('link',{name:other}).count()>=1,'Related public profile link '+other);
    }
    if(t.rolePolicy)assert.match(body,/Not applicable to this public-policy/);
    const links=await details.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
    assert(links.some(x=>x.startsWith('https://')),'Original publication link exposed');
    assert(links.filter(x=>x.startsWith('/who-is-who.html?person='))
      .every(x=>/^\/who-is-who\.html\?person=[a-z0-9-]+$/.test(x)),
      'Internal cross-profile links are safe');
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
      'No unapproved scores or member voting');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Premium 14-tab dock unchanged');
    const size=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(size.doc<=size.viewport+4,'No horizontal overflow '+width+' '+t.name);
   }
   await wait(page,'david-spergel');
   assert.equal(await page.locator('#profileEvidenceReviews [data-m29-readiness]').count(),0,
    'Documented public role is not assigned an incident-scoring checklist');
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14);
   assert.deepEqual(errors,[],'No uncaught Chromium JavaScript errors '+width);
   await ctx.close();
   console.log('M29 rubric Chrome PASS '+width+'px, five claim families + policy N/A and role-only no-score');
  }
  // Simulate a forged public ledger attempting to 'approve' rating gates.
  // The parser MUST reject it, leaving original claims unscored and the directory usable.
  const ledger=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/public-who-editorial-readiness-m29.json'),'utf8'));
  for(const mode of ['forged_score','missing_ledger']){
   const ctx=await browser.newContext({viewport:{width:393,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin!==base)return route.abort('blockedbyclient');
    if(u.pathname==='/data/public-who-editorial-readiness-m29.json'){
      if(mode==='missing_ledger')return route.fulfill({status:404,body:'Missing'});
      const tampered=structuredClone(ledger);
      tampered.claims[0].editorialScoreEnabled=true;
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(tampered)});
    }
    return route.continue();
   });
   const page=await ctx.newPage();
   await wait(page,'david-grusch');
   assert.equal(await page.locator('#profileName').innerText(),'David Grusch','Original profile usable after M29 failure');
   assert.equal(await page.locator('#profileEvidenceReviews [data-m29-readiness]').count(),0,
     'Untrusted M29 data must never display reviewer-readiness as vetted');
   assert.equal(await page.locator('#profileEvidenceReviews .claim-score,#profileEvidenceReviews [data-rating-save]').count(),0,
     'Forged or unavailable ledger does NOT enable ratings');
   await ctx.close();
   console.log('M29 fail-closed Chrome PASS for '+mode);
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
