'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright-core');
const {articles,clips,chosen,videos,day}=require('./test_host_recommendations.cjs');
const id='00000000-0000-4000-8000-000000000111',other='00000000-0000-4000-8000-000000000112';
const script=fs.readFileSync('assets/host-recommendations.js','utf8');
const html='<html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Host picks QA</title>'+
 fs.readFileSync('index.html','utf8').match(/<style id="dd-host-recommendation-style">[\s\S]*?<\/style>/)[0]+'</head><body>'+
 '<details id="newsSummary" hidden></details><div id="newsGrid">'+articles.map(a=>'<article data-news-id="'+a.id+'"><div class="card-body"><p>'+a.headline+'</p><button>▲ 7</button></div></article>').join('')+'</div>'+
 '<details id="videoSummary" hidden></details><div id="clipsFeed">'+clips.map(a=>'<article data-video-id="'+a.id+'"><div class="clip-info"><p>'+a.title+'</p><button>☆ Fav</button></div></article>').join('')+'</div>'+
 '<div data-dd-host-thread="'+id+'"><p>Evidence and sources</p><button>▲ 2</button></div><div data-dd-host-thread="'+other+'"><p>Bot thread</p><button>▲ 0</button></div></body></html>';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,1280]){
   const page=await browser.newPage({viewport:{width,height:850},userAgent:width===393?'DisclosureDeskAndroid QA':undefined});
   await page.route('http://127.0.0.1:9876/',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
   await page.goto('http://127.0.0.1:9876/');
   await page.evaluate(({day,id,articles,clips})=>{
    window.DD_COMMUNITY_FEATURES={discussionHosts:true,hostRecommendations:true};
    window.DD_COMMUNITY_TEST_CONFIG={environment:'test',url:'https://fixture.invalid',publishableKey:'fixture'};
    window.hostResult={data:{active:true,day,discussions:[{id,host:'investigator'}]}};
    window.hostCalls=[];
    window.supabase={createClient(){return {rpc(name){window.hostCalls.push(name);return Promise.resolve(window.hostResult)}}}};
    window.ddSyncHostRecommendationCards=()=>{
     DDHostPicks.catalogue('news',document.querySelector('#newsGrid'),articles,document.querySelector('#newsSummary'));
     DDHostPicks.catalogue('video',document.querySelector('#clipsFeed'),clips,document.querySelector('#videoSummary'));
    };
   },{day,id,articles,clips});
   await page.addScriptTag({content:script});
   await page.waitForFunction(()=>document.querySelectorAll('.dd-host-recommendation').length===5);
   assert.equal(await page.locator('#newsGrid .dd-host-recommendation').count(),2);
   assert.equal(await page.locator('#clipsFeed .dd-host-recommendation').count(),2);
   assert.equal(await page.locator('[data-dd-host-thread="'+id+'"] .dd-host-recommendation').count(),1);
   assert.equal(await page.locator('[data-dd-host-thread="'+other+'"] .dd-host-recommendation').count(),0);
   assert.deepEqual(await page.locator('#newsGrid button').allTextContents(),articles.map(()=> '▲ 7'));
   assert.deepEqual(await page.locator('[data-dd-host-thread] button').allTextContents(),['▲ 2','▲ 0']);
   assert.deepEqual(await page.evaluate(()=>window.hostCalls),['dd_host_public_picks']);
   await page.locator('#newsSummary summary').click();assert.equal(await page.locator('#newsSummary a').count(),2);
   for(const p of chosen)assert(await page.locator('#newsSummary a[href*="dd_news='+p.id+'"]').count());
   await page.locator('#videoSummary summary').click();for(const p of videos)assert(await page.locator('#videoSummary a[href*="dd_videos='+p.id+'"]').count());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.evaluate(({day})=>{window.hostResult={data:{active:false,day,discussions:[]}};return DDHostPicks.refresh(true)},{day});
   assert.equal(await page.locator('.dd-host-recommendation').count(),0);assert.equal(await page.locator('#newsSummary').isVisible(),false);
   await page.evaluate(({day,id})=>{window.hostResult={data:{active:true,day,discussions:[{id,host:'investigator'}]}};return DDHostPicks.refresh(true)},{day,id});
   assert.equal(await page.locator('.dd-host-recommendation').count(),5);
   await page.evaluate(()=>{window.hostResult={error:{message:'unavailable'}};return DDHostPicks.refresh(true)});
   assert.equal(await page.locator('.dd-host-recommendation').count(),0);
   await page.close();console.log('PASS '+width+'px: public labels, daily links, untouched votes, pause and fail-closed read');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
