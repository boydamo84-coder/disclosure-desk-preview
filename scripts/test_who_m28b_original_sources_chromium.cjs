'use strict';
// No external requests and no voting: source reader acceptance in real headless Chrome.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const profiles=[
 {id:'mick-west',name:'Mick West',passages:3,contrasts:0,pattern:/infrared glare/},
 {id:'kevin-knuth',name:'Kevin Knuth',passages:3,contrasts:0,pattern:/5,370 g/},
 {id:'leslie-kean',name:'Leslie Kean',passages:3,contrasts:0,pattern:/not departmental authentication/},
 {id:'avi-loeb',name:'Avi Loeb',passages:3,contrasts:2,pattern:/cannot prove.*directly attributable to IM1/i}
];
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());return u.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   for(const p of profiles){
    await page.goto(BASE+'/who-is-who.html?person='+p.id,{waitUntil:'domcontentloaded'});
    await page.locator('#personProfile').waitFor({state:'visible',timeout:30000});
    assert.equal((await page.locator('#profileName').innerText()).trim(),p.name);
    const host=page.locator('#profileEvidenceReviews');
    const outer=host.locator('.claim-review > .claim-evidence-details');
    assert.equal(await outer.count(),1,'One original evidence panel for '+p.name);
    await outer.locator(':scope > summary').click();
    const details=outer.locator('details[data-m28b-sourcecheck]');
    assert.equal(await details.count(),1,'M28b source-limited review visible for '+p.name);
    await details.locator(':scope > summary').click();
    assert.equal(await details.getAttribute('open'),'','Original publication drawer expanded');
    const summary=await details.innerText();
    assert.match(summary,/Research comparison — not an approved finding or rating/);
    assert.match(summary,/Second human editorial approval: not obtained/);
    assert.match(summary,p.pattern);
    assert.equal(await details.locator('h5').count(),p.contrasts>0?2:1,'Source section count');
    assert.equal(await details.locator('.claim-evidence-list li').count(),p.passages+p.contrasts);
    const links=await details.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.href));
    assert.equal(links.length,1+p.contrasts,'Original publisher plus explicitly tagged contrasting papers');
    assert(links.every(x=>x.startsWith('https://')));
    if(p.id==='avi-loeb'){
     assert.match(summary,/Publisher abstract\/highlights indexed; full text not directly accessible/);
     assert(links.some(x=>x.endsWith('S000925412500018X')));
     assert(links.some(x=>x.endsWith('S0009254125000178')));
    }
    assert.equal(await host.locator('.claim-score,[data-rating-save],[data-evidence-claim-id]').count(),0,
      'Unapproved source notes do not create percentage, vote or backend action');
    assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14,'Original premium 14-tab dock remains intact');
    const bounds=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(bounds.scroll<=bounds.viewport+4,'No horizontal overflow on '+width+'px for '+p.name);
   }
   assert.deepEqual(errors,[],'No uncaught reader errors at width '+width);
   console.log('M28b original-source reader green '+width+'px, '+profiles.length+' profiles');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
