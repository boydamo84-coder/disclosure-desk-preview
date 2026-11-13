'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {buildFixture}=require('./m64_profile_fixture.cjs');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
   await context.route('**/*',r=>{
    const url=new URL(r.request().url());
    if(url.origin!==BASE)return r.abort();
    if(url.pathname==='/__m66-profile')return r.fulfill({contentType:'text/html',body:buildFixture()});
    return r.continue();
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/__m66-profile');
   await page.waitForFunction(()=>document.getElementById('ddProfileLikesReceived').textContent==='5');
   await page.evaluate(()=>{
    const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmfoAAAAASUVORK5CYII=';
    const bytes=Uint8Array.from(atob(png),c=>c.charCodeAt(0));
    const avatarBlob=new Blob([bytes],{type:'image/png'});
    let actor={id:'11111111-1111-4111-8111-111111111111'},deleted=0;
    const listeners=[];
    window.__m66={get removed(){return deleted},signOut(){actor=null;listeners.forEach(fn=>fn('SIGNED_OUT',null))}};
    const fake={
      auth:{getUser:async()=>({data:{user:actor},error:null}),onAuthStateChange:fn=>listeners.push(fn)},
      rpc:async name=>name==='dd_avatar_my_settings'
       ?{data:[{public_key:'44444444-4444-4444-8444-444444444444',visible:true}],error:null}
       :{data:true,error:null},
      storage:{from:()=>({
        download:async()=>({data:avatarBlob,error:null}),
        upload:async()=>({error:null}),
        remove:async()=>{deleted++;return{error:null}}
      })}
    };
    window.DD_COMMUNITY_FEATURES={profileAvatars:true};
    window.supabase.createClient=()=>fake;
   });
   await page.addScriptTag({url:BASE+'/assets/confirmation-dialog.js'});
   await page.addScriptTag({url:BASE+'/assets/profile-avatars.js'});
   await page.waitForFunction(()=>document.querySelector('#ddAvatarImage')?.hidden===false);
   const size=await page.evaluate(()=>{
    const rect=id=>document.getElementById(id).getBoundingClientRect();
    const avatar=rect('ddAvatarPanel'),identity=rect('ddProfileIdentityCard'),name=rect('ddProfileDisplayName'),
       counts=rect('ddProfileFilesCount'),grid=rect('ddProfileSettings');
    return {avatar:avatar.top,name:name.top,identity:identity.top,height:identity.height,
       counts:counts.top,settings:grid.top,viewport:innerWidth,scroll:document.documentElement.scrollWidth};
   });
   assert(size.avatar>=size.identity-1&&size.avatar<size.counts,'Photo is in header before cloud summary');
   assert(size.name<size.counts,'Username and votes are above cloud summary');
   assert(size.height<=205,'No oversized profile/photo panel '+width+': '+JSON.stringify(size));
   assert(size.scroll<=size.viewport+1,'No horizontal overflow at '+width+': '+JSON.stringify(size));
   const titles=await page.locator('#ddProfilePrivate > .dd-profile-grid > details > summary').allTextContents();
   assert.deepEqual(titles.map(t=>t.replace(/\s+/g,' ').trim()),[
    '✎ My W.NE Research⌄','▣ Investigation Boards⌄','◉ My Witness Reports⌄',
    '💬 My Comments⌄','✉ Private Chat⌄','⚙ Profile settings⌄'
   ],'Cloud documents, Boards and witness reports must come first');
   assert.equal(await page.locator('#ddProfileSettings').getAttribute('open'),null,'Settings closed on arrival');
   assert.equal(await page.locator('#ddAvatarFile').isVisible(),false,'Photo picker hidden on first screen');
   await page.locator('#ddProfileSettings > summary').click();
   await page.locator('#ddAvatarSettings > summary').click();
   assert.equal(await page.locator('#ddAvatarFile').isEnabled(),true,'Existing avatar picker active in settings');
   assert.equal(await page.locator('#ddAvatarRemove').isVisible(),true,'Remove photo in settings only');
   await page.locator('#ddAvatarSettings .dd-avatar-information > summary').click();
   assert.match(await page.locator('#ddAvatarPhotoRequirements').textContent(),/maximum 5 MB/);
   // M74 uses a branded modal instead of the obsolete window.confirm().
   await page.locator('#ddAvatarRemove').click();
   const confirmation=page.locator('dialog.dd-confirm-dialog');
   await confirmation.waitFor({state:'visible'});
   await confirmation.locator('.dd-confirm-cancel').click();
   assert.equal(await page.evaluate(()=>window.__m66.removed),0,'Cancel must preserve profile photo');
   await page.locator('#ddAvatarRemove').click();
   await confirmation.waitFor({state:'visible'});
   await confirmation.locator('.dd-confirm-accept').click();
   await page.waitForFunction(()=>document.getElementById('ddAvatarFallback')?.hidden===false);
   assert.equal(await page.evaluate(()=>window.__m66.removed),1,'Existing confirmed removal called once');
   assert.equal(await page.locator('#ddProfileLikesReceived').textContent(),'5','Avatar removal does not reset reaction stats');
   await page.evaluate(()=>window.__m66.signOut());
   await page.waitForFunction(()=>document.getElementById('ddAvatarPanel')?.hidden &&
       document.getElementById('ddAvatarSettings')?.hidden);
   assert.deepEqual(errors,[],'No runtime JS errors at '+width);
   await context.close();
  }
  console.log('PASS M66 real Chromium 320/393/820/1280: compact identity, photo display, ordered cards, closed settings, photo requirements, confirmed removal, sign-out, no overflow');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
