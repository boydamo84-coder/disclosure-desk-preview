'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./m67_card_actions_fixture.cjs');
const BASE='http://127.0.0.1:4173';
async function geometry(card,width){
 const state=await card.evaluate(el=>{const rail=el.querySelector('.dd-action-rail'),r=rail.getBoundingClientRect();return {rail:!!rail,justify:getComputedStyle(rail).justifyContent,scroll:rail.scrollWidth,client:rail.clientWidth,right:r.right,buttons:[...rail.querySelectorAll('button')].map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})),page:document.documentElement.scrollWidth,viewport:innerWidth}});
 assert(state.rail);assert.equal(state.justify,'flex-end');assert(state.scroll<=state.client+2);assert(state.right<=width+1);assert(state.page<=state.viewport+1,'No viewport overflow');assert(state.buttons.every(b=>b.height>=40&&b.width<=115),'Compact tappable actions '+JSON.stringify(state));
}
async function foldComments(page,card,key){
 const toggle=card.locator('.dd-inline-comments-toggle'),host=card.locator('[data-news-comments]');
 await toggle.waitFor();assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await host.isVisible(),false,'No comments visible by default');assert.match(await toggle.textContent(),/▾/);
 await toggle.click();await card.getByText('Fixture comment 1',{exact:true}).waitFor();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.match(await toggle.textContent(),/▴/);assert.equal(await host.locator('[data-dd-news-comment-id]').count(),3);
 const thread=await host.evaluate(el=>{const rows=[...el.querySelectorAll('[data-dd-news-comment-id]')].map(x=>x.getBoundingClientRect());return {column:rows.every((r,i)=>!i||r.top>=rows[i-1].bottom-1),composer:el.querySelector('textarea').getBoundingClientRect().height}});assert(thread.column,'Comments form one vertical thread');assert(thread.composer<=94,'Compact comment composer');
 const textarea=host.locator('textarea');await textarea.fill('Retain this draft for '+key);await toggle.click();assert.equal(await host.isVisible(),false);await toggle.click();assert.equal(await textarea.inputValue(),'Retain this draft for '+key);
 await textarea.fill('Posted fixture reply '+key);await host.getByRole('button',{name:'Post comment',exact:true}).click();await card.getByText('Posted fixture reply '+key,{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.__m67.posts.at(-1).case_id),key,'Existing discussion key used');await toggle.click();
}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const width of [320,393,820,1280]){
  const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==BASE)return route.abort();if(u.pathname==='/__m67-cards')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});return route.continue()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/__m67-cards?dd_tab=archivePage',{waitUntil:'domcontentloaded'});
  const archive=page.locator('[data-archive-id="m67-archive-a"]');await archive.waitFor();await archive.locator('.dd-inline-comments-toggle').waitFor();await geometry(archive,width);assert.equal(await archive.locator('[data-save-archive] [data-star-icon]').count(),1,'Board saved-state refresh preserves icon');
  const position=await archive.evaluate(el=>{const follow=el.querySelector('[data-follow-archive]').getBoundingClientRect(),rail=el.querySelector('.dd-action-rail').getBoundingClientRect(),card=el.getBoundingClientRect();return {followTop:follow.top,followRight:follow.right,cardRight:card.right,railTop:rail.top,hasFollowInRail:!!el.querySelector('.dd-action-rail [data-follow-archive]')}});
  assert(position.followTop<position.railTop);assert(position.cardRight-position.followRight<30);assert.equal(position.hasFollowInRail,false);
  await archive.locator('[data-follow-archive]').click();assert.equal(await page.locator('#archiveCaseDialog').evaluate(e=>e.open),false,'Following does not open the case');assert.equal(await archive.locator('[data-follow-archive]').getAttribute('aria-pressed'),'true');
  await page.reload();await archive.locator('[data-follow-archive][aria-pressed="true"]').waitFor();
  await page.evaluate(()=>{window.__m67.user=true});await foldComments(page,archive,'archive:m67-archive-a');
  await archive.locator('[data-share-archive]').click();assert.equal(await page.evaluate(()=>window.__m67.shared.at(-1).url),'https://example.invalid/archive/a');
  await archive.locator('[data-save-archive]').click();await page.locator('#collectionPicker').waitFor({state:'visible'});await page.locator('#pickerClose').click();
  await archive.locator('[data-open-archive]').click();await page.locator('#archiveCaseDialog').waitFor({state:'visible'});assert.equal(await page.locator('#archiveCaseBody .dd-action-rail').count(),1);assert.equal(await page.locator('#archiveCaseBody .dd-action-rail [data-follow-archive]').count(),0);await page.locator('#archiveCaseClose').click();
  await page.evaluate(()=>window.navigateTo('watchRead'));const media=page.locator('[data-media-id="fixture-doc"]');await media.waitFor();await media.locator('.dd-inline-comments-toggle').waitFor();await geometry(media,width);await foldComments(page,media,'media:fixture-doc');
  await media.locator('.dd-media-rate').click();assert.equal(await media.locator('select[aria-label="Rate Fixture documentary"]').isVisible(),true);
  await page.getByRole('button',{name:'Books',exact:true}).click();await page.locator('[data-media-id="fixture-book"] .dd-inline-comments-toggle').waitFor();await page.getByRole('button',{name:'Documentaries',exact:true}).click();await media.locator('.dd-inline-comments-toggle').waitFor();assert.equal(await media.locator('[data-news-comments]').isVisible(),false,'Refreshed category retains a working collapsed control');
  await page.evaluate(()=>window.navigateTo('clips'));const video=page.locator('[data-video-id="m67-video"]');await video.waitFor();await video.locator('.dd-inline-comments-toggle').waitFor();await geometry(video,width);await foldComments(page,video,'video:m67-video');
  const layout=await video.evaluate(el=>({player:el.querySelector('.dd-video-card-player').getBoundingClientRect().bottom,info:el.querySelector('.clip-info').getBoundingClientRect().top,rail:el.querySelector('.dd-action-rail').getBoundingClientRect().top,infoBottom:el.querySelector('.clip-info').getBoundingClientRect().bottom}));assert(layout.info>=layout.player-1);assert(layout.rail>=layout.infoBottom-1,'Video rail below content');
  await page.evaluate(()=>window.navigateTo('cases'));await geometry(page.locator('#caseList article').first(),width);
  assert.deepEqual(errors,[],'No JavaScript errors at '+width);await context.close();
 }
 console.log('PASS M67 real Chromium 320/393/820/1280: Archive header Follow/persistence, shared bars, working Board/share, Archive/Watch&Read/Video fold-out comments and posting/drafts, category refresh, video layout, case rails, no overflow/errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
