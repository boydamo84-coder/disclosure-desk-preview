'use strict';
// Real controllers/styles, loopback-only fictional data; no public messages or accounts.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./social_design_fixture.cjs');
const BASE='http://127.0.0.1:4173',html=buildFixture();
const firstTitle='What should we check first when reviewing an unfamiliar sighting?';
const parentId='33333333-cccc-4ccc-8ccc-cccccccccccc',childId='44444444-dddd-4ddd-8ddd-dddddddddddd';
async function noOverflow(page,label){const size=await page.evaluate(()=>({w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth}));assert(size.s<=size.w+2,label+': '+JSON.stringify(size));}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let checks=0;
try{for(const width of [320,393,820,1280]){
 const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block'});
 await ctx.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==BASE)return route.abort('blockedbyclient');if(u.pathname==='/__social-design')return route.fulfill({status:200,contentType:'text/html',body:html});return route.continue()});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+'/__social-design?view=chatPage',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:/NovaAtlas · 2 unread/}).waitFor();
 const icon=await page.locator('#ddChatNew').evaluate(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e),p=getComputedStyle(e,'::before'),q=getComputedStyle(e,'::after');return {width:b.width,height:b.height,font:s.fontSize,left:parseFloat(p.left),top:parseFloat(p.top),vertical:q.transform}});
 assert.equal(icon.width,40);assert.equal(icon.height,40);assert.equal(icon.font,'0px');assert(Math.abs(icon.left-20)<.6&&Math.abs(icon.top-20)<.6,JSON.stringify(icon));assert.notEqual(icon.vertical,'none');checks++;
 await noOverflow(page,'Chat inbox '+width);checks++;
 await page.getByRole('button',{name:'Unread (1)',exact:true}).click();assert.equal(await page.locator('.dd-chat-side>.dd-chat-people .dd-chat-person').count(),1);
 await page.getByRole('button',{name:/All chats/,exact:true}).click();await page.getByRole('searchbox',{name:'Search existing conversations'}).fill('Signal');assert.equal(await page.locator('.dd-chat-side>.dd-chat-people .dd-chat-person').count(),1);await page.getByRole('searchbox',{name:'Search existing conversations'}).fill('');checks++;
 await page.getByRole('button',{name:/NovaAtlas ·/}).click();await page.getByRole('textbox',{name:'Write a private message'}).waitFor();
 const input=page.getByRole('textbox',{name:'Write a private message'});await input.fill('A private draft that survives refresh.');await page.evaluate(()=>window.DDPrivateChat.refresh());assert.equal(await input.inputValue(),'A private draft that survives refresh.');checks++;
 const composer=await page.locator('.dd-chat-compose').boundingBox(),dock=await page.locator('nav.nav').boundingBox();assert(composer&&dock&&composer.y+composer.height<=dock.y+2&&composer.y>=0,'composer remains above navigation '+width);checks++;
 await input.fill('Fictional design acceptance message.');await page.getByRole('button',{name:'Send private message',exact:true}).click();await page.locator('.dd-chat-history').getByText('Fictional design acceptance message.',{exact:true}).waitFor();assert.equal(await input.inputValue(),'');await noOverflow(page,'Chat conversation '+width);checks++;
 if(width<760){await page.getByRole('button',{name:'Back to chats',exact:true}).click();await page.getByRole('heading',{name:'Chats',exact:true}).waitFor();assert.equal(await page.locator('.dd-chat-person[aria-pressed=true]').count(),0);checks++;}
 else {const sidebar=await page.locator('.dd-chat-side').boundingBox(),view=await page.locator('.dd-chat-view').boundingBox();assert(sidebar&&view&&view.x>=sidebar.x+sidebar.width-1);checks++;}
 await page.getByRole('button',{name:'Start a new chat',exact:true}).click();await page.getByRole('textbox',{name:'Search user by exact public username'}).fill('DraftRecipient');await page.getByRole('button',{name:'Request chat',exact:true}).click();await page.getByRole('textbox',{name:'Invitation preview message',exact:true}).fill('An invitation draft from the previous account.');
 await page.evaluate(async()=>{window.__SocialQA.switchAccount('22222222-2222-4222-8222-222222222222');await window.DDPrivateChat.refresh()});
 await page.getByRole('button',{name:'Start a new chat',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Search user by exact public username'}).inputValue(),'');assert.equal(await page.getByRole('textbox',{name:'Invitation preview message',exact:true}).isVisible(),false);assert.equal(await page.locator('.dd-chat-request-feedback').innerText(),'');checks++;
 await page.getByRole('button',{name:'Close new chat request',exact:true}).click();
 await page.evaluate(()=>window.navigateTo('discussionsPage'));await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).waitFor();await noOverflow(page,'Subjects '+width);checks++;
 const originalSubject=page.locator('#ddForumSections .dd-forum-section-card').first();
 await originalSubject.locator('button[data-section-favourite]').click();
 await page.locator('#ddForumFavouriteGroup').getByRole('button',{name:/Open favourite subject UAP evidence/}).waitFor();
 assert.equal(await page.locator('#ddForumSubjectNav button[aria-pressed=true]').count(),1,
  'Favourited subject shows a selected star beside the sidebar subject');checks++;
 await page.evaluate(()=>window.__SocialQA.switchAccount('11111111-1111-4111-8111-111111111111'));
 await page.waitForFunction(()=>document.getElementById('ddForumFavouriteGroup').hidden);
 await page.evaluate(()=>window.__SocialQA.switchAccount('22222222-2222-4222-8222-222222222222'));
 await page.locator('#ddForumFavouriteGroup').getByRole('button',{name:/Open favourite subject UAP evidence/}).waitFor();
 checks++;
 await page.evaluate(()=>{
  window.__SocialQA.sections.unshift({id:'99999999-9999-4999-8999-999999999999',
   title:'Recently created subject',description:'A newly added fictional subject',
   topic:'Evidence',thread_count:0,is_steward:false,created_at:new Date().toISOString()});
  window.DDDiscussions.refresh();
 });
 await page.getByRole('button',{name:'Browse subject: Recently created subject'}).waitFor();
 const subjectLabels=await page.locator('#ddForumSections .dd-forum-section-card>.dd-forum-title').allInnerTexts();
 assert.equal(subjectLabels.at(-1),'Recently created subject','Newly added subjects must appear at bottom, even when API returns newest first');
 await noOverflow(page,'Starred subjects '+width);checks++;
 await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).click();await page.getByRole('button',{name:'Read discussion: '+firstTitle,exact:true}).waitFor();assert.equal(await page.locator('#ddForumPostList .dd-forum-post-card').count(),3);assert.equal(await page.locator('#ddForumPostList .dd-forum-reply-card').count(),0);assert.equal(await page.locator('#ddForumPostList .dd-forum-avatar').first().getAttribute('data-social-avatar'),'NovaAtlas');checks++;
 await page.getByRole('searchbox',{name:'Search this subject',exact:true}).fill('rainy');await page.waitForFunction(()=>document.querySelectorAll('#ddForumPostList .dd-forum-post-card').length===1);await page.getByRole('searchbox',{name:'Search this subject',exact:true}).fill('');await page.waitForFunction(()=>document.querySelectorAll('#ddForumPostList .dd-forum-post-card').length===3);checks++;
 // Deliberately place a sibling between a parent and its child in RPC order.
 await page.evaluate(()=>{
  window.__SocialQA.replies.push(window.__SocialQA.replies.splice(1,1)[0]);
  for(let i=1;i<=3;i++)window.__SocialQA.replies.push({
   id:'88888888-8888-4888-8888-'+String(i).padStart(12,'0'),
   author_name:'SyntheticCommenter',body:'Extra comment auto-visible '+i,
   created_at:new Date().toISOString(),likes:0,dislikes:0,my_vote:0
  });
 });
 await page.getByRole('button',{name:'Read discussion: '+firstTitle,exact:true}).click();await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor();
 const order=await page.locator('#ddForumReplies .dd-forum-reply-card').evaluateAll(es=>es.map(e=>e.dataset.ddForumReplyId));assert.equal(order[0],parentId);assert.equal(order[1],childId);assert.equal(await page.locator('#ddForumReplies .dd-forum-avatar').first().getAttribute('data-social-avatar'),'SignalSeeker');assert.equal(await page.locator('#ddForumThreadTitle').isVisible(),false);checks++;
 const nested=page.locator('[data-dd-forum-reply-id="'+childId+'"]');assert(await nested.evaluate(e=>parseFloat(getComputedStyle(e).marginLeft)>0));
 assert.equal(await page.locator('#ddForumReplies .dd-forum-reply-card').count(),6,
  'Opening any post automatically displays all six comments without pressing Show more');
 assert.equal(await page.locator('#ddForumReplyCreate').isVisible(),true,'Comment field immediately visible');
 const commentInput=page.getByRole('textbox',{name:'Write a comment or reply'});
 assert.equal(await commentInput.getAttribute('rows'),'1','Comment editor begins at one line');
 const oneLine=await commentInput.evaluate(e=>e.getBoundingClientRect().height);
 assert(oneLine<=62,'One-line editor should not occupy the old tall reply box: '+oneLine);
 await commentInput.fill(Array.from({length:12},()=> 'An original source review').join(String.fromCharCode(10)));
 const expandedEditor=await commentInput.evaluate(e=>({
  visual:e.getBoundingClientRect().height,scroll:e.scrollHeight,
  overflow:getComputedStyle(e).overflowY
 }));
 assert(expandedEditor.visual>oneLine&&expandedEditor.visual<=100,
  'Comment editor grows to no more than three lines: '+JSON.stringify(expandedEditor));
 assert(expandedEditor.scroll>expandedEditor.visual&&expandedEditor.overflow==='auto',
  'Further comment lines must be scrollable before submitting');
 await commentInput.fill('');checks++;
 await page.locator('[data-dd-forum-reply-id="'+parentId+'"]').getByRole('button',{name:'↳ Reply',exact:true}).click();
 const reply=page.locator('#ddForumReplyCreate');assert.equal(await reply.evaluate(e=>e.previousElementSibling?.dataset.ddForumReplyId),parentId);await reply.getByRole('textbox').fill('A fictional inline reply for layout acceptance.');await reply.getByRole('button',{name:'Post reply',exact:true}).click();await page.locator('#ddForumReplies').getByText('A fictional inline reply for layout acceptance.',{exact:true}).waitFor();checks++;
 await noOverflow(page,'Comment thread '+width);assert.deepEqual(errors,[]);checks++;
 console.log('PASS M49 '+width+'px: centred add icon, inbox/filter/search, stable draft/send, viewport, account switch, subject/feed and grouped inline replies');await ctx.close();
}console.log('PASS M49 social design: '+checks+' controlled real Chromium checks; no live service used');}finally{await browser.close()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
