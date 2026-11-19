'use strict';
/* M75: deliberately inert unless an owner-approved THIRD Supabase project and
 * TWO genuine server-issued access tokens are provided privately.
 * Never prints tokens, emails, raw ballot records or user identifiers. */
const fs=require('node:fs');
const crypto=require('node:crypto');
const BLOCKED_REFS=new Set([
 'omqxizswzcwgzqaczlhe', // LIVE Disclosure Desk - absolutely never target
 'nsqmktjigdllkqhsuqmh'  // pre-existing personal project - not a QA sandbox
]);
const err=message=>{throw new Error(message)};
function configure(env,needTokens=true){
 const ref=env.DD_M75_PROJECT_REF||'';
 const approved=env.DD_M75_OWNER_APPROVED_REF||'';
 if(!/^[a-z0-9]{20}$/.test(ref)||BLOCKED_REFS.has(ref))
  err('M75 blocked: project is not an isolated QA project');
 if(ref!==approved)err('M75 blocked: dedicated project has not been owner-approved');
 const url='https://'+ref+'.supabase.co';
 if(env.DD_M75_URL!==url)err('M75 blocked: API URL does not match approved project');
 const key=env.DD_M75_PUBLISHABLE_KEY||'';
 if(!/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(key))
  err('M75 requires a sandbox-only Supabase publishable key, never service_role');
 const emailA=(env.DD_M75_ACCOUNT_A_EMAIL||'').trim().toLowerCase();
 const emailB=(env.DD_M75_ACCOUNT_B_EMAIL||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailA)
   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailB)
   || emailA===emailB)
  err('M75 requires two different, private test email addresses');
 const tokenA=env.DD_M75_ACCOUNT_A_ACCESS_TOKEN||'';
 const tokenB=env.DD_M75_ACCOUNT_B_ACCESS_TOKEN||'';
 if(needTokens&&(tokenA.length<32||tokenB.length<32||tokenA===tokenB))
  err('M75 requires two different server-issued access tokens, never a shared login');
 return {ref,url,key,emailA,emailB,tokenA,tokenB,env};
}
async function request(cfg,relative,token,method,body,fetcher){
 if(!relative.startsWith('/')||relative.startsWith('//')||relative.includes('://'))
  err('Unsafe API path');
 const headers={apikey:cfg.key,Accept:'application/json'};
 if(token)headers.Authorization='Bearer '+token;
 if(body!==undefined)headers['Content-Type']='application/json';
 if(method==='POST'||method==='PATCH')headers.Prefer='return=representation';
 let response;
 try {
  response=await fetcher(cfg.url+relative,{
   method:method||'GET',headers,
   ...(body===undefined?{}:{body:JSON.stringify(body)}),
   redirect:'error',signal:AbortSignal.timeout(15000)
  });
 }catch(e){err('M75 sandbox request failed; no credentials were logged');}
 let json=null;
 try{
  const raw=await response.text();
  if(raw)json=JSON.parse(raw);
 }catch(e){err('Sandbox API returned non-JSON; no credentials were logged');}
 return {ok:response.ok,status:response.status,data:json};
}
function must(r,label){
 if(!r.ok)err('M75 '+label+' failed (HTTP '+r.status+'); check sandbox setup and permissions');
 return r.data;
}
function singleRow(rows,label){
 if(!Array.isArray(rows)||rows.length!==1)err('M75 '+label+' failed: expected exactly one own row');
 return rows[0];
}
function noRows(rows,label){
 if(!Array.isArray(rows)||rows.length!==0)err('M75 '+label+' failed: cross-account data exposed');
}
async function identity(cfg,token,expectedEmail,label,fetcher){
 const data=must(await request(cfg,'/auth/v1/user',token,'GET',undefined,fetcher),'authenticated identity '+label);
 if(!data||typeof data.id!=='string'
   ||data.email?.trim().toLowerCase()!==expectedEmail
   ||data.is_anonymous===true)
  err('M75 '+label+' token is not the expected verified permanent Auth identity');
 return {id:data.id};
}
function rowsPath(claimId,ownerId){
 let p='/rest/v1/dd_who_m63_member_ballots?select=user_id,claim_id,claim_version,original_points,is_withdrawn';
 p+='&claim_id=eq.'+encodeURIComponent(claimId)+'&claim_version=eq.1';
 if(ownerId)p+='&user_id=eq.'+encodeURIComponent(ownerId);
 return p;
}
async function run(env,mode,fetcher=globalThis.fetch){
 if(!['auth-only','sandbox-write'].includes(mode))err('Invalid M75 mode');
 const c=configure(env);
 if(typeof fetcher!=='function')err('No HTTP client available');
 const a=await identity(c,c.tokenA,c.emailA,'Account A',fetcher);
 const b=await identity(c,c.tokenB,c.emailB,'Account B',fetcher);
 if(a.id===b.id)err('Both logins returned one Auth user ID: account isolation impossible');
 if(mode==='auth-only')return {mode:'auth-only',distinctVerifiedAuthUsers:true,networkWrites:false};
 // Before any DB write, require TWO explicit owner-controlled sandbox gates.
 if(env.DD_M75_ALLOW_SANDBOX_WRITES!=='I_APPROVE_TEST_ONLY_BALLOTS'
    ||env.DD_M75_TEST_SCHEMA_REVIEWED!=='true')
  err('M75 write tests disabled: owner sandbox write/schema approval missing');
 const claim=env.DD_M75_TEST_CLAIM_ID||'';
 if(!/^m75-sandbox-[a-z0-9-]{8,64}$/.test(claim))
  err('M75 refuses non-fictional or improperly scoped claim identifiers');
 const approvedRows=must(await request(c,
 '/rest/v1/dd_who_m63_claim_versions?select=claim_id,claim_version,eligible,enabled&claim_id=eq.'+
 encodeURIComponent(claim)+'&claim_version=eq.1',c.tokenA,'GET',undefined,fetcher),'approved sandbox claim lookup');
 const claimRow=singleRow(approvedRows,'fictional claim registry');
 if(claimRow.claim_id!==claim||claimRow.claim_version!==1||claimRow.eligible!==true||claimRow.enabled!==true)
  err('M75 needs one independently prepared, enabled FICTIONAL sandbox claim');
 const ballotPath='/rest/v1/dd_who_m63_member_ballots?select=user_id,claim_id,claim_version,original_points,is_withdrawn';
 const ballot=(original_points)=>({claim_id:claim,claim_version:1,original_points});
 const aInserted=singleRow(must(await request(c,ballotPath,c.tokenA,'POST',ballot(0),fetcher),'A write'),'A ballot insert');
 const bInserted=singleRow(must(await request(c,ballotPath,c.tokenB,'POST',ballot(25),fetcher),'B write'),'B ballot insert');
 if(aInserted.user_id!==a.id||bInserted.user_id!==b.id||aInserted.original_points!==0||bInserted.original_points!==25)
  err('M75 Auth UID or zero-versus-25 score mismatch after server writes');
 const readOwn=async (token,uid)=>singleRow(
   must(await request(c,rowsPath(claim,uid),token,'GET',undefined,fetcher),'own ballot read'),'own ballot');
 const crossA=must(await request(c,rowsPath(claim,b.id),c.tokenA,'GET',undefined,fetcher),'A cross-read');
 const crossB=must(await request(c,rowsPath(claim,a.id),c.tokenB,'GET',undefined,fetcher),'B cross-read');
 noRows(crossA,'A read B');noRows(crossB,'B read A');
 const crossWrite=await request(c,rowsPath(claim,a.id),c.tokenB,'PATCH',{original_points:17},fetcher);
 if(crossWrite.ok)noRows(crossWrite.data,'B changed A');
 const afterCross=await readOwn(c.tokenA,a.id);
 if(afterCross.original_points!==0)err('M75 cross-account write changed Account A private data');
 const withdraw=singleRow(must(await request(c,rowsPath(claim,a.id),c.tokenA,'PATCH',{is_withdrawn:true},fetcher),'A withdrawal'),'withdraw result');
 if(withdraw.is_withdrawn!==true)err('M75 owner withdrawal was not persisted');
 const resurrect=await request(c,rowsPath(claim,a.id),c.tokenA,'PATCH',{is_withdrawn:false},fetcher);
 if(resurrect.ok&&!Array.isArray(resurrect.data))err('Unexpected resurrect API response');
 if(resurrect.ok&&resurrect.data.length!==0)err('M75 resurrecting a withdrawn ballot succeeded');
 if((await readOwn(c.tokenA,a.id)).is_withdrawn!==true)
  err('M75 withdrawal is not permanent in the test schema');
 if((await readOwn(c.tokenB,b.id)).original_points!==25)
  err('M75 Account B private ballot changed unexpectedly');
 // Guest must never read any raw ballot. An HTTP denial and zero-row RLS
 // response are both acceptable; any other data is a failure.
 const guest=await request(c,rowsPath(claim),null,'GET',undefined,fetcher);
 if(guest.ok)noRows(guest.data,'guest read private votes');
 return {mode:'sandbox-write',distinctVerifiedAuthUsers:true,privateBallotsIsolated:true,
   zeroPreserved:true,withdrawalPermanent:true,guestCannotReadRawBallots:true,
   projectType:'owner-approved isolated test',liveProjectTouched:false};
}
module.exports={configure,run};
if(require.main===module){
 const mode=process.argv[2]||'';
 run(process.env,mode).then(result=>{
  // No emails, account IDs, tokens or raw ballot rows are ever emitted.
  console.log('M75 SAFE SANDBOX RESULT '+JSON.stringify(result));
 }).catch(e=>{
  console.error('M75 BLOCKED: '+(e?.message||'Unexpected test failure'));
  process.exitCode=1;
 });
}
