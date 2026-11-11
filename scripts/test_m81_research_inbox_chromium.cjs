'use strict';
// Real browser check of the Java-injected Android-only Research Inbox entry.
// Offline fictional Profile; no user data or Supabase writes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {getInjectedJs}=require('./test_m81_native_research_contract.cjs');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  for (const width of [320,393,820]) {
   const context=await browser.newContext({viewport:{width,height:820},serviceWorkers:'block'});
   await context.route('**/*',route=>
    new URL(route.request().url()).origin===BASE?route.continue():route.abort());
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(BASE+'/assets/community-polish.css');
   await page.setContent('<!doctype html><html><head>'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<link rel="stylesheet" href="'+BASE+'/assets/community-polish.css">'
    +'</head><body style="margin:0;background:#0e2433;color:#f0eadc">'
    +'<section id="profilePage" style="padding:10px">'
    +'<div class="dd-profile-heading"><h2>My Profile</h2></div>'
    +'<div class="dd-profile-card" id="ddProfileIdentityCard">Researcher</div>'
    +'<details id="ddProfileSettings" class="dd-profile-card dd-profile-fold dd-profile-settings">'
    +'<summary><span>⚙ Profile settings</span></summary>'
    +'<div class="dd-profile-settings-meta">Settings description</div>'
    +'<details id="ddAndroidAlertsSettings" class="dd-profile-card dd-profile-fold">'
    +'<summary>🔔 App notifications</summary><p>Notification choices</p></details>'
    +'<details class="dd-profile-card dd-profile-fold"><summary>Account settings</summary></details>'
    +'</details></section></body></html>');
   await page.evaluate(()=>{
    window.__messages=[];
    window.DDAndroid={postMessage:value=>window.__messages.push(JSON.parse(value))};
   });
   const injection=getInjectedJs();
   await page.evaluate(injection);
   await page.evaluate(injection);
   const result=await page.evaluate(()=>{
    const settings=document.getElementById('ddProfileSettings');
    const inbox=document.getElementById('ddAndroidResearchInbox');
    const alerts=document.getElementById('ddAndroidAlertsSettings');
    return {
     nested:settings.contains(inbox),
     afterAlerts:alerts.nextElementSibling===inbox,
     count:document.querySelectorAll('#ddAndroidResearchInbox').length,
     title:inbox.querySelector('summary')?.textContent,
     note:inbox.querySelector('p')?.textContent,
     width:document.documentElement.scrollWidth,
     viewport:innerWidth
    };
   });
   assert(result.nested,'Profile settings contains native inbox');
   assert(result.afterAlerts,'Inbox appears after existing notification settings');
   assert.equal(result.count,1,'No duplicate row after repeated page load');
   assert.match(result.title,/Research Inbox/);
   assert.match(result.note,/stay on this phone/i);
   assert(result.width<=result.viewport+1,'No horizontal overflow');
   await page.evaluate(()=>{
    document.getElementById('ddProfileSettings').open=true;
    document.getElementById('ddAndroidResearchInbox').open=true;
   });
   const button=page.getByRole('button',{name:'Open saved Android research links'});
   await button.waitFor({state:'visible'});
   const rect=await button.evaluate(el=>{const a=el.getBoundingClientRect();
    return {height:a.height,left:a.left,right:a.right};});
   assert(rect.height>=44,'Touch target at least 44px');
   assert(rect.left>=0 && rect.right<=width,'Button stays in mobile viewport');
   await button.click();
   assert.deepEqual(await page.evaluate(()=>window.__messages),
    [{type:'open_research_inbox'}],'Only native origin-restricted action sent');
   assert.deepEqual(errors,[],'No browser runtime errors');
   console.log('PASS M81 native Profile Research Inbox UI at '+width+'px: accessible, nested, no duplicates, bridge message only');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
