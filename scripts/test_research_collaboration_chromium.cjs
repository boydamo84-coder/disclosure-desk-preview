'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright-core');
const axe = require('axe-core');
const index = require('../data/pursue-index.json');
const seed = require('../docs/research-release/discussion-host-queue.json');

const root = path.resolve('.release-staging/public-site');
const mime = {js:'text/javascript',css:'text/css',json:'application/json',html:'text/html',pdf:'application/pdf'};
const server = http.createServer((request,response) => {
  const url = new URL(request.url,'http://localhost');
  let file = path.resolve(root,'.'+url.pathname);
  if (!file.startsWith(root + path.sep) && file !== root) return response.writeHead(404).end();
  if (url.pathname.endsWith('/')) file=path.join(file,'index.html');
  else if (!path.extname(file)) file+='.html';
  if (!fs.existsSync(file)) return response.writeHead(404).end();
  response.writeHead(200,{'Content-Type':mime[path.extname(file).slice(1)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(response);
});

async function text(page,selector,value) {
  await page.waitForFunction(({selector,value}) => document.querySelector(selector)?.textContent.includes(value), {selector,value});
}
async function accessibility(page,route,width) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,route+' overflow at '+width);
  await page.addScriptTag({content:axe.source});
  const violations = await page.evaluate(async () => (await axe.run(document, {
    runOnly: {type:'tag', values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
  })).violations.map(result => ({id:result.id,nodes:result.nodes.map(item=>item.target)})));
  assert.deepEqual(violations,[],route+' axe findings at '+width);
}

(async () => {
  assert.equal(index.records.length,521);
  assert.equal(index.releases.length,8);
  assert.equal(new Set(index.records.map(r=>r.key)).size,521);
  assert.equal(index.sourceSha256,'bae7455d6b5dff3ab84beb22607bc119db27cfb45a2746cec3c39e8a7662b247');
  for(const record of index.records) {
    const url = new URL(record.source);
    assert.equal(url.protocol,'https:');
    assert.ok(['www.war.gov','www.dvidshub.net'].includes(url.host));
    for (const [,related] of record.related || []) {
      if (related.startsWith('/pursue#record-')) assert.ok(index.records.some(r=>r.key===related.slice(15)));
    }
  }
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    for (const width of [320,393,820,1280]) {
      const context = await browser.newContext({viewport:{width,height:950},acceptDownloads:true,serviceWorkers:'block'});
      const external = [];
      await context.route('**/*',route => {
        const url=new URL(route.request().url());
        if (url.origin===base || url.protocol==='blob:') return route.continue();
        external.push(url.origin);
        return route.abort('blockedbyclient');
      });
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/research-collaborations');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Skip to content');
      await page.keyboard.press('Enter');
      const main=page.locator('main');
      assert.equal(await main.evaluate(node=>node===document.activeElement),true);
      await accessibility(page,'research-collaborations',width);
      await page.getByLabel('Project summary').fill('   ');
      await page.getByRole('button',{name:'Open email draft'}).click();
      await text(page,'#enquiry-status','Enter a short project summary');
      assert.match(await page.getByRole('link',{name:'Email the research desk directly'}).getAttribute('href'),/^mailto:support@uapdisclosuredesk.com/);
      await page.getByRole('link',{name:'Search PURSUE'}).click();
      await text(page,'#archive-status','521 records');
      await accessibility(page,'pursue',width);
      await page.getByLabel('Release',{exact:true}).selectOption('4');
      await text(page,'#archive-status','40 records');
      await page.getByLabel('File type').selectOption('Document');
      await text(page,'#archive-status','14 of 14');
      await page.getByLabel('Find a record').fill('DOW-UAP-D089');
      await text(page,'#archive-status','1 of 1');
      const record=page.locator('#record-r04-dow-uap-d089');
      const original=await record.getByRole('link',{name:'Open original document'}).getAttribute('href');
      assert.match(original,/war.gov.*DOW-UAP-D089/);
      assert.match(await record.innerText(),/companion material identified by AARO/i);
      await record.getByRole('button',{name:'Save to W.NE references'}).click();
      await text(page,'#record-r04-dow-uap-d089 [role=status]','Saved to W.NE');
      await record.getByRole('button',{name:'Save to W.NE references'}).click();
      await text(page,'#record-r04-dow-uap-d089 [role=status]','already');
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('wne_research_references_v1')).map(row=>row.url)),[original]);
      const downloadEvent=page.waitForEvent('download');
      await page.getByRole('button',{name:'Save results for offline reading'}).click();
      const download=await downloadEvent;
      const offline=fs.readFileSync(await download.path(),'utf8');
      assert.match(offline,/PURSUE offline index/);
      assert.match(offline,/DOW-UAP-D089/);
      assert.doesNotMatch(offline,/<script|DOW-UAP-D090|Add to Board/i);
      await page.getByLabel('Find a record').fill('no known result for this phrase');
      await text(page,'#archive-status','No records match');
      await page.goto(base+'/pursue#record-r04-dow-uap-d089');
      await record.waitFor();
      assert.equal(await record.evaluate(node=>node===document.activeElement),true);
      const board=await record.getByRole('link',{name:'Add to Board'}).getAttribute('href');
      await page.getByRole('link',{name:'FOIA Tracker',exact:true}).click();
      await text(page,'#foia-status','2 requests');
      await accessibility(page,'foia-tracker',width);
      await page.getByLabel('Status',{exact:true}).selectOption('open');
      await text(page,'#foia-status','1 request');
      assert.equal(await page.locator('#request-27-f-0917').isVisible(),false);
      await page.getByLabel('Find a request').fill('25-F-3215');
      assert.match(await page.locator('#request-25-f-3215').innerText(),/open on 19 November/);
      const evidence=await page.locator('#request-25-f-3215').getByRole('link',{name:/Referral and tracking evidence/}).getAttribute('href');
      const pdf=await page.request.get(base+evidence);
      assert.equal(pdf.status(),200);
      assert.equal((await pdf.body()).subarray(0,5).toString(),'%PDF-');
      await page.goto(base+'/discussion-hosts#scientist');
      await accessibility(page,'discussion-hosts',width);
      assert.equal(await page.getByText('Automated discussion host',{exact:true}).count(),5);
      assert.deepEqual(external,[],'Public research should make no third-party requests automatically');
      assert.deepEqual(errors,[]);
      await page.goto(base+board);
      await page.getByRole('button',{name:'Choose investigation board'}).click();
      await page.getByRole('button',{name:'Create a new collection'}).click();
      await page.locator('#pickerNewName').fill('PURSUE test board');
      await page.getByRole('button',{name:'Create and save'}).click();
      await text(page,'#boardList','DOW-UAP-D089');
      assert.equal(await page.locator('#boardList a').filter({hasText:/DOW-UAP-D089/}).first().getAttribute('href'),original);
      assert.ok(!external.some(origin=>origin.includes('adsterra')||origin.includes('googletagmanager')));
      await context.close();
      console.log('PASS research links, filters, source handoff, offline download and accessibility at '+width+'px');
    }

    // Exercise the dashboard realistically while using fictional RPC responses.
    // Actual permissions, idempotency and expiry are verified by the database suite.
    const context=await browser.newContext({viewport:{width:393,height:850},userAgent:'DisclosureDeskAndroid Test'});
    const id='7d4e05c0-6329-4ee0-b62f-307cae42740f';
    let allowed=false;
    let writes=0;
    const first=seed[0];
    const post={...first,id,section_key:first.sectionKey,state:'draft',posted_at:null};
    await context.route(base+'/fixture',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><html lang="en"><meta charset="utf-8"><title>Host fixture</title>
    <details id="ddDiscussionHostAdmin" hidden><summary>Discussions · Automated Hosts</summary><p role="status"></p><div data-host-queue></div></details>
    <div id="robot"></div><div id="member"></div>
    <script src="/assets/discussion-hosts.js" defer></script></html>`}));
    await context.exposeBinding('hostRpc',(_source,name,args={})=>{
      if(name.startsWith('dd_host_admin_')&&!allowed) return {error:{message:'Discussion Host owner access required'}};
      if(name==='dd_host_admin_queue')return {data:{trial:{paused:true,enabled_by_operator:false},posts:[post],sections:[{key:first.sectionKey,title:'UFO UAP Sightings'}],audit:[]}};
      if(name==='dd_host_admin_edit'){writes++;post.title=args.p_title;return {data:true};}
      if(name==='dd_host_admin_post'){writes++;post.state='approved';return {data:true};}
      return {data:[]};
    });
    await context.addInitScript(user=>{
      window.DD_COMMUNITY_FEATURES={discussionHosts:true};
      window.DD_COMMUNITY_TEST_CONFIG={url:'https://example.invalid',publishableKey:'fixture'};
      window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:{id:user}}}),
        onAuthStateChange:fn=>{window.testAuthEvent=fn;}},rpc:window.hostRpc})};
    },id);
    const page=await context.newPage();
    await page.goto(base+'/fixture');
    const dashboard=page.locator('#ddDiscussionHostAdmin');
    await dashboard.locator('summary').first().click();
    await text(page,'[role=status]','owner access required');
    assert.equal(writes,0);
    allowed=true;
    await dashboard.locator('summary').first().click();
    await dashboard.locator('summary').first().click();
    await text(page,'[role=status]','queue loaded');
    assert.equal(await page.getByRole('button',{name:'Resume posting'}).isDisabled(),true);
    const queued = page.locator('[data-host-queue] details.dd-forum-item > summary').first();
    assert.match(await queued.innerText(), /Day 1 · 09:00 UTC/);
    await queued.click();
    await page.getByText('Edit post and time',{exact:true}).click();
    await page.getByLabel('Title',{exact:true}).fill('Edited research starter');
    await page.getByRole('button',{name:'Save edits for review'}).click();
    await text(page,'[role=status]','Change saved');
    assert.match(await queued.innerText(), /Edited research starter/);
    await queued.click();
    await page.getByRole('button',{name:'Approve post'}).click();
    await page.getByText(/approved · Edited research starter/).waitFor();
    assert.equal(writes,2);
    await page.evaluate(id=>{
      const labels=async ()=>[{id,host:'investigator'}];
      DDDiscussionHosts.attach(document.querySelector('#robot'),{id,created_at:new Date().toISOString()},labels);
      DDDiscussionHosts.attach(document.querySelector('#member'),{id:'2a2299cb-a794-4060-a0df-3cb546a3c656',created_at:new Date().toISOString()},labels);
    },id);
    await page.locator('#robot').getByRole('link',{name:'The Investigator · Automated host'}).waitFor();
    assert.equal(await page.locator('#member a').count(),0);
    await page.evaluate(()=>window.testAuthEvent('SIGNED_OUT'));
    assert.equal(await page.locator('[data-host-queue]').innerText(),'');
    assert.equal(await dashboard.evaluate(node=>node.open),false);
    await context.close();
    console.log('PASS host owner dashboard and Android-user-agent badge fixture, including account-switch clearing');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
