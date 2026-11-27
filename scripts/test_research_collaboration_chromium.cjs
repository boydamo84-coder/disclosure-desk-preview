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
const mime = {js:'text/javascript',css:'text/css',json:'application/json',html:'text/html',pdf:'application/pdf',mp4:'video/mp4',jpg:'image/jpeg'};
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
async function researchActions(page,container,width,key="foia-25-f-3215") {
  const transfer=container.locator('[data-research-transfer="'+key+'"]');
  const buttons=transfer.locator('.actions > :is(a.action,button)');
  assert.deepEqual(await buttons.allTextContents(),['Add to Board','+ W.NE Ref','Open W.NE']);
  const styles=await buttons.evaluateAll(nodes=>nodes.map(n=>{
    const s=getComputedStyle(n),r=n.getBoundingClientRect();
    const rgb=v=>v.match(/\d+/g).slice(0,3).map(Number);
    const lum=v=>rgb(v).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4)
      .reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
    const l1=lum(s.color),l2=lum(s.backgroundColor);
    return {bg:s.backgroundColor,fg:s.color,contrast:(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05),
      height:r.height,left:r.left,right:r.right,viewport:innerWidth};
  }));
  for(const style of styles){
    assert.equal(style.bg,'rgb(25, 43, 58)','Research actions must be muted navy');
    assert.equal(style.fg,'rgb(225, 197, 142)','Research actions must use readable muted gold');
    assert.ok(style.contrast>=4.5&&style.height>=44&&style.left>=0&&style.right<=style.viewport,
      'Research action contrast and touch target at '+width+'px: '+JSON.stringify(style));
  }
  assert.ok((await buttons.first().getAttribute('href')).endsWith('dd_research='+key));
  assert.match(await buttons.last().getAttribute('href'),/dd_tab=researchStudio/);
  const save=transfer.getByRole('button',{name:'+ W.NE Ref — Save to W.NE references'});
  await save.click();
  assert.match(await transfer.locator('[role=status]').innerText(),/Saved to W.NE/);
  await save.click();
  assert.match(await transfer.locator('[role=status]').innerText(),/already/);
  console.log('PASS muted research controls, compact label, contrast '+styles[0].contrast.toFixed(2)+':1 and reference save at '+width+'px');
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
  // Native readers must preserve the entire canonical article, not drift into a second editorial version.
  const nativeHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const key of ['investigations','rendlesham-forest-1980','roswell-1947']){
    const source=fs.readFileSync(path.join(root,key+'.html'),'utf8');
    const body=source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1]
      .replace(/\bid="([^"]+)"/g,(_,id)=>'id="dd-reader-'+key+'-'+id+'"')
      .replace(/href="#([^"]+)"/g,(_,id)=>'href="#dd-reader-'+key+'-'+id+'"')
      .replace(/class="([^"]+)"/g,(_,classes)=>'class="'+classes.split(/\s+/).map(x=>['muted','small','tag'].includes(x)?x:'dd-reader-'+x).join(' ')+'"')
      .replace(/<(\/?)h1\b/g,'<$1h2');
    assert.ok(nativeHtml.includes(body),'Native reader differs from canonical article: '+key);
  }
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
      await record.getByRole('button',{name:'+ W.NE Ref — Save to W.NE references'}).click();
      await text(page,'#record-r04-dow-uap-d089 [role=status]','Saved to W.NE');
      await record.getByRole('button',{name:'+ W.NE Ref — Save to W.NE references'}).click();
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
      await researchActions(page,page.locator('#request-25-f-3215'),width);
      const evidence=await page.locator('#request-25-f-3215').getByRole('link',{name:/Referral and tracking evidence/}).getAttribute('href');
      const pdf=await page.request.get(base+evidence);
      assert.equal(pdf.status(),200);
      assert.equal((await pdf.body()).subarray(0,5).toString(),'%PDF-');
      await page.goto(base+'/investigations#navy-video-records-referral');
      await researchActions(page,page.locator('#navy-video-records-referral'),width,'navy-video-records-referral');
      await page.goto(base+'/discussion-hosts#scientist');
      await accessibility(page,'discussion-hosts',width);
      assert.equal(await page.getByText('Automated discussion host',{exact:true}).count(),5);
      assert.deepEqual(external,[],'Public research should make no third-party requests automatically');
      assert.deepEqual(errors,[]);
      await page.goto(base+board);
      await page.getByRole('button',{name:'Choose investigation board'}).click();
      assert.match(await page.locator('#ddBoardLocalNotice').innerText(),/Saved on this device only.*Copy device boards to cloud/s);
      await page.getByRole('button',{name:'Create a new collection'}).click();
      await page.locator('#pickerNewName').fill('PURSUE test board');
      await page.getByRole('button',{name:'Create and save'}).click();
      await text(page,'#boardList','DOW-UAP-D089');
      assert.match(await page.locator('#ddBoardToast').textContent(),/Saved on this device/);
      assert.equal(await page.locator('#boardList a').filter({hasText:/DOW-UAP-D089/}).first().getAttribute('href'),original);
      assert.ok(!external.some(origin=>origin.includes('adsterra')||origin.includes('googletagmanager')));
      await context.close();
      console.log('PASS research links, filters, source handoff, offline download and accessibility at '+width+'px');
    }

    // Homepage theme and release history: actual staged HTML, local media and real Chromium.
    for(const width of [393,1280]){
      const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
      try {
        await ctx.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort('blockedbyclient'));
        const page=await ctx.newPage();
        await page.goto(base+'/index.html?dd_tab=discover');
        const hero=page.locator('#ddHomeThemeHero'),video=page.locator('#ddHomeThemeVideo'),choice=page.locator('#ddHomeThemeChoice'),pause=page.locator('#ddHomeThemePause');
        await hero.waitFor({state:'visible'});
        assert.equal(await choice.inputValue(),'nightfall');
        assert.equal(await choice.locator('option[value="orbital"]').count(),0);
        await page.waitForFunction(()=>{const v=document.getElementById('ddHomeThemeVideo');return v.readyState>=2&&!v.paused&&v.classList.contains('dd-playing')});
        assert.ok(await video.evaluate(v=>v.currentSrc.endsWith('/data/nightfall.mp4')&&v.muted&&v.loop));
        const updates=await ctx.newPage();
        await updates.goto(base+'/site-updates.html');
        assert.ok(await updates.getByText('Research & Collaboration',{exact:true}).isVisible());
        assert.ok(await updates.locator('.dd-updates-theme-live').isVisible());
        assert.equal(await updates.locator('#ddR3ReleaseAnnouncement').isVisible(),false);
        await updates.locator('.dd-updates-history > summary').click();
        assert.ok(await updates.locator('#ddR3ReleaseAnnouncement').isVisible());
        await updates.close();
        assert.ok(await page.locator('#ddSiteUpdatesButton').isVisible());
        const cog=page.locator('#ddHomeThemeMenu > summary');
        assert.equal(await choice.isVisible(),false);
        await cog.click();
        assert.equal(await choice.isVisible(),true);
        await pause.click();
        await page.waitForFunction(()=>!document.getElementById('ddHomeThemeVideo').hasAttribute('src'));
        await choice.selectOption('eclipse');
        await pause.click();
        await page.waitForFunction(()=>{const v=document.getElementById('ddHomeThemeVideo');return v.currentSrc.endsWith('/data/eclipse.mp4')&&!v.paused&&v.readyState>=2});
        await choice.selectOption('classic');
        await page.waitForFunction(()=>!document.getElementById('ddHomeThemeVideo').hasAttribute('src'));
        await page.reload();
        assert.equal(await choice.inputValue(),'classic');
        assert.equal(await choice.isVisible(),false);
        await cog.click();
        await page.emulateMedia({reducedMotion:'reduce'});
        await choice.selectOption('nightfall');
        assert.equal(await pause.isDisabled(),true);
        assert.equal(await video.getAttribute('src'),null);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        await page.keyboard.press('Escape');
        assert.equal(await choice.isVisible(),false);
        await page.goto(base+'/index.html?dd_tab=archivePage');
        const shortcut=page.locator('#ddArchivePursueShortcut');
        await shortcut.waitFor({state:'visible'});
        await page.waitForFunction(()=>Array.from(document.querySelectorAll('#archiveCategory option')).some(o=>o.value==='PURSUE'));
        const before=page.url();
        await shortcut.click();
        await page.waitForFunction(()=>document.querySelector('#archiveStatus').textContent.startsWith('521 of '));
        assert.equal(page.url(),before);
        assert.equal(await shortcut.getAttribute('aria-pressed'),'true');
        const cards=page.locator('#archiveList .dd-archive-card');
        assert.ok(await cards.count()>0);
        assert.equal(await cards.first().locator('[data-save-archive]').count(),1);
        await page.locator('#archiveSearch').fill('DOW-UAP-D089');
        await page.waitForFunction(()=>document.querySelector('#archiveStatus').textContent.startsWith('1 of '));
        const card=cards.first();
        assert.match(await card.innerText(),/DOW-UAP-D089/);
        assert.match(await card.locator('.dd-archive-source-link').getAttribute('href'),/war.gov.*DOW-UAP-D089/);
        assert.equal(await card.locator('[data-follow-archive]').count(),1);
        assert.equal(await card.locator('[data-share-archive]').count(),1);
        assert.equal(await card.locator('[data-compare-archive]').count(),1);
        assert.equal(await card.locator('[data-news-comments]').count(),1);
        await card.locator('[data-dd-sat-archive]').click();
        const sat=page.locator('#ddSatelliteDialog');
        await sat.waitFor({state:'visible'});
        assert.match(await sat.innerText(),/DOW-UAP-D089/);
        assert.match(await sat.innerText(),/No verified event date/);
        assert.equal(await sat.locator('#ddSatYearInput').inputValue(),'');
        assert.equal(await sat.locator('#ddSatMonthInput').inputValue(),'');
        assert.equal(await sat.locator('#ddSatDayInput').inputValue(),'');
        for(const provider of ['https://worldview.earthdata.nasa.gov/','https://pics.eumetsat.int/','https://earthexplorer.usgs.gov/','https://view.eumetsat.int/']){
          const link=sat.locator('a[href="'+provider+'"]');
          assert.ok(await link.isVisible(),'Missing manual satellite provider '+provider);
        }
        assert.match(await sat.getByRole('link',{name:'Read original government record'}).getAttribute('href'),/war.gov.*DOW-UAP-D089/);
        await sat.evaluate(n=>n.close());
        await card.locator('[data-open-archive]').click();
        await page.locator('#archiveCaseDialog').waitFor({state:'visible'});
        assert.match(await page.locator('#archiveCaseTitle').innerText(),/DOW-UAP-D089/);
        assert.equal(await page.locator('#archiveCaseBody [data-dd-sat-archive]').count(),1);
        assert.ok(await page.locator('#archiveCaseBody [data-dd-citation-url]').count()>0);
        assert.ok(await page.locator('#archiveCaseBody .dd-case-connections').isVisible());
        await page.evaluate(()=>document.getElementById('archiveCaseDialog').close());
        await shortcut.click();
        assert.equal(await shortcut.getAttribute('aria-pressed'),'false');
        await page.waitForFunction(()=>Number(document.querySelector('#archiveStatus').textContent.split(' ')[0])>521);
        assert.equal(await page.locator('#ddArchiveLoadedCount').textContent(),Number((await page.locator('#archiveStatus').textContent()).match(/of (\d+) source-linked/)[1]).toLocaleString('en-GB')+' RECORDS LOADED');
        assert.equal(await page.locator('#archivePage .dd-archive-people-shortcut').count(),0);
        await page.locator('#archivePage [data-dd-capabilities]').click();
        const help=page.locator('#ddResearchCapabilities');
        await help.waitFor({state:'visible'});
        assert.match(await help.innerText(),/Hypothesis Lab/);
        await help.locator('#ddCapabilitiesResearch').click();
        const research=page.locator('#originalResearchPage');
        await research.waitFor({state:'visible'});
        assert.equal(await page.locator('[data-tab="originalResearchPage"]').getAttribute('aria-current'),'page');
        await research.locator('[data-dd-research-panel="ddResearchFoia"]').click();
        assert.ok(await research.locator('#request-27-f-0917').isVisible());
        await research.locator('#foia-search').fill('25-F-3215');
        assert.ok(await research.locator('#request-25-f-3215').isVisible());
        await researchActions(page,research.locator('#request-25-f-3215'),width);
        await research.locator('[data-dd-research-panel="ddResearchFoiGuide"]').click();
        assert.ok(await research.getByText('Example wording',{exact:true}).isVisible());
        await research.locator('[data-dd-research-panel="ddResearchCollab"]').click();
        assert.ok(await research.locator('#collaboration-enquiry').isVisible());
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        await page.reload();
        await research.waitFor({state:'visible'});
        const reader=page.locator('#ddOriginalReader');
        const readerUrl=page.url();
        await research.locator('[data-dd-open-reader]').click();
        await reader.waitFor({state:'visible'});
        assert.equal(page.url(),readerUrl);
        assert.ok(await page.locator('.nav [data-tab="originalResearchPage"]').isVisible());
        assert.ok(await reader.getByRole('heading',{name:'Disclosure Desk Original Research'}).isVisible());
        assert.equal(await research.locator('.dd-research-hub-grid').isVisible(),false);
        await reader.getByRole('link',{name:'Open full research dossier'}).click();
        await reader.locator('[data-dd-reader-view="rendlesham-forest-1980"]').waitFor({state:'visible'});
        assert.equal(page.url(),readerUrl);
        await reader.locator('[data-dd-reader-view="rendlesham-forest-1980"] a[href="/roswell-1947"]').first().click();
        await reader.locator('[data-dd-reader-view="roswell-1947"]').waitFor({state:'visible'});
        assert.equal(page.url(),readerUrl);
        await reader.locator('#ddReaderBack').click();
        await reader.locator('[data-dd-reader-view="investigations"]').waitFor({state:'visible'});
        await reader.locator('#ddReaderBack').click();
        assert.equal(await reader.isVisible(),false);
        assert.ok(await research.locator('.dd-research-hub-grid').isVisible());
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        console.log('PASS native original investigations and dossier navigation at '+width+'px');
        const footerLinks=page.locator('.dd-sources-direct a');
        assert.equal(await footerLinks.count(),1);
        assert.equal(await footerLinks.first().getAttribute('href'),'/sources');
        // Flex items are blockified by CSS: computed display is flex, even when authored inline-flex.
        for(const section of ['originalResearchPage','discover','archivePage','boards','clips','discussionsPage']){
          await page.evaluate(id=>window.navigateTo(id),section);
          const layout=await footerLinks.first().evaluate(el=>{
            const b=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();
            return {width:b.width,left:b.left,right:b.right,height:b.height,display:getComputedStyle(el).display,centered:Math.abs((b.left+b.right-p.left-p.right)/2)<2,viewport:innerWidth};
          });
          assert.ok(layout.width>0&&layout.left>=0&&layout.right<=layout.viewport&&layout.height>=44&&['flex','inline-flex'].includes(layout.display)&&layout.centered,section+' footer geometry: '+JSON.stringify(layout));
        }
        console.log('PASS shared footer button geometry across main tabs at '+width+'px');
        console.log('PASS native Research hub, FOIA panels, capabilities and routing at '+width+'px');
        console.log('PASS native Evidence Archive PURSUE filtering, card and case detail at '+width+'px');
        console.log('PASS homepage themes, motion preference and collapsed release history at '+width+'px');
      } finally {await ctx.close()}
    }

    // Video feed: remote fixture, stable IDs, provider deduplication and failure fallback.
    {
      const ctx=await browser.newContext({viewport:{width:393,height:900},serviceWorkers:'block'});
      let fail=false,requests=0;
      const saved=JSON.parse(fs.readFileSync(path.join(root,'data/disclosure-clips.json'),'utf8'));
      const fixture=Array.from({length:12},(_,i)=>({id:'qa-remote-'+i,title:'QA catalogue video '+i,publisher:'QA fixture',source:'https://www.youtube.com/watch?v='+('QATEST000'+String(i).padStart(2,'0')),group:'YouTube',evidenceStatus:'unverified',youtubeId:'QATEST000'+String(i).padStart(2,'0'),discoveredAt:'2026-11-25T12:00:00Z'}));
      fixture.push({...fixture[0],id:'qa-provider-duplicate'});
      try{
        await ctx.route('**/*',route=>{
          const url=route.request().url();
          if(url==='https://raw.githubusercontent.com/boydamo84-coder/disclosure-desk-preview/main/data/disclosure-clips.json'){
            requests++;
            return fail?route.fulfill({status:503,body:'Unavailable'}):route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify([...saved,...fixture])});
          }
          return new URL(url).origin===base?route.continue():route.abort('blockedbyclient');
        });
        const page=await ctx.newPage();
        await page.goto(base+'/index.html?dd_tab=clips');
        await text(page,'#ddClipFeedStatus','Checked just now');
        await page.locator('#clipSearch').fill('QA catalogue video 0');
        const card=page.locator('#clipsFeed [data-video-id="qa-remote-0"]');
        await card.waitFor({state:'visible'});
        assert.equal(await page.locator('#clipsFeed [data-video-id="qa-provider-duplicate"]').count(),0);
        fail=true;
        await page.locator('#ddClipRefresh').click();
        await text(page,'#ddClipFeedStatus','Keeping last loaded catalogue');
        assert.ok(await card.isVisible());
        assert.ok(requests>=2);
        console.log('PASS video catalogue remote refresh, deduplication and fallback');
      }finally{await ctx.close()}
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
