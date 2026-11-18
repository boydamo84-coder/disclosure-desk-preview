'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const page=await browser.newPage({viewport:{width,height:820}});
   const outside=[];
   page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:4173/'))outside.push(req.url())});
   await page.goto('http://127.0.0.1:4173/scripts/fixtures/ad-m01-preview-test.html?dd_ads_preview=1',{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelectorAll('.dd-ad-preview').length===7,{timeout:8000});
   const state=await page.evaluate(()=>{
    const news=[...document.querySelectorAll('#newsGrid > *')];
    const archive=[...document.querySelectorAll('#archiveList > *')];
    const placements=[...document.querySelectorAll('.dd-ad-preview')].map(x=>({area:x.dataset.ddAdArea,seq:x.dataset.ddAdSequence,text:x.textContent.trim()}));
    const after=(items,selector)=>items.filter(x=>x.matches(selector)).map(n=>n.nextElementSibling?.dataset.ddAdArea||'none');
    return {news:news.filter(x=>x.matches('article')).length,
      archive:archive.filter(x=>x.matches('article')).length,
      newsSlotIndexes:news.filter(x=>x.matches('article')).map((n,i)=>n.nextElementSibling?.dataset.ddAdArea==='news'?i+1:null).filter(Boolean),
      archiveSlotIndexes:archive.filter(x=>x.matches('article')).map((n,i)=>n.nextElementSibling?.dataset.ddAdArea==='archive'?i+1:null).filter(Boolean),
      placements,advertiserRequests:performance.getEntriesByType('resource').filter(x=>/adsterra|adsbygoogle|doubleclick|monetag/i.test(x.name)).length,
      wneSlots:document.querySelectorAll('#researchStudio .dd-ad-preview').length,
      horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+2};
   });
   assert.equal(state.news,19);
   assert.equal(state.archive,26);
   assert.deepEqual(state.newsSlotIndexes,[6,12,18]);
   assert.deepEqual(state.archiveSlotIndexes,[12,24]);
   assert.deepEqual(state.placements.map(x=>x.area).sort(),['archive','archive','discussions','news','news','news','videos'].sort());
   assert(state.placements.every(p=>p.text.includes('Advertisement')&&p.text.includes('preview only')));
   assert.equal(state.advertiserRequests,0);
   assert.equal(state.wneSlots,0);
   assert.equal(state.horizontalOverflow,false,'Overflow on '+width);
   assert.deepEqual(outside,[],'External requests from mock fixture on '+width);

   await page.evaluate(()=>{
    const host=document.getElementById('newsGrid');host.replaceChildren();
    for(let i=0;i<13;i++){const article=document.createElement('article');article.dataset.newsId='rerender-'+i;host.append(article)}
   });
   await page.waitForFunction(()=>document.querySelectorAll('#newsGrid > [data-dd-ad-area="news"]').length===2);
   const after=await page.locator('#newsGrid > [data-dd-ad-area="news"]').count();
   assert.equal(after,2,'Rerender must remove stale third ad '+width);
   await page.close();
  }
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:4173/scripts/fixtures/ad-m01-preview-test.html?dd_ads_preview=0');
  assert.equal(await page.locator('.dd-ad-preview').count(),0,'Public/ordinary view has no blank placeholders');
  await page.close();
  console.log('ADS M01 CHROME PASS: preview-only, 6/12/18 News, 12/24 Archive, one video/forum banner, W.NE clear; responsive 320/393/820/1280; re-render safe');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});