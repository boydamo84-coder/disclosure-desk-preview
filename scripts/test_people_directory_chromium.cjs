'use strict';
// Local loopback Chromium acceptance: mobile/desktop directory, shareable links,
// optional third-party YouTube iframe and browser Back. No real accounts.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===BASE)return route.continue();
    return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(BASE+'/who-is-who.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#peopleCards article.card').first().waitFor();
   assert.equal(await page.locator('#peopleCards article.card').count(),17,'All seventeen source-linked cards appear');
   assert.equal(await page.locator('iframe').count(),0,'No publisher player loads by default');
   const widths=await page.evaluate(()=>({a:document.documentElement.scrollWidth,b:window.innerWidth}));
   assert(widths.a<=widths.b+3,'Directory must not horizontally overflow '+width+'px');
   await page.locator('#peopleSearch').fill('Mick West');
   assert.equal(await page.locator('#peopleCards article.card').count(),1,'Name search filters');
   await page.locator('#peopleCards button').click();
   await page.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await page.locator('#profileName').textContent(),'Mick West','Correct person detail');
   assert.equal(await page.locator('#profileTimeline li').count()>=3,true,'Dated history present');
   assert.equal(await page.locator('#profileBiography p').count()>=3,true,'Full story present');
   assert.equal(await page.locator('#profilePodcasts .source-entry').count()>=1,true,'A real podcast link appears');
   assert.match(await page.locator('#profileFilms').innerText(),/No film or documentary appearance has yet been verified/,'Unknown film credit is explicit');
   assert.equal(await page.locator('#profileVideoPlayers .video-card').count()>=1,true,'Publisher video card');
   assert.equal(await page.locator('iframe').count(),0,'Lazy player does not contact YouTube yet');
   const u=new URL(page.url());assert.equal(u.searchParams.get('person'),'mick-west','Shareable profile URL');
   await page.locator('#profileVideoPlayers .video-card .video-play').first().click();
   const video=page.locator('#profileVideoPlayers iframe').first();
   await video.waitFor({state:'attached'});
   assert.match(await video.getAttribute('src'),/^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}$/);
   assert.equal(await page.locator('#profileVideoPlayers a[href*="youtube.com/watch"]').count()>=1,true,
    'Publisher video original link preserved');
   const detailWidths=await page.evaluate(()=>({a:document.documentElement.scrollWidth,b:window.innerWidth}));
   assert(detailWidths.a<=detailWidths.b+3,'Detailed profile must not horizontally overflow '+width+'px');
   await page.goBack({waitUntil:'domcontentloaded'});
   await page.locator('#directoryPage').waitFor({state:'visible'});
   await page.locator('#peopleSearch').fill('');
   await page.locator('#peopleCategory').selectOption('Pilot');
   assert.equal(await page.locator('#peopleCards article.card').count()>=2,true,'Role filtering');
   const direct=await ctx.newPage();
   await direct.goto(BASE+'/who-is-who.html?person=david-grusch',{waitUntil:'domcontentloaded'});
   await direct.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await direct.locator('#profileName').textContent(),'David Grusch',"Deep link to the correct person profile");
   assert.match(await direct.locator('#profileSocials').textContent(),/No personal social media account/,
    'No fake personal handles inferred where unverified');
   await direct.locator('#directoryBack').click();
   const legacy=await ctx.newPage();
   await legacy.goto(BASE+'/who-is-who.html?person=nick-pope',{waitUntil:'domcontentloaded'});
   await legacy.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await legacy.locator('#profileName').textContent(),'Nick Pope');
   assert.match(await legacy.locator('#profileBiography').innerText(),/6 April 2026/,'Historical memorial biography');
   assert.equal(await legacy.locator('#profileFilms .source-entry').count()>=1,true);
   assert.equal(await legacy.locator('#profileRelatedCases .dd-person-case-link').count(),1,
    "Pope's 2014 Rendlesham book authorship has a cited reference");
   await legacy.close();
   const warren=await ctx.newPage();
   await warren.goto(BASE+'/who-is-who.html?person=larry-warren',{waitUntil:'domcontentloaded'});
   await warren.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await warren.locator('#profileRelatedCases a[href="/rendlesham-forest-1980"]').count(),1);
   // M8 source-attributed reverse links: original citations and editorial caution.
   assert.equal(await warren.locator('#profileRelatedCases .dd-person-case-link').count(),1,
    'Warren profile has exactly one attributed retrospective Rendlesham relationship');
   assert.match(await warren.locator('#profileRelatedCases').innerText(),/Retrospective claimed participant/);
   assert(await warren.locator('#profileRelatedCases a[href^="https://"]').count()>=1);
   const fravor=await ctx.newPage();
   await fravor.goto(BASE+'/who-is-who.html?person=david-fravor',{waitUntil:'domcontentloaded'});
   await fravor.locator('#personProfile').waitFor({state:'visible'});
   assert.equal(await fravor.locator('#profileRelatedCases .dd-person-case-link').count(),1,
    "Fravor's Nimitz encounter is linked to the public congressional record");
   assert.match(await fravor.locator('#profileRelatedCases').innerText(),/First-person encounter account/);
   assert.equal(await fravor.locator('#profileRelatedCases a[href*="dd_archive_case=featured-nimitz-2004"]').count(),1);
   assert.equal(await fravor.locator('#profileRelatedCases a[href^="https://"]').count(),1);
   await fravor.close();
   await warren.close();
   await direct.locator('#directoryPage').waitFor({state:'visible'});
   assert.equal(new URL(direct.url()).searchParams.has('person'),false,'Return clears profile ID');
   const deadly=errors.filter(x=>/ReferenceError|SyntaxError|Cannot access|is not defined/.test(x));
   assert.deepEqual(deadly,[],'Fatal client errors: '+deadly.join(', '));
   console.log('PASS Who’s Who '+width+'px: 17 profiles, text/category filters, deep links, long bios, source history, click-only video, browser Back and no layout overflow');
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error('FAIL Who’s Who Chromium:',error.stack||error);process.exitCode=1});
