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
  assert.equal(tabs,12,'Current public release keeps all twelve approved navigation tabs');
  assert.equal(await selected(page,'discover'),'page');
  assert.equal(await hasVisibleSection(page,'discover'),true);
  pass('all twelve approved bottom tabs and visible News');
  const navRail=page.locator('.nav-inner');
  await page.locator('#ddNavNext').waitFor({state:'visible'});
  const initialDockScroll=await navRail.evaluate(el=>el.scrollLeft);
  await page.locator('#ddNavNext').click();
  await page.waitForFunction(previous=>document.querySelector('.nav-inner').scrollLeft>previous+15,initialDockScroll);
  const movedDockScroll=await navRail.evaluate(el=>el.scrollLeft);
  assert(movedDockScroll>initialDockScroll+15,'Right arrow advances mobile navigation');
  await page.locator('#ddNavPrev').click();
  await page.waitForFunction(previous=>document.querySelector('.nav-inner').scrollLeft<previous-15,movedDockScroll);
  assert.equal(await selected(page,'discover'),'page','Arrow movement must not change selected page');
  pass('clickable dock arrows move the navigation without changing the active section');
  // Synthetic-only broadcast feed. No requests to the real backend or publisher.
  await page.waitForSelector('#ddNewsTickerHub:not([hidden])',{timeout:10000});
  await page.evaluate(()=>{
    window.ddNewsTickerRows=[
      {id:'browser-major-1',headline:'Synthetic major UAP bulletin',source:'Fixture Publisher',
        url:'https://example.org/uap-story',date:new Date(Date.now()-60000).toISOString(),priority:'major'},
      {id:'browser-recent-1',headline:'Synthetic recent UAP update',source:'Fixture Publisher',
        url:'https://example.org/uap-recent',date:new Date(Date.now()-10*3600000).toISOString(),priority:'standard'}
    ];
    window.dispatchEvent(new Event('dd-news-updated'));
  });
  assert.match(await page.locator('#ddNewsTickerBreakingTrack').innerText(),/Synthetic major UAP bulletin/);
  assert.match(await page.locator('#ddNewsTickerRecentTrack').innerText(),/Synthetic recent UAP update/);
  const tickerGeometry=await page.evaluate(()=>{
    const ticker=document.getElementById('ddNewsTickerHub').getBoundingClientRect();
    const nav=document.querySelector('nav.nav').getBoundingClientRect();
    return {tickerBottom:ticker.bottom,tickerHeight:ticker.height,navTop:nav.top,viewport:innerHeight};
  });
  assert(tickerGeometry.tickerBottom<=tickerGeometry.navTop-2,'TV ticker must remain ABOVE bottom navigation');
  assert(tickerGeometry.tickerHeight<140,'Ticker must be slim on 393px mobile');
  pass('real Chromium 393px: two-colour crawl fixed above navigation with measured clearance');
  await page.screenshot({path:path.join(OUTPUT,'mobile-news-ticker-393px.png'),fullPage:false});
  await page.locator('.nav .tab[data-tab="witness"]').click();
  assert.equal(await page.locator('#ddNewsTickerHub').isVisible(),false);
  assert.equal(await page.locator('#ddNewsTickerAlert').isVisible(),true,'New major headline appears over other tabs');
  await page.locator('#ddNewsTickerHide').click();
  assert.equal(await page.locator('#ddNewsTickerAlert').isVisible(),false);
  await page.evaluate(()=>{
    window.ddNewsTickerRows.push({
      id:'browser-major-2',headline:'Second synthetic breaking bulletin',source:'Fixture Publisher',
      url:'https://example.org/second-story',date:new Date().toISOString(),priority:'major'
    });
    window.dispatchEvent(new Event('dd-news-updated'));
  });
  assert.equal(await page.locator('#ddNewsTickerAlert').isVisible(),true);
  await page.locator('#ddNewsTickerOff').click();
  assert.equal(await page.locator('#ddNewsTickerAlert').isVisible(),false);
  pass('real Chromium 393px: alert only outside News, hide until next, Off stays respected');
  await page.locator('.nav .tab[data-tab="discover"]').click();
  assert.equal(await page.locator('#ddNewsTickerHub').isVisible(),true);
  assert.equal(await page.locator('#ddNewsTickerAlert').isVisible(),false);
  pass('real Chromium 393px: original News ticker restores on return');
  await page.evaluate(()=>{
    window.ddNewsTickerRows=[{
      id:'browser-recent-only',headline:'Synthetic nine-hour update',source:'Fixture Publisher',
      url:'https://example.org/nine-hour',date:new Date(Date.now()-9*3600000).toISOString(),priority:'standard'
    }];
    window.dispatchEvent(new Event('dd-news-updated'));
  });
  assert.equal(await page.locator('.dd-news-ticker-breaking').isVisible(),false,'Breaking hidden without <=8h stories');
  assert.match(await page.locator('#ddNewsTickerRecentTrack').innerText(),/Synthetic nine-hour update/);
  pass('No Breaking headline leaves the 48-hour ticker visible');

  for(const target of ['witness','hub','profilePage','clips']){
   await page.locator('.nav .tab[data-tab="'+target+'"]').click({timeout:10000});
   assert.equal(await selected(page,target),'page','aria-current reflects '+target);
   assert.equal(await hasVisibleSection(page,target),true,'Section is visible: '+target);
   pass('navigate to '+target+' with touch/mobile viewport');
  }
  await page.locator('.nav .tab[data-tab="hub"]').click();
  await page.locator('.nav .tab[data-tab="profilePage"]').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.nav .tab[data-tab="profilePage"][aria-current="page"]').waitFor({state:'attached'});
  assert.equal(await hasVisibleSection(page,'profilePage'),true,'Reload must retain last tab in the browser session');
  pass('Browser refresh retains last selected tab, without storing private messages');
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
  assert.equal(await page.locator('nav.nav .tab').count(),12);
  await page.waitForFunction(()=>!document.getElementById('discussionsPage').classList.contains('hidden'),
    null,{timeout:10000});
  assert.equal(await hasVisibleSection(page,'discussionsPage'),true,
    'Approved public Discussions deep link must open the community area');
  assert.equal(await page.locator('.nav .tab[data-tab="discussionsPage"]').count(),0,
    'Discussions opens through Community and must not duplicate the bottom dock');
  pass('approved Discussions deep link opens community without adding a phantom bottom tab');
  await page.goto(BASE+'/?dd_tab=chatPage',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.nav .tab[data-tab="chatPage"]');
  await page.waitForFunction(()=>!document.getElementById('chatPage').hidden &&
     !document.getElementById('chatPage').classList.contains('hidden'),null,{timeout:10000});
  assert.equal(await hasVisibleSection(page,'chatPage'),true,'Approved private Chat deep link must open');
  assert.equal(await selected(page,'chatPage'),'page');
  await page.locator('.nav .tab[data-tab="hub"]').click();
  assert.equal(await page.locator('#chatPage').evaluate(el=>el.hidden),true,
    'Private Chat panel must be hidden again on navigation away');
  pass('approved Chat link opens and closes without exposing hidden content elsewhere');
  await page.goto(BASE+'/?dd_tab=profilePage',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.nav .tab[data-tab="profilePage"]');
  assert.equal(await selected(page,'profilePage'),'page');
  pass('valid W.NE return deep link restores Profile');
  await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.dd-site-dock-tab');
  assert.equal(await page.locator('.dd-site-dock-tab').count(),12);
  assert.equal(await page.locator('.dd-site-dock-tab[data-dd-tab="discussionsPage"]').count(),0);
  pass('Research guest preview retains all twelve navigation links');
  const back=page.locator('.dd-site-dock-tab[data-dd-tab="hub"]');
  await back.click({timeout:10000});
  await page.waitForURL('**/?dd_tab=hub',{timeout:10000});
  assert.equal(await selected(page,'hub'),'page');
  pass('Research dock returns through main site to Explore');
  await page.goto(BASE+'/research/index.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.dd-site-dock-tab[data-dd-tab="profilePage"]');
  assert.equal(await page.locator('.dd-site-dock-tab').count(),12);
  pass('Research entry preserves twelve shared nav destinations');
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
  // Native dialog close event is asynchronous: wait for the restored tab before asserting.
  await page.locator('.nav .tab[data-tab="hub"][aria-current="page"]').waitFor({state:'attached',timeout:3500});
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

  // Fully offline browser integration of profile avatars: guest hidden, owner auto-save.
  // Synthetic Supabase Auth + Storage responses, NEVER user uploads or real network.
  const avatarContext=await browser.newContext({viewport:{width:393,height:852},
   deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'en-GB'});
  await avatarContext.route('**/*',offlineRoute);
  await avatarContext.addInitScript(()=>{
   try{localStorage.setItem('dd-welcome-tour-choice-v2','dismissed')}catch(_){}
  });
  const avatarPage=await avatarContext.newPage();
  await avatarPage.goto(BASE+'/?dd_tab=profilePage',{waitUntil:'domcontentloaded',timeout:35000});
  await avatarPage.waitForSelector('#ddAvatarPanel',{state:'attached'});
  assert.equal(await avatarPage.locator('#ddAvatarPanel').isVisible(),false,
   'Account photo panel must be hidden for signed-out guests');
  pass('profile photo controls stay hidden for guests in real mobile browser');
  await avatarPage.evaluate(async()=>{
   document.getElementById('ddProfilePrivate').hidden=false;
   document.getElementById('ddProfileGuest').hidden=true;
   window.__avatarQa={writes:[],user:'11111111-1111-4111-8111-111111111111',
    privateKey:'22222222-2222-4222-8222-222222222222'};
   window.DD_COMMUNITY_FEATURES={...window.DD_COMMUNITY_FEATURES,profileAvatars:true};
   window.supabase={createClient:()=>({
    auth:{
     getUser:async()=>({data:{user:{id:window.__avatarQa.user,is_anonymous:false}},error:null}),
     onAuthStateChange:()=>{}
    },
    rpc:async(name,args)=>{
     if(name==='dd_avatar_my_settings')
      return {data:[{public_key:window.__avatarQa.privateKey,visible:true}],error:null};
     if(name==='dd_avatar_set_visibility')return {data:true,error:null};
     throw Error('Unexpected public avatar RPC');
    },
    storage:{from:bucket=>{
     if(bucket!=='dd-profile-avatars')throw Error('Unexpected avatar bucket');
     return {
      download:async()=>window.__avatarQa.savedPhoto?{data:window.__avatarQa.savedPhoto,error:null}:{data:null,error:{message:'Object not found'}},
      upload:async(path,blob,options)=>{
       window.__avatarQa.savedPhoto=blob;
       window.__avatarQa.writes.push({action:'upload',path,contentType:blob.type,
        bytes:blob.size,options});
       return {data:{path},error:null};
      },
      remove:async(paths)=>{
       window.__avatarQa.savedPhoto=null;
       window.__avatarQa.writes.push({action:'remove',paths});
       return {data:paths,error:null};
      }
     };
    }}
   })};
   const tag=document.createElement('script');
   tag.src='/assets/profile-avatars.js?offline-qa=true';
   document.body.append(tag);
   await new Promise((resolve,reject)=>{
    tag.addEventListener('load',resolve,{once:true});
    tag.addEventListener('error',reject,{once:true});
   });
  });
  await avatarPage.locator('#ddAvatarPanel:not([hidden])').waitFor({state:'attached'});
  await avatarPage.locator('#ddAvatarFile:not([disabled])').waitFor({state:'attached',timeout:7500});
  const photoBounds=await avatarPage.locator('#ddAvatarPanel').boundingBox();
  assert(photoBounds&&photoBounds.width<=393,'Private avatar must fit portrait viewport');
  pass('profile photo real Chromium controls render inside 393px screen, offline');
  const png=Buffer.from(
   'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGM8Mc2GgRTARJLqUQ2jGoaUBgAZUwG6BUheJgAAAABJRU5ErkJggg==',
   'base64');
  await avatarPage.locator('#ddAvatarFile').setInputFiles({
   name:'synthetic-photo.png',mimeType:'image/png',buffer:png
  });
  try{
   await avatarPage.waitForFunction(()=>window.__avatarQa?.writes?.some(x=>x.action==='upload'),
    null,{timeout:10000});
  }catch(error){
   const details=await avatarPage.evaluate(()=>({
    status:document.getElementById('ddAvatarStatus')?.textContent,
    fileName:document.getElementById('ddAvatarFile')?.files?.[0]?.name,
    fileType:document.getElementById('ddAvatarFile')?.files?.[0]?.type,
    fileDisabled:document.getElementById('ddAvatarFile')?.disabled,
    pendingRetry:!document.getElementById('ddAvatarSave')?.hidden,
    secureContext:window.isSecureContext
   }));
   throw Error('Auto-save avatar test failed '+JSON.stringify(details)+'; '+error.message);
  }
  assert.match(await avatarPage.locator('#ddAvatarStatus').innerText(),/saved automatically/);
  const upload=await avatarPage.evaluate(()=>window.__avatarQa.writes.find(x=>x.action==='upload'));
  assert.equal(upload.path,'22222222-2222-4222-8222-222222222222/avatar.webp');
  assert.equal(upload.contentType,'image/webp');
  assert(upload.bytes>0&&upload.bytes<=1048576,'Photo is re-encoded under 1 MiB');
  pass('real browser photo auto-saves WebP to separate opaque private key');
  avatarPage.on('dialog',d=>d.accept());
  // Avatar auto-upload is asynchronous: wait for its UI confirmation, not only the mock write call.
  try{
   await avatarPage.locator('#ddAvatarRemove:not([hidden]):not([disabled])').waitFor({state:'visible',timeout:10000});
  }catch(error){
   const snapshot=await avatarPage.evaluate(()=>({
    status:document.getElementById('ddAvatarStatus')?.textContent,
    panelHidden:document.getElementById('ddAvatarPanel')?.hidden,
    removeHidden:document.getElementById('ddAvatarRemove')?.hidden,
    removeDisabled:document.getElementById('ddAvatarRemove')?.disabled,
    key:window.__avatarQa?.privateKey,
    savedBytes:window.__avatarQa?.savedPhoto?.size,
    writes:window.__avatarQa?.writes?.map(x=>x.action),
    url:location.pathname
   }));
   throw Error('Avatar removal readiness diagnostic '+JSON.stringify(snapshot)+'; '+error.message);
  }
  await avatarPage.locator('#ddAvatarRemove').click();
  await avatarPage.waitForFunction(()=>window.__avatarQa?.writes?.some(x=>x.action==='remove'));
  const removal=await avatarPage.evaluate(()=>window.__avatarQa.writes.find(x=>x.action==='remove'));
  assert.deepEqual(removal.paths,['22222222-2222-4222-8222-222222222222/avatar.webp']);
  pass('real browser photo removal uses only current-account opaque private key');
  await avatarPage.screenshot({path:path.join(OUTPUT,'private-profile-photo-393px.png'),
   fullPage:false});
  await avatarContext.close();

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
