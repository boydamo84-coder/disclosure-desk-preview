'use strict';
// Fictional accounts, discussion rows and vote totals only; all external traffic blocked.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./social_design_fixture.cjs');
const base='http://127.0.0.1:4173';
const useOriginal=process.env.GUEST_QA_ORIGINAL==='1';
const browserPath=process.env.CHROMIUM_PATH||'/usr/bin/google-chrome';
function replaceExact(source,from,to){
 assert(source.includes(from),'Fixture contract: '+from.slice(0,80));return source.replace(from,to);
}
let html=buildFixture();
html=replaceExact(html,'let user=A;const listeners=[];',
 'let user=null;const listeners=[];let releaseAuth,slowAuth=true,summaryCalls=0,summaryMode="transient";const writes=[];');
html=replaceExact(html,'getUser:async()=>answer({user:user?{id:user,is_anonymous:false}:null})',
 'getUser:async()=>{if(slowAuth)await new Promise(r=>{releaseAuth=r});return answer({user:user?{id:user,is_anonymous:false}:null})}');
html=replaceExact(html,"if(name==='dd_chat_my_pairs')",
 `if(name==='dd_news_article_vote_summary'){
  summaryCalls++;if(summaryMode==='denied')return {data:null,error:{message:'Permission denied'},status:403};
  if(summaryCalls===1)return {data:null,error:{message:'Service temporarily unavailable'},status:503};
  return answer(p.p_story_keys.map(story_key=>({story_key,upvotes:7,downvotes:2,my_vote:0})));
 }
 if(name==='dd_news_article_vote_set'){
  writes.push({name,user});return user?answer([{upvotes:8,downvotes:2,my_vote:p.p_value}]):{data:null,error:{message:'Forbidden'}};
 }
 if(name==='dd_discussions_vote'||name==='dd_discussions_reply'||name==='dd_discussions_create_thread_v2'||name==='dd_discussions_create_section')writes.push({name,user});
 if(name==='dd_chat_my_pairs')`);
html=replaceExact(html,'privateChat:true,discussions:true','privateChat:true,discussions:true,voting:true');
html=replaceExact(html,'window.__SocialQA={globalPosts,switchAccount(id)',
 'window.__GuestQA={release(){slowAuth=false;releaseAuth?.()},summaryCalls:()=>summaryCalls,writes,deny(){summaryMode="denied"}};window.__SocialQA={globalPosts,switchAccount(id)');
html=replaceExact(html,'<script defer src="/assets/profile-private-chat.js"></script><script defer src="/assets/chat-tab-ui.js"></script>','');
html=replaceExact(html,'<script defer src="/assets/community-discussions.js"></script>',
 '<script>document.getElementById("newsGrid").innerHTML=\'<div data-news-article-votes="news:guest-regression"></div>\';</script><script defer src="/assets/news-article-votes.js"></script><script defer src="/assets/community-discussions.js"></script>');
(async()=>{
 const browser=await chromium.launch({executablePath:browserPath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<760,serviceWorkers:'block'});
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.origin!==base)return route.abort('blockedbyclient');
    if(url.pathname==='/guest-qa')return route.fulfill({status:200,contentType:'text/html',body:html});
    if(url.pathname.startsWith('/assets/')){
     const name=url.pathname.split('/').at(-1);
     if(!/^[a-z0-9.-]+$/i.test(name))return route.abort();
     const file=path.join(__dirname,'..',useOriginal&&['community-discussions.js','news-article-votes.js'].includes(name)?'original':'assets',name);
     if(fs.existsSync(file))return route.fulfill({path:file,contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'application/octet-stream'});
    }
    return route.fulfill({status:404,body:''});
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/guest-qa?view=discussionsPage',{waitUntil:'domcontentloaded'});
   const feed=page.locator('#ddForumGlobalFeed');
   await feed.locator('.dd-forum-post-card').first().waitFor({timeout:5000});
   assert.equal(await feed.locator('.dd-forum-post-card').count(),5,'Guest sees feed even while the identity lookup is unresolved');
   assert.equal(await page.locator('#ddForumSections .dd-forum-section-card').count(),4,'Guest sees all subjects');
   // Confirm the delayed authentication call doesn't prevent public reading.
   await page.evaluate(()=>window.__GuestQA.release());
   await feed.locator('.dd-forum-vote').first().click();
   await page.waitForFunction(()=>document.getElementById('ddForumStatus').textContent.includes('Sign in'));
   assert.equal(await page.evaluate(()=>window.__GuestQA.writes.length),0,'Guest vote never reaches write RPC');
   await feed.locator('.dd-forum-title').first().click();
   await page.locator('#ddForumReplies .dd-forum-reply-card').first().waitFor({timeout:5000});
   assert.equal(await page.locator('#ddForumReplies .dd-forum-reply-card').count(),3,'Guest sees all replies');
   const composer=page.locator('#ddForumReplyCreate');
   if(await composer.isVisible()){
    await composer.locator('textarea').fill('Synthetic guest must not publish');
    await composer.locator('button[type=submit]').click();
    await page.waitForFunction(()=>document.getElementById('ddForumStatus').textContent.includes('Sign in'));
   }
   assert.equal(await page.evaluate(()=>window.__GuestQA.writes.length),0,'Guest reply never reaches write RPC');
   await page.evaluate(()=>window.navigateTo('discover'));
   const up=page.getByRole('button',{name:'Upvote article',exact:true});
   await page.waitForFunction(()=>document.querySelector('[data-news-vote="1"]')?.textContent==='▲ 7',{},{timeout:5000});
   assert.equal(await page.getByRole('button',{name:'Downvote article',exact:true}).innerText(),'▼ 2');
   assert.equal(await page.evaluate(()=>window.__GuestQA.summaryCalls()),2,'Transient failure recovered with one retry');
   await up.click();
   await page.waitForFunction(()=>document.querySelector('.dd-news-vote-status')?.textContent==='Sign in to vote');
   assert.equal(await page.evaluate(()=>window.__GuestQA.writes.length),0,'Guest news vote never reaches write RPC');
   await page.evaluate(()=>window.__SocialQA.switchAccount('11111111-1111-4111-8111-111111111111'));
   await up.click();
   await page.waitForFunction(()=>document.querySelector('[data-news-vote="1"]')?.textContent==='▲ 8');
   assert.equal(await page.evaluate(()=>window.__GuestQA.writes.length),1,'Registered members can vote');
   // Explicit denial must not be retried, masked with fake zeroes, or enable writes.
   await page.evaluate(()=>{
    window.__GuestQA.deny();
    const card=document.createElement('div');card.dataset.newsArticleVotes='news:denied-case';document.getElementById('newsGrid').append(card);
   });
   const denied=page.locator('[data-news-article-votes="news:denied-case"]');
   await denied.getByText('Vote totals temporarily unavailable. Reload to retry.',{exact:true}).waitFor({timeout:5000});
   assert.equal(await denied.getByRole('button',{name:'Upvote article'}).isEnabled(),false);
   assert.equal(await page.evaluate(()=>window.__GuestQA.summaryCalls()),3,'No retry on permission denial');
   assert.deepEqual(errors,[],'No browser errors');
   await context.close();console.log('PASS guest/member access '+width+'px: slow identity, public threads/replies/counts, transient recovery, no guest writes, no permission retry');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
