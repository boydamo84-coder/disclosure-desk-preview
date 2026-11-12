'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const {buildFixture}=require('./m68_comment_thread_fixture.cjs');
const {buildFixture:forumFixture}=require('./social_design_fixture.cjs');
const BASE='http://127.0.0.1:4173';
async function compactThread(list,selector,forum=false){
 const result=await list.evaluate((host,{selector,forum})=>{
  const rows=[...host.querySelectorAll(selector)];
  return {display:getComputedStyle(host).display,overflow:document.documentElement.scrollWidth>innerWidth+1,
   rows:rows.map(el=>{const style=getComputedStyle(el),r=el.getBoundingClientRect(),rail=el.querySelector('.dd-action-rail'),b=rail.getBoundingClientRect(),body=el.querySelector(forum?'.dd-forum-body':'.dd-comment-body').getBoundingClientRect();return {
    top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right,margin:parseFloat(style.marginLeft),border:style.borderTopWidth,radius:style.borderTopLeftRadius,background:style.backgroundColor,shadow:style.boxShadow,
    bodyHeight:body.height,railHeight:b.height,railBackground:getComputedStyle(rail).backgroundColor,
    gap:body.top-el.querySelector(forum?'.dd-forum-post-head':'.dd-comment-head').getBoundingClientRect().bottom,
    depth:el.style.getPropertyValue('--dd-comment-depth'),buttons:[...rail.querySelectorAll('button')].map(x=>x.getBoundingClientRect().height)}})};
 },{selector,forum});
 assert.equal(result.display,'block');assert.equal(result.overflow,false);
 assert(result.rows.length>=3);
 for(let i=0;i<result.rows.length;i++){
  const row=result.rows[i];assert.equal(row.radius,'0px');assert.equal(row.shadow,'none');assert.equal(row.border,'0px');assert.equal(row.background,'rgba(0, 0, 0, 0)');assert.equal(row.railBackground,'rgba(0, 0, 0, 0)');
  assert(row.gap<=3&&row.gap>=-1,'No large byline/body gap '+JSON.stringify(row));
  assert(row.buttons.every(h=>h>=39),'Useful touch targets retained');
  if(i)assert(row.top>=result.rows[i-1].bottom-1&&row.top-result.rows[i-1].bottom<5,'One closely spaced vertical thread');
  if(row.bodyHeight<24)assert(row.height<=110,'Short comment remains compact '+JSON.stringify(row));
 }
 return result.rows;
}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const width of [320,393,820,1280]){
  const context=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'}),errors=[];
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==BASE)return route.abort();if(u.pathname==='/__m68-threads')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});if(u.pathname==='/__m68-forum')return route.fulfill({contentType:'text/html; charset=utf-8',body:forumFixture()});return route.continue()});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/__m68-threads?dd_tab=archivePage',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{window.__m67.user=true});
  const archive=page.locator('[data-archive-id="m67-archive-a"]');await archive.locator('.dd-inline-comments-toggle').click();
  await archive.getByText('Start with the original report.',{exact:true}).waitFor();
  const host=archive.locator('.dd-inline-comments-preview'),rows=await compactThread(host,'.dd-comment-card');
  assert.equal(rows.length,7,'All roots, descendants and orphan comments remain visible');
  for(let i=1;i<=4;i++){assert.equal(rows[i].depth,String(i));assert(rows[i].margin>rows[i-1].margin,'Nested replies use progressive guides');}
  assert.equal(rows[5].margin,0,'New root returns to full width');assert.equal(rows[6].margin,0,'Orphan safely shown as root');
  const first=host.locator('.dd-comment-card').first();await first.locator('[data-vote-value="1"]').click();assert.equal(await first.locator('[data-vote-value="1"]').getAttribute('aria-pressed'),'true');
  await first.locator('[data-vote-value="-1"]').click();assert.equal(await first.locator('[data-vote-value="-1"]').getAttribute('aria-pressed'),'true');assert.equal(await first.locator('[data-vote-value="1"]').getAttribute('aria-pressed'),'false');
  await first.locator('.dd-action-share').click();assert.match(await page.evaluate(()=>window.__m67.shared.at(-1).url),/dd_comment=88888888/);
  page.once('dialog',dialog=>dialog.accept('spam'));await first.locator('.dd-comment-flag').click();await page.waitForFunction(()=>window.__m68.calls.some(x=>x.name==='insert:dd_case_comment_flags'));
  await first.locator('.dd-comment-reply-button').click();const form=archive.locator('form');await form.locator('textarea').fill('A compact threaded reply.');await form.getByRole('button',{name:'Post reply',exact:true}).click();await archive.getByText('A compact threaded reply.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__m67.posts.at(-1).parent_id),await page.evaluate(()=>window.__m68.ids[0]));
  for(const [tab,key] of [['discover','#newsGrid article[data-news-id]'],['watchRead','[data-media-id="fixture-doc"]'],['clips','[data-video-id="m67-video"]']]){
   await page.evaluate(tab=>window.navigateTo(tab),tab);const card=page.locator(key).first();await card.locator('.dd-inline-comments-toggle').click();await card.getByText('Start with the original report.',{exact:true}).waitFor();await compactThread(card.locator('.dd-inline-comments-preview'),'.dd-comment-card');
  }
  await page.evaluate(()=>window.ddOpenCaseDiscussion('case:fixture','Fixture discussion'));await page.locator('#ddCommentsToggle').click();await page.locator('#ddCaseDiscussionList .dd-comment-card').first().waitFor();await compactThread(page.locator('#ddCaseDiscussionList'),'.dd-comment-card');await page.locator('#ddCaseDiscussionClose').click();
  await page.goto(BASE+'/__m68-forum?view=discussionsPage',{waitUntil:'domcontentloaded'});
  await page.getByRole('tab',{name:'Sections',exact:true}).click();
  await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).click();await page.getByRole('button',{name:/Read discussion: What should we check first/}).click();await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor();
  await compactThread(page.locator('#ddForumReplies'),'.dd-forum-reply-card',true);
  const reply=page.locator('#ddForumReplies .dd-forum-reply-card').first();await reply.getByRole('button',{name:'↳ Reply',exact:true}).click();await page.getByRole('textbox',{name:'Write a comment or reply'}).fill('A compact forum reply.');await page.getByRole('button',{name:'Post reply',exact:true}).click();await page.getByText('A compact forum reply.',{exact:true}).waitFor();
  assert.deepEqual(errors,[],'No JavaScript errors at '+width);await context.close();
 }
 console.log('PASS M68 real Chromium 320/393/820/1280: compact unboxed vertical threads, progressive reply guides, readable long sources/orphans, votes/switching, reply parent/post, flag/share, News/Archive/Watch&Read/Videos/Case and forum parity, no overflow/errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
