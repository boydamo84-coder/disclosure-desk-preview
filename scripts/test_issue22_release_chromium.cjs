'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright-core');
const {weeklyQuestion} = require('../assets/research-spotlight.js');

const staging = path.resolve('.release-staging/public-site');
const mime = {html:'text/html',css:'text/css',js:'text/javascript',json:'application/json',jpg:'image/jpeg',svg:'image/svg+xml',pdf:'application/pdf',mp4:'video/mp4'};
const server = http.createServer((request,response) => {
  const {pathname} = new URL(request.url,'http://localhost');
  if(pathname==='/favicon.ico')return response.writeHead(302,{Location:'/assets/disclosure-desk-mark.svg'}).end();
  let file = path.resolve(staging,'.'+pathname);
  if(file!==staging&&!file.startsWith(staging+path.sep))return response.writeHead(404).end();
  if(pathname.endsWith('/'))file=path.join(file,'index.html');
  else if(!path.extname(file))file+='.html';
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return response.writeHead(404).end();
  const contentType=mime[path.extname(file).slice(1)]||'application/octet-stream';
  response.writeHead(200,{'Content-Type':contentType});
  fs.createReadStream(file).pipe(response);
});
let local;
const canonicalOrigin = 'https://uapdisclosuredesk.com';
const primary = ['discover', 'archivePage', 'originalResearchPage', 'peopleDirectory', 'researchStudio'];
const sitemap = fs.readFileSync('.release-staging/public-site/sitemap.xml','utf8');
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
const widthList = [320, 393, 820, 1280];

async function localOnly(context) {
  await context.route('**/*', route => new URL(route.request().url()).origin === local ?
    route.continue() : route.abort('blockedbyclient'));
}
async function openMore(page, root) {
  const trigger = root.getByRole('button', {name:'More', exact:true});
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {name:'More destinations'});
  await dialog.waitFor();
  assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  return {trigger, dialog};
}
async function checkDock(page, selector, width) {
  const root = page.locator(selector);
  await root.waitFor();
  assert.deepEqual(await root.locator('.nav-inner [data-tab]').evaluateAll(nodes => nodes.map(node => node.dataset.tab)),primary);
  const dimensions = await root.locator('.nav-inner .tab').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return {width:r.width,height:r.height,inside:r.left>=0&&r.right<=innerWidth,icon:!!node.querySelector('svg[aria-hidden="true"]')};
  }));
  assert.equal(dimensions.length,6);
  assert.ok(dimensions.every(d => d.width>=44&&d.height>=44&&d.inside&&d.icon),width+' px dock '+JSON.stringify(dimensions));
  const {trigger,dialog} = await openMore(page,root);
  for(const label of ['Map','Videos','LIVE','Boards','Witness','Discussions','Watch & Read','Profile','Help','Case Files','Rabbit Hole','Documents','Podcasts','About']){
    await dialog.getByRole('button',{name:label,exact:true}).waitFor();
  }
  const profile=dialog.getByRole('button',{name:'Profile',exact:true});
  // Real geometry catches stale main-dock avatar CSS overriding More row layout.
  const profileLayout=()=>profile.evaluate(el=>{
    const icon=el.querySelector('.ico'), text=[...el.childNodes].find(node=>node.nodeType===3&&node.textContent.trim());
    const range=document.createRange();range.selectNodeContents(text);
    const a=icon.getBoundingClientRect(),b=range.getBoundingClientRect(),r=el.getBoundingClientRect();
    const css=getComputedStyle(el);
    return {direction:css.flexDirection,iconLeft:a.left,iconRight:a.right,labelLeft:b.left,
      centerDifference:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),rowLeft:r.left,rowHeight:r.height};
  });
  const assertAligned=async()=>{const g=await profileLayout();
    assert.equal(g.direction,'row');assert.ok(g.iconRight<g.labelLeft&&g.centerDifference<3&&g.iconLeft-g.rowLeft<16&&g.rowHeight>=44,JSON.stringify(g));
  };
  await assertAligned();
  // Exercise the owner-photo rendering path without contacting account/storage services.
  const previousIcon=await profile.evaluate(el=>{const ico=el.querySelector('.ico'),html=ico.innerHTML;
    const image=document.createElement('img');image.alt='';image.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="23" height="23"%3E%3Ccircle cx="11.5" cy="11.5" r="11.5" fill="%2375899d"/%3E%3C/svg%3E';ico.replaceChildren(image);return html;});
  await assertAligned();
  await profile.evaluate((el,html)=>{el.querySelector('.ico').innerHTML=html;},previousIcon);
  assert.match(await page.locator(':focus').textContent(),/Close|Help/);
  await page.keyboard.press('Tab');
  assert.ok(await dialog.locator(':focus').count(),'Tab stays inside More');
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(() => document.activeElement?.textContent === 'More');
  await page.waitForFunction(() => document.querySelector('.dd-dock-more')?.getAttribute('aria-expanded') === 'false');
  return root;
}

(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    local='http://127.0.0.1:'+server.address().port;
    browser = await chromium.launch({
    executablePath:process.env.CHROME_PATH,
      args:['--no-sandbox','--disable-dev-shm-usage'],
    });
    for (const width of widthList) {
      const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
      await localOnly(context);
      const page=await context.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(local+'/',{waitUntil:'load'});
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('id'),'ddHomeSkip');
      const cog=page.locator('#ddHomeThemeMenu summary');
      const touch=await cog.boundingBox();
      assert.ok(touch.width>=44&&touch.height>=44);
      await cog.click();
      assert.ok(await page.locator('#ddHomeThemeMenu').evaluate(el=>el.open));
      await page.keyboard.press('Escape');
      assert.ok(!await page.locator('#ddHomeThemeMenu').evaluate(el=>el.open));
      const homeDock=await checkDock(page,'#ddHomeDock',width);
      const more=await openMore(page,homeDock);
      await more.dialog.getByRole('button',{name:'Boards',exact:true}).click();
      await page.locator('#boards').waitFor();
      await page.waitForFunction(() => document.querySelector('.dd-dock-more')?.getAttribute('aria-expanded') === 'false');
      assert.ok(await more.trigger.evaluate(el=>el.classList.contains('dd-dock-current')));
      await page.goBack();
      await page.locator('#discover').waitFor();

      await page.locator('#ddHomeDock [data-tab="originalResearchPage"]').click();
      assert.equal(await page.locator('#ddSiteBack').isVisible(),false,'Research root has no redundant header Back');
      await page.getByRole('button',{name:/Original investigations/}).click();
      await page.locator('#ddOriginalReader [data-dd-reader-view="investigations"] a[href="/rendlesham-forest-1980"]').first().click();
      const ledger=page.locator('#dd-reader-rendlesham-forest-1980-record-ledger');
      await ledger.waitFor();
      assert.equal(await page.locator('#ddSiteBack').isVisible(),false,'Research reader uses its own Back');
      assert.equal(await page.locator('#ddReaderBack').isVisible(),true,'Dossier keeps its functional reader Back');
      assert.match(await ledger.innerText(),/signed memo/);
      assert.equal(await page.locator('#ddReaderSharePage').getAttribute('href'),'/rendlesham-forest-1980');
      await page.locator('#ddReaderBack').click();
      await page.locator('#ddOriginalReader [data-dd-reader-view="investigations"] a[href="/roswell-1947"]').first().click();
      await page.locator('#dd-reader-roswell-1947-record-ledger a[href$="#page=6"]').waitFor();
      assert.equal(await page.locator('#ddReaderSharePage').getAttribute('href'),'/roswell-1947');

      await page.goto(local+'/who-is-who?person=mike-gold');
      const profile=page.locator('#personProfile');
      await profile.waitFor();
      assert.match(await profile.locator('#profileRecordStatus').textContent(),/Source linked/);
      assert.equal(await profile.locator('#profileFullStory').getAttribute('open'),null);
      const nav=await checkDock(page,'#ddWebSecondaryNav',width);
      await nav.getByRole('button',{name:'Who’s Who in Disclosure'}).click();
      await page.locator('#peopleSearch').fill('Fravor');
      await page.locator('#peopleCards [data-person-id="david-fravor"] button').first().waitFor();
      const method=page.locator('.dd-who-methodology');
      assert.equal(await method.getAttribute('open'),null);
      await method.locator('summary').first().click();
      await page.locator('#ddWhoSourceTracker').waitFor();

      for(const route of ['/pursue','/foia-tracker','/sources','/site-updates','/foia-whs-27-f-0917']){
        await page.goto(local+route);
        await page.locator('#ddWebSecondaryNav').waitFor();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow at '+route+' '+width);
      }
      assert.deepEqual(errors,[],'Unexpected JavaScript errors at '+width);
      await context.close();
      console.log('PASS '+width+'px: SVG targets, More keyboard/focus, Boards Back, both embedded dossiers, profile search and secondary layout');
    }

    const offline = await browser.newContext({javaScriptEnabled:false,viewport:{width:393,height:850}});
    await localOnly(offline);
    const page=await offline.newPage(),images=new Set();
    for (const route of [...routes,'/discussion-hosts']) {
      const response=await page.goto(local+route);
      assert.equal(response.status(),200,route);
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),canonicalOrigin+route);
      const meta=(selector)=>page.locator('meta['+selector+']').getAttribute('content');
      assert.equal(await meta('property="og:title"'),await page.title(),route);
      assert.equal(await meta('name="twitter:description"'),await meta('name="description"'),route);
      assert.equal(await meta('name="twitter:card"'),'summary_large_image');
      const image=await meta('property="og:image"');
      assert.equal(await meta('name="twitter:image"'),image);
      images.add(image);
    }
    for(const image of images){
      const url=new URL(image);
      const response=await offline.request.get(local+url.pathname);
      assert.equal(response.status(),200);
      assert.match(response.headers()['content-type'],/^image\/jpeg/);
      const bytes=await response.body();
      assert.ok(bytes.length>10000&&bytes.length<300000);
    }
    assert.equal(images.size,3);
    await page.goto(local+'/pursue');
    const catalogue=JSON.parse(fs.readFileSync(path.join(staging,'data/pursue-index.json'),'utf8'));
    assert.equal(await page.locator('#archive-public-index a').count(),catalogue.records.length);
    assert.ok(await page.locator('#archive-public-index').isVisible());
    assert.equal(await page.locator('#archive-public-index .dd-public-release').count(),catalogue.releases.length);
    const release=page.locator('#archive-public-index .dd-public-release').first();
    await release.locator('summary').click();
    assert.ok(await release.locator('a').first().isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.goto(local+'/who-is-who');
    assert.ok(await page.locator('#peopleCards a').count()>=50);
    const staticBio=page.locator('#peopleCards a[href="/nasa-mike-gold"]');
    await staticBio.click();
    assert.equal(new URL(page.url()).pathname,'/nasa-mike-gold');
    assert.ok(await page.locator('#primary-sources a').count()>=2);
    assert.equal((await offline.request.get(local+'/missing-issue22-test')).status(),404);
    const legacyIcon=await offline.request.get(local+'/favicon.ico',{maxRedirects:0});
    assert.equal(legacyIcon.status(),302);
    assert.equal(legacyIcon.headers().location,'/assets/disclosure-desk-mark.svg');
    assert.match(await (await offline.request.get(local+'/research/wne.html')).text(),/name="robots" content="noindex/);
    assert.equal((await offline.request.get(local+'/docs/issues.md')).status(),404);
    const oneWeek=7*86400000, friday=Date.UTC(2026,10,27);
    assert.equal(weeklyQuestion(friday).id,weeklyQuestion(friday+86400000).id);
    assert.notEqual(weeklyQuestion(friday).id,weeklyQuestion(friday+oneWeek).id);
    console.log('PASS '+routes.length+' indexable routes, three JPEG responses, no-JS public indices, private-site boundaries and weekly question cadence');
  }finally{
    await browser?.close();
    server.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
