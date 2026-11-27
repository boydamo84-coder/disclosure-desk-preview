'use strict';
// Local, read-only test of the new Home and archive layout. No real accounts or external APIs.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(['/usr/bin/google-chrome','/usr/bin/chromium'].find(x=>fs.existsSync(x))),args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 for(const width of [320,393,820,1280]){
  const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin===base)return route.continue();
   if(url.hostname==='unpkg.com'&&url.pathname==='/leaflet@1.9.4/dist/leaflet.js'&&fs.existsSync('node_modules/leaflet/dist/leaflet.js'))return route.fulfill({path:'node_modules/leaflet/dist/leaflet.js',contentType:'application/javascript'});
   return route.abort('blockedbyclient');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'load'});
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('#ddWelcomeDialog, #appTourDialog[open]').count(),0);
  assert.equal(await page.locator('#discover #ddResearchReleaseNotes').count(),0);
  assert.equal(await page.locator('#ddDiscoveryHeading').isVisible(),true);
  assert.equal(await page.locator('#ddSpotlightCard').count(),1);
  await page.locator('#ddSpotlightControls').waitFor({state:'visible'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Home overflow at '+width);
  if(width===393&&process.env.SCREENSHOT)await page.screenshot({path:process.env.SCREENSHOT});
  // M100: smaller visual control, original touch target and unchanged settings.
  const cog=page.locator('#ddHomeThemeMenu > summary'),settings=page.locator('#ddHomeThemeControls');
  await cog.waitFor({state:'visible'});
  const geometry=await cog.evaluate(el=>{
   const rect=el.getBoundingClientRect(),ui=getComputedStyle(el),visual=getComputedStyle(el,'::before');
   return {width:rect.width,height:rect.height,font:parseFloat(ui.fontSize),inset:parseFloat(visual.top),bg:ui.backgroundColor,overflow:el.closest('#ddHomeThemeHero').getBoundingClientRect().right<rect.right};
  });
  assert.ok(geometry.width>=44&&geometry.height>=44,'Accessible cog target');
  assert.equal(geometry.font,17);
  assert.equal(geometry.inset,6);
  assert.equal(geometry.bg,'rgba(0, 0, 0, 0)');
  assert.equal(geometry.overflow,false);
  assert.equal(await settings.isVisible(),false);
  await cog.click({position:{x:2,y:22}});
  assert.equal(await settings.isVisible(),true,'Tap outside visible square still works');
  assert.deepEqual(await page.locator('#ddHomeThemeChoice option').evaluateAll(options=>options.map(o=>o.value)),['nightfall','classic','eclipse']);
  assert.equal(await page.locator('#ddHomeThemePause').isVisible(),true);
  await cog.focus();
  await cog.press('Enter');
  assert.equal(await settings.isVisible(),false,'Keyboard closes settings');
  await page.locator('#ddJumpToNews').click();
  assert.equal(await page.locator('#ddLatestNews').evaluate(n=>document.activeElement===n),true);
  assert.equal(await page.locator('#newsLatestTab').evaluate(n=>n.classList.contains('active')),true);
  await page.getByText('Personalise my news',{exact:true}).click();
  assert.equal(await page.locator('#interestInput').isVisible(),true);
  await page.getByText('Personalise my news',{exact:true}).click();
  await page.locator('#ddSiteHome').click();
  await page.getByRole('button',{name:'Take the tour',exact:true}).click();
  await page.locator('#appTourDialog[open]').waitFor({state:'attached'});
  await page.locator('#tourClose').click();
  await page.locator('#appTourDialog[open]').waitFor({state:'detached'});
  await page.locator('#ddSiteUpdatesButton').click();
  assert.ok(page.url().endsWith('/site-updates.html'));
  assert.equal(await page.locator('#ddResearchReleaseNotes').isVisible(),true);
  assert.equal(await page.locator('#ddR3ReleaseAnnouncement').isVisible(),false);
  await page.locator('.dd-updates-history > summary').click();
  assert.equal(await page.locator('#ddR3ReleaseAnnouncement').isVisible(),true);
  await page.getByRole('link',{name:'Back to Home'}).click();
  await page.getByRole('button',{name:'Explore archive ›',exact:true}).click();
  await page.locator('#archivePage').waitFor({state:'visible'});
  await page.getByText('About the evidence & source labels',{exact:true}).click();
  assert.equal(await page.locator('#archivePage .dd-evidence-guide').first().evaluate(n=>n.open),true);
  await page.locator('[data-open-archive="featured-rendlesham-1980"]').first().waitFor({state:'visible',timeout:20000});
  await page.locator('[data-open-archive="featured-rendlesham-1980"]').first().click();
  await page.locator('#archiveCaseDialog[open]').waitFor({state:'attached'});
  assert.equal(await page.locator('#archiveCaseBody .dd-case-reader-source a').isVisible(),true);
  assert.ok(await page.locator('#archiveCaseBody .dd-case-reader-status').isVisible());
  await page.locator('#archiveCaseDialog').evaluate(d=>d.close());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Archive overflow at '+width);
  assert.deepEqual(errors.filter(x=>/SyntaxError|ReferenceError|is not defined|Cannot access/i.test(x)),[]);
  console.log('PASS '+width+'px: Home, news jump, opt-in tour, site updates, archive source/reader, no overflow/fatal JS');
  await context.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
