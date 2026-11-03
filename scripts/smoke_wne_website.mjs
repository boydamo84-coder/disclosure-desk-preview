import {chromium,devices} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const relative=pathname.replace(/^\/disclosure-desk-preview\/?/,'').replace(/^\//,'')||'index.html';
 const file=resolve(root,relative);
 if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(readFileSync(file))}
 catch{res.writeHead(404).end('Not found')}
});
const equal=(actual,want,label)=>{if(actual!==want)throw Error(label+': expected '+JSON.stringify(want)+', got '+JSON.stringify(actual))};
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port+'/disclosure-desk-preview/';
const browser=await chromium.launch({headless:true});
try{
 for(const [profile,options] of [['mobile',devices['Pixel 7']],['desktop',{viewport:{width:1280,height:860}}]]){
  const context=await browser.newContext(options);
  await context.addInitScript(()=>{try{localStorage.setItem('dd-welcome-tour-choice-v1','dismissed')}catch{}});
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const tab=page.locator('[data-tab="researchStudio"]');
  await tab.scrollIntoViewIfNeeded();await tab.click();
  await page.locator('#researchStudio').waitFor({state:'visible'});
  equal(await page.locator('#discover').isVisible(),false,profile+' news should hide');
  equal(await page.locator('#ddResearchStudioHeading').innerText(),'W.NE Research Studio',profile+' W.NE heading');
  await page.locator('[data-tab="hub"]').scrollIntoViewIfNeeded();
  await page.locator('[data-tab="hub"]').click();
  await page.locator('#hub').waitFor({state:'visible'});
  equal(await page.locator('#hub #startAppTour').count(),1,profile+' one tour entry');
  await page.locator('#startAppTour').click();
  await page.locator('#appTourDialog').waitFor({state:'visible'});
  equal(await page.locator('#tourHeading').innerText(),'Welcome to Disclosure Desk',profile+' full tour starts correctly');
  for(let i=0;i<3;i++)await page.locator('#tourNext').click();
  equal(await page.locator('#tourHeading').innerText(),'W.NE Research Studio',profile+' full tour includes W.NE');
  await page.locator('#researchStudio').waitFor({state:'visible'});
  await page.locator('#tourClose').click();
  await page.locator('#hub').waitFor({state:'visible'});
  await page.locator('[data-start-tour="studio"]').click();
  equal(await page.locator('#tourHeading').innerText(),'Introducing W.NE',profile+' W.NE focused tour');
  await page.locator('#tourNext').click();
  equal(await page.locator('#tourHeading').innerText(),'Side-by-side research',profile+' split-screen tour step');
  await page.locator('#tourClose').click();
  await page.locator('#hub').waitFor({state:'visible'});
  equal(await page.locator('#ddExploreContact a[href^="mailto:"]').count()>=3,true,profile+' enquiry options');
  equal(await page.locator('#ddExplorePrivacy a[href="/privacy.html"]').count(),1,profile+' visible privacy link');
  await page.locator('#hub button[data-go="about"]').click();
  await page.locator('#about').waitFor({state:'visible'});
  equal((await page.locator('#about').innerText()).includes('Boyd Digital Studios'),true,profile+' studio credit in About');
  equal(await page.locator('.dd-site-footer-actions a[href="/privacy.html"]').count(),1,profile+' footer privacy link');
  await page.locator('[data-tab="livePage"]').scrollIntoViewIfNeeded();await page.locator('[data-tab="livePage"]').click();
  await page.locator('#livePage').waitFor({state:'visible'});
  await page.locator('[data-tab="watchRead"]').scrollIntoViewIfNeeded();await page.locator('[data-tab="watchRead"]').click();
  await page.locator('#watchRead').waitFor({state:'visible'});
  // Preserve each production navigation route. The old main-only video smoke
  // expects hidden controls and is not valid against this 9-tab production base.
  for(const route of ['discover','archivePage','mapPage','clips','boards','witness']){
    await page.locator('[data-tab="'+route+'"]').scrollIntoViewIfNeeded();
    await page.locator('[data-tab="'+route+'"]').click();
    await page.locator('#'+route).waitFor({state:'visible'});
  }
  await page.goto(base+'research/guest-preview.html',{waitUntil:'domcontentloaded'});
  equal((await page.locator('body').innerText()).includes('read-only demonstration'),true,profile+' guest preview readonly');
  await page.locator('[data-section="1"]').click();
  equal((await page.locator('#sample').innerText()).includes('2. Evidence'),true,profile+' guest sample section');
  await page.locator('.dd-site-dock').waitFor({state:'visible'});
  equal(await page.locator('.dd-site-dock-tab').count(),10,profile+' full Disclosure Desk navigation within Research Edition');
  equal(await page.locator('.dd-site-dock-tab[aria-current="page"]').getAttribute('data-dd-tab'),'researchStudio',profile+' W.NE remains selected');
  await page.locator('.dd-site-dock-toggle').click();
  equal(await page.locator('.dd-site-dock').evaluate(el=>el.classList.contains('is-hidden')),true,profile+' hide navigation');
  await page.locator('.dd-site-dock-toggle').click();
  equal(await page.locator('.dd-site-dock').evaluate(el=>el.classList.contains('is-hidden')),false,profile+' show navigation');
  // Guest navigation shares the same deep-links as the main Disclosure Desk tabs.
  await page.locator('.dd-site-dock-tab[data-dd-tab="boards"]').click();
  await page.locator('#boards').waitFor({state:'visible'});
  equal(new URL(page.url()).searchParams.get('dd_tab'),'boards',profile+' returns directly to chosen main-site section');
  await page.goto(base+'research/guest-preview.html',{waitUntil:'domcontentloaded'});
  await page.locator('a.dd-return-to-site').click();
  await page.locator('[data-tab="discover"]').waitFor({state:'visible'});
  equal(await page.locator('.nav-inner').isVisible(),true,profile+' guest return restores main website navigation');
  await page.goto(base+'research/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('a.dd-return-to-site').click();
  await page.locator('[data-tab="researchStudio"]').waitFor({state:'visible'});
  equal(await page.locator('.nav-inner').isVisible(),true,profile+' Research Studio landing exit returns to main website');
  // Test W.NE save-before-navigation without creating any real Supabase data.
  // A local HTML fixture supplies a fake editor whose save resolves only when
  // the test explicitly decides success or failure.
  await page.route('**/research/research-workspace.html',route=>route.fulfill({
   status:200,contentType:'text/html',
   body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><header>Research Studio test editor</header><main><iframe id="writer" srcdoc="<html><body>Disposable editor test</body></html>"></iframe></main><script src="./research-site-nav.js"></script></body></html>'
  }));
  await page.goto(base+'research/research-workspace.html',{waitUntil:'domcontentloaded'});
  await page.locator('.dd-site-dock').waitFor({state:'visible'});
  await page.evaluate(()=>{
   const frame=document.querySelector('#writer');
   frame.contentWindow.wneSaveBeforeNavigation=()=>new Promise(resolve=>{window.__resolveTestSave=resolve});
  });
  await page.locator('.dd-site-dock-tab[data-dd-tab="boards"]').click();
  equal(new URL(page.url()).pathname.endsWith('/research/research-workspace.html'),true,profile+' save must finish before navigation');
  await page.evaluate(()=>window.__resolveTestSave(false));
  await page.locator('.dd-site-dock-status[data-error="yes"]').waitFor({state:'visible'});
  equal(new URL(page.url()).pathname.endsWith('/research/research-workspace.html'),true,profile+' failed save keeps editor open');
  await page.locator('.dd-site-dock-tab[data-dd-tab="boards"]').click();
  equal(new URL(page.url()).pathname.endsWith('/research/research-workspace.html'),true,profile+' pending save keeps editor open');
  await page.evaluate(()=>window.__resolveTestSave(true));
  await page.waitForURL('**/?dd_tab=boards');
  await page.locator('#boards').waitFor({state:'visible'});
  await page.unroute('**/research/research-workspace.html');
  await page.goto(base+'privacy.html',{waitUntil:'domcontentloaded'});
  equal((await page.locator('body').innerText()).includes('W.NE Research Edition'),true,profile+' policy covers W.NE');
  await page.goto(base+'research-edition.html',{waitUntil:'domcontentloaded'});
  equal((await page.locator('h1').innerText()).includes('Write. Nothing Else.'),true,profile+' indexable public W.NE overview');
  equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://uapdisclosuredesk.com/research-edition.html',profile+' canonical public page');
  console.log(profile+': W.NE tab, existing LIVE/Watch & Read tabs, full tour, focused tour, Explore, About, contact, footer, guest preview and Privacy Policy passed');
  await context.close();
 }
}finally{await browser.close();server.close()}
