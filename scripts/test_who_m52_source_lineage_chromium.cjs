'use strict';
// M52 local-only real Chromium. No outside-site visits, account writes or publication.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const all=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/public-people-directory.json'),'utf8')).people;
const claims=all.filter(p=>p.claimEvidence?.length);
const base='http://127.0.0.1:4173';
const samples=new Set(['ross-coulthart','jake-barber','tim-gallaudet','jacques-vallee','larry-warren']);
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:820},locale:'en-GB'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(String(err.message||err)));
   const batch=width===393?claims:claims.filter(p=>samples.has(p.id));
   for(const person of batch){
    await page.goto(base+'/who-is-who.html?person='+person.id,{waitUntil:'domcontentloaded',timeout:30000});
    const profile=page.locator('#personProfile');
    await profile.waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('#profileName').innerText(),person.name);
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Premium navigation retains 14 tabs');
    const evidence=page.locator('#profileEvidenceReviews .claim-review .claim-evidence-details');
    assert.equal(await evidence.count(),1);
    await evidence.locator(':scope > summary').click();
    const review=evidence.locator('.claim-evidence-summary');
    await review.waitFor({state:'visible'});
    assert.equal(await review.locator('.claim-lineage-note').count(),1,'Reader exposes one source lineage explanation');
    assert.match(await review.locator('.claim-lineage-note').innerText(),/How these sources relate:/);
    assert((await review.locator('.claim-lineage-note').innerText()).length>=100,'Real source reasoning in reader');
    const expected=person.claimEvidence[0].evidenceReviewSummary;
    const links=review.locator('a[target="_blank"]');
    const grouped=review.locator('.claim-source-lineage');
    assert.equal(await links.count(),expected.links.length,'All 84 links kept across directory');
    assert.equal(await grouped.count(),expected.links.filter(l=>l.sharedRecord).length,
     'Show only actual curated reused-source labels');
    for(let i=0;i<expected.links.length;i++){
     assert.equal(await links.nth(i).getAttribute('href'),expected.links[i].url);
     assert.equal(await links.nth(i).getAttribute('rel'),'noopener noreferrer');
    }
    if(person.id==='ross-coulthart')assert.match(await review.innerText(),/Different point in the same recording/);
    if(person.id==='tim-gallaudet')assert.match(await review.innerText(),/Same named report; copy not hash-matched/);
    if(person.id==='jacques-vallee')assert.match(await review.innerText(),/Same published paper/);
    assert.equal(await evidence.locator('[data-rating-save],[data-evidence-claim-id]').count(),0,'Ratings disabled');
    const overflow=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    assert(overflow.actual<=overflow.view+3,'No horizontal overflow at '+width+' '+person.id+': '+JSON.stringify(overflow));
    // In-app on-screen Back must exit the profile without closing the tab or erasing the Who directory.
    await page.locator('#directoryBack').click();
    await page.locator('#directoryPage').waitFor({state:'visible',timeout:7000});
    assert.equal(await page.locator('#personProfile').isVisible(),false,'Back closes profile');
    assert(!new URL(page.url()).searchParams.has('person'),'Back clears profile URL');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Back retains original nav');
   }
   assert.deepEqual(errors,[],'No page script errors at '+width);
   await context.close();
  }
  console.log('M52 Chromium PASS: 23 source-lineage summaries at 393 px, 5 selected at 320/820/1280, same-record attribution, 14 tabs, readable links, on-screen Back and withheld voting.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
