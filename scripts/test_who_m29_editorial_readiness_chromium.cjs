'use strict';
// M29 real Chrome: 23-record editor handoff remains read-only at phone/tablet/desktop widths.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const cases=[
 {id:'garry-nolan',name:'Garry Nolan',peer:'Jacques Vallée',relation:'ONE shared scientific study',rubric:true},
 {id:'jacques-vallee',name:'Jacques Vallée',peer:'Garry Nolan',relation:'ONE shared scientific study',rubric:true},
 {id:'david-grusch',name:'David Grusch',peer:'Leslie Kean',relation:'Overlapping original reporting',rubric:true},
 {id:'david-fravor',name:'David Fravor',peer:'Kevin Knuth',relation:'Same case, distinct evidence streams',rubric:true},
 {id:'kevin-knuth',name:'Kevin Knuth',peer:'David Fravor',relation:'Same case, distinct evidence streams',rubric:true},
 {id:'ross-coulthart',name:'Ross Coulthart',peer:'Leslie Kean',relation:'Overlapping original reporting',rubric:true},
 {id:'bob-lazar',name:'Bob Lazar',peer:'George Knapp',relation:'Same broadcaster/interview chain',rubric:true},
 {id:'larry-warren',name:'Larry Warren',peer:'Nick Pope',relation:'Same historical case, different source perspectives',rubric:true},
 {id:'christopher-mellon',name:'Christopher Mellon',peer:null,relation:null,rubric:false},
 {id:'mike-gold',name:'Mike Gold',peer:null,relation:null,rubric:false}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort('blockedbyclient'));
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   for(const p of cases){
    await page.goto(base+'/who-is-who.html?person='+p.id,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:30000});
    assert.equal((await page.locator('#profileName').innerText()).trim(),p.name);
    const host=page.locator('#profileEvidenceReviews');
    const outer=host.locator('.claim-review > .claim-evidence-details');
    assert.equal(await outer.count(),1);
    await outer.locator(':scope > summary').click();
    const panel=outer.locator('details[data-m29-editorial-queue]');
    assert.equal(await panel.count(),1,'Unscored M29 review queue exists for '+p.name);
    await panel.locator(':scope > summary').click();
    assert.equal(await panel.getAttribute('open'),'');
    const body=await panel.innerText();
    assert.match(body,/Human review required — NOT scored, not signed and not eligible for community voting/);
    assert.match(body,/Confirmed independent-corroboration count: Not determined/);
    assert.match(body,/First human editor: no signed approval/);
    assert.match(body,/Independent second editor: not assigned/);
    assert.match(body,/no public evidence percentage, no member ballot, no portrait approval/i);
    if(p.rubric){
     assert.match(body,/Five criterion checks awaiting human assessment/);
     const headings=panel.locator('h5').filter({hasText:'Five criterion checks awaiting human assessment'});
     assert.equal(await headings.count(),1);
     assert.equal(await headings.evaluate(el=>el.nextElementSibling.querySelectorAll('li').length),5);
     assert.doesNotMatch(body,/Physical-incident evidence percentage: Not applicable/);
    }else{
     assert.match(body,/Physical-incident evidence percentage: Not applicable/);
     assert.doesNotMatch(body,/Five criterion checks awaiting human assessment/);
    }
    if(p.peer){
     assert.match(body,new RegExp(p.relation));
     assert.match(body,new RegExp(p.peer));
    }
    const links=await panel.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
    assert(links.some(u=>u.startsWith('https://')),'Original source is openable');
    assert(links.every(u=>u.startsWith('https://')||u.startsWith('/who-is-who.html?person=')),
      'Only safe originals and same-site related dossiers');
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
      'No unreviewed numeric or community voting controls');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,
      'Preserve original premium nav');
    const widthData=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(widthData.scroll<=widthData.viewport+4,'No reader overflow at '+width+'px, '+p.name);
    if(width===393&&p.id==='garry-nolan'){
     const other=panel.locator('a[href="/who-is-who.html?person=jacques-vallee"]');
     assert((await other.count())>=1,'Shared study peer deep link is available');
     await other.first().click();
     await page.locator('#profileName').waitFor({state:'visible',timeout:30000});
     assert.equal((await page.locator('#profileName').innerText()).trim(),'Jacques Vallée',
      'Source lineage cross-profile navigation');
    }
   }
   assert.deepEqual(errors,[],'No uncaught JS errors at '+width+'px');
   await ctx.close();
   console.log('M29 editorial queue real Chrome PASS '+width+'px: 10 profiles, source overlap, no scores/votes');
  }
  // Malformed approval attempts must not be shown as a human-signed public queue or rating.
  const ctx=await browser.newContext({viewport:{width:393,height:850}});
  const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/public-people-directory.json'),'utf8'));
  const one=fixture.people.find(p=>p.id==='garry-nolan').claimEvidence[0];
  one.m29EditorialPreparation.editorialSignoff.firstHumanEditor='approved_without_real_signature';
  one.m29EditorialPreparation.permissionToPublishNumericEvidenceRating=true;
  await ctx.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin!==base)return route.abort('blockedbyclient');
   if(u.pathname==='/data/public-people-directory.json')return route.fulfill({
     status:200,contentType:'application/json',body:JSON.stringify(fixture)
   });
   return route.continue();
  });
  const p=await ctx.newPage();
  await p.goto(base+'/who-is-who.html?person=garry-nolan',{waitUntil:'domcontentloaded'});
  await p.locator('#personProfile').waitFor({state:'visible',timeout:30000});
  const outer=p.locator('#profileEvidenceReviews .claim-review > .claim-evidence-details');
  await outer.locator(':scope > summary').click();
  assert.equal(await outer.locator('[data-m29-editorial-queue]').count(),0,
   'Invalid self-approved source packet must fail closed');
  assert.equal(await p.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
   'Malformed packet must not leak a score or member ballot');
  await ctx.close();
  console.log('M29 rejected synthetic/self-signoff packet PASS; no unapproved claim rating or vote');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
