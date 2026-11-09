'use strict';
// M35 geometry acceptance in real offline Chromium. Synthetic UI, no live account.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const html=fs.readFileSync('index.html','utf8');
const css=html.match(/<style id="dd-m35-one-action-rail">([\s\S]*?)<\/style>/)?.[1];
assert.ok(css,'M35 shared rail CSS missing');
const demo=String.raw`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box}body{margin:0;padding:6px;background:#11283a;color:#eee;font:14px system-ui}
article{margin:10px 0;width:100%;border:1px solid #54687b}.dd-news-actions{width:100%}
.dd-news-main-actions,.dd-forum-actions,.dd-comment-action-rail{min-height:48px}</style></head><body>
<div id="newsGrid"><article><div class="dd-news-actions">
<div class="dd-news-main-actions dd-action-rail" data-check="news"><span data-news-article-votes><div class="dd-news-article-vote-controls"><button data-up>▲ 12</button><button data-down>▼ 3</button></div></span><button class="dd-action-board">☆</button><button class="dd-action-share">↗ Share</button><button class="dd-inline-comments-toggle">Comments (5)</button></div></div></article></div>
<div id="discussionsPage"><article><div class="dd-forum-actions dd-action-rail" data-check="forum"><button class="dd-forum-vote" data-up>▲ 12</button><button class="dd-forum-vote" data-down>▼ 3</button><button class="dd-forum-star-action">☆</button><button class="dd-forum-share-action">↗ Share</button><button class="dd-forum-comments-action">Comments (5)</button></div></article>
<article class="dd-forum-reply-card"><div class="dd-forum-actions dd-action-rail" data-check="forum-reply"><button class="dd-forum-vote" data-up>▲ 2</button><button class="dd-forum-vote" data-down>▼ 1</button><button class="dd-forum-star-action">☆</button><button class="dd-forum-share-action">↗ Share</button><button class="dd-forum-reply-action">↳ Reply</button></div></article></div>
<article class="dd-comment-card"><div class="dd-comment-action-rail dd-action-rail" data-check="comment"><div class="dd-community-votes"><button class="dd-community-vote-button" data-up>▲ 12</button><button class="dd-community-vote-button" data-down>▼ 3</button></div><button class="dd-action-board">☆</button><button class="dd-action-share">↗ Share</button><button class="dd-comment-reply-button">↳ Reply</button></div></article>
</body></html>`;
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
   args:['--no-sandbox','--disable-dev-shm-usage']});
 let pass=0;
 try{
 for(const width of [320,393,1280]){
  const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});
  const page=await ctx.newPage();
  await page.setContent(demo);
  await page.addStyleTag({content:css});
  for(const kind of ['news','forum','forum-reply','comment']){
   const actual=await page.locator('[data-check="'+kind+'"]').evaluate(el=>{
    const rect=s=>el.querySelector(s)?.getBoundingClientRect();
    const up=rect('[data-up]'),down=rect('[data-down]'),
     board=rect('.dd-action-board,.dd-forum-star-action'),
     share=rect('.dd-action-share,.dd-forum-share-action'),
     comments=rect('.dd-inline-comments-toggle,.dd-forum-comments-action,.dd-forum-reply-action');
    const rail=el.getBoundingClientRect();
    return {gap:Math.round(down.left-up.right),upX:up.left,downX:down.left,
     boardX:board.left,shareX:share.left,shareWidth:share.width,
     commentsX:comments.left,railRight:rail.right,visibleWidth:el.clientWidth,
     scrollWidth:el.scrollWidth,viewport:document.documentElement.clientWidth,
     height:rail.height,boardWidth:board.width};
   });
   assert.ok(actual.gap>=0&&actual.gap<=8,kind+' arrows must be adjacent: '+JSON.stringify(actual));
   assert.ok(actual.downX<actual.boardX,kind+' star must follow vote pair');
   assert.ok(actual.boardX<actual.shareX,kind+' Share must follow star');
   assert.ok(actual.shareX<actual.commentsX,kind+' Comments/Reply must follow Share');
   assert.ok(actual.shareWidth<=125,kind+' Share must be compact');
   assert.ok(actual.boardWidth>=35,kind+' Board star must be tappable');
   assert.ok(actual.railRight<=actual.viewport+1,kind+' rail must fit device width');
   assert.ok(actual.height>=40,kind+' rail must remain tappable');
   assert.ok(actual.scrollWidth<=actual.visibleWidth+2,
    kind+' must fit its bar without horizontal scrolling at '+width+'px: '+JSON.stringify(actual));
   pass++;
  }
  await ctx.close();
 }
 console.log('PASS M35 real offline Chromium: '+pass+' mobile/desktop post/article/comment/reply rail geometries, 320/393/1280px');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M35 rail geometry',e.stack||e);process.exitCode=1});
