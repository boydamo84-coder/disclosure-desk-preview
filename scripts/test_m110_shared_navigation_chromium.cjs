'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const origin='https://uapdisclosuredesk.com',root=path.resolve('android-test/app/src/main/assets/dd-site');
const back=fs.readFileSync('android-test/app/src/main/assets/back-navigation.js','utf8');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:393,height:780},reducedMotion:'reduce',userAgent:'Mozilla/5.0 Android DisclosureDeskAndroid'});
  let homeRequests=0,standaloneDirectory=0,embeddedDirectory=0;
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url()),req=route.request();
   if(url.origin!==origin)return route.abort();
   if(req.isNavigationRequest()){
    if(url.pathname==='/')homeRequests++;
    if(url.pathname==='/who-is-who.html'||url.pathname==='/who-is-who'){
     if(req.frame().parentFrame())embeddedDirectory++;else standaloneDirectory++;
    }
   }
   let file=path.join(root,url.pathname==='/'?'index.html':url.pathname.endsWith('/')?url.pathname.slice(1)+'index.html':url.pathname.slice(1));
   if(!fs.existsSync(file)&&!path.extname(file))file+='.html';
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
  });
  await context.addInitScript(()=>{
   // Only simulate auth for the private research pages; public Desk and directory
   // exercise the real guest/no-backend path, not an incomplete account mock.
   if(!location.pathname.startsWith('/research/'))return;
   const user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'};
   window.supabase={createClient:()=>({
    auth:{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
    rpc:async()=>({data:[],error:null}),
    from:()=>({select(){return this},eq(){return this},not(){return this},order(){return this},limit(){return this},maybeSingle:async()=>({data:null,error:null}),then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}})
   })};
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/research/r3-lab/',{waitUntil:'load'});
  await page.waitForFunction(()=>document.documentElement.dataset.r3Boot==='ready');
  const dock=page.locator('#ddWebSecondaryNav');
  await dock.waitFor();
  assert.equal(await page.locator('#r3BuildStamp').count(),0,'Internal build stamp removed from hosted page');
  for(const width of [320,393,768]){
   await page.setViewportSize({width,height:780});
   assert.deepEqual(await dock.locator('.nav-inner>button').evaluateAll(nodes=>nodes.map(n=>n.dataset.tab||'more')),
    ['discover','clips','archivePage','originalResearchPage','researchStudio','more']);
   assert.equal(await dock.locator('.nav-inner>button .ico svg').count(),6);
   assert.equal(await dock.locator('.nav-inner').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
   assert.equal(await dock.locator('[data-tab="originalResearchPage"]').getAttribute('aria-current'),'page');
   await dock.locator('.dd-dock-more').click();
   assert.equal(await dock.locator('[data-tab="chatPage"]').isVisible(),true);
   assert.equal(await dock.locator('[data-tab="peopleDirectory"]').isVisible(),true);
   assert.equal(await dock.locator('[data-tab="hub"]').textContent(),'Help');
   assert.equal(await page.evaluate(back),'handled','Back closes More');
   await dock.locator('#ddDockMore').waitFor({state:'hidden'});
  }
  await page.setViewportSize({width:393,height:780});
  const customized=['archivePage','peopleDirectory','discover','originalResearchPage','researchStudio','more'];
  const currentOrder=selector=>page.locator(selector+' .nav-inner>button').evaluateAll(nodes=>nodes.map(n=>n.dataset.tab||'more'));
  await dock.locator('.dd-dock-more').click();
  await dock.locator('.dd-dock-customise').click();
  await dock.getByLabel('Bottom tab 2',{exact:true}).selectOption('peopleDirectory');
  await dock.getByLabel('Bottom tab 1',{exact:true}).selectOption('archivePage');
  await dock.locator('[data-dock-save]').click();
  await dock.locator('#ddDockMore').waitFor({state:'hidden'});
  assert.deepEqual(await currentOrder('#ddWebSecondaryNav'),customized);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>document.documentElement.dataset.r3Boot==='ready');
  assert.deepEqual(await currentOrder('#ddWebSecondaryNav'),customized,'Custom order persists after a full reload');
  await page.locator('#sampleBtn').click();
  await page.locator('#workPanel').waitFor();
  await dock.locator('[data-tab="peopleDirectory"]').click();
  await page.locator('#ddConfirmDialog[open]').waitFor();
  assert.match(await page.locator('#ddDialogDescription').textContent(),/session-only/);
  await page.locator('#ddDialogCancel').click();
  assert.equal(page.url(),origin+'/research/r3-lab/');
  // Native Back is guarded too.
  assert.equal(await page.evaluate(back),'handled');
  await page.locator('#ddConfirmDialog[open]').waitFor();
  await page.locator('#ddDialogCancel').click();
  await context.route('**/research/wne.html?*',route=>route.fulfill({contentType:'text/html',
   body:'<!doctype html><main><div id="editor" contenteditable="true">Fictional writing</div></main><script>window.wneSaveBeforeNavigation=async()=>false</script>'}));
  await page.goto(origin+'/research/research-workspace.html?id=11111111-1111-4111-8111-111111111111',{waitUntil:'domcontentloaded'});
  await page.frameLocator('#writer').locator('#editor').waitFor();
  await page.locator('#ddResearchSiteDock').waitFor();
  assert.deepEqual(await currentOrder('#ddResearchSiteDock'),customized,'Same preferences in W.NE');
  assert.equal(await page.evaluate(()=>ddResearchNavigateTo('peopleDirectory')),false,'Failed save leaves W.NE in place');
  assert.match(page.url(),/research-workspace/);
  await page.evaluate(()=>document.getElementById('writer').contentWindow.wneSaveBeforeNavigation=async()=>true);
  await page.locator('#ddResearchSiteDock [data-tab="peopleDirectory"]').click();
  await page.waitForURL(origin+'/?dd_tab=peopleDirectory');
  await page.frameLocator('#ddAppPeopleFrame').locator('#peopleCards .card').first().waitFor();
  assert.equal(homeRequests,1);
  assert.equal(standaloneDirectory,0,'No intermediate standalone directory from W.NE');
  assert.equal(embeddedDirectory,1);
  assert.deepEqual(await currentOrder('#ddHomeDock'),customized,'Same preferences on Home');
  await page.locator('#ddHomeDock [data-tab="originalResearchPage"]').click();
  await page.locator('#originalResearchPage').waitFor();
  assert.equal(homeRequests,1,'Research tab must not reload Desk after W.NE return');
  await page.locator('#ddHomeDock [data-tab="peopleDirectory"]').click();
  assert.equal(embeddedDirectory,1,'Directory retained after returning from Research');
  // Video has been relegated to More; preserve its original badge and count.
  await page.evaluate(()=>{
   const badge=document.querySelector('#ddHomeDock [data-new-badge="videos"]');badge.textContent='3';badge.hidden=false;
  });
  await page.waitForFunction(()=>document.querySelector('#ddHomeDock .dd-dock-more').hasAttribute('data-dd-attention'));
  await page.locator('#ddHomeDock .dd-dock-more').click();
  assert.equal(await page.locator('#ddHomeDock .dd-dock-links [data-tab="clips"] [data-new-badge]').isVisible(),true);
  await page.locator('#ddHomeDock .dd-dock-customise').click();
  await page.locator('#ddHomeDock [data-dock-reset]').click();
  await page.locator('#ddHomeDock [data-dock-save]').click();
  await page.locator('#ddHomeDock #ddDockMore').waitFor({state:'hidden'});
  assert.deepEqual(await currentOrder('#ddHomeDock'),['discover','clips','archivePage','originalResearchPage','researchStudio','more']);
  assert.equal(await page.locator('#ddHomeDock .nav-inner [data-new-badge="videos"]').isVisible(),true,'Badge follows tab to bar');
  assert.equal(await page.locator('#ddHomeDock .dd-dock-more').getAttribute('data-dd-attention'),null,'No double-counted video alert');
  await page.locator('#ddHomeDock .dd-dock-more').click();
  await page.locator('#ddHomeDock .dd-dock-customise').click();
  await page.locator('#ddHomeDock').getByLabel('Bottom tab 1',{exact:true}).selectOption('profilePage');
  await page.locator('#ddHomeDock [data-dock-cancel]').click();
  await page.locator('#ddHomeDock .dd-dock-heading button').click();
  assert.deepEqual(await currentOrder('#ddHomeDock'),['discover','clips','archivePage','originalResearchPage','researchStudio','more'],'Cancel leaves original preferences');
  assert.ok(!errors.length,errors.join('\n'));
  console.log('PASS M110: R3 shared dock 320/393/768px, cancel-safe unsaved notebook and Back, W.NE save guard, direct retained directory route and quick next tab.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
