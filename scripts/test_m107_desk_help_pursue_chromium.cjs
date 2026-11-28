'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const origin='https://uapdisclosuredesk.com',root=path.resolve('android-test/app/src/main/assets/dd-site');
const assets=path.resolve('android-test/app/src/main/assets');
const header=fs.readFileSync(path.join(assets,'compact-header.js'),'utf8');
const back=fs.readFileSync(path.join(assets,'back-navigation.js'),'utf8');
const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
(async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:393,height:780},reducedMotion:'reduce'});
  let mapRequests=0;
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='unpkg.com'&&url.pathname==='/leaflet@1.9.4/dist/leaflet.js'&&fs.existsSync('node_modules/leaflet/dist/leaflet.js'))
    {mapRequests++;return route.fulfill({path:'node_modules/leaflet/dist/leaflet.js',contentType:'application/javascript'});}
   if(url.origin!==origin)return route.abort();
   let file=path.join(root,url.pathname==='/'?'index.html':url.pathname.replace(/^\//,''));
   if(!fs.existsSync(file)&&!path.extname(file))file+='.html';
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();
  await page.goto(origin+'/?dd_tab=discover',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.DDPageHelp?.open==='function');
  assert.equal(mapRequests,0,'News does not wait for a remote map library');
  const homeHelp=page.locator('#discover > .dd-help-bar');
  assert.equal(await homeHelp.isVisible(),true,'Website retains the original help row');
  assert.equal(await page.evaluate(header),true);
  assert.equal(await homeHelp.isVisible(),false,'APK removes homepage help row');
  assert.equal(await page.evaluate(()=>DDNativePageHelp()),'opened');
  await page.locator('#ddPageHelpDialog[open]').waitFor();
  assert.equal(await page.locator('#ddPageHelpTitle').textContent(),'News and discoveries');
  assert.equal(await page.locator('#ddPageHelpGuide').getAttribute('href'),'/guide#news');
  assert.equal(await page.evaluate(back),'handled');
  await page.locator('#ddPageHelpDialog').waitFor({state:'hidden'});
  await page.evaluate(()=>navigateTo('archivePage'));
  assert.equal(await page.locator('#archivePage > .dd-help-bar').isVisible(),true);
  assert.equal(await page.evaluate(()=>DDNativePageHelp()),'opened');
  assert.equal(await page.locator('#ddPageHelpTitle').textContent(),'Evidence Archive');
  await page.evaluate(back);
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#archiveCategory option')).some(o=>o.value==='PURSUE'),{},{timeout:45000});
  await page.evaluate(()=>{document.querySelector('#ddCompareCases').open=true;window.scrollTo(0,0)});
  await page.locator('#ddArchivePursueShortcut').click();
  await page.waitForFunction(()=>document.getElementById('archiveStatus').textContent.includes('PURSUE only')&&document.getElementById('archiveStatus').textContent.startsWith('521 of '));
  await page.waitForFunction(()=>{
   const status=document.getElementById('archiveStatus').getBoundingClientRect();
   const first=document.querySelector('#archiveList .dd-archive-card')?.getBoundingClientRect();
   return scrollY>100&&status.top>=0&&status.bottom<innerHeight&&first?.top<innerHeight;
  },{},{timeout:15000});
  assert.equal(await page.locator('#ddArchivePursueShortcut').getAttribute('aria-pressed'),'true');
  assert.ok((await page.locator('#archiveList .dd-archive-card').first().getAttribute('data-archive-id')).startsWith('pursue-'));
  await page.locator('#ddArchivePursueShortcut').click();
  assert.equal(await page.locator('#ddArchivePursueShortcut').getAttribute('aria-pressed'),'false');
  assert.doesNotMatch(await page.locator('#archiveStatus').textContent(),/PURSUE only/);
  assert.equal(mapRequests,0,'Archive also does not fetch the map library');
  await page.evaluate(()=>navigateTo('mapPage'));
  await page.waitForFunction(()=>document.getElementById('map').classList.contains('leaflet-container'));
  assert.equal(mapRequests,1,'Map starts its existing library on selection');
  // Nested reader > investigations listing > Research > News; no task exit.
  await page.evaluate(()=>navigateTo('originalResearchPage'));
  await page.locator('[data-dd-open-reader]').click();
  await page.locator('#ddOriginalReader:not([hidden])').waitFor();
  await page.locator('#ddOriginalReader [data-dd-reader-view="investigations"] a[href*="rendlesham-forest-1980"]').first().click();
  await page.locator('#ddOriginalReader [data-dd-reader-view="rendlesham-forest-1980"]:not([hidden])').waitFor();
  assert.equal(await page.evaluate(back),'handled');
  await page.locator('#ddOriginalReader [data-dd-reader-view="investigations"]:not([hidden])').waitFor();
  assert.equal(await page.evaluate(back),'handled');
  await page.locator('#ddOriginalReader').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(back),'home');
  await page.locator('#discover').waitFor();
  // Real tab history returns to previous section, rather than opening a new entry.
  await page.locator('.nav [data-tab="originalResearchPage"]').click();
  assert.equal(await page.evaluate(back),'history');
  await page.goBack();
  await page.locator('#discover').waitFor();
  // Every public SPA section, including direct launch with no usable history.
  for(const id of ['archivePage','originalResearchPage','researchStudio','mapPage','livePage','clips','boards','witness','watchRead','profilePage','hub','cases','rabbitHole','resources','about']){
   await page.evaluate(id=>{history.replaceState({ddSection:id},'',location.href);navigateTo(id)},id);
   await page.locator('#'+id).waitFor();
   assert.equal(await page.evaluate(back),'home',id+' returns to News');
   await page.locator('#discover').waitFor();
  }
  await page.evaluate(()=>navigateTo('watchRead'));
  assert.equal(await page.locator('#ddRecommendedPods').evaluate(el=>el.open),false,'Pods collapsed on ordinary visit');
  await page.locator('#ddRecommendedPods summary').click();
  assert.equal(await page.locator('#podcastList article').count(),4,'All four original show recommendations retained');
  await page.locator('#ddRecommendedPods summary').click();
  await page.evaluate(()=>navigateTo('podcasts'));
  assert.equal(await page.locator('#ddRecommendedPods').evaluate(el=>el.open),true,'Legacy Podcast route opens merged section');
  assert.equal(await page.locator('.dd-dock-links [data-tab="podcasts"]').count(),0,'No duplicate Podcast menu entry');
  await page.evaluate(()=>navigateTo('discover'));
  // Existing badge signals (not live private data): More aggregates only
  // destinations in the menu, and clears when their own counts are cleared.
  const more=page.locator('.dd-dock-more');
  await page.evaluate(()=>{
   const video=document.querySelector('.dd-dock-links [data-new-badge="videos"]');
   video.textContent='3';video.hidden=false;
  });
  await page.waitForFunction(()=>document.querySelector('.dd-dock-more').hasAttribute('data-dd-attention'));
  assert.match(await more.getAttribute('aria-label'),/1 with new items/);
  await more.click();
  assert.equal(await page.locator('.dd-dock-links [data-tab="clips"] [data-new-badge]').isVisible(),true);
  assert.equal(await page.locator('.dd-dock-links [data-tab="clips"]').getAttribute('data-dd-attention'),'');
  await page.evaluate(()=>{
   const menu=document.querySelector('.dd-dock-links');
   const item=document.createElement('button');item.dataset.tab='qa-chat';item.className='tab';item.textContent='Synthetic Chat';
   const badge=document.createElement('span');badge.className='dd-chat-unread-badge';badge.textContent='2';item.append(badge);menu.append(item);
   window.__qaChat=item;
  });
  await page.waitForFunction(()=>document.querySelector('.dd-dock-more').getAttribute('aria-label').includes('2 with new items'));
  await page.evaluate(()=>{
   document.querySelector('.dd-dock-links [data-new-badge="videos"]').hidden=true;
   window.__qaChat.querySelector('.dd-chat-unread-badge').hidden=true;
  });
  await page.waitForFunction(()=>!document.querySelector('.dd-dock-more').hasAttribute('data-dd-attention'));
  await page.evaluate(()=>window.__qaChat.remove());
  assert.equal(await page.evaluate(back),'handled','More closes first');
  await page.locator('#ddDockMore').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(back),'root','Only News root can exit');
  // Canonical secondary pages use real WebView history rather than exiting.
  for(const name of ['rendlesham-forest-1980','roswell-1947','investigations','foia-tracker','pursue','sources','who-is-who','guide','site-updates','privacy','terms','community-rules','research-collaborations']){
   await page.goto(origin+'/'+name,{waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(back),'history',name+' uses document history');
  }
  // Real Research Studio shell with a synthetic local editor iframe and
  // fictional auth. Test full-screen layout without opening a real document.
  await context.route('**/research/wne.html?*',route=>route.fulfill({contentType:'text/html',
   body:'<!doctype html><div class="mobilebar">Sections</div><div class="topbar">Save</div><div class="formatbar">Formatting toolbar</div><main><div id="editor" contenteditable="true">Unsaved synthetic writing</div></main><script>window.wneSaveBeforeNavigation=async()=>false;window.__identity=123;</script>'}));
  await context.addInitScript(()=>{
   window.supabase={createClient:()=>({
    auth:{getUser:async()=>({data:{user:{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}},error:null}),
     getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
    from:()=>({select(){return this},eq(){return this},order(){return this},limit(){return this},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}})
   })};
  });
  let libraryRequests=0;
  await context.route('**/research/research-bible.html',route=>{libraryRequests++;return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Fictional research library</title><p>Library</p>'})});
  const focusPage=await context.newPage();
  await focusPage.goto(origin+'/research/research-workspace.html?id=11111111-1111-4111-8111-111111111111',{waitUntil:'domcontentloaded'});
  await focusPage.locator('#writer').waitFor();
  const editor=focusPage.frameLocator('#writer').locator('#editor');
  await editor.waitFor();
  await focusPage.locator('#ddResearchSiteDock').waitFor();
  assert.equal(await focusPage.locator('#dd-documents-btn').isVisible(),false,'Duplicate outer Home removed');
  assert.equal(await focusPage.locator('#bible').getAttribute('src'),'about:blank','Editor-only startup skips separate Library');
  assert.equal(libraryRequests,0);
  const dock=focusPage.locator('#ddResearchSiteDock');
  const primary=dock.locator('.nav-inner > button');
  assert.deepEqual(await primary.evaluateAll(buttons=>buttons.map(b=>b.dataset.tab||'more')),
    ['discover','archivePage','originalResearchPage','peopleDirectory','researchStudio','more']);
  for(const width of [320,393]){
   await focusPage.setViewportSize({width,height:780});
   assert.equal(await dock.locator('.nav-inner').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Six cells fit '+width);
  }
  const oldUrl=focusPage.url();
  await dock.locator('[data-tab="researchStudio"]').click();
  await dock.locator('[data-tab="researchStudio"]').click();
  assert.equal(focusPage.url(),oldUrl,'Repeat active W.NE tab keeps report mounted');
  assert.equal(await focusPage.evaluate(()=>document.getElementById('writer').contentWindow.__identity),123);
  await dock.locator('.dd-dock-more').click();
  await dock.locator('#ddDockMore[open]').waitFor();
  assert.equal(await dock.locator('[data-tab="witness"]').isVisible(),true);
  await dock.locator('.dd-dock-heading button').click();
  assert.equal(await focusPage.evaluate(()=>ddResearchNavigateTo('archivePage')),false,'Failed save blocks shared dock navigation');
  // File's existing document-manager bridge remains available.
  await focusPage.evaluate(()=>document.getElementById('writer').contentWindow.wneSaveBeforeNavigation=async()=>true);
  assert.equal(await focusPage.evaluate(()=>ddResearchOpenHome()),true);
  await focusPage.locator('#dd-documents-dialog[open]').waitFor();
  await focusPage.locator('#dd-close-documents').click();
  await focusPage.evaluate(()=>document.getElementById('writer').contentWindow.wneSaveBeforeNavigation=async()=>false);
  await focusPage.locator('#bothBtn').click();
  await focusPage.waitForFunction(()=>document.getElementById('bible').getAttribute('src')==='./research-bible.html');
  await focusPage.frameLocator('#bible').locator('p').waitFor();
  assert.equal(libraryRequests,1,'Library loads only on first selection');

  const regular=await focusPage.locator('#writer').boundingBox();
  await focusPage.locator('#dd-writing-focus-enter').click();
  assert.equal(await focusPage.locator('body>header').isVisible(),false);
  assert.equal(await focusPage.locator('#bible').isVisible(),false);
  assert.equal(await focusPage.locator('#splitter').isVisible(),false);
  assert.equal(await focusPage.frameLocator('#writer').locator('.formatbar').isVisible(),true);
  assert.equal(await editor.innerText(),'Unsaved synthetic writing');
  assert.ok((await focusPage.locator('#writer').boundingBox()).height>regular.height+100);
  assert.equal(await focusPage.evaluate(back),'handled','System Back exits focus, never leaves writer');
  assert.equal(await focusPage.locator('#bothBtn').getAttribute('aria-pressed'),'true','Previous split layout restored');
  assert.equal(await editor.innerText(),'Unsaved synthetic writing');
  assert.equal(await focusPage.evaluate(()=>document.getElementById('writer').contentWindow.__identity),123,'Same live editor instance');
  assert.equal(await focusPage.evaluate(back),'handled','Workspace uses existing save guard');
  await focusPage.waitForTimeout(150);
  assert.match(focusPage.url(),/research-workspace/,'Failed save must keep report open');
  await focusPage.locator('#dd-writing-focus-enter').click();
  await focusPage.locator('#dd-writing-focus-exit').click();
  assert.equal(await focusPage.locator('#dd-writing-focus-bar').isVisible(),false);
  assert.equal(await editor.innerText(),'Unsaved synthetic writing');
  console.log('PASS M108: shared 6-cell W.NE dock at 320/393px, repeat-tab stability, File document manager, save guard, on-demand Map and Library.');
  console.log('PASS M107: Android-only Desk help, public help preserved, PURSUE scroll + filter reset, nested research readers, tab history, all public SPA sections and canonical back routes.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
