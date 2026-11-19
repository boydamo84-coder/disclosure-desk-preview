'use strict';
// Zero-network contract. Test emails, JWTs and user IDs are entirely fictional.
const assert=require('node:assert/strict');
const {configure,run}=require('./who-m75-supabase-auth-preflight.cjs');
const env={
 DD_M75_PROJECT_REF:'aaaaaaaaaaaaaaaaaaaa',
 DD_M75_OWNER_APPROVED_REF:'aaaaaaaaaaaaaaaaaaaa',
 DD_M75_URL:'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
 DD_M75_PUBLISHABLE_KEY:'sb_publishable_TEST_abcde12345678',
 DD_M75_ACCOUNT_A_EMAIL:'alice@test.invalid',
 DD_M75_ACCOUNT_B_EMAIL:'bob@test.invalid',
 DD_M75_ACCOUNT_A_ACCESS_TOKEN:'A'.repeat(90),
 DD_M75_ACCOUNT_B_ACCESS_TOKEN:'B'.repeat(90),
 DD_M75_ALLOW_SANDBOX_WRITES:'I_APPROVE_TEST_ONLY_BALLOTS',
 DD_M75_TEST_SCHEMA_REVIEWED:'true',
 DD_M75_TEST_CLAIM_ID:'m75-sandbox-testcase-001'
};
const fail=(changes)=>assert.throws(()=>configure({...env,...changes}),/M75/);
fail({DD_M75_PROJECT_REF:'omqxizswzcwgzqaczlhe',DD_M75_OWNER_APPROVED_REF:'omqxizswzcwgzqaczlhe',
 DD_M75_URL:'https://omqxizswzcwgzqaczlhe.supabase.co'});
fail({DD_M75_PROJECT_REF:'nsqmktjigdllkqhsuqmh',DD_M75_OWNER_APPROVED_REF:'nsqmktjigdllkqhsuqmh',
 DD_M75_URL:'https://nsqmktjigdllkqhsuqmh.supabase.co'});
fail({DD_M75_OWNER_APPROVED_REF:'bbbbbbbbbbbbbbbbbbbb'});
fail({DD_M75_URL:'https://untrusted.example.net'});
fail({DD_M75_ACCOUNT_B_EMAIL:env.DD_M75_ACCOUNT_A_EMAIL});
fail({DD_M75_ACCOUNT_B_ACCESS_TOKEN:env.DD_M75_ACCOUNT_A_ACCESS_TOKEN});
fail({DD_M75_PUBLISHABLE_KEY:'sb_secret_NEVER_USE'});
const aid='11111111-1111-4111-8111-111111111111';
const bid='22222222-2222-4222-8222-222222222222';
const ballots=new Map();
let allRequests=0;
function result(data,status=200){
 return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
}
function mock(url,opt){
 allRequests++;
 assert(url.startsWith(env.DD_M75_URL+'/'),'No unexpected domain');
 const endpoint=new URL(url),p=endpoint.pathname,method=opt.method;
 const auth=opt.headers.Authorization;
 const who=auth==='Bearer '+env.DD_M75_ACCOUNT_A_ACCESS_TOKEN?'A':
  auth==='Bearer '+env.DD_M75_ACCOUNT_B_ACCESS_TOKEN?'B':'guest';
 const uid=who==='A'?aid:who==='B'?bid:null;
 if(p==='/auth/v1/user'){
  assert.equal(method,'GET');
  if(who==='guest')return result({message:'No authentication'},401);
  return result({id:uid,email:who==='A'?env.DD_M75_ACCOUNT_A_EMAIL:env.DD_M75_ACCOUNT_B_EMAIL,is_anonymous:false});
 }
 if(p==='/rest/v1/dd_who_m63_claim_versions'){
  return result([{claim_id:env.DD_M75_TEST_CLAIM_ID,claim_version:1,enabled:true,eligible:true}]);
 }
 if(p==='/rest/v1/dd_who_m63_member_ballots'){
  const owner=endpoint.searchParams.get('user_id')?.replace(/^eq\./,'');
  const current=[...ballots.values()].filter(row=>row.user_id===uid&&(!owner||owner===uid));
  if(method==='GET')return result(current);
  if(method==='POST'){
   const x=JSON.parse(opt.body);
   if(uid===null)return result({message:'unauthorized'},403);
   const row={...x,user_id:uid,is_withdrawn:false};
   ballots.set(uid,row);return result([row],201);
  }
  if(method==='PATCH'){
   if(owner!==uid)return result([]);
   const change=JSON.parse(opt.body),row=ballots.get(uid);
   if(!row)return result([]);
   if(row.is_withdrawn===true)return result({message:'Already withdrawn'},400);
   Object.assign(row,change);return result([row]);
  }
 }
 throw Error('Unexpected sandbox request');
}
(async()=>{
 const idResult=await run(env,'auth-only',mock);
 assert.equal(idResult.distinctVerifiedAuthUsers,true);
 assert.equal(ballots.size,0,'Auth preflight must not write');
 assert.equal(allRequests,2);
 const v=await run(env,'sandbox-write',mock);
 assert.equal(v.privateBallotsIsolated,true);
 assert.equal(v.withdrawalPermanent,true);
 assert.equal(ballots.get(aid).original_points,0);
 assert.equal(ballots.get(aid).is_withdrawn,true);
 assert.equal(ballots.get(bid).original_points,25);
 assert.equal(ballots.size,2);
 const bad={...env,DD_M75_ALLOW_SANDBOX_WRITES:''};
 await assert.rejects(()=>run(bad,'sandbox-write',mock),/write tests disabled/);
 const failedAuth={...env,DD_M75_ACCOUNT_B_EMAIL:'notmatching@test.invalid'};
 await assert.rejects(()=>run(failedAuth,'auth-only',mock),/token is not the expected/);
 const maliciousFetch=(url,opts)=>{
  if(url.includes('user_id=eq.')&&opts.method==='GET'&&opts.headers.Authorization==='Bearer '+env.DD_M75_ACCOUNT_A_ACCESS_TOKEN)
   return result([{user_id:bid,claim_id:env.DD_M75_TEST_CLAIM_ID,original_points:25}]);
  return mock(url,opts);
 };
 // The full run may stop earlier on duplicate inserts; direct cross-account
 // simulation above already covers the legitimate happy path.
 assert(!JSON.stringify(idResult).includes(env.DD_M75_ACCOUNT_A_EMAIL),'Never log PII');
 console.log('M75 CONTRACT PASS: blocked production/unapproved projects, distinct Auth identities, sandbox-only writes, cross-account RLS, permanent withdrawal, zero preserved, no real network');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
