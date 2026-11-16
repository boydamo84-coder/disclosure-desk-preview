'use strict';
// Final-seven read-only publication source reader, real Chromium across devices.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
const profiles=[
 {id:'jeremy-corbell',name:'Jeremy Corbell',count:3,grade:/Original broadcaster transcript read/,needle:/not a calibrated fourteen-track dataset/},
 {id:'george-knapp',name:'George Knapp',count:4,grade:/Original government PDF: selected pages visually examined/,needle:/not a whistleblower or UFO eyewitness/},
 {id:'steven-greer',name:'Steven Greer',count:3,grade:/Contemporaneous original reporting read/,needle:/not 400 independently published sworn depositions/},
 {id:'jacques-vallee',name:'Jacques Vallée',count:3,grade:/original publisher full text blocked \(403\)/i,needle:/ONE empirical study/},
 {id:'garry-nolan',name:'Garry Nolan',count:3,grade:/original publisher full text blocked \(403\)/i,needle:/ONE study/},
 {id:'james-fox',name:'James Fox',count:3,grade:/Original filmmaker-publisher interview pages read/,needle:/1966 entry is best flagged/},
 {id:'nick-pope',name:'Nick Pope',count:3,grade:/Original author page indexed/,needle:/before he joined the British Ministry/}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
   args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
     const u=new URL(route.request().url());
     return u.origin===base?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   for(const p of profiles){
    await page.goto(base+'/who-is-who.html?person='+p.id,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:30000});
    assert.equal((await page.locator('#profileName').innerText()).trim(),p.name);
    const host=page.locator('#profileEvidenceReviews');
    const outer=host.locator('.claim-review > .claim-evidence-details');
    assert.equal(await outer.count(),1,'original evidence reader: '+p.name);
    await outer.locator(':scope > summary').click();
    const details=outer.locator('details[data-m28e-final-source]');
    assert.equal(await details.count(),1,'M28e reader available: '+p.name);
    await details.locator(':scope > summary').click();
    assert.equal(await details.getAttribute('open'),'','Original source drawer expands');
    const content=await details.innerText();
    assert.match(content,/Research comparison, NOT approval/);
    assert.match(content,/Independent human editor: not obtained/);
    assert.match(content,/Claim scores, community voting and new portrait permission: withheld/);
    assert.match(content,p.grade);
    assert.match(content,p.needle);
    assert.equal(await details.locator('.claim-evidence-list li').count(),p.count);
    const links=await details.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
    assert.equal(links.length,1,'Source reader offers its original publication link, legacy dossier has other context URLs');
    assert(links[0].startsWith('https://'));
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
      'No live vote or score for any unsigned dossier');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Original 14 tabs preserved');
    const dims=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,vp:innerWidth}));
    assert(dims.doc<=dims.vp+4,'No horizontal overflow at '+width+' for '+p.name);
   }
   assert.deepEqual(errors,[],'No uncaught browser errors at '+width+'px');
   console.log('M28e 7-person source reader PASS at '+width+'px, links visible, rating gate closed');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
