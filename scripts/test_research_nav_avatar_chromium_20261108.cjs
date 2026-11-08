'use strict';
// Research bottom-dock private-avatar acceptance in REAL offline Chromium.
// Fakes both identities and Storage; no Supabase account or live photo accessed.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core');
const BASE='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  let passed=0;
  const pass=(s)=>{passed++;console.log('PASS RESEARCH AVATAR '+s)};
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:width===393?852:800},
    isMobile:width===393,hasTouch:width===393});
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    return u.origin===BASE?route.continue():route.abort('blockedbyclient');
   });
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/robots.txt',{waitUntil:'domcontentloaded'});
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><h1>Research profile mock</h1></main></body></html>');
   await page.evaluate(()=>{
    const first='11111111-1111-4111-8111-111111111111';
    const second='22222222-2222-4222-8222-222222222222';
    window.__avatarFixture={first,second,owner:first,callbacks:[],calls:[],hold:false,release:null};
    const fake={
     auth:{
      getUser:async()=>({data:{user:window.__avatarFixture.owner?
       {id:window.__avatarFixture.owner,is_anonymous:false}:null},error:null}),
      onAuthStateChange(fn){window.__avatarFixture.callbacks.push(fn);
       return {data:{subscription:{unsubscribe(){}}}}}
     },
     rpc:async(name)=>{
      window.__avatarFixture.calls.push(name);
      if(name!=='dd_avatar_my_settings')throw Error('unexpected RPC');
      const id=window.__avatarFixture.owner;
      return {data:[{public_key:id===first?first:second,visible:false}],error:null};
     },
     storage:{from(bucket){
      if(bucket!=='dd-profile-avatars')throw Error('wrong bucket');
      return {download:async path=>{
       window.__avatarFixture.calls.push('download:'+path);
       if(window.__avatarFixture.hold){
        return new Promise(resolve=>{window.__avatarFixture.release=()=>resolve({data:new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/RfMAAAAASUVORK5CYII='),c=>c.charCodeAt(0))],{type:'image/png'}),error:null})});
       }
       return {data:new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/RfMAAAAASUVORK5CYII='),c=>c.charCodeAt(0))],{type:'image/png'}),error:null};
      }};
     }}
    };
    window.supabase={createClient:()=>fake};
    window.DD_COMMUNITY_TEST_CONFIG={url:'https://fake.invalid',publishableKey:'fake',environment:'test'};
    window.DD_COMMUNITY_FEATURES={profileAvatars:true,privateChat:true};
   });
   await page.addScriptTag({url:BASE+'/research/research-site-nav.js'});
   await page.locator('[data-dd-tab="profilePage"] img').waitFor({state:'attached',timeout:10000});
   assert.equal(await page.locator('[data-dd-tab="profilePage"] img').count(),1);
   assert.deepEqual(errors,[]);
   pass(width+'px signed-in owner private avatar appears even when hidden publicly');
   await page.evaluate(()=>{
    window.__avatarFixture.owner=null;
    for(const fn of window.__avatarFixture.callbacks)fn('SIGNED_OUT',null);
   });
   assert.equal(await page.locator('[data-dd-tab="profilePage"] img').count(),0);
   assert.match(await page.locator('[data-dd-tab="profilePage"]').innerText(),/👤/);
   pass(width+'px signed out removes private photo immediately');

   await page.evaluate(()=>{
    window.__avatarFixture.owner=window.__avatarFixture.second;
    for(const fn of window.__avatarFixture.callbacks)fn('SIGNED_IN',{user:{id:window.__avatarFixture.second}});
   });
   await page.locator('[data-dd-tab="profilePage"] img').waitFor({state:'attached',timeout:10000});
   const last=await page.evaluate(()=>window.__avatarFixture.calls.filter(x=>x.startsWith('download:')).at(-1));
   assert(last.startsWith('download:22222222-2222-4222-8222-222222222222/'));
   pass(width+'px account B loads ONLY its own opaque Storage photo key');

   // Hold a download for B, then sign out before the response returns.
   await page.evaluate(()=>{
    window.__avatarFixture.hold=true;
    for(const fn of window.__avatarFixture.callbacks)fn('SIGNED_IN',{user:{id:window.__avatarFixture.owner}});
   });
   await page.waitForFunction(()=>typeof window.__avatarFixture.release==='function',{timeout:10000});
   await page.evaluate(()=>{
    window.__avatarFixture.owner=null;
    for(const fn of window.__avatarFixture.callbacks)fn('SIGNED_OUT',null);
    window.__avatarFixture.release();
   });
   await page.waitForTimeout(100);
   assert.equal(await page.locator('[data-dd-tab="profilePage"] img').count(),0);
   assert.match(await page.locator('[data-dd-tab="profilePage"]').innerText(),/👤/);
   assert.deepEqual(errors,[]);
   pass(width+'px stale after-signout photo response cannot restore prior avatar');

   await ctx.close();
  }
  console.log('PASS RESEARCH AVATAR TOTAL '+passed+' real-browser isolated checks');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL RESEARCH AVATAR',e.stack||e);process.exitCode=1});
