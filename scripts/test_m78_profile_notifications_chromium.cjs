'use strict';
// Real offline Chromium on 320px/393px/820px: test Java-originated JS output.
// No remote accounts, actual notification permission or mobile device writes.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const {getInjectedJs}=require('./test_m78_profile_notifications_contract.cjs');
const injected=getInjectedJs(),BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820]){
   const ctx=await browser.newContext({viewport:{width,height:820},serviceWorkers:'block'});
   await ctx.route('**/*',route=>new URL(route.request().url()).origin===BASE?route.continue():route.abort());
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/assets/community-polish.css').catch(()=>{});
   await page.setContent('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="'+BASE+'/assets/community-polish.css"></head><body style="margin:0;background:#0d2030;color:#f0eadc"><section id="profilePage" style="padding:12px"><div class="dd-profile-heading"><h2>My profile</h2></div><div id="ddProfilePrivate"><div class="dd-profile-card dd-profile-identity" id="ddProfileIdentityCard">Researcher</div><div class="dd-profile-card" id="fixtureFold">My research</div><details id="ddProfileSettings" class="dd-profile-card dd-profile-fold dd-profile-settings"><summary><span>⚙ Profile settings</span><span class="dd-profile-chevron" aria-hidden="true">⌄</span></summary><div class="dd-profile-settings-meta"><p>Account email</p></div><details id="ddAvatarSettings"><summary>Profile photo &amp; visibility</summary></details><details class="dd-profile-card dd-profile-fold"><summary>Public Username</summary></details></details></div></section></body></html>');
   await page.evaluate(()=>{
    window.__nativeNotifications=[];
    window.DDAndroid={postMessage:payload=>window.__nativeNotifications.push(JSON.parse(payload))};
   });
   await page.evaluate(injected);
   await page.evaluate(injected); // no duplicates
   const overview=await page.evaluate(()=>{
    const settings=document.getElementById('ddProfileSettings');
    const panel=document.getElementById('ddAndroidAlertsSettings');
    const title=document.querySelector('#profilePage .dd-profile-heading');
    const meta=settings.querySelector('.dd-profile-settings-meta');
    return {nested:settings.contains(panel),afterMeta:meta.nextElementSibling===panel,
      type:panel.tagName,duplicate:document.querySelectorAll('#ddAndroidAlertsSettings').length,
      outside:document.querySelector('#profilePage>.dd-android-alert-settings')!==null,
      headingNext:title.nextElementSibling?.id||'',
      summary:panel.querySelector('summary')?.textContent||''};
   });
   assert.equal(overview.nested,true,'App notifications inside Profile settings');
   assert.equal(overview.afterMeta,true,'Alerts is first nested settings group');
   assert.equal(overview.type,'DETAILS','Native control is an expandable row');
   assert.equal(overview.duplicate,1,'Only one notification control on multiple app loads');
   assert.equal(overview.outside,false,'No standalone card above Profile');
   assert.notEqual(overview.headingNext,'ddAndroidAlertsSettings','Profile identity remains at top');
   assert.match(overview.summary,/App notifications/,'Readable label');
   await page.evaluate(()=>{
    document.getElementById('ddProfileSettings').open=true;
    document.getElementById('ddAndroidAlertsSettings').open=true;
   });
   const button=page.getByRole('button',{name:'Open Android notification settings'});
   await button.waitFor({state:'visible'});
   const metrics=await button.evaluate(el=>{const r=el.getBoundingClientRect();
    return {height:r.height,left:r.left,right:r.right,scrollWidth:document.documentElement.scrollWidth,
      screenWidth:innerWidth};});
   assert(metrics.height>=44,'Touch target >=44px');
   assert(metrics.left>=0&&metrics.right<=width,'Button inside viewport');
   assert(metrics.scrollWidth<=width+1,'No page overflow');
   await button.click();
   const events=await page.evaluate(()=>window.__nativeNotifications);
   assert.deepEqual(events,[{type:'open_notification_settings'}],
    'Profile action uses only the already origin-restricted native message bridge');
   assert.deepEqual(errors,[],'No browser JS errors');
   console.log('PASS M78 Profile notification settings nested '+width+'px, native action and no duplicate or overflow');
   await ctx.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
