'use strict';
// M90 real Chromium: local fictional data only, no production Supabase, Netlify or writes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./social_design_fixture.cjs');
const origin='http://127.0.0.1:4173',fixture=buildFixture();
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let tests=0;
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<760,hasTouch:width<760,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort('blockedbyclient');
    if(url.pathname==='/__m90-fixture')return route.fulfill({status:200,contentType:'text/html',body:fixture});
    return route.continue();
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/__m90-fixture?view=discussionsPage',{waitUntil:'domcontentloaded'});
   const feedTab=page.getByRole('tab',{name:'Feed',exact:true}),sectionsTab=page.getByRole('tab',{name:'Sections',exact:true});
   const feedView=page.locator('#ddForumFeedView'),directory=page.locator('#ddForumDirectoryView'),feed=page.locator('#ddForumGlobalFeed');
   await feed.locator('.dd-forum-post-card').first().waitFor();
   assert.equal(await feedTab.getAttribute('aria-selected'),'true','Feed is initial view');
   assert.equal(await sectionsTab.getAttribute('aria-selected'),'false');
   assert.equal(await feedView.isVisible(),true);
   assert.equal(await directory.isVisible(),false,'Directory hidden while browsing Feed');
   assert.equal(await feed.locator('.dd-forum-post-card').count(),5,'Global feed still displays original cards');
   tests+=5;

   await sectionsTab.click();
   await page.locator('#ddForumSections .dd-forum-section-card').first().waitFor();
   assert.equal(await feedView.isVisible(),false,'Feed is removed when Sections chosen');
   assert.equal(await directory.isVisible(),true);
   assert.equal(await sectionsTab.getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#ddForumSections .dd-forum-section-card').count(),4);
   tests+=4;
   await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).click();
   await page.locator('#ddForumPostList .dd-forum-post-card').first().waitFor();
   assert.equal(await page.locator('#ddForumViewTabs').isVisible(),false,'Tabs hidden inside subject');
   await page.locator('#ddForumBackSections').click();
   await directory.waitFor({state:'visible'});
   assert.equal(await sectionsTab.getAttribute('aria-selected'),'true','Return to Sections');
   tests+=2;

   const menu=page.getByRole('button',{name:'Open all discussion subjects'});
   await menu.click();
   const drawer=page.getByRole('dialog',{name:'All subjects'});
   await drawer.waitFor();
   assert.equal(await drawer.locator('#ddForumDrawerList .dd-community-drawer-subject-row').count(),4,'All subjects available in drawer from Sections');
   await page.getByRole('button',{name:'Close subject menu'}).click();
   await drawer.waitFor({state:'hidden'});
   tests++;

   await feedTab.click();
   await feed.locator('.dd-forum-post-card').first().waitFor();
   assert.equal(await directory.isVisible(),false,'Sections hidden on Feed');
   const action=feed.locator('.dd-forum-post-card').first().locator('.dd-forum-actions.dd-action-rail');
   assert.equal(await action.locator('.dd-forum-vote').count(),2,'Original vote actions preserved');
   assert.equal(await action.locator('.dd-forum-comments-action').count(),1,'Original comments action preserved');
   tests+=3;
   await feed.locator('.dd-forum-post-card').first().getByRole('button',{name:/Read discussion: What should we check first/}).click();
   await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor();
   assert.equal(await page.locator('#ddForumReplies .dd-forum-reply-card').count(),3,'Same nested comments');
   assert.equal(await page.locator('#ddForumReplyCreate').isVisible(),true,'Auto-open composer unchanged');
   await page.locator('#ddForumBackThreads').click();
   await feedView.waitFor({state:'visible'});
   assert.equal(await feedTab.getAttribute('aria-selected'),'true','Return to Feed from feed post');
   tests+=3;

   await sectionsTab.click();
   await page.evaluate(()=>window.navigateTo('chatPage'));
   await page.evaluate(()=>window.navigateTo('discussionsPage'));
   await directory.waitFor({state:'visible'});
   assert.equal(await sectionsTab.getAttribute('aria-selected'),'true','Chosen overview survives leaving the site tab');
   const saved=await page.evaluate(()=>Object.entries(localStorage).filter(([key])=>key.startsWith('dd-forum-overview-tab-v1:')));
   assert(saved.some(([,v])=>v==='sections'),'Section selection stored per account');
   tests+=2;
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#ddForumDirectoryView').waitFor({state:'visible'});
   assert.equal(await page.getByRole('tab',{name:'Sections',exact:true}).getAttribute('aria-selected'),'true','Preference survives reload');
   tests++;
   const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
   assert(dimensions.scroll<=dimensions.width+2,'No horizontal overflow at '+width+'px');
   assert.deepEqual(errors,[],'No browser JavaScript failures at '+width+'px');
   tests+=2;
   await context.close();
   console.log('PASS M90 '+width+'px: independent tabs, stored preference, post/section return, drawer and actions');
  }
  console.log('PASS M90: '+tests+' synthetic real-Chromium checks at four sizes (NO DEPLOY)');
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL M90:',error.stack||error);process.exitCode=1});
