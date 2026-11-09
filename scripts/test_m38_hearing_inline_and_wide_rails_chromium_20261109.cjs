'use strict';
// M38 real Chrome: shared action geometry + inline hearing discussion placement.
// All requests are intercepted to local fixture. No Supabase, live accounts or Netlify.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const pageHtml=fs.readFileSync('index.html','utf8');
const css=pageHtml.match(/<style id="dd-m35-one-action-rail">([\s\S]*?)<\/style>/)?.[1];
const caseCode=fs.readFileSync('assets/case-discussions.js','utf8');
assert.ok(css&&css.includes('M38 final audit:'),'M38 CSS missing');
const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box}body{margin:0;padding:6px;background:#11283a;color:#eee;font:14px system-ui}
article{width:100%;margin:8px 0;border:1px solid #54687b}.dd-news-actions{width:100%}
.dd-action-rail{min-height:46px}</style></head><body>
<div id="ddCloudAccount"></div>
<div id="newsGrid"><article><div class="dd-news-actions"><div class="dd-news-main-actions dd-action-rail" data-rail="news">
<button>▲ 12</button><button>▼ 3</button><button class="dd-inline-comments-toggle">💬 5</button><button class="dd-action-board">☆</button><button class="dd-action-share">⤴</button></div></div></article></div>
<div id="discussionsPage">
<article><div class="dd-forum-actions dd-action-rail" data-rail="forum"><button>▲ 12</button><button>▼ 3</button><button class="dd-forum-comments-action">💬 5</button><button class="dd-forum-star-action">☆</button><button class="dd-forum-share-action">⤴</button></div></article>
<article><div class="dd-forum-actions dd-action-rail" data-rail="forumReply"><button>▲ 1</button><button>▼ 0</button><button class="dd-forum-star-action">☆</button><button class="dd-forum-share-action">⤴</button><button class="dd-forum-reply-action">↳ Reply</button></div></article>
</div>
<article class="dd-comment-card"><div class="dd-comment-action-rail dd-action-rail" data-rail="comment"><div class="dd-community-votes"><button>▲ 6</button><button>▼ 1</button></div><button class="dd-action-board">☆</button><button class="dd-action-share">⤴</button><button class="dd-comment-reply-button">↳ Reply</button></div></article>
<article class="dd-witness-report"><div class="dd-witness-action-rail" data-rail="witness"><div class="dd-community-votes"><button>▲ 2</button><button>▼ 0</button></div><button class="dd-action-board">☆</button><button class="dd-action-share">⤴</button></div></article>
<article id="hearingCard"><div id="recording" style="height:220px">Official video fixture</div><div id="inlineHost" class="dd-hearing-comments-host"></div></article>
</body></html>`;
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let count=0;
  for(const width of [320,393,1280]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});
   const page=await context.newPage();
   await page.route('https://uapdisclosuredesk.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:fixture}));
   await page.goto('https://uapdisclosuredesk.com/');
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:caseCode});
   const opened=await page.evaluate(()=>{
    return window.ddOpenInlineCaseDiscussion('hearing:fixture-id','Hearing Discussion',document.getElementById('inlineHost'));
   });
   assert.equal(opened,true,'Hearing inline API opens');
   assert.equal(await page.locator('#inlineHost #ddCaseDiscussionDialog').count(),1,'Reused shared dialog is under player');
   assert.equal(await page.locator('#inlineHost #ddCaseDiscussionForm').isVisible(),true,'Real writing form exposed beneath video');
   const metrics=await page.evaluate(()=>{
    const host=document.getElementById('inlineHost'),record=document.getElementById('recording'),
     discussion=document.getElementById('ddCaseDiscussionDialog'),section=discussion.querySelector('section');
    return {recordBottom:record.getBoundingClientRect().bottom,inlineTop:discussion.getBoundingClientRect().top,
     position:getComputedStyle(discussion).position,panelRole:section.getAttribute('role'),
     ariaModal:section.getAttribute('aria-modal'),bodyOverflow:document.body.style.overflow};
   });
   assert.ok(metrics.inlineTop>=metrics.recordBottom-2,'Comments directly below hearing video '+JSON.stringify(metrics));
   assert.equal(metrics.position,'relative','No fixed-position hearing modal');
   assert.equal(metrics.panelRole,'region','Accessible inline region');
   assert.equal(metrics.ariaModal,null,'Not announced as a modal');
   assert.equal(metrics.bodyOverflow,'','Inline hearing comments do not lock the page');
   for(const kind of ['news','forum','forumReply','comment','witness']){
    const box=await page.locator('[data-rail="'+kind+'"]').evaluate(node=>{
     const rail=node.getBoundingClientRect(),btn=node.querySelectorAll('button'),
      first=btn[0].getBoundingClientRect(),last=btn[btn.length-1].getBoundingClientRect();
     return {railLeft:rail.left,railRight:rail.right,railWidth:rail.width,
      firstLeft:first.left,lastRight:last.right,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,
      widths:[...btn].map(n=>Math.round(n.getBoundingClientRect().width))};
    });
    assert.ok(box.scrollWidth<=box.clientWidth+2,kind+' bar must fit '+width+'px '+JSON.stringify(box));
    assert.ok(Math.max(...box.widths)<=115,kind+' buttons never stretch across post '+JSON.stringify(box));
    if(width>=760){
     assert.ok(box.railRight-box.lastRight<=14,kind+' last action near right edge '+JSON.stringify(box));
     assert.ok(box.firstLeft>box.railLeft+box.railWidth*.45,kind+' group right-aligned '+JSON.stringify(box));
    }
    count++;
   }
   const caseRail=await page.locator('#ddCaseDiscussionActions').evaluate(node=>{
    const rail=node.getBoundingClientRect(),btn=node.querySelectorAll('button');
    return {left:rail.left,right:rail.right,width:rail.width,first:btn[0].getBoundingClientRect().left,
     last:btn[btn.length-1].getBoundingClientRect().right,scroll:node.scrollWidth,client:node.clientWidth,
     widths:[...btn].map(x=>Math.round(x.getBoundingClientRect().width))};
   });
   assert.ok(caseRail.scroll<=caseRail.client+2,'Case/Hearing action rail fits '+width+'px');
   if(width>=760){assert.ok(caseRail.right-caseRail.last<=14,'Case/Hearing rail at right');
    assert.ok(caseRail.first>caseRail.left+caseRail.width*.45,'Case/Hearing group is compact right side')}
   await page.locator('#ddCaseDiscussionClose').click();
   assert.equal(await page.locator('#inlineHost #ddCaseDiscussionDialog').count(),0,'Closing restores shared dialog');
   assert.equal(await page.locator('body > #ddCaseDiscussionDialog').count(),1,'Dialog is not destroyed');
   const dialog=await page.evaluate(()=>{
    window.ddOpenCaseDiscussion('case:fixture-id','Case Discussion');
    const el=document.getElementById('ddCaseDiscussionDialog');
    return {position:getComputedStyle(el).position,hidden:el.hidden,aria:el.querySelector('section').getAttribute('aria-modal')};
   });
   assert.equal(dialog.position,'fixed','Normal Case discussion still opens modal');
   assert.equal(dialog.hidden,false);
   assert.equal(dialog.aria,'true');
   await page.locator('#ddCaseDiscussionClose').click();
   await context.close();
  }
  console.log('PASS M38 real Chromium: '+count+' responsive rails + 3 inline hearing/Case dialog transitions (no live data)');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M38 real Chromium',e.stack||e);process.exitCode=1});
