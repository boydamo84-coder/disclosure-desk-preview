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
 await page.getByRole('button',{name:'Browse subject: UAP evidence',exact:true}).click();await page.getByRole('button',{name:'Read discussion: '+firstTitle,exact:true}).waitFor();assert.equal(await page.locator('#ddForumPostList .dd-forum-post-card').count(),3);assert.equal(await page.locator('#ddForumPostList .dd-forum-reply-card').count(),0);assert.equal(await page.locator('#ddForumPostList .dd-forum-avatar').first().getAttribute('data-social-avatar'),'NovaAtlas');checks++;
 await page.getByRole('searchbox',{name:'Search this subject',exact:true}).fill('rainy');await page.waitForFunction(()=>document.querySelectorAll('#ddForumPostList .dd-forum-post-card').length===1);await page.getByRole('searchbox',{name:'Search this subject',exact:true}).fill('');await page.waitForFunction(()=>document.querySelectorAll('#ddForumPostList .dd-forum-post-card').length===3);checks++;
 // Deliberately place a sibling between a parent and its child in RPC order.
 await page.evaluate(()=>window.__SocialQA.replies.push(window.__SocialQA.replies.splice(1,1)[0]));
 await page.getByRole('button',{name:'Read discussion: '+firstTitle,exact:true}).click();await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor();
 const order=await page.locator('#ddForumReplies .dd-forum-reply-card').evaluateAll(es=>es.map(e=>e.dataset.ddForumReplyId));assert.equal(order[0],parentId);assert.equal(order[1],childId);assert.equal(await page.locator('#ddForumReplies .dd-forum-avatar').first().getAttribute('data-social-avatar'),'SignalSeeker');assert.equal(await page.locator('#ddForumThreadTitle').isVisible(),false);checks++;
 const nested=page.locator('[data-dd-forum-reply-id="'+childId+'"]');assert(await nested.evaluate(e=>parseFloat(getComputedStyle(e).marginLeft)>0));
 await page.locator('[data-dd-forum-reply-id="'+parentId+'"]').getByRole('button',{name:'↳ Reply',exact:true}).click();
 const reply=page.locator('#ddForumReplyCreate');assert.equal(await reply.evaluate(e=>e.previousElementSibling?.dataset.ddForumReplyId),parentId);await reply.getByRole('textbox').fill('A fictional inline reply for layout acceptance.');await reply.getByRole('button',{name:'Post reply',exact:true}).click();await page.locator('#ddForumReplies').getByText('A fictional inline reply for layout acceptance.',{exact:true}).waitFor();checks++;
 await noOverflow(page,'Comment thread '+width);assert.deepEqual(errors,[]);checks++;
 console.log('PASS M49 '+width+'px: centred add icon, inbox/filter/search, stable draft/send, viewport, account switch, subject/feed and grouped inline replies');await ctx.close();
}console.log('PASS M49 social design: '+checks+' controlled real Chromium checks; no live service used');}finally{await browser.close()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
