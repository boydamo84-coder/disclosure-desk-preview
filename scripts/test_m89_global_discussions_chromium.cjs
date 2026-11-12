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
   await page.getByRole('tab',{name:'Sections',exact:true}).click();
   await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).first().click();
   await page.locator('#ddForumPostList .dd-forum-post-card').first().waitFor();
   assert.equal(await page.locator('#ddForumPostList .dd-forum-post-card').count(),3,'Original subject feed unaffected');
   checks+=2;
   const menu=page.getByRole('button',{name:'Open all discussion subjects'});
   await menu.click();
   const drawer=page.getByRole('dialog',{name:'All subjects'});
   await drawer.waitFor();
   const rows=drawer.locator('#ddForumDrawerList .dd-community-drawer-subject-row');
   assert.equal(await rows.count(),4,'All four subjects are listed');
   await drawer.locator('#ddForumDrawerList [data-section-favourite]').first().click();
   await drawer.locator('#ddForumDrawerFavouriteNav .dd-community-drawer-subject-row').first().waitFor();
   assert.equal(await drawer.locator('#ddForumDrawerFavouriteNav .dd-community-drawer-subject-row').count(),1,'Favourite appears at top');
   assert.equal(await drawer.locator('#ddForumDrawerList [data-section-favourite]').first().getAttribute('aria-pressed'),'true','Star selection saved');
   await page.evaluate(()=>window.__SocialQA.sections.push({
    id:'99999999-8888-4888-8888-888888888888',
    title:'Newly published discussion subject',description:'A newly added subject',topic:'UAP',
    thread_count:0,is_steward:false,created_at:new Date().toISOString()
   }));
   await drawer.getByRole('button',{name:'Refresh discussion subjects'}).click();
   await drawer.getByRole('button',{name:'Open discussion subject: Newly published discussion subject'}).waitFor();
   assert.equal(await rows.count(),5,'New subject automatically appears in the refreshed drawer');
   await drawer.getByRole('searchbox',{name:'Search discussion subjects'}).fill('this will not match');
   assert.equal(await rows.count(),0,'Drawer search narrows subjects');
   await drawer.getByRole('searchbox',{name:'Search discussion subjects'}).fill('');
   await drawer.getByRole('button',{name:'Open discussion subject: Newly published discussion subject'}).click();
   await drawer.waitFor({state:'hidden'});
   assert.equal(await menu.getAttribute('aria-expanded'),'false','Drawer closes on navigation');
   await menu.click();await page.keyboard.press('Escape');await drawer.waitFor({state:'hidden'});
   assert.equal(await menu.getAttribute('aria-expanded'),'false','Escape dismisses drawer');
   if(width<760)assert.equal(await page.locator('#discussionsPage .dd-community-subjects').isVisible(),false,'Mobile uses drawer rather than horizontal subject strip');
   checks+=9;
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
