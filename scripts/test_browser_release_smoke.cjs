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
  const offlineRoute=route=>{
   const u=new URL(route.request().url());
   if(u.origin===BASE)return route.continue();
   // Offline vendor map JS is the exact pinned Leaflet 1.9.4 npm release.
   if(u.hostname==='unpkg.com'&&u.pathname==='/leaflet@1.9.4/dist/leaflet.js'){
    return route.fulfill({path:path.resolve('node_modules/leaflet/dist/leaflet.js'),
     contentType:'application/javascript',status:200});
   }
   return route.abort('blockedbyclient');
  };
  await context.route('**/*',offlineRoute);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  // Init scripts run in sandboxed/opaque-origin frames as well as the top frame.
  // Only the website's top-level origin has permission to access localStorage.
  await page.addInitScript(()=>{
   if(window.top===window){try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch{}}
  });
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
  // Landscape is NOT covered by the original portrait fake-DOM tests.
  await page.setViewportSize({width:852,height:393});
  await page.goto(BASE+'/?dd_tab=profilePage',{waitUntil:'domcontentloaded',timeout:35000});
  await page.locator('.nav .tab[data-tab="witness"]').click({timeout:10000});
  assert.equal(await selected(page,'witness'),'page');
  assert.equal(await hasVisibleSection(page,'witness'),true);
  pass('landscape 852x393 touch navigation preserves selected tab');
  await page.screenshot({path:path.join(OUTPUT,'landscape-witness-852x393.png'),fullPage:false});
  await page.locator('.nav .tab[data-tab="hub"]').click();
  await page.locator('#startAppTour').click({timeout:10000});
  const tourBox=await page.locator('#appTourDialog').boundingBox();
  assert.ok(tourBox&&tourBox.height<=393,
   'Landscape tour must fit a 393px-height screen: '+JSON.stringify(tourBox));
  await page.keyboard.press('Escape');
  assert.equal(await selected(page,'hub'),'page');
  pass('landscape modal is bounded to viewport and Escape returns to Explore');

  // Fresh context explicitly exercises the first-visit dialog, not the stored
  // dismissal used for ordinary navigation smoke checks.
  const fresh=await browser.newContext({viewport:{width:393,height:852},
   deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'en-GB'});
  await fresh.route('**/*',offlineRoute);
  const first=await fresh.newPage();
  await first.goto(BASE+'/',{waitUntil:'load',timeout:35000});
  await first.locator('#ddWelcomeDialog[open]').waitFor({state:'attached',timeout:7500});
  assert.equal(await first.locator('#ddWelcomeDialog').evaluate(el=>el.open),true);
  pass('first-visit welcome uses a real native modal dialog');
  await first.keyboard.press('Escape');
  assert.equal(await first.locator('#ddWelcomeDialog[open]').count(),0,
   'Escape must dismiss first-visit modal');
  assert.equal(await selected(first,'discover'),'page');
  pass('first-visit Escape dismisses welcome without leaving News');
  await fresh.close();

  // Real Chromium execution of the REAL W.NE document page and its navigation
  // module, but synthetic save responses only. No project or cloud writes.
  const writer=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,
   isMobile:true,hasTouch:true,locale:'en-GB'});
  await writer.route('**/*',offlineRoute);
  await writer.addInitScript(()=>{
   // Fake authenticated identity is LOCAL TEST ONLY; no signed credentials
   // or real Supabase API calls. Auth guard uses this synthetic response.
   const db={
    auth:{
     getUser:async()=>({data:{user:{id:'synthetic-editor-only'}},error:null}),
     onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
    },
    rpc:async()=>({data:null,error:{message:'No test-cloud save endpoint'}}),
    from:()=>({select:()=>({eq:()=>({single:async()=>({data:null,error:{message:'No test data'}})})})})
   };
   window.supabase={createClient:()=>db};
  });
  const editorPage=await writer.newPage();
  await editorPage.goto(BASE+'/research/wne.html',{waitUntil:'domcontentloaded',timeout:35000});
  await editorPage.waitForFunction(()=>typeof window.ddResearchNavigateTo==='function',
   {timeout:7500});
  assert.equal(new URL(editorPage.url()).pathname,'/research/wne.html',
   'Actual editor page remains open after fake test login');
  await editorPage.evaluate(()=>{window.wneSaveBeforeNavigation=async()=>false});
  const refused=await editorPage.evaluate(()=>window.ddResearchNavigateTo('hub'));
  assert.equal(refused,false,'Unconfirmed W.NE save must block navigation');
  assert.equal(new URL(editorPage.url()).pathname,'/research/wne.html');
  pass('actual W.NE editor DOM refuses site exit after unconfirmed save');
  await editorPage.evaluate(()=>{window.wneSaveBeforeNavigation=async()=>true});
  const allowed=await editorPage.evaluate(()=>window.ddResearchNavigateTo('hub'));
  assert.equal(allowed,true,'Explicit save hook confirmation allows site exit');
  await editorPage.waitForURL('**/?dd_tab=hub',{timeout:10000});
  assert.equal(await selected(editorPage,'hub'),'page');
  pass('actual editor with synthetic confirmed save returns to correct site tab');
  await writer.close();
  fs.writeFileSync(path.join(OUTPUT,'result.json'),JSON.stringify({
   status:'PASS',checks:count,viewports:['Chromium mobile 393x852','Chromium landscape 852x393'],
   realPhone:false,supabaseNetworkAllowed:false,writerSaveResponses:'synthetic only',
   pageErrors:errors.slice(0,15)
  },null,2)+'\n');
  if(errors.length)console.log('INFO local browser page exceptions (external services blocked): '+JSON.stringify(errors.slice(0,6)));
  console.log('PASS BROWSER TOTAL '+count+' real Chromium checks; no live network/deploy');
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL BROWSER:',error.stack||error);
 fs.writeFileSync(path.join(OUTPUT,'failure.txt'),String(error.stack||error)+'\n');
 process.exitCode=1;
});
