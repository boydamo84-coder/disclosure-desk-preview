'use strict';
// M23 NO DEPLOY — actual signed HS256 JWT verification by a separate local
// PostgREST container. NEVER contacts Supabase. Secrets and UUIDs are test-only.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const endpoint='http://127.0.0.1:3207';
const secret='m23-CI-TEST-only-LOCAL-key-not-a-real-secret-832adc7896';
const id=[
 '11111111-1111-4111-8111-111111111111',
 '22222222-2222-4222-8222-222222222222',
 '33333333-3333-4333-8333-333333333333',
 '44444444-4444-4444-8444-444444444444',
 '55555555-5555-4555-8555-555555555555'
];
const claim='claim-http-synthetic';
let checks=0;
function token(index,opts={}){
 const now=Math.floor(Date.now()/1000);
 const body={role:opts.role||'authenticated',aud:opts.aud||'authenticated',
  sub:id[index],iat:now-2,exp:now+900,is_anonymous:opts.anon===true};
 if(opts.expired)body.exp=now-90;
 const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify(body)).toString('base64url');
 const source=header+'.'+payload;
 const signed=crypto.createHmac('sha256',opts.badSignature?secret+'INVALID':secret)
  .update(source).digest('base64url');
 return source+'.'+signed;
}
async function call(path,body,auth,extraHeaders){
 const headers={'content-type':'application/json','accept':'application/json',...(extraHeaders||{})};
 if(auth)headers.authorization='Bearer '+auth;
 const r=await fetch(endpoint+path,{method:body===undefined?'GET':'POST',
  headers,body:body===undefined?undefined:JSON.stringify(body)});
 let data;
 const raw=await r.text();
 try{data=raw?JSON.parse(raw):null}catch{data=raw.slice(0,500)}
 return {code:r.status,data};
}
const good=(r,description)=>{
 assert(r.code>=200&&r.code<300,description+': HTTP '+r.code+' '+JSON.stringify(r.data).slice(0,500));checks++;return r;
};
const denied=(r,description)=>{
 assert(r.code>=400&&r.code<500,description+' unexpectedly returned HTTP '+r.code+': '+JSON.stringify(r.data).slice(0,500));checks++;
};
function row(r){
 assert(Array.isArray(r.data)&&r.data.length===1,'Expected exactly one claim response: '+JSON.stringify(r.data));
 return r.data[0];
}
const summary=(ids,auth)=>call('/rpc/dd_who_claim_rating_summary',{p_claim_ids:ids},auth);
const rate=(claim_id,p_rating,auth)=>call('/rpc/dd_who_claim_rating_set',{p_claim_id:claim_id,p_rating},auth);
(async()=>{
 const guest=good(await summary([claim]),'Guest can read enabled claim summary');
 assert.equal(row(guest).rating_count,0);checks++;
 assert.equal(row(guest).community_mean,null);checks++;
 assert.equal(row(guest).my_rating,null);checks++;
 denied(await rate(claim,70,null),'Guest cannot vote');
 denied(await call('/dd_who_claim_ratings?select=claim_id,score'),'No guest raw vote read');
 denied(await call('/dd_who_reviewable_claims?select=claim_id'),'No guest registry read');
 denied(await call('/rpc/dd_who_claim_rating_set_impl',{p_claim_id:claim,p_rating:55}),
  'Privileged worker is not exposed as public RPC');
 denied(await call('/rpc/dd_who_claim_rating_summary',{p_claim_ids:[claim]},null,{'content-profile':'dd_who_private'}),
  'Private schema cannot be requested as POST Content-Profile');
 denied(await rate(claim,50,token(0,{badSignature:true})),'Wrong signature JWT rejected');
 denied(await rate(claim,50,token(0,{expired:true})),'Expired JWT rejected');
 denied(await rate(claim,50,token(0,{aud:'not-this-audience'})),'Wrong audience JWT rejected');
 denied(await rate(claim,50,'not.a.jwt'),'Malformed bearer rejected');
 const anonToken=token(0,{anon:true});
 denied(await rate(claim,90,anonToken),'Signed anonymous-account claim cannot vote');
 denied(await summary([]),'Empty claim list rejected');
 denied(await summary(['NOT A VALID ID']),'Invalid claim ID rejected');
 const a=token(0),b=token(1);
 denied(await call('/dd_who_claim_ratings?select=claim_id,score',undefined,a),
  'Authenticated member cannot read raw vote rows');
 const one=good(await rate(claim,80,a),'Signed account 1 can submit exactly one vote');
 assert.equal(row(one).rating_count,1);checks++;
 assert.equal(row(one).my_rating,80);checks++;
 assert.equal(row(one).community_mean,null);checks++;
 const other=good(await summary([claim],b),'Signed account 2 can read vote summary');
 assert.equal(row(other).rating_count,1);checks++;
 assert.equal(row(other).my_rating,null);checks++;
 denied(await rate(claim,70,a),'Immediate rating edit denied by cooldown');
 denied(await rate('claim-http-disabled',75,a),'Disabled claim rejects member vote');
 denied(await rate('claim-fake-nonexistent',75,a),'Unknown claim rejects member vote');
 denied(await rate(claim,110,a),'Out of range rating rejected');
 const vals=[100,70,30,20];
 for(let i=1;i<=4;i++){
  const r=good(await rate(claim,vals[i-1],token(i)),'Synthetic signed member '+(i+1));
  assert.equal(row(r).rating_count,i+1);checks++;
  assert.equal(row(r).my_rating,vals[i-1]);checks++;
  if(i<4){assert.equal(row(r).community_mean,null);checks++;}
 }
 const g=good(await summary([claim]),'Guest can see five-voter mean');
 assert.equal(row(g).rating_count,5);checks++;
 assert.equal(Number(row(g).community_mean),60);checks++;
 assert.equal(row(g).my_rating,null);checks++;
 const s1=good(await summary([claim],a),'Account 1 sees only own rating after others vote');
 assert.equal(row(s1).my_rating,80);checks++;
 const s2=good(await summary([claim],b),'Account 2 sees only own rating after others vote');
 assert.equal(row(s2).my_rating,100);checks++;
 const disabled=good(await summary(['claim-http-disabled']), 'Disabled claim summary does not expose anything');
 assert.deepEqual(disabled.data,[]);checks++;
 console.log('M23 PostgREST: '+checks+' real HTTP/JWT+RPC assertions passed using 5 synthetic accounts. No GoTrue or real Supabase users.');
})().catch(e=>{console.error('M23 FAILED: '+e.message);process.exitCode=1});
