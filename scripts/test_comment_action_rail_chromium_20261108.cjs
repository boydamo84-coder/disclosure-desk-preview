'use strict';
// Real offline Chromium UI acceptance for shared comments across News,
// Cases, Videos and Hearings. Never contacts live Supabase or Netlify.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
const ID='11111111-1111-4111-8111-111111111111';
(async()=>{
 const html=fs.readFileSync('index.html','utf8');
 const css=html.match(/<style id="dd-comment-action-rail-v1">([\s\S]*?)<\/style>/)?.[1];
 assert.ok(css,'shared comments CSS must be in index');
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 let passed=0;
 function pass(s){passed++;console.log('PASS COMMENT ACTION RAIL '+s)}
 try{
  for(const width of [393,1280]){
   const context=await browser.newContext({viewport:{width,height:width===393?852:850},
      isMobile:width===393,hasTouch:width===393,locale:'en-GB'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===BASE?
      route.continue():route.abort('blockedbyclient'));
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
   await page.goto(BASE+'/robots.txt',{waitUntil:'domcontentloaded'});
   await page.setContent('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
      '<body style="background:#0b1823;color:#eee;font:14px system-ui"><div id="cases"></div>'+
      '<article class="card"><div class="dd-news-main-actions dd-action-rail"><button class="dd-action-board">☆</button></div>'+ 
      '<div class="dd-news-inline-comments" data-news-comments="news:sample" data-comments-collapsed="true"></div></article></body></html>');
   await page.addStyleTag({content:css});
   await page.evaluate(id=>{
     const calls=[];window.__commentActionCalls=calls;
     window.DD_COMMUNITY_TEST_CONFIG={environment:'test',url:'https://invalid.test',publishableKey:'public-fixture'};
     window.DD_COMMUNITY_FEATURES={voting:true};
     window.DDMemberAvatars={decorate(avatar){avatar.dataset.decorated='yes'}};
     window.DDPublicProfiles={namesFor:async()=>({[id]:'SampleReporter'})};
     window.prompt=()=> 'spam';
     window.supabase={createClient:()=>({
       auth:{getUser:async()=>({data:{user:{id:'22222222-2222-4222-8222-222222222222',is_anonymous:false}},error:null})},
       rpc:async(name,args)=>{
         calls.push({name,args});
         if(name==='dd_public_comments')return {data:[{
           id,body:'Research discussion comment',created_at:'2026-11-08T19:00:00Z',
           is_mine:false
         }],error:null};
         if(name==='dd_vote_summary')return {data:[{target_id:id,likes:3,dislikes:2,my_vote:0}],error:null};
         if(name==='dd_vote_set')return {data:{likes:4,dislikes:2,my_vote:1},error:null};
         throw Error('Unexpected RPC '+name);
       },
       from:table=>({insert:async row=>{calls.push({name:'insert:'+table,args:row});return {data:[],error:null};}})
     })};
   },ID);
   await page.addScriptTag({url:BASE+'/assets/community-votes.js'});
   await page.addScriptTag({url:BASE+'/assets/case-discussions.js'});
   await page.addScriptTag({url:BASE+'/assets/inline-news-comments.js'});
   const host=page.locator('[data-news-comments]');
   const toggle=page.locator('.dd-inline-comments-toggle');
   await toggle.waitFor({state:'visible'});
   assert.equal(await toggle.evaluate(el=>el.closest('[data-news-comments]')===null),true,'Visible comments toggle stays outside collapsed panel');
   assert.equal(await toggle.getAttribute('aria-expanded'),'false','News comments closed by default');
   assert.equal(await host.isVisible(),false,'News comments must not render previews until tapped');
   assert.equal(await page.evaluate(()=>window.__commentActionCalls.filter(x=>x.name==='dd_public_comments').length),0,
     'Closed News does not request public comments before click');
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-expanded'),'true','Comments button expands News thread inline');
   const news=page.locator('[data-news-comments] .dd-comment-card');
   await news.waitFor({timeout:6000});
   await page.waitForFunction(()=>document.querySelector('[data-news-comments] [data-vote-value="1"]')?.textContent.includes('3'));
   assert.equal(await news.locator('.dd-comment-head .dd-comment-flag').count(),1);
   assert.equal(await news.locator('.dd-comment-action-rail [data-vote-value]').count(),2);
   assert.equal(await news.locator('.dd-comment-head .dd-forum-avatar[data-decorated="yes"]').count(),1);
   const geometry=await news.evaluate(el=>{
     const header=el.querySelector('.dd-comment-head').getBoundingClientRect();
     const flag=el.querySelector('.dd-comment-flag').getBoundingClientRect();
     const body=el.querySelector('.dd-comment-body').getBoundingClientRect();
     const rail=el.querySelector('.dd-comment-action-rail').getBoundingClientRect();
     const card=el.getBoundingClientRect();
     return {flagRight:flag.right,headerRight:header.right,flagBottom:flag.bottom,bodyTop:body.top,bodyBottom:body.bottom,
       railTop:rail.top,cardBottom:card.bottom,cardRight:card.right,viewport:document.documentElement.clientWidth,
       flagSize:flag.width,railHeight:rail.height};
   });
   assert.ok(geometry.flagRight>=geometry.headerRight-50,'Flag must sit in header at right edge');
   assert.ok(geometry.flagBottom<=geometry.bodyTop+5,'Flag must sit above comment body');
   assert.ok(geometry.bodyBottom<=geometry.railTop,'Vote rail must sit below body');
   assert.ok(geometry.cardRight<=geometry.viewport+1,'Comment card must fit viewport');
   assert.ok(geometry.flagSize>=38 && geometry.railHeight>=40,'Touch targets remain useful');
   pass(width+'px News flag in header, votes in footer, avatar and fit');
   const flag=news.locator('.dd-comment-flag');
   assert.equal(await flag.getAttribute('aria-label'),'Report this comment');
   await flag.click();
   await page.waitForFunction(()=>window.__commentActionCalls.some(x=>x.name==='insert:dd_case_comment_flags'));
   const callsAfterFlag=await page.evaluate(()=>window.__commentActionCalls);
   const sent=callsAfterFlag.find(x=>x.name==='insert:dd_case_comment_flags');
   assert.equal(sent.args.reason,'spam');
   pass(width+'px News flag still sends existing moderation report');
   await news.locator('[data-vote-value="1"]').click();
   await page.waitForFunction(()=>window.__commentActionCalls.some(x=>x.name==='dd_vote_set'));
   assert.equal(await news.locator('[data-vote-value="1"]').getAttribute('aria-pressed'),'true');
   pass(width+'px News like RPC and pressed state work');

   await page.evaluate(()=>window.ddOpenCaseDiscussion('case:sample','Case sample'));
   const card=page.locator('#ddCaseDiscussionList .dd-comment-card');
   await card.waitFor({timeout:6000});
   await page.waitForFunction(()=>document.querySelector('#ddCaseDiscussionList [data-vote-value="1"]')?.textContent.includes('3'));
   assert.equal(await card.locator('.dd-comment-head .dd-comment-flag').count(),1);
   assert.equal(await card.locator('.dd-comment-action-rail [data-vote-value]').count(),2);
   const caseGeometry=await card.evaluate(el=>{
      const body=el.querySelector('.dd-comment-body').getBoundingClientRect();
      const rail=el.querySelector('.dd-comment-action-rail').getBoundingClientRect();
      const flag=el.querySelector('.dd-comment-flag').getBoundingClientRect();
      const head=el.querySelector('.dd-comment-head').getBoundingClientRect();
      return {footerAfter:rail.top>=body.bottom,flagTop:flag.top,headBottom:head.bottom,
        right:el.getBoundingClientRect().right,viewport:document.documentElement.clientWidth};
   });
   assert.equal(caseGeometry.footerAfter,true);
   assert.ok(caseGeometry.flagTop<caseGeometry.headBottom);
   assert.ok(caseGeometry.right<=caseGeometry.viewport+1);
   pass(width+'px Case/Video/Hearing shared dialog has matching action layout');
   await card.locator('.dd-comment-flag').click();
   await page.waitForFunction(()=>window.__commentActionCalls.filter(x=>x.name==='insert:dd_case_comment_flags').length>=2);
   assert.match(await page.locator('#ddCaseDiscussionStatus').textContent(),/Flag recorded/);
   pass(width+'px shared dialog reporting still works');
   assert.deepEqual(errors,[],'No browser JavaScript errors');
   await context.close();
  }
  console.log('PASS COMMENT ACTION RAIL TOTAL '+passed+' offline Chromium assertions; no external requests');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL COMMENT ACTION RAIL',e.stack||e);process.exitCode=1});
