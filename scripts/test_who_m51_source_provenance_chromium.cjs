'use strict';
// M51 local-only Chromium regression; never navigates to publishers or activates ratings.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const people=JSON.parse(fs.readFileSync(path.join(root,'data/public-people-directory.json'),'utf8')).people;
const claims=people.filter(p=>p.claimEvidence?.length);
const base='http://127.0.0.1:4173';
const representatives=['steven-greer','tim-gallaudet','james-fox','michael-shellenberger'];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   const checked=width===393?claims:claims.filter(p=>representatives.includes(p.id));
   for(const person of checked){
    await page.goto(base+'/who-is-who.html?person='+person.id,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('#profileName').innerText(),person.name,'Opened correct profile');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Premium 14-tab navigation remains');
    const details=page.locator('#profileEvidenceReviews .claim-review .claim-evidence-details');
    assert.equal(await details.count(),1,person.id+' must keep one claim evidence panel');
    await details.locator(':scope > summary').click();
    const summary=details.locator('.claim-evidence-summary');
    await summary.waitFor({state:'visible'});
    const expected=person.claimEvidence[0].evidenceReviewSummary.links;
    const actual=summary.locator('a[target="_blank"]');
    assert.equal(await actual.count(),expected.length,'All listed evidence links must be shown for '+person.id);
    const labels=summary.locator('.claim-source-kind');
    assert.equal(await labels.count(),expected.length,'Every evidence URL shows its hosting type');
    assert.match(await summary.innerText(),/Source labels identify the hosting location/);
    for(let i=0;i<expected.length;i++){
     const link=actual.nth(i),el=labels.nth(i),record=expected[i];
     assert.equal(await link.getAttribute('href'),record.url);
     assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
     assert.equal(await link.getAttribute('target'),'_blank');
     assert((await el.innerText()).trim().length>=9);
    }
    if(person.id==='steven-greer')
      assert((await summary.locator('a[href="https://disclosureprojectarchive.net/items/show/6"]').count())===1,'Canonical Greer archive target');
    if(person.id==='tim-gallaudet'){
      assert((await summary.locator('a[href*="theblackvault.com/documentarchive/wp-content/uploads/2025/02/AARO_GoFast_"]').count())===1,'Alternative Go Fast host in reader');
      assert.match(await summary.innerText(),/Agency original was HTTP 403/);
      assert.match(await summary.innerText(),/byte-for-byte identity/);
    }
    if(person.id==='james-fox')
      assert.match(await summary.innerText(),/Brazilian STM original archive access may be restricted/);
    assert.equal(await details.locator('button[data-rating-save],input[data-evidence-claim-id]').count(),0,'No vote can activate');
    const bounds=await summary.evaluate(el=>({docWidth:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
    assert(bounds.docWidth<=bounds.view+3,'Evidence source links must not cause horizontal overflow: '+width+' '+person.id+' '+JSON.stringify(bounds));
   }
   assert.deepEqual(errors,[],'No JS errors at '+width+': '+errors.join(' | '));
   await ctx.close();
  }
  console.log('M51 Chromium PASS: direct evidence source links, hosting provenance, external-link safety, 23 dossiers on 393 px and 4 representative profiles at 320/820/1280 px, no horizontal overflow or vote controls.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
