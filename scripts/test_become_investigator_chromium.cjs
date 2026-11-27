'use strict';
// Actual browser guest-only QA; all external calls blocked.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173',epoch=Date.UTC(2026,10,27,12);
const dataset=require('../.release-staging/public-site/data/research-spotlight.json');
const {batch}=require('../assets/research-spotlight.js');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(['/usr/bin/google-chrome','/usr/bin/chromium'].find(x=>fs.existsSync(x))),args:['--no-sandbox','--disable-dev-shm-usage']});
 async function context(width,motion='reduce'){
  const ctx=await browser.newContext({viewport:{width,height:850},reducedMotion:motion});
  await ctx.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin===base)return route.continue();
   if(url.hostname==='unpkg.com'&&url.pathname==='/leaflet@1.9.4/dist/leaflet.js'&&fs.existsSync('node_modules/leaflet/dist/leaflet.js'))return route.fulfill({path:'node_modules/leaflet/dist/leaflet.js',contentType:'application/javascript'});
   return route.abort('blockedbyclient');
  });
  return ctx;
 }
 try{
 for(const width of [320,393,820,1280]){
  const ctx=await context(width);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date(epoch));
  await page.goto(base+'/',{waitUntil:'load'});
  const controls=page.locator('#ddSpotlightControls'),card=page.locator('#ddSpotlightCard');
  await controls.waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#ddSpotlightPause').getAttribute('aria-label'),'Play automatic rotation');
  const items=batch(dataset,epoch);
  for(let i=0;i<4;i++){
    assert.equal(await card.getAttribute('data-spotlight-id'),items[i].id);
    assert.equal(await page.locator('#ddSpotlightPosition').textContent(),(i+1)+' / 4');
    assert.equal(await page.locator('#ddSpotlightTag').textContent(),i%2?'PURSUE record':'Historical investigation');
    await page.locator('#ddSpotlightNext').click();
  }
  assert.equal(await card.getAttribute('data-spotlight-id'),items[0].id);
  await page.locator('#ddSpotlightPause').click();
  assert.equal(await page.locator('#ddSpotlightPause').getAttribute('aria-label'),'Pause automatic rotation');
  await page.locator('#ddSpotlightPause').click();
  await page.locator('#ddSpotlightPrev').click();
  assert.equal(await card.getAttribute('data-spotlight-id'),items[3].id);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Home overflow '+width);
  assert.ok(await page.getByRole('link',{name:'Hypothesis Lab Compare explanations · Beta'}).count());
  // Open a newly released PURSUE selection through the existing archive reader.
  await page.locator('#ddSpotlightNext').click();await page.locator('#ddSpotlightNext').click();
  assert.equal(await card.getAttribute('data-spotlight-id'),items[1].id);
  await card.click();
  await page.locator('#archiveCaseDialog[open]').waitFor({state:'attached',timeout:30000});
  assert.equal(await page.locator('#archiveCaseBody').getAttribute('data-archive-case-id'),items[1].id);
  assert.equal(await page.locator('#archiveCaseBody .dd-case-reader-source a').first().getAttribute('href'),items[1].source);
  await page.locator('#archiveCaseDialog').evaluate(d=>d.close());
  await page.locator('#ddSiteHome').click();
  await page.locator('.dd-investigator-cta').click();
  assert.ok(page.url().endsWith('/first-investigation.html'));
  const nav=page.locator('#ddWebSecondaryNav');
  await nav.waitFor({state:'visible'});
  assert.equal(await nav.locator('.tab').count(),15);
  assert.equal(await nav.locator('.tab[disabled]').count(),0);
  assert.equal(await nav.locator('[data-tab=originalResearchPage]').count(),1);
  if(width<=393)assert.ok(await nav.locator('#ddWebNavNext').isVisible());
  assert.ok(await page.locator('#sampleStep1').isVisible());
  assert.ok(!(await page.locator('#sampleStep2').isVisible()));
  await page.locator('#sampleNext1').click();
  assert.ok(await page.locator('#sampleStep2').isVisible());
  await page.locator('#sampleNext2').click();
  assert.ok(await page.locator('#sampleComplete').isDisabled());
  await page.locator('input[value=position]').check();
  assert.ok(await nav.isVisible(),'Navigation stays visible when selecting a research question');
  await page.locator('#sampleComplete').click();
  assert.ok(await page.locator('#sampleResult').isVisible());
  assert.match(await page.locator('#sampleQuestion').textContent(),/observer positions/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Sample overflow '+width);
  await page.locator('#sampleReset').click();
  assert.ok(await page.locator('#sampleStep1').isVisible());
  assert.ok(!(await page.locator('input[value=position]').isChecked()));
  await page.getByRole('link',{name:'Evidence First',exact:true}).click();
  assert.ok(page.url().endsWith('/guide.html#evidence-first'));
  assert.ok(await page.locator('#evidence-first').isVisible());
  await nav.waitFor({state:'visible'});
  assert.equal(await nav.locator('.tab').count(),15);
  await nav.locator('[data-tab="archivePage"]').click();
  await page.locator('#archivePage').waitFor({state:'visible'});
  for(const route of ['/site-updates.html','/rendlesham-forest-1980.html','/roswell-1947.html']){
   await page.goto(base+route,{waitUntil:'load'});
   await nav.waitFor({state:'visible'});
   assert.equal(await nav.locator('.tab').count(),15);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Editorial page overflow '+route+' '+width);
  }
  assert.deepEqual(errors.filter(x=>/SyntaxError|ReferenceError|is not defined|Cannot access/i.test(x)),[]);
  console.log('PASS '+width+'px: carousel, direct original-source PURSUE reader, guided sample, reset, evidence guide, no overflow/fatal JS');
  await ctx.close();
 }
 const ctx=await context(820,'no-preference'),page=await ctx.newPage();
 await page.clock.setFixedTime(new Date(epoch));
 await page.goto(base+'/',{waitUntil:'load'});
 await page.locator('#ddSpotlightControls').waitFor({state:'visible'});
 await page.locator('#ddSpotlight').scrollIntoViewIfNeeded();
 await page.mouse.move(0,0);
 const id=await page.locator('#ddSpotlightCard').getAttribute('data-spotlight-id');
 await page.waitForFunction(previous=>document.getElementById('ddSpotlightCard').dataset.spotlightId!==previous,id,{timeout:15000});
 console.log('PASS automatic rotation in a visible, unfocused carousel');
 await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
