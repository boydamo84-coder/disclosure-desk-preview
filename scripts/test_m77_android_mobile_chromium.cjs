'use strict';
// Offline real Chromium tests of the exact M77 reply CSS and mobile Chat viewport.
// Synthetic public comments only; never reads or modifies real Supabase data.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./m73_owner_comments_fixture.cjs');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820]){
   const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==BASE)return route.abort();
    if(url.pathname==='/__m77-mobile')return route.fulfill({contentType:'text/html; charset=utf-8',body:buildFixture()});
    return route.continue();
   });
   const page=await context.newPage();
   await page.goto(BASE+'/__m77-mobile?dd_tab=archivePage',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.__m68 && !!window.DDCommunityVotes);
   const ids=await page.evaluate(()=>window.__m68.ids);
   const archive=page.locator('[data-archive-id="m67-archive-a"]').first();
   await archive.locator('.dd-inline-comments-toggle').click();
   const parent=archive.locator('[data-dd-news-comment-id="'+ids[0]+'"]');
   const child=archive.locator('[data-dd-news-comment-id="'+ids[1]+'"]');
   await parent.waitFor({state:'visible'});
   await child.waitFor({state:'visible'});
   const geo=await page.evaluate(ids=>{
    const root=document.querySelector('[data-archive-id="m67-archive-a"]');
    const a=root.querySelector('[data-dd-news-comment-id="'+ids[0]+'"]');
    const b=root.querySelector('[data-dd-news-comment-id="'+ids[1]+'"]');
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(),css=getComputedStyle(b);
    const target=b.querySelector('.dd-comment-parent-label');
    return {parentLeft:ar.left,childLeft:br.left,parentWidth:ar.width,childWidth:br.width,
      indent:css.getPropertyValue('--dd-comment-indent').trim(),border:css.borderLeftWidth,
      targetVisibility:target?.getBoundingClientRect().height||0,
      overflow:document.documentElement.scrollWidth-innerWidth};
   },ids);
   assert(geo.childLeft>=geo.parentLeft+12,'Reply must visibly indent at '+width+': '+JSON.stringify(geo));
   assert(geo.childWidth<=geo.parentWidth-12,'Reply must actually narrow, not widen: '+JSON.stringify(geo));
   assert(parseFloat(geo.border)>=2,'Reply thread guide visible');
   assert(geo.targetVisibility>0,'Replying-to caption is visible');
   assert(geo.overflow<=1,'Thread must not cause horizontal overflow');
   if(width<760){
    await page.evaluate(()=>{
     const chat=document.querySelector('#chatPage');
     chat.classList.remove('hidden');chat.removeAttribute('hidden');chat.classList.add('dd-chat-designed');
     chat.style.setProperty('--dd-chat-visual-height','960px');
     chat.style.setProperty('--dd-chat-visual-top','0px');
     chat.style.setProperty('--dd-chat-bottom-space','76px');
     const mount=document.getElementById('ddChatPageMount');mount.replaceChildren();
     const host=document.createElement('div');host.id='ddProfileChatApp';
     const layout=document.createElement('div');layout.className='dd-chat-layout';
     const side=document.createElement('div');side.className='dd-chat-side';
     const head=document.createElement('div');head.className='dd-chat-sidebar-head';head.textContent='Chats';
     const people=document.createElement('div');people.className='dd-chat-people';
     people.textContent='Fixture conversation';
     side.append(head,people);layout.append(side);host.append(layout);mount.append(host);
    });
    const panel=await page.evaluate(()=>{
     const chat=document.getElementById('chatPage'),side=chat.querySelector('.dd-chat-side');
     const cr=chat.getBoundingClientRect(),sr=side.getBoundingClientRect(),computed=getComputedStyle(chat);
     const mount=chat.querySelector('#ddChatPageMount'),app=chat.querySelector('#ddProfileChatApp'),layout=chat.querySelector('.dd-chat-layout');
     return {top:cr.top,height:cr.height,width:cr.width,sideHeight:sr.height,position:computed.position,
       mountHeight:mount?.getBoundingClientRect().height,appHeight:app?.getBoundingClientRect().height,
       layoutHeight:layout?.getBoundingClientRect().height,sideComputedHeight:getComputedStyle(side).height,
       overflow:document.documentElement.scrollWidth-innerWidth};
    });
    assert.equal(panel.position,'fixed');
    assert(panel.top>=-1&&panel.top<=1,'Chat starts at top, not below unused website header');
    assert(panel.height>=880&&panel.height<=886,'Chat fills viewport above dock: '+JSON.stringify(panel));
    assert(panel.sideHeight>=panel.height-60,'Chat conversation list fills the remaining viewport beneath its 46px search/control strip: '+JSON.stringify(panel));
    assert(panel.overflow<=1,'Chat must not widen page');
   }
   await context.close();
   console.log('PASS M77 mobile nested replies and Chat viewport '+width+'px');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
