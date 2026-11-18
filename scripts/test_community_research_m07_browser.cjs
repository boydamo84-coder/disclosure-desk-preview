'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const target='https://uapdisclosuredesk.com';
const pubId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function mime(p){return p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.svg')?'image/svg+xml':'text/html';}
async function open(page,routePath){
 await page.goto(target+routePath,{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(125);
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const size of [320,393,820,1280]){
   for(const mode of ['guest','member','pilot']){
    const context=await browser.newContext({viewport:{width:size,height:820},locale:'en-GB'});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(url.origin!==target)return route.abort('blockedbyclient');
     let filename=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
     const resolved=path.resolve(root,filename);
     if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved))
      return route.fulfill({status:404,body:'Not found'});
     return route.fulfill({status:200,contentType:mime(resolved),body:fs.readFileSync(resolved)});
    });
    await context.addInitScript(({mode,pubId})=>{
     window.__qa={mode,pubId,requests:[],login:mode!=='guest'};
     const paperProvider=()=>({
       select(fields){
        const builder={
         eq(){return builder},
         order(){return builder},
         range(){return Promise.resolve({data:[],error:null})},
         limit(){return Promise.resolve({data:[],error:null})},
         maybeSingle(){return Promise.resolve({data:null,error:null})}
        };
        return builder;
       }
     });
     window.supabase={createClient:(url,key)=>{
       if(url!=='https://omqxizswzcwgzqaczlhe.supabase.co'||!key.startsWith('sb_publishable_'))
        throw Error('Pilot used unexpected backend');
       return {
         auth:{getUser:async()=>({data:{user:window.__qa.login?{id:pubId,is_anonymous:false}:null},error:null})},
         rpc:async(name,args)=>{
          window.__qa.requests.push(name);
          if(name==='dd_cr_pilot_status')return {data:window.__qa.mode==='pilot'&&window.__qa.login,error:null};
          if(name==='dd_cr_my_papers' && window.__qa.mode==='pilot')return {data:[],error:null};
          return {data:null,error:{message:'Access denied by test backend'}};
         },
         from(name){
          window.__qa.requests.push('from:'+name);
          if(name==='dd_cr_drafts'||name==='dd_cr_editions')return paperProvider();
          throw Error('Unexpected non-research API '+name);
         }
       };
     }};
    },{mode,pubId});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));
    await open(page,'/my-research.html');
    if(mode==='pilot'){
     await page.locator('#myResearchBoard').waitFor({state:'visible',timeout:6000});
     assert.equal(await page.locator('#myResearchRecords .item').count(),0);
     const calls=await page.evaluate(()=>window.__qa.requests.slice());
     assert(calls.includes('dd_cr_pilot_status'),'Pilot must call server for membership');
     assert(calls.includes('dd_cr_my_papers'),'Eligible researcher must get own server portfolio');
     await page.evaluate(()=>{
       window.__qa.login=false;
       window.dispatchEvent(new Event('focus'));
     });
     await page.locator('#myResearchAvailability').filter({hasText:'Please sign in'}).waitFor({timeout:6000});
     assert.equal(await page.locator('#myResearchBoard').isVisible(),true,'Board may remain as empty shell');
     assert.equal(await page.locator('#myResearchRecords .item').count(),0);
    }else{
     assert.equal(await page.locator('#myResearchBoard').isVisible(),false,
      'Guest/nonpilot must not see beta board');
     assert.match(await page.locator('#myResearchAvailability').innerText(),/approved beta researcher|limited/i);
     assert.equal(await page.evaluate(()=>window.__qa.requests.some(n=>n==='dd_cr_my_papers')),false,
      'Guest/nonpilot accessed member paper list');
    }
    const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
    assert(dims.scroll<=dims.width+2,'Mobile horizontal overflow '+size+' '+mode);
    // The composition page must also avoid showing controls to nonmembers.
    if(mode!=='pilot'){
     await open(page,'/community-research.html');
     assert.equal(await page.locator('#researchM03Panel').getAttribute('hidden')!==null,true,
      'Publishing form exposed without verified pilot status');
    }
    assert.deepEqual(errors,[],'Browser JS error '+size+'/'+mode+': '+errors.join(','));
    await context.close();
   }
  }
  console.log('PASS M07 Chrome: real production-domain rules, guest/member blocked, approved pilot checked server-side, sign-out clears data, no accidental external requests, 320/393/820/1280.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
