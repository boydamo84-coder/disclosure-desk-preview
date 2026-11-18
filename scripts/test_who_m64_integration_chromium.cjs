'use strict';
// M64: full real Who's Who Chrome integration, synthetic account/DB only.
// Explicit interception prevents production Supabase and all third-party API traffic.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const people=require('../data/public-people-directory.json').people;
const person=people.find(p=>p.id==='david-fravor');
assert(person&&person.claimEvidence?.length);
const claim=person.claimEvidence.find(c=>c.id&&c.sources?.some(s=>s.kind==='primary'));
const source=claim.sources.find(s=>s.kind==='primary').url;
const approval={claimId:claim.id,claimVersion:1,statement:claim.statement,originalSourceUrl:source,
 status:'independently_approved_for_community_criteria',reviewedAt:'2026-11-18',
 leadEditor:'synthetic-review-A',independentEditor:'synthetic-review-B',enabled:true};
const base='http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const width of [320,393,820,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850},locale:'en-GB'});
   const errors=[],outside=[],dbRequests=[],registryRequests=[];
   await ctx.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin!==base){if(route.request().resourceType()!=='image')outside.push(u.href);
     return route.abort('blockedbyclient')}
    if(/\/(rest|auth)\/v1\//.test(u.pathname)||/\/rpc\//.test(u.pathname)){
     dbRequests.push(u.pathname);return route.abort('blockedbyclient')}
    if(u.pathname==='/data/who-community-approvals-m64.json'){
     registryRequests.push(u.pathname);
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({schemaVersion:1,approvedClaims:[approval]})});
    }
    return route.continue();
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(String(e.message||e)));
   await page.goto(base+'/who-is-who.html?person=david-fravor',
    {waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#personProfile').waitFor({state:'visible',timeout:20000});
   await page.locator('#profileEvidenceReviews article[data-evidence-claim-id]').first().waitFor();
   assert.equal(await page.locator('#profileEvidenceReviews .dd-m64-ballot').count(),0,
    'Disabled live flag cannot render any ballot, even with a synthetic approval injected');
   assert.equal(await page.locator('#profileEvidenceReviews [data-m64-save]').count(),0);
   assert.equal(registryRequests.length,0,'Disabled mode must not fetch approvals even on Who page');
   assert.equal(await page.locator('#ddWebSecondaryNav .tab').count(),14);
   assert((await page.locator('#profileEvidenceReviews a[href^="https://"]').count())>=2);
   // Isolated mocked activation: no live-account, production DB, or privileged writes.
   await page.evaluate(({claim,approval})=>{
    window.DD_COMMUNITY_FEATURES=Object.freeze({...window.DD_COMMUNITY_FEATURES,whoEvidenceBallots:true});
    const store=new Map();const state={member:{id:'synthetic-A',is_anonymous:false},store,calls:[]};
    const key=()=>state.member?.id+':'+claim.id+':1';
    function exec(table,mode,filter,payload,single){
     state.calls.push({table,mode});
     if(table==='dd_who_m63_claim_versions'){
      const row={claim_id:claim.id,claim_version:1,statement:claim.statement,
       original_source_url:approval.originalSourceUrl,eligible:true,enabled:true,
       reviewed_at:'2026-11-18T00:00:00Z'};
      return {data:filter.claim_version===1?row:null,error:null};
     }
     if(table==='dd_who_m63_public_snapshots')return {data:[],error:null};
     if(table!=='dd_who_m63_member_ballots')return {data:null,error:{message:'Unknown fake table'}};
     const user=state.member;
     if(!user||user.is_anonymous)return {data:null,error:{message:'Sign in required'}};
     const k=key(),old=store.get(k);
     if(mode==='select')return {data:old?{...old}:null,error:null};
     if(mode==='insert'){
      if(old)return {data:null,error:{message:'Duplicate ballot'}};
      const row={claim_id:claim.id,claim_version:1,is_withdrawn:false,revision:1,...payload};
      store.set(k,row);return {data:{revision:1},error:null};
     }
     if(mode==='update'){
      if(!old)return {data:null,error:{message:'Missing ballot'}};
      const row={...old,...payload,revision:old.revision+1};
      store.set(k,row);return {data:{revision:row.revision},error:null};
     }
     return {data:null,error:{message:'Invalid operation'}};
    }
    function query(table){
     const f={},q={mode:'select',payload:null,
      eq(k,v){f[k]=v;return this},
      select(){return this},
      insert(v){this.mode='insert';this.payload=v;return this},
      update(v){this.mode='update';this.payload=v;return this},
      maybeSingle(){return Promise.resolve(exec(table,this.mode,f,this.payload,true))},
      then(resolve,reject){return Promise.resolve(exec(table,this.mode,f,this.payload,false)).then(resolve,reject)}
     };return q;
    }
    window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:state.member},error:null})},
     from:query
    })};
    window.__M64Synthetic=state;
   },{claim,approval});
   await page.evaluate(async person=>window.DDWhoEvidenceM64.mountForPerson(
    person,document.querySelector('#profileEvidenceReviews')),person);
   const panel=page.locator('#profileEvidenceReviews details.dd-m64-ballot');
   await panel.waitFor({state:'attached',timeout:6000});
   assert.equal(await panel.count(),1,'Exact matched claim has one invitation');
   await panel.locator(':scope > summary').click();
   await panel.locator('fieldset.dd-m64-field').first().waitFor({state:'visible'});
   assert.equal(await panel.locator('fieldset.dd-m64-field').count(),5);
   const unknown=panel.locator('.dd-m64-unknown input'),slider=panel.locator('input[type="range"]');
   assert.equal(await unknown.count(),5);
   assert.equal(await slider.count(),5);
   assert.match(await panel.locator('[data-m64-assessment]').innerText(),/All five criteria unknown/);
   for(let i=0;i<5;i++)assert(await unknown.nth(i).isChecked());
   await unknown.first().uncheck();
   assert.equal(await slider.first().inputValue(),'0');
   assert.match(await panel.locator('[data-m64-assessment]').innerText(),/1 of 5 answered · 0 \/ 25/);
   await panel.locator('[data-m64-save]').click();
   await panel.locator('[data-m64-save]').filter({hasText:'Update private assessment'}).waitFor();
   // No user-supplied identity goes into writes; server uses auth.uid().
   const aState=await page.evaluate(({id})=>{
    const s=window.__M64Synthetic;
    return s.store.get('synthetic-A:'+id+':1');
   },{id:claim.id});
   assert.equal(aState.original_points,0);
   assert.equal(aState.independent_points,null);
   assert.equal(aState.revision,1);
   // Different synthetic account must have its own empty private ballot.
   await page.evaluate(()=>{window.__M64Synthetic.member={id:'synthetic-B',is_anonymous:false}});
   await page.evaluate(async ({claim,approval})=>{
    const host=document.createElement('section');host.id='m64-alt-account';
    document.querySelector('#profileEvidenceReviews .claim-review').append(host);
    const ui=window.DDWhoEvidenceM64.mountClaim(host,claim,1,
     window.DDWhoEvidenceM64.adapterFor(),approval);
    if(!ui)throw Error('M64 alternate account mount failed');
    await ui.refresh();
   },{claim,approval});
   const other=page.locator('#m64-alt-account');
   await other.locator('fieldset').first().waitFor();
   assert.match(await other.locator('[data-m64-assessment]').innerText(),/All five criteria unknown/);
   assert.equal(await other.locator('[data-m64-withdraw]').isDisabled(),true);
   for(let i=0;i<5;i++)await other.locator('.dd-m64-unknown input').nth(i).uncheck();
   assert.match(await other.locator('[data-m64-assessment]').innerText(),/0 \/ 100/);
   await other.locator('[data-m64-save]').click();
   await other.locator('[data-m64-save]').filter({hasText:'Update private assessment'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__M64Synthetic.store.size),2);
   await other.locator('[data-m64-withdraw]').click();
   await other.locator('[data-m64-save]').filter({hasText:'Save private assessment'}).waitFor();
   const b=await page.evaluate(id=>window.__M64Synthetic.store.get('synthetic-B:'+id+':1'),claim.id);
   assert.equal(b.is_withdrawn,true);
   assert.equal(b.revision,2);
   const aAgain=await page.evaluate(id=>window.__M64Synthetic.store.get('synthetic-A:'+id+':1'),claim.id);
   assert.equal(aAgain.is_withdrawn,false,'B withdrawal must not affect A');
   await page.evaluate(async ({claim,approval})=>{
    window.__M64Synthetic.member={id:'synthetic-anonymous',is_anonymous:true};
    const host=document.createElement('section');host.id='m64-anonymous';
    document.querySelector('#profileEvidenceReviews .claim-review').append(host);
    await window.DDWhoEvidenceM64.mountClaim(host,claim,1,
     window.DDWhoEvidenceM64.adapterFor(),approval).refresh();
   },{claim,approval});
   assert.match(await page.locator('#m64-anonymous').innerText(),/Sign in with a registered/);
   assert.equal(await page.locator('#m64-anonymous fieldset').count(),0);
   await page.evaluate(async ({claim,approval})=>{
    window.__M64Synthetic.member=null;
    const host=document.createElement('section');host.id='m64-guest';
    document.querySelector('#profileEvidenceReviews .claim-review').append(host);
    await window.DDWhoEvidenceM64.mountClaim(host,claim,1,
     window.DDWhoEvidenceM64.adapterFor(),approval).refresh();
   },{claim,approval});
   assert.match(await page.locator('#m64-guest').innerText(),/Sign in with a registered/);
   await page.evaluate(async ({claim,approval})=>{
    window.__M64Synthetic.member={id:'synthetic-A',is_anonymous:false};
    const host=document.createElement('section');host.id='m64-mismatched-version';
    document.querySelector('#profileEvidenceReviews .claim-review').append(host);
    await window.DDWhoEvidenceM64.mountClaim(host,claim,2,
     window.DDWhoEvidenceM64.adapterFor(),{...approval,claimVersion:2}).refresh();
   },{claim,approval});
   assert.match(await page.locator('#m64-mismatched-version').innerText(),/not approved for community assessment/);
   const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth}));
   assert(dimensions.scroll<=dimensions.width+3,'No overflow at '+width+': '+JSON.stringify(dimensions));
   assert.deepEqual(dbRequests,[],'No actual Supabase or API calls');
   assert.deepEqual(outside,[],'No external scripts, API or network calls');
   assert.deepEqual(errors,[],'No script errors at '+width);
   await ctx.close();
  }
  console.log('M64 CHROME PASS: actual Who page inactive by default, source-linked Fravor claim gated in synthetic mode, A/B signed-in ballots private, zero/unknown, anonymous/guest blocked, revision/withdrawal, mismatch version and 320/393/820/1280 no overflow; NO live calls.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
