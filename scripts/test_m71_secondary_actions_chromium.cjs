'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./m68_comment_thread_fixture.cjs');
const BASE='http://127.0.0.1:4173';
async function inspect(rail,label,required){
 await rail.waitFor({state:'visible'});
 await rail.evaluate(el=>window.DDUnifiedActionRails?.normalise(el));
 const got=await rail.evaluate(el=>{
  const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
  return {
   labels:[...el.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')||b.textContent.trim()),
   slots:[...el.children].filter(c=>c.dataset.ddActionSlot!=='spacer').map(c=>c.dataset.ddActionSlot),
   bg:style.backgroundColor,viewport:innerWidth,scroll:document.documentElement.scrollWidth,
   rect:{left:rect.left,right:rect.right,width:rect.width},
   buttons:[...el.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)
  };
 });
 for(const role of required)assert(got.slots.includes(role),label+': missing '+role+': '+JSON.stringify(got));
 const order={vote:0,comments:1,board:2,share:3,extra:4,reply:5};
 for(let i=1;i<got.slots.length;i++)
  assert(order[got.slots[i-1]]<=order[got.slots[i]],label+': shared ordering fails '+got.slots.join(','));
 assert.equal(got.bg,'rgb(15, 37, 52)',label+': same navy Discussions action strip');
 assert(got.buttons.every(v=>v>=39),label+': touch target too small');
 assert(got.scroll<=got.viewport+1,label+': page overflow');
 assert(got.rect.left>=-1&&got.rect.right<=got.viewport+1,label+': rail clipped or overflows');
 return got;
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 for(const width of [320,393,820,1280]){
  const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'}),errors=[];
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin!==BASE)return route.abort();
   if(u.pathname==='/__m71-pages')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/__m71-pages?dd_tab=archivePage',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.DDUnifiedActionRails&&!!window.__m68);
  await page.evaluate(()=>window.__m67.user=true);
  const archive=page.locator('[data-archive-id="m67-archive-a"]').first();
  await archive.locator('[data-open-archive]').click();
  const detail=page.locator('#archiveCaseDialog');
  await detail.waitFor({state:'visible'});
  await detail.locator('#archiveCaseBody .dd-action-rail .dd-inline-comments-toggle').waitFor();
  await inspect(detail.locator('#archiveCaseBody .dd-action-rail'),'Archive full case',['comments','board','share']);
  assert.equal(await detail.locator('.dd-inline-comments-toggle').count(),1,'Exactly one Archive full-case comments button, not a second modal control');
  await detail.locator('.dd-inline-comments-toggle').click();
  await detail.getByText('Start with the original report.',{exact:true}).waitFor();
  const ar=detail.locator('.dd-comment-card').first();
  assert.equal(await ar.locator('.dd-comment-reply-button').count(),1,'Archive full-case inline Reply exists');
  await ar.locator('.dd-comment-reply-button').click();
  assert.equal(await detail.locator('form button[type=submit]').textContent(),'Post reply');
  await detail.locator('.dd-inline-comments-toggle').click();
  await page.locator('#archiveCaseClose').click();

  await page.evaluate(()=>window.navigateTo('cases'));
  const featured=page.locator('#caseList article').first();await featured.waitFor();
  await inspect(featured.locator('.dd-research-action-rail'),'Featured case',['comments','board','share']);
  assert.equal(await featured.locator('[data-case-discussion]').count(),0,'Featured case no longer uses modal-only comments');
  await featured.locator('.dd-inline-comments-toggle').click();
  await featured.locator('.dd-comment-card').first().waitFor();
  assert.equal(await featured.locator('form textarea').getAttribute('rows'),'1');
  await featured.locator('.dd-comment-card').first().locator('.dd-comment-reply-button').click();
  assert.equal(await featured.locator('form button[type=submit]').textContent(),'Post reply');
  await featured.locator('.dd-inline-comments-toggle').click();
  await featured.locator('[data-evidence-open]').click();
  const evidence=page.locator('#evidenceDialog');await evidence.waitFor({state:'visible'});
  await inspect(evidence.locator('#evidenceBody .dd-research-action-rail'),'Full evidence case',['comments','board','share']);
  await evidence.locator('.dd-inline-comments-toggle').click();
  await evidence.getByText('Start with the original report.',{exact:true}).waitFor();
  await page.locator('#evidenceClose').click();

  await page.evaluate(()=>window.navigateTo('rabbitHole'));
  const rabbit=page.locator('#rabbitList article').first();
  await rabbit.waitFor();
  await inspect(rabbit.locator('.dd-research-action-rail'),'Rabbit Hole',['comments','board','share']);
  await rabbit.locator('.dd-inline-comments-toggle').click();
  await rabbit.locator('.dd-comment-card').first().waitFor();
  await rabbit.locator('.dd-inline-comments-toggle').click();

  await page.evaluate(()=>window.navigateTo('livePage'));
  const hearing=page.locator('#ddLiveEvents .dd-live-inline-card').first();
  await hearing.waitFor();
  await inspect(hearing.locator('.dd-live-hearing-action-rail'),'LIVE hearing recording',['comments','board','share']);
  assert.equal(await hearing.locator('.dd-hearing-comments-toggle').count(),1,'LIVE card has one in-card Comments control');
  await hearing.locator('.dd-hearing-comments-toggle').click();
  const hearingHost=hearing.locator('.dd-hearing-comments-host');await hearingHost.locator('#ddCaseDiscussionList .dd-comment-card').first().waitFor();
  assert.equal(await hearingHost.locator('#ddCaseDiscussionBody').getAttribute('rows'),'1','LIVE composer matches Discussion');
  await hearingHost.locator('#ddCaseDiscussionList .dd-comment-card').first().locator('.dd-comment-reply-button').click();
  assert.equal(await hearingHost.locator('#ddCaseDiscussionForm button[type=submit]').textContent(),'Post reply');
  await hearing.locator('.dd-hearing-comments-toggle').click();
  assert.equal(await hearingHost.isVisible(),false,'LIVE comments fold away without navigating');
  await hearing.getByRole('button',{name:/Recording details \/ saved LIVE chat/}).click();
  const detailHearing=page.locator('section').filter({has:page.locator('h2')}).filter({hasText:'Hearing Discussion'});
  // The details overlay also uses the same helper and live controls.
  assert((await page.locator('.dd-live-hearing-action-rail').count())>=2,'LIVE recording detail has a common bar');
  await page.locator('button').filter({hasText:'✕ Close'}).last().click();

  await page.evaluate(()=>window.navigateTo('clips'));
  await page.locator('[data-video-id="m67-video"]').first().waitFor();
  await page.locator('#openImmersiveClips').click();
  const immersive=page.locator('#immersiveViewer:not([hidden]) .immersive-item').first();
  await immersive.waitFor();
  await inspect(immersive.locator('.immersive-tools'),'Immersive video',['comments','board','share']);
  assert.equal(await immersive.locator('[data-clip-action=discuss]').count(),0,'No separate immersive discussion modal');
  const toggle=immersive.locator('.dd-inline-comments-toggle');await toggle.click();
  const panel=immersive.locator('.dd-immersive-inline-comments');
  await panel.getByText('Start with the original report.',{exact:true}).waitFor();
  const geo=await panel.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerWidth,height:innerHeight}});
  assert(geo.left>=-1&&geo.right<=geo.viewport+1&&geo.top>=0&&geo.bottom<=geo.height+1,'Immersive comment panel fits phone '+JSON.stringify(geo));
  await panel.locator('.dd-comment-card').first().locator('.dd-comment-reply-button').click();
  assert.equal(await panel.locator('form button[type=submit]').textContent(),'Post reply');
  await toggle.click();assert.equal(await panel.isVisible(),false);
  await page.locator('#closeImmersive').click();

  assert.deepEqual(errors,[],'No runtime errors at '+width);
  await context.close();
 }
 console.log('PASS M71 page-level Chromium 320/393/820/1280: Archive full case, featured cases, full evidence, Rabbit Hole, LIVE hearings + details, immersive Video; real inline comments/Reply and identical action board');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
