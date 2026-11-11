'use strict';
// NO LIVE CALLS: real Chromium against a self-contained fictional Supabase fixture.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./social_design_fixture.cjs');
const BASE='http://127.0.0.1:4173',html=buildFixture();
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let checks=0;
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<760,hasTouch:width<760,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==BASE)return route.abort('blockedbyclient');
    if(url.pathname==='/__m89-fixture')return route.fulfill({status:200,contentType:'text/html',body:html});
    return route.continue();
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/__m89-fixture?view=discussionsPage',{waitUntil:'domcontentloaded'});
   const feed=page.locator('#ddForumGlobalFeed');
   await feed.locator('.dd-forum-post-card').first().waitFor();
   assert.equal(await feed.locator('.dd-forum-post-card').count(),5,'Five public posts from different boards in synthetic feed');
   assert.equal(await feed.locator('.dd-forum-actions.dd-action-rail').count(),5,'Same Discussions action board');
   assert.equal(await feed.locator('.dd-community-global-subject').count(),5,'Original subject chip on every card');
   assert.equal(await page.locator('#ddForumGlobalSort').inputValue(),'popular','Popular default');
   assert.equal(await feed.locator('.dd-forum-post-card').first().locator('.dd-forum-title').innerText(),
    'What should we check first when reviewing an unfamiliar sighting?','Popular balances likes and recency');
   assert.equal(await page.locator('#ddForumGlobalLoadMore').isVisible(),false,'No empty extra page');
   checks+=6;
   await page.locator('#ddForumGlobalSort').selectOption('new');
   await page.waitForFunction(()=>document.querySelector('#ddForumGlobalFeed .dd-forum-title')?.textContent?.includes('fresh question'));
   checks++;
   await page.locator('#ddForumGlobalSort').selectOption('top');
   await page.waitForFunction(()=>document.querySelector('#ddForumGlobalFeed .dd-forum-title')?.textContent?.includes('Classic disclosure'));
   checks++;
   await page.locator('#ddForumGlobalSort').selectOption('popular');
   await page.waitForFunction(()=>document.querySelector('#ddForumGlobalFeed .dd-forum-title')?.textContent?.includes('What should'));
   const first=feed.locator('.dd-forum-post-card').first();
   assert.equal(await first.locator('.dd-forum-vote').count(),2);
   assert.equal(await first.locator('.dd-forum-comments-action').count(),1);
   checks+=3;
   await first.getByRole('button',{name:/Read discussion: What should we check first/}).click();
   await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor();
   assert.equal(await page.locator('#ddForumReplyCreate').isVisible(),true,'Comment composer auto-open');
   assert.equal(await page.locator('#ddForumReplies .dd-forum-reply-card').count(),3,'Existing threaded replies auto-visible');
   assert.equal(await page.locator('#ddForumBackThreads').innerText(),'← Back to Popular');
   checks+=3;
   await page.locator('#ddForumBackThreads').click();
   await feed.locator('.dd-forum-post-card').first().waitFor();
   assert.equal(await page.locator('#ddForumSectionsPane').isVisible(),true);
   await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).first().click();
   await page.locator('#ddForumPostList .dd-forum-post-card').first().waitFor();
   assert.equal(await page.locator('#ddForumPostList .dd-forum-post-card').count(),3,'Original subject feed unaffected');
   checks+=2;
   const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   assert(dims.scroll<=dims.client+2,'No horizontal overflow '+width+' '+JSON.stringify(dims));
   assert.deepEqual(errors,[],'No JS page errors '+width);
   checks+=2;
   await context.close();
   console.log('PASS M89 '+width+'px: cross-subject dropdown, sorting, original post cards, comments and navigation');
  }
  console.log('PASS M89 synthetic Chromium '+checks+' checks / no live services');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M89:',e.stack||e);process.exitCode=1});
