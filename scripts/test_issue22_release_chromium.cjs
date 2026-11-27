'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright-core');
const {weeklyQuestion} = require('../assets/research-spotlight.js');

const local = 'http://127.0.0.1:4173';
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
  const browser = await chromium.launch({
    executablePath:process.env.CHROME_PATH,
    args:['--no-sandbox','--disable-dev-shm-usage'],
  });
  try{
    for (const width of widthList) {
      const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
      await localOnly(context);
      const page=await context.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(local+'/',{waitUntil:'load'});
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('id'),'ddHomeSkip');
      const homeDock=await checkDock(page,'#ddHomeDock',width);
      const more=await openMore(page,homeDock);
      await more.dialog.getByRole('button',{name:'Boards',exact:true}).click();
      await page.locator('#boards').waitFor();
      await page.waitForFunction(() => document.querySelector('.dd-dock-more')?.getAttribute('aria-expanded') === 'false');
      assert.ok(await more.trigger.evaluate(el=>el.classList.contains('dd-dock-current')));
      await page.goBack();
      await page.locator('#discover').waitFor();

      await page.locator('#ddHomeDock [data-tab="originalResearchPage"]').click();
      await page.getByRole('button',{name:/Original investigations/}).click();
      await page.locator('#ddOriginalReader [data-dd-reader-view="investigations"] a[href="/rendlesham-forest-1980"]').first().click();
      const ledger=page.locator('#dd-reader-rendlesham-forest-1980-record-ledger');
      await ledger.waitFor();
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
    assert.equal(await page.locator('#archive-public-index a').count(),24);
    assert.ok(await page.locator('#archive-public-index').isVisible());
    await page.goto(local+'/who-is-who');
    assert.ok(await page.locator('#peopleCards a').count()>=50);
    const staticBio=page.locator('#peopleCards a[href="/nasa-mike-gold"]');
    await staticBio.click();
    assert.equal(new URL(page.url()).pathname,'/nasa-mike-gold');
    assert.ok(await page.locator('#primary-sources a').count()>=2);
    assert.equal((await offline.request.get(local+'/missing-issue22-test')).status(),404);
    assert.match(await (await offline.request.get(local+'/research/wne.html')).text(),/name="robots" content="noindex/);
    assert.equal((await offline.request.get(local+'/docs/issues.md')).status(),404);
    const oneWeek=7*86400000, friday=Date.UTC(2026,10,27);
    assert.equal(weeklyQuestion(friday).id,weeklyQuestion(friday+86400000).id);
    assert.notEqual(weeklyQuestion(friday).id,weeklyQuestion(friday+oneWeek).id);
    console.log('PASS '+routes.length+' indexable routes, three JPEG responses, no-JS public indices, private-site boundaries and weekly question cadence');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
