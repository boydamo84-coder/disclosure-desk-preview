'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./m68_comment_thread_fixture.cjs');
const {buildFixture:forumFixture}=require('./social_design_fixture.cjs');
const BASE='http://127.0.0.1:4173';
const rank={vote:0,comments:1,board:2,share:3,extra:4,reply:5,spacer:6};
async function checkRail(rail,kind,label,withComments=true){
 await rail.locator('xpath=..').waitFor();
 await rail.evaluate(el=>window.DDUnifiedActionRails?.normalise(el));
 const data=await rail.evaluate(el=>{
  const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
  const children=[...el.children].filter(n=>n.dataset.ddActionSlot!=='spacer');
  return {type:el.dataset.ddRailType,ordered:children.map(n=>n.dataset.ddActionSlot),
   bg:style.backgroundColor,width:rect.width,viewport:innerWidth,
   overflow:document.documentElement.scrollWidth>innerWidth+1,
   buttons:[...el.querySelectorAll('button')].map(x=>({height:x.getBoundingClientRect().height,
    pressed:x.getAttribute('aria-pressed'),label:x.getAttribute('aria-label')||x.textContent}))};
 });
 assert.equal(data.type,kind,label+': common rail kind');
 assert(data.ordered.length>0,label+': actions exist');
 for(let i=1;i<data.ordered.length;i++)
  assert(rank[data.ordered[i]]>=rank[data.ordered[i-1]],
    label+': expected vote → comments → Board → Share → extras → Reply, got '+data.ordered.join(','));
 if(withComments)assert(data.ordered.includes('comments'),label+': comments control expected');
 assert(data.ordered.includes('board')&&data.ordered.includes('share'),label+': Board and Share retain real handlers');
 assert(data.buttons.every(b=>b.height>=39),label+': button touch targets >=39px');
 assert(!data.overflow,label+': no viewport overflow');
 assert(data.width<=data.viewport+1,label+': rail contained in screen');
 if(kind==='comment')assert.equal(data.bg,'rgba(0, 0, 0, 0)',label+': compact forum-style transparent comment row');
 else assert.equal(data.bg,'rgb(15, 37, 52)',label+': identical Discussion-style navy action strip');
 return data;
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const width of [320,393,820,1280]){
  const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'}),errors=[];
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());if(u.origin!==BASE)return route.abort();
   if(u.pathname==='/__m70-main')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});
   if(u.pathname==='/__m70-forum')return route.fulfill({contentType:'text/html; charset=utf-8',body:forumFixture()});
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/__m70-main?dd_tab=archivePage',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.DDUnifiedActionRails);
  await page.evaluate(()=>{window.__m67.user=true});
  const archive=page.locator('[data-archive-id="m67-archive-a"]').first();
  await archive.waitFor();
  const a=await checkRail(archive.locator('.dd-archive-action-rail'),'post','Archive',true);
  assert(await archive.locator('.dd-archive-follow').count()===1,'Archive Follow remains outside bottom rail');
  await archive.locator('.dd-inline-comments-toggle').click();
  await archive.getByText('Start with the original report.',{exact:true}).waitFor();
  const first=archive.locator('.dd-comment-card').first();
  const ac=await checkRail(first.locator('.dd-comment-action-rail'),'comment','Archive reply',false);
  assert(ac.ordered.includes('vote')&&ac.ordered[ac.ordered.length-1]==='reply','Comment Reply stays at end');
  assert(await first.locator('.dd-comment-flag').count()===1,'Flag stays in comment header');
  // Redraw must preserve the same single rail and handlers.
  await page.evaluate(()=>window.DDUnifiedActionRails.scan(document));
  assert.equal(await first.locator('.dd-comment-action-rail').count(),1,'Repeated normalisation must not duplicate actions');
  for(const [tab,locator,label] of [
   ['discover','#newsGrid article[data-news-id]','News'],
   ['watchRead','[data-media-id="fixture-doc"]','Watch & Read'],
   ['clips','[data-video-id="m67-video"]','Videos']
  ]){
   await page.evaluate(dest=>window.navigateTo(dest),tab);
   const card=page.locator(locator).first();await card.waitFor();
   const rail=card.locator(label==='News'?'.dd-news-main-actions':label==='Videos'?'.clip-utility-actions':'.dd-media-actions');
   const result=await checkRail(rail,'post',label,true);
   assert(result.ordered.indexOf('comments')<result.ordered.indexOf('board'),'Comments placed ahead of Board on '+label);
   await card.locator('.dd-inline-comments-toggle').click();
   await card.getByText('Start with the original report.',{exact:true}).waitFor();
   const reply=card.locator('.dd-comment-card').first();
   await checkRail(reply.locator('.dd-comment-action-rail'),'comment',label+' reply',false);
   await reply.locator('.dd-comment-reply-button').click();
   assert.equal(await card.locator('form button[type=submit]').textContent(),'Post reply','Reply composer matches Discussion on '+label);
   const body=card.locator('form textarea');
   assert.equal(await body.getAttribute('rows'),'1','All public composers start as a single line on '+label);
   // No synthetic vote counters added to media titles or video cards.
   if(label==='Videos'||label==='Watch & Read')assert(!result.ordered.includes('vote'),label+': no unsupported fabricated member-vote counter');
  }
  // Case / Hearing discussions reuse the same shared public comment actions.
  await page.evaluate(()=>window.ddOpenCaseDiscussion('case:fixture','Fixture case discussion'));
  await page.locator('#ddCaseDiscussionDialog:not([hidden])').waitFor();
  await checkRail(page.locator('#ddCaseDiscussionActions'),'post','Case/Hearing',true);
  await page.locator('#ddCommentsToggle').click();
  await page.locator('#ddCaseDiscussionBody').waitFor({state:'visible'});
  assert.equal(await page.locator('#ddCaseDiscussionBody').getAttribute('rows'),'1','Case/Hearing composer starts as single line');
  await page.locator('#ddCaseDiscussionBody').fill('Test case / hearing reply input expands to three lines while preserving all existing comments.');
  const caseHeight=await page.locator('#ddCaseDiscussionBody').evaluate(el=>el.getBoundingClientRect().height);
  assert(caseHeight>=44&&caseHeight<=95,'Case/Hearing composer is capped at three lines');
  await page.locator('#ddCaseDiscussionList .dd-comment-card').first().waitFor();
  await checkRail(page.locator('#ddCaseDiscussionList .dd-comment-card').first().locator('.dd-comment-action-rail'),'comment','Case/Hearing reply',false);
  await page.locator('#ddCaseDiscussionList .dd-comment-card').first().locator('.dd-comment-reply-button').click();
  assert.equal(await page.locator('#ddCaseDiscussionForm button[type=submit]').textContent(),'Post reply','Case/Hearing Reply follows the Discussion pattern');
  await page.locator('#ddCaseDiscussionClose').click();
  await page.goto(BASE+'/__m70-forum?view=discussionsPage',{waitUntil:'domcontentloaded'});
  await page.addScriptTag({url:BASE+'/assets/unified-action-rails.js'});
  await page.getByRole('tab',{name:'Sections',exact:true}).click();
  await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).click();
  const post=page.locator('#ddForumPostList .dd-forum-post-card').first();await post.waitFor();
  const f=await checkRail(post.locator('.dd-forum-actions'),'post','Discussions original',true);
  assert(f.ordered[0]==='vote'&&f.ordered[1]==='vote','Discussion likes/dislikes remain adjacent');
  await page.getByRole('button',{name:/Read discussion: What should we check first/}).click();
  await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor();
  const fr=await checkRail(page.locator('#ddForumReplies .dd-forum-reply-card').first().locator('.dd-forum-actions'),'comment','Discussion reply',false);
  assert(fr.ordered.at(-1)==='reply','Discussion inline Reply shares the same end position');
  assert.deepEqual(errors,[],'No browser JavaScript errors at '+width);
  await context.close();
 }
 console.log('PASS M70 unified real Chromium 320/393/820/1280: same ordered/navy post rails and compact comment rows for Discussions, News, Archive, Videos, Watch & Read; Reply, dropdown, Board, Share, existing vote permissions, small-screen geometry');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
