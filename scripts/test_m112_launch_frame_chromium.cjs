'use strict';
// Actual embedded app layout; remote SDK held deliberately until our
// first-frame logic finishes. No account, credentials or live API calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const root=path.resolve('android-test/app/src/main/assets/dd-site'),origin='https://uapdisclosuredesk.com';
const native=fs.readFileSync('android-test/app/src/main/assets/compact-header.js','utf8');
const java=fs.readFileSync('android-test/app/src/main/java/com/disclosuredesk/preview/MainActivity.java','utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.indexOf('page-help.js')<html.indexOf('@supabase/supabase-js'),'Local help must not wait for the remote SDK');
assert.match(java,/onPageCommitVisible[\s\S]*?prepareHomeLayout\(\);/);
assert.match(java,/homeLayoutPrepared=true;[\s\S]*?layoutDesk\(\);[\s\S]*?addOnPreDrawListener[\s\S]*?postVisualStateCallback[\s\S]*?revealHome\(generation\)/,'Native cover waits for final layout and WebView visual state');
assert.match(java,/root\.postDelayed\(homeLayoutWatchdog,10000\)/,'Bounded fallback avoids a stuck launch');
assert.match(java,/generation!=documentGeneration/,'Stale callbacks must not uncover another document');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const [width,tab] of [[393,'discover'],[320,'originalResearchPage']]){
   const ctx=await browser.newContext({viewport:{width,height:780},userAgent:'Mozilla/5.0 Android DisclosureDeskAndroid',serviceWorkers:'block'});
   let unblock,requested=false,finished=false;
   const pending=new Promise(resolve=>{unblock=resolve});
   await ctx.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.includes('/@supabase/')){
      requested=true;await pending;finished=true;return route.abort('blockedbyclient');
    }
    if(url.origin!==origin)return route.abort('blockedbyclient');
    let file=path.join(root,url.pathname==='/'?'index.html':url.pathname.endsWith('/')?url.pathname.slice(1)+'index.html':url.pathname.slice(1));
    if(!fs.existsSync(file)&&!path.extname(file))file+='.html';
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
    return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
   });
   await ctx.addInitScript(script=>{
     window.__nativeMessages=[];
     window.DDAndroid={postMessage:value=>window.__nativeMessages.push(JSON.parse(value))};
     window.__earlyResult=(0,eval)(script);
   },native);
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
     await page.goto(origin+'/?dd_tab='+tab,{waitUntil:'commit'});
     assert.equal(await page.evaluate(()=>window.__earlyResult),false,'Do not touch incomplete shell on first paint');
     // Native retry loop can succeed before onPageFinished / DOMContentLoaded.
     await page.waitForFunction(code=>(0,eval)(code)===true,native,{timeout:15000,polling:75});
     assert(requested&&!finished,'First complete layout does not wait for the remote Supabase SDK');
     assert.equal(await page.locator('header.top').isVisible(),false,'No large header in the revealed frame');
     assert.equal(await page.locator('#discover > .dd-help-bar').isVisible(),false,'No temporary homepage help row');
     assert.equal(await page.locator('#ddHomeDock .nav-inner>button').evaluateAll(nodes=>nodes.map(n=>n.dataset.tab||'more')).then(a=>a.join(',')),'discover,clips,archivePage,originalResearchPage,researchStudio,more');
     assert.equal(await page.locator('#ddAndroidResearchInbox').count(),1);
     assert.equal(await page.locator('#ddAndroidResearchInboxExplore').count(),1);
     assert.equal(await page.locator('#ddAndroidAlertsSettings').count(),1);
     assert.equal(await page.locator('#dd-android-breaking-2line').count(),1);
     assert.equal(await page.locator('#'+tab).isVisible(),true,'The correct direct section is visible');
     assert.equal(await page.evaluate(native),true,'Repeat evaluation is safe');
     assert.equal(await page.locator('#ddAndroidResearchInbox').count(),1,'No duplicate Inbox');
     // Release the deferred SDK. The final layout controls must not change.
     unblock();
     await page.waitForLoadState('load');
     assert.equal(await page.locator('header.top').isVisible(),false);
     assert.equal(await page.locator('#ddAndroidResearchInbox').count(),1);
     assert.equal(await page.locator('#discover > .dd-help-bar').isVisible(),false);
     await page.evaluate(()=>navigateTo('discover'));
     await page.locator('#ddAndroidResearchInbox button').first().click();
     assert.equal(await page.evaluate(()=>window.__nativeMessages.some(m=>m.type==='open_research_inbox')),true);
     assert.equal(await page.evaluate(()=>DDNativePageHelp()),'opened');
     await page.locator('#ddPageHelpDialog[open]').waitFor();
     await page.locator('.dd-help-close').click();
     assert.deepEqual(errors,[]);
     console.log('PASS M112 '+width+'px '+tab+': first native-ready frame, remote SDK held, final tabs, no duplicate controls, direct destination and help/Inbox bridges');
   }finally{unblock();await ctx.close()}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M112 startup',e.stack||e);process.exitCode=1});
