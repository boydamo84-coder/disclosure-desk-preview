'use strict';
// M80 acceptance: actual comment/reply rendering and real viewport scrolling.
// All accounts/comments are fictional; external requests are blocked.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const {buildFixture}=require('./m73_owner_comments_fixture.cjs');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820]){
   const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==BASE)return route.abort();
    if(url.pathname==='/__m79-comment')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});
    return route.continue();
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/__m79-comment?dd_tab=archivePage',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.DDCommunityVotes&&!!window.__m68);
   await page.evaluate(()=>{window.__m67.user=true}); // Synthetic registered account, never live.
   const archive=page.locator('[data-archive-id="m67-archive-a"]').first();
   await archive.locator('.dd-inline-comments-toggle').click();
   const first=archive.locator('.dd-comment-card').first();
   await first.waitFor({state:'visible'});
   await first.locator('.dd-comment-reply-button').click();
   const replyForm=archive.locator('.dd-news-inline-comments form').first();
   await replyForm.getByRole('button',{name:'Post reply'}).waitFor({state:'visible'});
   await replyForm.locator('textarea').fill('M80 synthetic mobile reply visible after posting.');
   const parent=await page.evaluate(()=>window.__m68.ids[0]);
   await replyForm.getByRole('button',{name:'Post reply'}).click();
   const posted=archive.getByText('M80 synthetic mobile reply visible after posting.',{exact:true});
   await posted.waitFor({state:'visible'});
   assert.equal(await replyForm.isVisible(),false,'After posting, inline reply composer closes');
   assert.equal(await page.evaluate(()=>window.__m67.posts.at(-1)?.parent_id),parent,
    'Actual posted reply retains its parent relationship');
   const newCard=archive.locator('.dd-comment-card').filter({hasText:'M80 synthetic mobile reply visible after posting.'}).first();
   assert(await newCard.evaluate(el=>el.classList.contains('dd-comment-nested')),'New comment shows nested style');
   // Simulate a keyboard reducing the usable viewport: verify an off-screen Post
   // button is scrolled into view, not covered. No OS keyboard needed.
   const keyboard=await page.evaluate(()=>{
    const outer=document.createElement('div');
    outer.style.cssText='position:fixed;top:70px;left:8px;width:300px;height:150px;overflow-y:auto;background:#172a39;z-index:100000';
    const content=document.createElement('div');content.style.height='520px';
    const form=document.createElement('form');form.className='dd-m79-form';
    form.style.cssText='position:relative;top:440px';
    const input=document.createElement('textarea'),submit=document.createElement('button');
    submit.type='submit';submit.textContent='Post comment';submit.style.height='44px';
    form.append(input,submit);content.append(form);outer.append(content);document.body.append(outer);
    const before=outer.scrollTop,changed=window.DDCommunityVotes.keepCommentComposerVisible(form),after=outer.scrollTop;
    outer.remove();
    return {before,after,changed};
   });
   assert.equal(keyboard.changed,true,'Post button initially obscured inside scrollable dialog');
   assert(keyboard.after>keyboard.before+10,'Keyboard guard scrolls the dialog to uncover Post');
   const viewport=await page.evaluate(()=>{
    const root=document.createElement('div');
    root.style.cssText='position:absolute;left:15px;top:'+(window.scrollY+window.innerHeight+150)+'px;height:70px;width:100px';
    const button=document.createElement('button');button.type='submit';button.textContent='Post reply';
    const form=document.createElement('form');form.append(button);root.append(form);
    document.body.append(root);const before=window.scrollY;
    const changed=window.DDCommunityVotes.keepCommentComposerVisible(form),after=window.scrollY;
    root.remove();return {before,after,changed};
   });
   assert(viewport.changed&&viewport.after>viewport.before,'Off-screen inline Post scrolls above viewport bottom');
   const reveal=await page.evaluate(async()=>{
    const anchor=document.createElement('div');
    anchor.style.cssText='position:absolute;left:16px;top:'+(document.documentElement.scrollHeight+100)+'px;height:50px;width:70px';
    anchor.textContent='New synthetic comment';document.body.append(anchor);
    window.scrollTo(0,0);
    const before=window.scrollY;
    const accepted=window.DDCommunityVotes.revealPostedComment(anchor);
    await new Promise(r=>setTimeout(r,450));
    const after=window.scrollY;anchor.remove();return {before,after,accepted};
   });
   assert(reveal.accepted&&reveal.after>reveal.before,'Newly posted card gets a modest automatic reveal');
   assert.deepEqual(errors,[],'No browser runtime errors');
   console.log('PASS M80 '+width+'px reply posting, obscured Post control, inline + modal scroll, new reply reveal');
   await ctx.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
