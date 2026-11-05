'use strict';
// Real Chromium mobile viewport (not Samsung physical/device sign-off).
// TEST SAFETY: host is strictly loopback; every external request is blocked
// except a local package-pinned Leaflet response. No Supabase/Netlify calls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const OUTPUT='browser-qa-artifacts';
fs.mkdirSync(OUTPUT,{recursive:true});
let count=0;
function pass(label){count++;console.log('PASS BROWSER '+label);}
async function hasVisibleSection(page,id){
 return await page.locator('#'+id).evaluate(el=>!el.classList.contains('hidden')&&
  getComputedStyle(el).display!=='none');
}
async function selected(page,id){
 return await page.locator('.nav .tab[data-tab="'+id+'"]').getAttribute('aria-current');
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,
   isMobile:true,hasTouch:true,locale:'en-GB'});
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin===BASE)return route.continue();
   // Offline vendor map JS is the exact pinned Leaflet 1.9.4 npm release.
   if(u.hostname==='unpkg.com'&&u.pathname==='/leaflet@1.9.4/dist/leaflet.js'){
    return route.fulfill({path:path.resolve('node_modules/leaflet/dist/leaflet.js'),
     contentType:'application/javascript',status:200});
   }
   return route.abort('blockedbyclient');
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.addInitScript(()=>{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')});
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.nav .tab[data-tab="profilePage"]');
  const tabs=await page.locator('nav.nav .tab').count();
  assert.equal(tabs,11,'Public/staged flag OFF retains exactly eleven tabs');
  assert.equal(await selected(page,'discover'),'page');
  assert.equal(await hasVisibleSection(page,'discover'),true);
  pass('existing 11 bottom tabs and visible News');
  for(const target of ['witness','hub','profilePage','clips']){
   await page.locator('.nav .tab[data-tab="'+target+'"]').click({timeout:10000});
   assert.equal(await selected(page,target),'page','aria-current reflects '+target);
   assert.equal(await hasVisibleSection(page,target),true,'Section is visible: '+target);
   pass('navigate to '+target+' with touch/mobile viewport');
  }
  await page.locator('.nav .tab[data-tab="hub"]').click();
  await page.locator('#startAppTour').click({timeout:10000});
  assert.equal(await page.locator('#appTourDialog').evaluate(el=>el.open),true,'Tour is native modal');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#appTourDialog').evaluate(el=>el.open),false);
  assert.equal(await selected(page,'hub'),'page','Escape returns to Explore');
  pass('tour opens native modal; Escape restores Explore');
  await page.screenshot({path:path.join(OUTPUT,'mobile-explore-393px.png'),fullPage:false});
  await page.goto(BASE+'/?dd_tab=discussionsPage',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.nav .tab[data-tab="discover"]');
  assert.equal(await page.locator('nav.nav .tab').count(),11);
  assert.equal(await hasVisibleSection(page,'discussionsPage'),false);
  assert.equal(await selected(page,'discover'),'page');
  pass('disabled Discussions deep link cannot reveal 12th tab');
  await page.goto(BASE+'/?dd_tab=profilePage',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.nav .tab[data-tab="profilePage"]');
  assert.equal(await selected(page,'profilePage'),'page');
  pass('valid W.NE return deep link restores Profile');
  await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.dd-site-dock-tab');
  assert.equal(await page.locator('.dd-site-dock-tab').count(),11);
  assert.equal(await page.locator('.dd-site-dock-tab[data-dd-tab="discussionsPage"]').count(),0);
  pass('Research guest preview contains same 11-tab dock, Discussions OFF');
  const back=page.locator('.dd-site-dock-tab[data-dd-tab="hub"]');
  await back.click({timeout:10000});
  await page.waitForURL('**/?dd_tab=hub',{timeout:10000});
  assert.equal(await selected(page,'hub'),'page');
  pass('Research dock returns through main site to Explore');
  await page.goto(BASE+'/research/index.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.dd-site-dock-tab[data-dd-tab="profilePage"]');
  assert.equal(await page.locator('.dd-site-dock-tab').count(),11);
  pass('Research entry preserves eleven shared nav destinations');
  await page.screenshot({path:path.join(OUTPUT,'mobile-research-entry-393px.png'),fullPage:false});
  // The responsive check catches horizontal content that breaks phone navigation.
  const widths=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,
    page:document.documentElement.scrollWidth}));
  assert.ok(widths.page<=widths.viewport+12,
   'Research entry has unexpected horizontal overflow '+JSON.stringify(widths));
  pass('Research entry has no excessive 393px horizontal overflow');
  fs.writeFileSync(path.join(OUTPUT,'result.json'),JSON.stringify({
   status:'PASS',checks:count,viewport:'Chromium mobile emulation 393x852',
   realPhone:false,supabaseNetworkAllowed:false,pageErrors:errors.slice(0,15)
  },null,2)+'\n');
  if(errors.length)console.log('INFO local browser page exceptions (external services blocked): '+JSON.stringify(errors.slice(0,6)));
  console.log('PASS BROWSER TOTAL '+count+' real Chromium checks; no live network/deploy');
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL BROWSER:',error.stack||error);
 fs.writeFileSync(path.join(OUTPUT,'failure.txt'),String(error.stack||error)+'\n');
 process.exitCode=1;
});
