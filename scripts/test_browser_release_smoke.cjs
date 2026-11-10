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
  assert.equal(tabs,13,'Current public release keeps all thirteen approved navigation tabs');
  assert.equal(await selected(page,'discover'),'page');
  assert.equal(await hasVisibleSection(page,'discover'),true);
  pass('all thirteen approved bottom tabs and visible News');
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
  // The tour's close handler restores navigation asynchronously after Escape.
  // Wait for the real state rather than sampling aria-current mid-update.
  await page.locator('.nav .tab[data-tab="hub"][aria-current="page"]').waitFor({state:'attached',timeout:5000});
  assert.equal(await selected(page,'hub'),'page','Escape returns to Explore');
  pass('tour opens native modal; Escape restores Explore');
  await page.screenshot({path:path.join(OUTPUT,'mobile-explore-393px.png'),fullPage:false});
  await page.goto(BASE+'/?dd_tab=discussionsPage',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.nav .tab[data-tab="discover"]');
  assert.equal(await page.locator('nav.nav .tab').count(),13);
  await page.waitForFunction(()=>!document.getElementById('discussionsPage').classList.contains('hidden'),
    null,{timeout:10000});
  assert.equal(await hasVisibleSection(page,'discussionsPage'),true,
    'Approved public Discussions deep link must open the community area');
  assert.equal(await page.evaluate(()=>typeof window.supabase),'undefined',
    'Offline navigation acceptance intentionally has no account SDK');
  await page.waitForFunction(()=>document.getElementById('ddForumStatus')?.textContent?.includes('Community service unavailable'));
  assert.equal(await page.locator('.nav .tab[data-tab="discussionsPage"]').count(),1,
    'Discussions has exactly one dedicated tab');
  pass('approved Discussions deep link opens the dedicated community tab');
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
  // M56 regression: deep-link URLs must follow actual navigation, not force
  // Archive again after refresh. All requests stay inside this offline fixture.
  await page.goto(BASE+'/?dd_tab=archivePage',{waitUntil:'domcontentloaded',timeout:35000});
  await page.locator('.nav .tab[data-tab="archivePage"][aria-current="page"]').waitFor({state:'attached',timeout:10000});
  assert.equal(await hasVisibleSection(page,'archivePage'),true,'Direct Archive URL must initialise a real visible page');
  // Archive's large catalogue may still be downloading on CI/mobile. This
  // navigation test checks that restoration did not trigger a TDZ crash;
  // the data-loader's own M55 tests separately check content/fallback/retry.
  await page.waitForTimeout(400);
  assert.equal(errors.some(e=>/Cannot access '(historicalRecords|ddArchiveFullReady|ddArchiveTried)' before initialization/.test(e)),false,
   'Opening Archive directly cannot access state before it is initialised');
  await page.locator('.nav .tab[data-tab="discover"]').click();
  assert.equal(new URL(page.url()).searchParams.get('dd_tab'),'discover','Archive query updated to News');
  await page.reload({waitUntil:'domcontentloaded',timeout:35000});
  await page.locator('.nav .tab[data-tab="discover"][aria-current="page"]').waitFor({state:'attached',timeout:10000});
  assert.equal(await hasVisibleSection(page,'discover'),true,'Reload after leaving Archive must remain on News');
  pass('M56 direct Archive loads safely, switching to News rewrites stale URL, refresh stays on News');
  await page.locator('.nav .tab[data-tab="mapPage"]').click();
  assert.equal(new URL(page.url()).searchParams.get('dd_tab'),'mapPage','News to Map updates deep-link URL');
  await page.reload({waitUntil:'domcontentloaded',timeout:35000});
  await page.locator('.nav .tab[data-tab="mapPage"][aria-current="page"]').waitFor({state:'attached',timeout:10000});
  assert.equal(await hasVisibleSection(page,'mapPage'),true,'Reload preserves Map');
  pass('M56 Map also restores after refresh and no longer jumps back to Archive');
  // M56: A real W.NE dock click must confirm save, then land on the chosen
  // section in ONE tap. A failed save must never navigate away from writing.
  const wneDockPage=await context.newPage();
  await wneDockPage.goto(BASE+'/robots.txt',{waitUntil:'domcontentloaded',timeout:10000});
  await wneDockPage.setContent('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="editor" contenteditable="true">Private unsaved fixture</div><button id="save">Save</button></body></html>');
  await wneDockPage.evaluate(()=>{
   sessionStorage.setItem('dd_last_open_tab_v1','researchStudio');
   window.__wneFakeSaveOK=false;
   window.wneSaveBeforeNavigation=async reason=>{
    sessionStorage.setItem('m56-wne-saved-before-leaving',reason);
    return window.__wneFakeSaveOK;
   };
  });
  await wneDockPage.addScriptTag({url:BASE+'/research/research-site-nav.js'});
  const clipsDock=wneDockPage.locator('[data-dd-tab="clips"]');
  await clipsDock.waitFor({state:'visible'});
  await clipsDock.click();
  await wneDockPage.waitForFunction(()=>document.querySelector('.dd-site-dock-status')?.textContent?.includes('Save was not confirmed'));
  assert.equal(new URL(wneDockPage.url()).pathname,'/robots.txt','Failed save must keep original W.NE document open');
  assert.match(await wneDockPage.evaluate(()=>sessionStorage.getItem('m56-wne-saved-before-leaving')||''),/Disclosure Desk navigation to clips/);
  pass('M56 W.NE dock protects unsaved document on rejected save, no navigation');
  await wneDockPage.evaluate(()=>{window.__wneFakeSaveOK=true});
  await clipsDock.click();
  await wneDockPage.waitForURL(url=>new URL(url).pathname==='/'&&new URL(url).searchParams.get('dd_tab')==='clips',{timeout:15000});
  await wneDockPage.locator('.nav .tab[data-tab="clips"][aria-current="page"]').waitFor({state:'attached',timeout:15000});
  assert.equal(await wneDockPage.locator('#clips').evaluate(el=>!el.classList.contains('hidden')),true,'First W.NE click after confirmed save must open Videos');
  assert.equal(await wneDockPage.locator('#researchStudio').evaluate(el=>el.classList.contains('hidden')),true,'Must not show intermediate W.NE landing page');
  pass('M56 W.NE confirmed autosave routes to selected Videos tab in ONE tap, not W.NE landing');
  await wneDockPage.close();
  const wneNews=await context.newPage();
  await wneNews.goto(BASE+'/robots.txt',{waitUntil:'domcontentloaded',timeout:10000});
  await wneNews.setContent('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="editor" contenteditable="true">News return fixture</div><button id="save">Save</button></body></html>');
  await wneNews.evaluate(()=>{
    sessionStorage.setItem('dd_last_open_tab_v1','researchStudio');
    window.wneSaveBeforeNavigation=async reason=>{
      sessionStorage.setItem('m56-news-save-reason',reason);
      return true;
    };
  });
  await wneNews.addScriptTag({url:BASE+'/research/research-site-nav.js'});
  await wneNews.locator('[data-dd-tab="discover"]').click();
  await wneNews.waitForURL(url=>new URL(url).pathname==='/'&&new URL(url).searchParams.get('dd_tab')==='discover',{timeout:15000});
  await wneNews.locator('.nav .tab[data-tab="discover"][aria-current="page"]').waitFor({state:'attached',timeout:15000});
  assert.equal(await wneNews.locator('#discover').evaluate(el=>!el.classList.contains('hidden')),true);
  assert.equal(await wneNews.locator('#researchStudio').evaluate(el=>el.classList.contains('hidden')),true,'News return cannot open W.NE landing');
  assert.match(await wneNews.evaluate(()=>sessionStorage.getItem('m56-news-save-reason')||''),/Disclosure Desk navigation to discover/);
  assert.equal(await wneNews.evaluate(()=>sessionStorage.getItem('dd_last_open_tab_v1')),'discover');
  pass('M56 W.NE auto-save and single tap to News bypasses old W.NE landing even with stale prior tab');
  await wneNews.close();
  // M57 regression: we tested leaving an open W.NE editor in M56, but missed
  // the return trip. First-time visitors may still see the public introduction.
  // Returning authenticated researchers must instead go through the account-
  // checked Research entry to reopen their actual document, not the landing.
  const m57=await context.newPage();
  await m57.goto(BASE+'/?dd_tab=clips',{waitUntil:'domcontentloaded',timeout:35000});
  await m57.evaluate(()=>{
   sessionStorage.removeItem('wne-research-active-document');
   sessionStorage.removeItem('dd-wne-resume-entry-v1');
   localStorage.removeItem('dd-wne-resume-entry-v1');
  });
  await m57.locator('.nav .tab[data-tab="researchStudio"]').click();
  assert.equal(new URL(m57.url()).pathname,'/','First-time visitor may use the W.NE introduction');
  assert.equal(await hasVisibleSection(m57,'researchStudio'),true);
  pass('M57 first-time W.NE visitor still sees the introduction and guest preview');

  const m57Doc='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const m57Owner='11111111-1111-4111-8111-111111111111';
  await m57.goto(BASE+'/?dd_tab=clips',{waitUntil:'domcontentloaded',timeout:35000});
  await m57.evaluate(({doc,owner})=>{
   sessionStorage.setItem('wne-research-active-document',doc);
   localStorage.setItem('wne-research-last-document:'+owner,doc);
  },{doc:m57Doc,owner:m57Owner});
  // The entire resume flow runs against synthetic account/RLS results. No
  // real Supabase account, API or document is contacted or modified.
  await m57.addInitScript(({doc,owner})=>{
   if(!location.pathname.startsWith('/research/'))return;
   const db={
    auth:{
     getUser:async()=>({data:{user:{id:owner}},error:null}),
     onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
    },
    from:table=>{
     if(table!=='research_documents')throw Error('Unexpected test table '+table);
     return {select:()=>({
      eq:(_field,id)=>({maybeSingle:async()=>({
       data:id===doc?{id:doc}:null,error:null
      })}),
      order:()=>({limit:async()=>({data:[{id:doc}],error:null})})
     })};
    }
   };
   window.supabase={createClient:()=>db};
  },{doc:m57Doc,owner:m57Owner});
  await m57.locator('.nav .tab[data-tab="researchStudio"]').click();
  await m57.waitForURL(url=>new URL(url).pathname==='/research/research-workspace.html'
    &&new URL(url).searchParams.get('id')===m57Doc,{timeout:16000});
  await m57.locator('#writer[src*="wne.html?id="]').waitFor({state:'attached',timeout:10000});
  assert.equal((await m57.locator('#writer').getAttribute('src')).includes('wne.html?id='+m57Doc),true,
   'Returning W.NE tab must reopen the selected private report');
  assert.equal(await m57.evaluate(()=>localStorage.getItem('dd-wne-resume-entry-v1')),'1');
  pass('M57 returning W.NE tab reopens last RLS-verified document, never public intro');

  // The prior authenticated session is sufficient even after the active-doc
  // session hint disappears, e.g. browser resumes a tab after restart.
  await m57.goto(BASE+'/?dd_tab=clips',{waitUntil:'domcontentloaded',timeout:35000});
  await m57.evaluate(()=>sessionStorage.removeItem('wne-research-active-document'));
  await m57.locator('.nav .tab[data-tab="researchStudio"]').click();
  await m57.waitForURL(url=>new URL(url).pathname==='/research/research-workspace.html'
    &&new URL(url).searchParams.get('id')===m57Doc,{timeout:16000});
  pass('M57 remembered signed-in workspace returns through auth gate after page switch');
  await m57.close();

  // M59 real browser: duplicate syndicated RSS links must yield one News card,
  // and the ticker must not repeat the same headline. Keep distinct reports.
  const m59NewsPage=await context.newPage();
  await m59NewsPage.goto(BASE+'/?dd_tab=discover',{waitUntil:'domcontentloaded',timeout:35000});
  await m59NewsPage.waitForFunction(()=>!document.getElementById('feedRefresh')?.disabled,null,{timeout:16000});
  await m59NewsPage.evaluate(()=>{
   const recent=new Date().toISOString();
   const old=new Date(Date.now()-21*86400000).toISOString();
   const item=(id,headline,source,date)=>({id,headline,source,date,url:'https://news.google.com/rss/articles/'+id,category:'UAP',priority:'standard'});
   ddNewsRows([
    item('m59-a','Navy admiral warns of UAP cover-up','Publisher A',recent),
    item('m59-b','Navy admiral warns of UAP “cover-up”','Publisher B',recent),
    item('m59-c','NASA publishes new UAP study','NASA',recent),
    item('m59-d','Navy admiral warns of UAP cover-up','Publisher A',old)
   ],'M59 synthetic duplicate test');
  });
  assert.equal(await m59NewsPage.locator('#newsGrid article[data-news-id]').count(),3,
   'Same syndicated story shown once, but distinct and later reports retained');
  assert.equal(await m59NewsPage.locator('#newsGrid article[data-news-id="m59-a"]').count(),1,
   'Retained story keeps original source ID');
  assert.equal(await m59NewsPage.locator('#newsGrid article[data-news-id="m59-b"]').count(),0,
   'Rewritten RSS link must not create another card');
  assert.equal(await m59NewsPage.evaluate(()=>window.ddNewsTickerRows?.length),3,
   'Live ticker must not repeat syndicated article');
  pass('M59 News cards and ticker collapse duplicate Google RSS URLs without hiding separate reports');
  // M60: actual News DOM groups different headlines for one event and retains
  // all attributed source URLs in a compact expandable coverage list.
  await m59NewsPage.evaluate(()=>{
   const recent=new Date().toISOString();
   const item=(id,headline,source)=>({id,headline,source,date:recent,
     url:'https://example.org/uap-source/'+id,category:'UAP',priority:'standard'});
   ddNewsRows([
    item('m60-main','Trump says Air Force pilots saw strange UFO beyond their F-22','Publisher Main'),
    item('m60-alt','Trump shares very strange revelations from Air Force pilots about UFOs','Publisher Alt'),
    item('m60-file-a','Video - DOW-UAP-PR124, Unresolved UAP Report, Pacific Ocean, 2019','DOW'),
    item('m60-file-b','Video - DOW-UAP-PR125, Unresolved UAP Report, Pacific Ocean, 2019','DOW')
   ],'M60 event coverage browser fixture');
  });
  assert.equal(await m59NewsPage.locator('#newsGrid article[data-news-id]').count(),3,
   'Two differently worded same-event stories should display as one, official video IDs separate');
  assert.equal(await m59NewsPage.locator('#newsGrid article[data-news-id="m60-alt"]').count(),0);
  const coverage=m59NewsPage.locator('#newsGrid article[data-news-id="m60-main"] details.dd-news-more-coverage');
  assert.equal(await coverage.count(),1,'Grouped News event exposes source expansion');
  assert.match(await coverage.locator('summary').innerText(),/1 other report/);
  await coverage.locator('summary').click();
  assert.equal(await coverage.locator('a[href="https://example.org/uap-source/m60-alt"]').count(),1,
   'Original additional publisher link is accessible after expansion');
  assert.match(await coverage.innerText(),/Publisher Alt/);
  assert.equal(await m59NewsPage.evaluate(()=>window.ddNewsTickerRows?.length),3,
   'Ticker presents event only once, plus two separate government videos');
  pass('M60 Chromium grouped related-event cards expose other original publishers; official file IDs stay distinct');
  await m59NewsPage.close();

  await page.goto(BASE+'/research/guest-preview.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.dd-site-dock-tab');
  assert.equal(await page.locator('.dd-site-dock-tab').count(),13);
  assert.equal(await page.locator('.dd-site-dock-tab[data-dd-tab="discussionsPage"]').count(),1);
  pass('Research guest preview retains all thirteen navigation links');
  const back=page.locator('.dd-site-dock-tab[data-dd-tab="hub"]');
  await back.click({timeout:10000});
  await page.waitForURL('**/?dd_tab=hub',{timeout:10000});
  assert.equal(await selected(page,'hub'),'page');
  pass('Research dock returns through main site to Explore');
  await page.goto(BASE+'/research/index.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('.dd-site-dock-tab[data-dd-tab="profilePage"]');
  assert.equal(await page.locator('.dd-site-dock-tab').count(),13);
  pass('Research entry preserves thirteen shared nav destinations');
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
  // The public page already includes the avatar controller. Keep that initial
  // guest copy inert, then load the *single* real controller after installing
  // synthetic Auth/Storage. Two simultaneous controllers mutate one DOM and
  // cause false hidden/disabled button states during async uploads.
  await avatarPage.route('**/assets/profile-avatars.js*',route=>{
   const requested=new URL(route.request().url());
   if(requested.searchParams.has('offline-qa'))return route.continue();
   return route.fulfill({status:200,contentType:'application/javascript',
    body:'/* guest avatar script deferred to the signed-in test harness */'});
  });
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
  // M66: actual member path is Profile settings → Photo & visibility;
  // keep full real upload/removal acceptance, not a hidden-control shortcut.
  await avatarPage.locator('#ddProfileSettings > summary').click();
  await avatarPage.locator('#ddAvatarSettings > summary').click();
  assert.equal(await avatarPage.locator('#ddAvatarFile').isEnabled(),true,
   'Photo picker remains enabled inside opened Profile Settings');
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
  // No-ID Writer now correctly opens Research Home; exercise the guard with a synthetic ID.
  await editorPage.goto(BASE+'/research/wne.html?id=11111111-1111-4111-8111-111111111111',{waitUntil:'domcontentloaded',timeout:35000});
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
