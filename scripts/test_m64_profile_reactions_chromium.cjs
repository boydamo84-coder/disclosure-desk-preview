'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./m64_profile_fixture.cjs');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const width of [320,393,820,1280]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==BASE)return r.abort();if(u.pathname==='/__m64-profile')return r.fulfill({contentType:'text/html',body:buildFixture()});return r.continue()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/__m64-profile');await page.waitForFunction(()=>document.getElementById('ddProfileLikesReceived').textContent==='5');
  const info=page.getByRole('group',{name:'Community reactions received'});
  assert.equal(await info.locator('details[open]').count(),0,'Breakdown starts collapsed');
  const geometry=await info.evaluate(el=>({height:el.getBoundingClientRect().height,inside:!!el.closest('.dd-profile-card'),font:parseFloat(getComputedStyle(el.querySelector('strong')).fontSize),width:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(geometry.inside,'Reactions are part of existing account card');
  assert(geometry.height<=70,'Compact row is small at '+width+': '+JSON.stringify(geometry));assert(geometry.font<=14);assert(geometry.width<=geometry.viewport+1);
  await page.getByRole('button',{name:'Refresh',exact:false}).click();
  await page.getByLabel('About reaction totals').click();assert.match(await page.locator('#ddProfileReactionBreakdown').textContent(),/Posts ▲ 2 \/ ▼ 1 · Comments ▲ 3 \/ ▼ 4/);
  await page.getByLabel('About reaction totals').click();
  await page.evaluate(()=>window.__m64.setCounts({post_likes:1,post_dislikes:2,comment_likes:3,comment_dislikes:4}));await page.locator('#ddProfileRefresh').click();await page.waitForFunction(()=>document.getElementById('ddProfileLikesReceived').textContent==='4');
  assert.equal(await page.locator('#ddProfileDislikesReceived').textContent(),'6');
  await page.evaluate(()=>window.__m64.setFailure(true));await page.locator('#ddProfileRefresh').click();await page.waitForFunction(()=>document.getElementById('ddProfileLikesReceived').textContent==='—');
  await page.evaluate(()=>{window.__m64.setFailure(false);window.__m64.switchAccount()});await page.waitForFunction(()=>document.getElementById('ddProfileLikesReceived').textContent==='0');
  assert.deepEqual(errors,[],'No page errors at '+width);await context.close();
 }
 console.log('PASS M64 Chromium 320/393/820/1280px: compact account row, optional breakdown, fresh sums, RPC failure, account switch, no overflow/errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
