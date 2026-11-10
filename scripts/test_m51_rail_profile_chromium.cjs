'use strict';
// M51 realistic CSS geometry: static fictional controls, no network/real account.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const source=fs.readFileSync('index.html','utf8');
const inlineCss=[...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(x=>x[1]).join('\n');
const sharedCss=fs.readFileSync('assets/community-polish.css','utf8');
const demo=String.raw\`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>\${inlineCss}</style><style>\${sharedCss}</style></head><body>
<div id="newsGrid" style="max-width:min(100%,440px);margin:16px auto">
<article class="card"><div class="dd-news-actions">
<div class="dd-news-main-actions dd-action-rail" data-check="news"><span data-news-article-votes><div class="dd-news-article-vote-controls"><button>▲ 0</button><button>▼ 0</button></div></span><button class="dd-inline-comments-toggle">💬 0</button><button class="dd-action-board bookmark-saved" data-check="saved-board"><span data-star-icon>★</span></button><button class="dd-action-share">♧</button><button class="outline dd-news-compare-action" data-compare-news="0">⚖ Compare</button></div>
</div></article></div>
<section id="discussionsPage" style="max-width:440px;margin:auto"><article class="dd-forum-post-card"><div class="dd-forum-actions dd-action-rail" data-check="forum"><button>▲ 0</button><button>▼ 0</button><button>💬 0</button><button class="dd-forum-star-action bookmark-saved">★</button><button>♧</button></div></article></section>
<article class="dd-comment-card" style="max-width:440px;margin:10px auto"><div class="dd-comment-action-rail dd-action-rail" data-check="comment"><div class="dd-community-votes"><button>▲ 0</button><button>▼ 0</button></div><button>☆</button><button>♧</button><button class="dd-comment-reply-button">Reply</button></div></article>
<div class="nav"><div class="nav-inner"><button class="tab" data-tab="profilePage" data-check="profile"><span class="ico">◉</span>Profile</button></div></div>
</body></html>\`;
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
   args:['--no-sandbox','--disable-dev-shm-usage']});
 let checks=0;
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},isMobile:width<=430,hasTouch:width<=430});
   const page=await ctx.newPage();
   await page.route('**/*',route=>route.abort());
   await page.setContent(demo);
   const state=await page.evaluate(()=>{
    const all=['news','forum','comment'].map(k=>{
     const el=document.querySelector('[data-check="'+k+'"]');
     const rail=el.getBoundingClientRect();
     const children=[...el.children].map(c=>c.getBoundingClientRect());
     return {kind:k,justify:getComputedStyle(el).justifyContent,
      railRight:rail.right,contentRight:Math.max(...children.map(c=>c.right)),
      height:rail.height,scroll:el.scrollWidth,visible:el.clientWidth};
    });
    const compare=document.querySelector('[data-compare-news]'),
      profile=document.querySelector('[data-check="profile"]'),icon=profile.querySelector('.ico').getBoundingClientRect();
    const labelNode=[...profile.childNodes].find(n=>n.nodeType===3&&n.textContent.includes('Profile'));
    const range=document.createRange();range.selectNodeContents(labelNode);
    const label=range.getBoundingClientRect();
    const saved=document.querySelector('[data-check="saved-board"]');
    return {rails:all,compareInRail:compare.closest('[data-check="news"]')!==null,
      compareMinHeight:compare.getBoundingClientRect().height,
      compareRight:compare.getBoundingClientRect().right,
      profileDirection:getComputedStyle(profile).flexDirection,
      iconBottom:icon.bottom,labelTop:label.top,
      savedLabel:getComputedStyle(saved,'::after').content,
      documentWidth:document.documentElement.scrollWidth};
   });
   for(const rail of state.rails){
    assert.equal(rail.justify,'flex-end',rail.kind+' right-aligned at '+width);
    assert.ok(rail.height>=39,rail.kind+' tappable bar');
    assert.ok(rail.railRight<=width+1,rail.kind+' outside screen');
    assert.ok(rail.contentRight<=width+1,rail.kind+' controls outside screen');
    assert.ok(rail.scroll<=rail.visible+2,rail.kind+' controls clipped at '+width+': '+JSON.stringify(rail));
    checks+=5;
   }
   assert.ok(state.compareInRail,'Compare inside News action rail');
   assert.ok(state.compareMinHeight>=40,'Compare tappable');
   assert.ok(state.compareRight<=width+1,'Compare on screen');
   assert.equal(state.profileDirection,'column','Avatar and Profile label stacked');
   assert.ok(state.labelTop>=state.iconBottom-2,'Profile label below icon');
   assert.match(state.savedLabel,/Added/,'Saved Board displays Added');
   assert.ok(state.documentWidth<=width+1,'No horizontal page overflow at '+width);
   checks+=7;
   await ctx.close();
  }
  console.log('PASS M51 Chromium: '+checks+' checks across 320/393/820/1280px, right rails, Compare, Added, Profile avatar label.');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL M51 real browser visual geometry',e.stack||e);process.exitCode=1});
