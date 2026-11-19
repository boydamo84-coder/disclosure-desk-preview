'use strict';
/* M69 browser QA: synthetic Supabase only. No live account/network/sign-up. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
   const remote=[],errors=[];
   await ctx.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===BASE)return route.continue();
    remote.push(url.href);return route.abort('blockedbyclient');
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   const target=BASE+'/scripts/fixtures/m69-profile-auth.html';
   await page.goto(target,{waitUntil:'domcontentloaded'});
   await page.locator('#ddProfileSignIn').waitFor();
   assert.equal(await page.locator('#ddProfileAuthForm').count(),0,'Form should open on demand');
   await page.locator('#ddProfileSignIn').click();
   await page.locator('#ddProfileAuthForm').waitFor();
   assert.equal(await page.locator('#ddProfileAuthForm').isVisible(),true);
   assert.equal(await page.locator('#ddProfileAuthUsernameRow').isVisible(),false);
   assert.equal(await page.locator('#ddProfileAuthEmail').evaluate(e=>e===document.activeElement),true,
    'Sign-in should focus email within Profile');
   assert.equal(await page.locator('[data-tab=profilePage]').getAttribute('class'),'tab active');
   assert.equal(await page.evaluate(()=>window.__boardsVisited),0,'No boards navigation on Profile sign-in');
   assert.equal(page.url(),target);
   await page.locator('#ddProfileAuthEmail').fill('researcher@example.com');
   await page.locator('#ddProfileAuthPassword').fill('wrong-password');
   await page.locator('#ddProfileAuthSubmit').click();
   await page.waitForFunction(()=>document.getElementById('ddProfileAuthStatus')?.dataset.state==='error');
   assert.match(await page.locator('#ddProfileAuthStatus').innerText(),/Invalid login credentials/);
   assert.equal(await page.evaluate(()=>window.__boardsVisited),0);
   assert.equal(await page.locator('#ddProfileGuest').isVisible(),true);
   // Changing mode to signup must stay in Profile with a visible username.
   await page.locator('#ddProfileRegister').click();
   assert.equal(await page.locator('#ddProfileAuthUsernameRow').isVisible(),true);
   assert.match(await page.locator('#ddProfileAuthSubmit').innerText(),/Create account/);
   await page.locator('#ddProfileAuthUsername').fill('Researcher_42');
   await page.locator('#ddProfileAuthPassword').fill('signup-password-123');
   await page.locator('#ddProfileAuthSubmit').click();
   await page.waitForFunction(()=>document.getElementById('ddProfileAuthStatus')?.textContent?.includes('confirmation email'));
   const signup=await page.evaluate(()=>window.__fakeAuth.calls.filter(c=>c.action==='signup')[0]);
   assert.equal(signup.username,'Researcher_42');
   assert.match(signup.redirect,/\?dd_tab=profilePage&dd_confirm=1$/);
   assert.equal(await page.evaluate(()=>window.__boardsVisited),0);
   // Recover credentials without being sent to Boards.
   await page.locator('#ddProfileAuthReset').click();
   await page.waitForFunction(()=>document.getElementById('ddProfileAuthStatus')?.textContent?.includes('password-reset email'));
   const reset=await page.evaluate(()=>window.__fakeAuth.calls.filter(c=>c.action==='reset')[0]);
   assert.match(reset.redirect,/\?dd_tab=profilePage$/);
   // Reuse existing account service to sign in successfully.
   await page.locator('#ddProfileSignIn').click();
   assert.equal(await page.locator('#ddProfileAuthUsernameRow').isVisible(),false);
   await page.locator('#ddProfileAuthPassword').fill('correct-pass-123');
   await page.locator('#ddProfileAuthSubmit').click();
   await page.waitForFunction(()=>document.getElementById('ddProfilePrivate')?.hidden===false);
   assert.equal(await page.locator('#ddProfileGuest').isVisible(),false);
   assert.equal(await page.locator('#ddProfileAuthPassword').inputValue(),'');
   assert.equal(await page.evaluate(()=>window.__boardsVisited),0);
   assert.equal(page.url(),target);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false,
    'Horizontal overflow at '+width+'px');
   assert.deepEqual(remote,[],'No third-party requests in synthetic test');
   assert.deepEqual(errors,[],'No JS page errors in synthetic test');
   await ctx.close();
   console.log('M69 PROFILE AUTH PASS '+width+'px — failure, signup, reset, sign-in all stay on Profile; no Boards redirect.');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('M69 PROFILE AUTH QA FAILED:',e.stack||e);process.exitCode=1});
