'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const {buildFixture}=require('./m73_owner_comments_fixture.cjs');
const {buildFixture:forumFixture}=require('./social_design_fixture.cjs');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 for(const width of [320,393,820,1280]){
  const ctx=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin!==BASE)return route.abort();
   if(u.pathname==='/__m86-public')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});
   if(u.pathname==='/__m86-forum')return route.fulfill({contentType:'text/html; charset=utf-8',body:forumFixture()});
   return route.continue();
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/__m86-public?dd_tab=discover',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__m68&&!!window.DDCommunityVotes);
  await page.evaluate(()=>{window.__m67.user=true});
  for(const [tab,selector,label] of [
   ['discover','#newsGrid article[data-news-id]','News'],
   ['archivePage','[data-archive-id="m67-archive-a"]','Archive'],
   ['watchRead','[data-media-id="fixture-doc"]','Watch & Read'],
   ['clips','[data-video-id="m67-video"]','Videos'],
   ['cases','#caseList article','Featured case']
  ]){
   await page.evaluate(dest=>window.navigateTo(dest),tab);
   const card=page.locator(selector).first();await card.waitFor();
   const toggle=card.locator('.dd-inline-comments-toggle').first(),host=card.locator('.dd-news-inline-comments').first();
   await toggle.waitFor();
   assert.equal(await toggle.getAttribute('aria-expanded'),'false',label+' initially collapsed at '+width);
   assert.equal(await host.isVisible(),false,label+' hidden before click');
   assert.equal(await host.locator('.dd-comment-card').count(),0,label+' no teasers');
   const key=await host.getAttribute('data-news-comments');
   const count=await page.evaluate(id=>window.__m68.calls.filter(c=>c.name==='dd_public_comments'&&c.args.p_case_id===id).length,key);
   assert.equal(count,0,label+' no eager comment RPC');
   await toggle.click();
   await host.locator('.dd-comment-card').first().waitFor({state:'visible'});
   assert.equal(await toggle.getAttribute('aria-expanded'),'true',label+' opened');
   assert.equal(await host.isVisible(),true,label+' panel visible');
   assert.equal(await host.evaluate(el=>el.closest('article')===el.parentElement),true,label+' panel directly beneath card');
   await host.locator('.dd-comment-card.dd-comment-nested').first().waitFor({state:'visible'});
   assert.equal(await host.locator('textarea').isVisible(),true,label+' composer in opened panel');
   assert.equal(await host.locator('textarea').evaluate(el=>document.activeElement===el),false,label+' no forced keyboard');
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-expanded'),'false',label+' closed');
   assert.equal(await host.isVisible(),false,label+' hidden after click');
  }
  await page.goto(BASE+'/__m86-forum?view=discussionsPage',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__SocialQA);
  await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).click();
  await page.getByRole('button',{name:/Read discussion: What should we check first/}).click();
  await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor({state:'visible'});
  assert.equal(await page.locator('#ddForumReplyPane').isVisible(),true,'Discussions remain open automatically');
  assert.deepEqual(errors,[],'No public-card runtime errors at '+width);
  await ctx.close();
  console.log('PASS M86 '+width+'px card comment folds + auto-open Discussions.');
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
