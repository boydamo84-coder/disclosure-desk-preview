'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const {buildFixture}=require('./m73_owner_comments_fixture.cjs');
const {buildFixture:forumFixture}=require('./social_design_fixture.cjs');
const BASE='http://127.0.0.1:4173';
async function menuTest(card,label,{edit=true}={}){
 const menu=card.locator('.dd-comment-more').first();
 await menu.locator('summary').waitFor({state:'visible'});
 assert.equal(await card.locator('.dd-comment-action-rail > .dd-comment-delete-button').count(),0,label+': no extra Delete icon');
 assert.equal(await card.locator('.dd-comment-more').count(),1,label+': exactly one More menu');
 await menu.locator('summary').click();
 await menu.locator('.dd-comment-delete-button').waitFor({state:'visible'});
 assert.equal(await menu.locator('.dd-comment-edit-button').count(),edit?1:0,label+': Edit permission matches 30-minute window');
 const geom=await menu.locator('.dd-comment-more-panel').evaluate(el=>{
  const r=el.getBoundingClientRect();return {left:r.left,right:r.right,screen:innerWidth,
   overflow:document.documentElement.scrollWidth-innerWidth};
 });
 assert(geom.left>=-1&&geom.right<=geom.screen+1&&geom.overflow<=1,label+': no mobile menu overflow: '+JSON.stringify(geom));
 return menu;
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'}),errors=[];
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());if(url.origin!==BASE)return route.abort();
    if(url.pathname==='/__m73-comments')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});
    if(url.pathname==='/__m73-forum')return route.fulfill({contentType:'text/html; charset=utf-8',body:forumFixture()});
    return route.continue();
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/__m73-comments?dd_tab=archivePage',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.__m73&&!!window.DDCommunityVotes);
   await page.evaluate(()=>{window.__m67.user=true});
   const archive=page.locator('[data-archive-id="m67-archive-a"]').first();
   await archive.locator('.dd-inline-comments-toggle').click();
   const first=archive.locator('.dd-comment-card').first();
   await first.locator('.dd-comment-more').waitFor();
   let menu=await menuTest(first,'Archive own comment',{edit:true});
   await menu.locator('.dd-comment-edit-button').click();
   const editForm=first.locator('.dd-comment-edit-form');await editForm.waitFor({state:'visible'});
   await editForm.locator('textarea').fill('My revised research comment with the original source.');
   await editForm.getByRole('button',{name:'Save changes'}).click();
   await first.getByText('My revised research comment with the original source.').waitFor();
   assert(await page.evaluate(()=>window.__m73.mutations.some(x=>x.name==='dd_edit_my_comment')),
    'Edit must use the existing owner-only RPC');
   const older=archive.locator('.dd-comment-card').nth(1);
   await menuTest(older,'Older own reply',{edit:false});
   await older.locator('.dd-comment-more > summary').click(); // close menu
   const stranger=archive.locator('.dd-comment-card').nth(2);
   assert.equal(await stranger.locator('.dd-owner-more').count(),0,'Other members have no owner menu');

   await first.locator('.dd-comment-reply-button').click();
   const form=archive.locator('.dd-news-inline-comments form').first();
   assert.equal(await form.locator('button[type=submit]').textContent(),'Post reply');
   await form.locator('textarea').fill('This is an unsent reply to cancel');
   await form.getByRole('button',{name:'Cancel'}).click();
   assert.equal(await form.isVisible(),false,'Cancel hides inline reply form');
   assert.equal(await page.evaluate(()=>window.__m67.posts.length),0,'Cancel must not post anything');
   await first.locator('.dd-comment-reply-button').click();
   await form.locator('textarea').fill('This new nested reply is successfully posted.');
   await form.getByRole('button',{name:'Post reply'}).click();
   await archive.getByText('This new nested reply is successfully posted.',{exact:true}).waitFor();
   assert.equal(await form.isVisible(),false,'Posting closes reply form without hiding thread');
   const parent=await page.evaluate(()=>window.__m67.posts.at(-1)?.parent_id);
   assert.equal(parent,await page.evaluate(()=>window.__m68.ids[0]),'Reply attaches to the correct parent');

   for(const [tab,selector,label] of [
    ['discover','#newsGrid article[data-news-id]','News'],
    ['watchRead','[data-media-id="fixture-doc"]','Watch & Read'],
    ['clips','[data-video-id="m67-video"]','Videos']
   ]){
    await page.evaluate(dest=>window.navigateTo(dest),tab);
    const card=page.locator(selector).first();await card.waitFor();
    await card.locator('.dd-inline-comments-toggle').click();
    const own=card.locator('.dd-comment-card').first();await own.locator('.dd-owner-more').waitFor();
    const m=await menuTest(own,label+' own comment',{edit:true});
    await m.locator('summary').click();
    assert.equal(await card.locator('.dd-comment-card').nth(2).locator('.dd-owner-more').count(),0,
      label+': stranger never sees owner tools');
   }
   // Full case/historical hearing discussion uses the same shared owner menu.
   await page.evaluate(()=>window.ddOpenCaseDiscussion('case:fixture','Fixture Case Discussion'));
   await page.locator('#ddCaseDiscussionDialog:not([hidden])').waitFor();
   await page.locator('#ddCommentsToggle').click();
   const ownCase=page.locator('#ddCaseDiscussionList .dd-comment-card').first();
   await ownCase.locator('.dd-owner-more').waitFor();
   menu=await menuTest(ownCase,'Case/Hearing own comment',{edit:true});
   await menu.locator('summary').click();
   await ownCase.locator('.dd-comment-reply-button').click();
   const caseForm=page.locator('#ddCaseDiscussionForm');
   await caseForm.getByRole('button',{name:'Cancel'}).waitFor({state:'visible'});
   await caseForm.locator('textarea').fill('Unsent case reply');
   await caseForm.getByRole('button',{name:'Cancel'}).click();
   assert.equal(await caseForm.isVisible(),false,'Case reply cancellation closes composer');
   await ownCase.locator('.dd-comment-reply-button').click();
   await caseForm.locator('textarea').fill('A successfully posted case reply.');
   await caseForm.getByRole('button',{name:'Post reply'}).click();
   await page.getByText('A successfully posted case reply.',{exact:true}).waitFor();
   assert.equal(await caseForm.isVisible(),false,'Case/Hearing successful Reply closes form');
   await page.locator('#ddCaseDiscussionClose').click();
   // Delete only our comment, through ... and an explicit confirmation dialog.
   await page.evaluate(dest=>window.navigateTo(dest),'archivePage');
   await archive.locator('.dd-comment-card').first().locator('.dd-owner-more > summary').click();
   page.once('dialog',dialog=>dialog.accept());
   await archive.locator('.dd-comment-card').first().locator('.dd-comment-more .dd-comment-delete-button').click();
   await page.waitForFunction(()=>window.__m73.mutations.some(x=>x.name==='dd_delete_my_comment'));
   assert.equal(await archive.getByText('My revised research comment with the original source.',{exact:true}).count(),0,
    'Deleting through More removes our authored comment');
   await page.goto(BASE+'/__m73-forum?view=discussionsPage',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.__SocialQA);
   await page.evaluate(()=>{
    const qa=window.__SocialQA;qa.posts[0].is_mine=true;qa.posts[0].created_at=new Date().toISOString();
    qa.replies[0].is_mine=true;qa.replies[0].created_at=new Date().toISOString();
   });
   await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).click();
   const ownPost=page.locator('#ddForumPostList .dd-forum-post-card').first();
   await ownPost.locator('.dd-forum-owner-more > summary').waitFor();
   await ownPost.locator('.dd-forum-owner-more > summary').click();
   assert.equal(await ownPost.locator('.dd-comment-delete-button').count(),1,'My Discussion post offers Delete inside More');
   assert.equal(await ownPost.locator('.dd-comment-edit-button').count(),1,'My recent Discussion post offers Edit');
   await ownPost.locator('.dd-forum-owner-more > summary').click();
   await page.getByRole('button',{name:/Read discussion: What should we check first/}).click();
   const ownReply=page.locator('#ddForumReplies .dd-forum-reply-card').first();
   await ownReply.locator('.dd-forum-owner-more > summary').waitFor();
   await ownReply.locator('.dd-forum-owner-more > summary').click();
   assert.equal(await ownReply.locator('.dd-comment-delete-button').count(),1,'My Discussion reply offers Delete in More');
   await ownReply.locator('.dd-forum-owner-more > summary').click();
   assert.equal(await page.locator('#ddForumReplies .dd-forum-reply-card').nth(1).locator('.dd-forum-owner-more').count(),0,
    'Other Discussion member reply has no own-menu');
   await ownReply.locator('.dd-forum-reply-action').click();
   const replyForm=page.locator('#ddForumReplyCreate');
   await replyForm.getByRole('button',{name:'Cancel'}).waitFor({state:'visible'});
   await replyForm.locator('textarea').fill('An unsent Discussion reply');
   await replyForm.getByRole('button',{name:'Cancel'}).click();
   assert.equal(await replyForm.isVisible(),false,'Discussion Cancel dismisses reply popup');
   await ownReply.locator('.dd-forum-reply-action').click();
   await replyForm.locator('textarea').fill('A posted Discussion reply with shared controls.');
   await replyForm.getByRole('button',{name:'Post reply'}).click();
   await page.getByText('A posted Discussion reply with shared controls.',{exact:true}).waitFor();
   assert.equal(await replyForm.isVisible(),false,'Discussion successful Post closes reply popup');
   assert.deepEqual(errors,[],'No JavaScript errors at '+width);
   await context.close();
  }
  console.log('PASS M73 Chromium 320/393/820/1280: News/Archive/Video/Watch&Read/Case/Hearing/Discussions owner-only More/Delete/Edit, no duplicate Delete, edit timeout, Post/Cancel reply and close-on-success');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
