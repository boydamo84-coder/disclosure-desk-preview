'use strict';
// Real desktop/mobile browser, all remote requests blocked except a synthetic
// GitHub-news fixture. No live feeds, external publisher links or accounts.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const base='http://127.0.0.1:4173',now=Date.UTC(2026,10,27,12);
const rows=Array.from({length:77},(_,i)=>({
 id:'qa-'+(i+1),headline:'UAP case '+(1001+i)+' source report',source:'QA fixture publisher',
 url:'https://fixture.invalid/news/'+(i+1),date:new Date(now-(i+1)*3600000).toISOString(),
 category:i<35?'UAP':'Drones',country:i<40?'United Kingdom':'United States',sourceType:'publisher'
}));
rows[64].relatedCoverage=[{...rows[64],id:'qa-alt-65',url:'https://fixture.invalid/alternate/65',source:'Secondary QA publisher',date:new Date(now-65*3600000-60000).toISOString()}];
const readRows=rows.map(x=>({...x,readAt:new Date(now).toISOString()}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(['/usr/bin/google-chrome','/usr/bin/chromium'].find(x=>fs.existsSync(x))),args:['--no-sandbox','--disable-dev-shm-usage']});
 async function make(width,path='/'){
  const ctx=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
  await ctx.addInitScript(read=>{
   if(!localStorage.getItem('disclosure_desk_read_articles_v1'))localStorage.setItem('disclosure_desk_read_articles_v1',JSON.stringify(read));
  },readRows);
  await ctx.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin===base)return route.continue();
   if(u.hostname==='raw.githubusercontent.com'&&u.pathname.endsWith('/data/news-alerts.json'))return route.fulfill({json:rows,headers:{'access-control-allow-origin':'*'}});
   if(u.hostname==='unpkg.com'&&u.pathname==='/leaflet@1.9.4/dist/leaflet.js'&&fs.existsSync('node_modules/leaflet/dist/leaflet.js'))return route.fulfill({path:'node_modules/leaflet/dist/leaflet.js',contentType:'application/javascript'});
   return route.abort('blockedbyclient');
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date(now));
  await page.goto(base+path,{waitUntil:'load'});await page.waitForFunction(()=>document.getElementById('feedStatus').textContent.includes('77 sourced stories'),{},{timeout:20000});
  return {ctx,page,errors};
 }
 const ids=page=>page.locator('#newsGrid article[data-news-id]').evaluateAll(xs=>xs.map(x=>x.dataset.newsId));
 const range=(start,end)=>Array.from({length:end-start+1},(_,i)=>'qa-'+(i+start));
 const pager=(page,where='Top')=>page.locator('#ddLatestNewsPager'+where);
 const click=async(page,where,direction)=>pager(page,where).locator('[data-page-'+direction+']').click();
 try{
 for(const width of [320,393,820,1280]){
  const {ctx,page,errors}=await make(width);
  await pager(page).waitFor({state:'visible'});
  assert.deepEqual(await ids(page),range(1,30));
  assert.ok(await pager(page).locator('[data-page-prev]').isDisabled());
  assert.equal(await pager(page).locator('[data-page-label]').textContent(),'1–30 of 77 stories · Page 1 of 3');
  assert.equal(await pager(page,'').locator('[data-page-label]').textContent(),await pager(page).locator('[data-page-label]').textContent());
  assert.equal(await pager(page).evaluate(n=>n.parentElement.id),'newsStickyControls');
  // The top pager is visible even far down the feed, not merely at the top.
  await page.locator('#newsGrid article').nth(12).scrollIntoViewIfNeeded();
  const sticky=await pager(page).evaluate(n=>({r:n.getBoundingClientRect().bottom,visible:getComputedStyle(n.parentElement).position,viewport:innerHeight}));
  assert.equal(sticky.visible,'sticky');assert.ok(sticky.r>0&&sticky.r<sticky.viewport,'Pager stays in viewport '+width);
  await click(page,'Top','next');
  assert.equal(new URL(page.url()).searchParams.get('page'),'2');
  assert.deepEqual(await ids(page),range(31,60));
  assert.equal(await pager(page,'').locator('[data-page-label]').textContent(),'31–60 of 77 stories · Page 2 of 3');
  // The current page's buttons retain source identity; never use page-one indices.
  await page.evaluate(()=>{window.addInvestigationLink=(title,url)=>{window.__qaSaved={title,url}};});
  await page.locator('#newsGrid [data-save-news]').first().click();
  assert.equal(await page.evaluate(()=>window.__qaSaved.url),rows[30].url);
  await click(page,'','next');
  assert.equal(new URL(page.url()).searchParams.get('page'),'3');
  assert.deepEqual(await ids(page),range(61,77));
  assert.ok(await pager(page).locator('[data-page-next]').isDisabled());assert.ok(await pager(page,'').locator('[data-page-next]').isDisabled());
  await page.goBack();await page.waitForFunction(()=>document.querySelector('#newsGrid article[data-news-id]')?.dataset.newsId==='qa-31');
  assert.deepEqual(await ids(page),range(31,60));
  await page.goForward();await page.waitForFunction(()=>document.querySelector('#newsGrid article[data-news-id]')?.dataset.newsId==='qa-61');
  await click(page,'Top','prev');
  assert.deepEqual(await ids(page),range(31,60));
  await page.locator('#newsSearch').fill('case 1077');
  assert.deepEqual(await ids(page),['qa-77']);assert.ok(!(await pager(page).isVisible()));
  assert.equal(new URL(page.url()).searchParams.get('page'),null);
  assert.equal(new URL(page.url()).searchParams.get('news_q'),'case 1077');
  await page.locator('#newsSearch').fill('');
  await page.locator('[data-topic="Drones"]').click();
  assert.deepEqual(await ids(page),range(36,65));
  await click(page,'Top','next');
  assert.deepEqual(await ids(page),range(66,77));
  assert.equal(new URL(page.url()).searchParams.get('news_category'),'Drones');
  const shared=page.url();await page.goto(shared,{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#newsGrid article[data-news-id]')?.dataset.newsId==='qa-66');
  assert.deepEqual(await ids(page),range(66,77));
  await page.locator('#newsCountry').selectOption('United Kingdom');
  assert.deepEqual(await ids(page),range(36,40));
  assert.equal(new URL(page.url()).searchParams.get('page'),null);
  assert.equal(new URL(page.url()).searchParams.get('news_country'),'United Kingdom');
  // Returning from a discussion clears filters and reveals the correct later page.
  await page.evaluate(()=>window.ddGoToDiscussionOrigin('news:qa-65'));
  assert.deepEqual(await ids(page),range(61,77));
  assert.equal(new URL(page.url()).searchParams.get('page'),'3');
  assert.ok(await page.locator('#newsGrid [data-news-id="qa-65"]').isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Home overflow '+width);
  await page.locator('#newsTopTab').click();await page.locator('#ddTopPagerTop').waitFor({state:'visible'});
  assert.equal(await page.locator('#topNewsList article').count(),30);
  await page.locator('#ddTopPagerTop [data-page-next]').click();
  assert.equal(new URL(page.url()).searchParams.get('news_view'),'top');
  assert.match(await page.locator('#topNewsList article .tag').first().textContent(),/^#31 /);
  assert.ok(!(await pager(page).isVisible()));
  await page.locator('#newsReadTab').click();
  assert.equal(await page.locator('#readList article').count(),30);
  await page.locator('#ddReadPagerTop [data-page-next]').click();
  assert.equal(await page.locator('#readList article').count(),30);
  assert.equal(new URL(page.url()).searchParams.get('page'),null);
  assert.ok(!(await pager(page).isVisible()));
  await page.locator('#readSearch').fill('case 1077');
  assert.equal(await page.locator('#readList article').count(),1);
  assert.deepEqual(errors.filter(x=>/SyntaxError|ReferenceError|is not defined|Cannot access/i.test(x)),[]);
  console.log('PASS '+width+'px: 30-card paging, sticky/paired controls, page-specific Board action, URL Back/Forward, search/country/category, shared link, discussion deep link, Top 100/Read and no overflow');
  await ctx.close();
 }
 const {ctx,page}=await make(393,'/?page=3');
 await page.waitForFunction(()=>document.querySelector('#newsGrid article[data-news-id]')?.dataset.newsId==='qa-61');
 assert.deepEqual(await ids(page),range(61,77));
 await page.goto(base+'/?dd_news=qa-alt-65',{waitUntil:'load'});
 await page.waitForFunction(()=>document.querySelector('#newsGrid article[data-news-id]')?.dataset.newsId==='qa-61');
 assert.equal(new URL(page.url()).searchParams.get('page'),'3');
 assert.ok(await page.locator('#newsGrid [data-news-id="qa-65"]').isVisible());
 console.log('PASS direct page-3 and grouped alternative news-ID links');
 await ctx.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
