'use strict';
// REAL HTTP signed JWT -> temporary PostgREST -> PostgreSQL 17 QA.
// STRICTLY LOOPBACK. No real auth accounts, Supabase endpoints or user content.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const base=process.env.DD_HTTP_TEST_ORIGIN||'http://127.0.0.1:3000';
const origin=new URL(base);
assert.equal(origin.protocol,'http:','HTTP gateway test must be local only');
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname),'Refuse any remote project URL');
assert.equal(origin.port,'3000','Refuse non-test HTTP port');
const secret=process.env.DD_CI_JWT_SECRET;
assert.ok(secret&&secret.length>=32,'Missing disposable test-only JWT signing key');
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(n,{anonymous=false,secretOverride=secret,expiresIn=300}={}){
 const payload={role:'authenticated',sub:'00000000-0000-0000-0000-'+String(n).padStart(12,'0'),
  is_anonymous:anonymous,exp:Math.floor(Date.now()/1000)+expiresIn};
 const header=b64({alg:'HS256',typ:'JWT'}),body=b64(payload);
 const unsigned=header+'.'+body;
 return unsigned+'.'+crypto.createHmac('sha256',secretOverride).update(unsigned).digest('base64url');
}
let checks=0;
async function http(path,{jwt=null,data=null,method='POST'}={}){
 const response=await fetch(base+path,{
  method,headers:{...(data!==null?{'content-type':'application/json'}:{}),
   ...(jwt?{authorization:'Bearer '+jwt}:{})},
  body:data!==null?JSON.stringify(data):undefined,
  signal:AbortSignal.timeout(10000)
 });
 const raw=await response.text();
 let payload;try{payload=raw?JSON.parse(raw):null}catch{payload=raw}
 return {status:response.status,payload};
}
async function pass(label,path,{jwt=null,data={}}={},expect=200){
 const r=await http(path,{jwt,data});
 assert.equal(r.status,expect,label+' should return '+expect+': '+JSON.stringify(r.payload).slice(0,300));
 checks++;console.log('PASS '+label+' HTTP '+r.status);return r.payload;
}
async function denied(label,path,{jwt=null,data={},method='POST',allow=[400,401,403,404]}={}){
 const r=await http(path,{jwt,data,method});
 assert.ok(allow.includes(r.status),label+' expected denial, got HTTP '+r.status+
  ': '+JSON.stringify(r.payload).slice(0,300));
 checks++;console.log('PASS '+label+' denied HTTP '+r.status);
}
(async()=>{
 const alice=token(1),bob=token(2),stranger=token(3);
 // This invalid signature catches an HTTP gateway that trusts forged role claims.
 await denied('forged signing key rejected','/rpc/dd_chat_my_pairs',
   {jwt:token(1,{secretOverride:'not-the-disposable-signing-key-that-was-configured'}),allow:[401,403]});
 await denied('expired JWT rejected','/rpc/dd_chat_my_pairs',
   {jwt:token(1,{expiresIn:-60}),allow:[401,403]});
 await denied('guest cannot enumerate private chats','/rpc/dd_chat_my_pairs',
   {allow:[401,403,404]});
 await denied('guest cannot send chat invitations','/rpc/dd_chat_request',
   {data:{p_username:'Researcher02',p_preview:'Guest attempts an invite'},
    allow:[401,403,404]});
 assert.deepEqual(await pass('authenticated Alice initially has no chats',
  '/rpc/dd_chat_my_pairs',{jwt:alice}),[]);
 const pairId=await pass('Alice sends one consent-first invite',
  '/rpc/dd_chat_request',{jwt:alice,
   data:{p_username:'Researcher02',p_preview:'Synthetic introduction from Alice only'}});
 assert.match(pairId,/^[a-f0-9-]{36}$/i,'Returned invite ID');
 const pending=await pass('Bob sees one pending incoming invitation',
  '/rpc/dd_chat_my_pairs',{jwt:bob});
 assert.equal(pending.length,1);assert.equal(pending[0].pair_id,pairId);
 assert.equal(pending[0].status,'pending');
 assert.equal(pending[0].direction,'received');
 assert.equal(pending[0].initial_preview,'Synthetic introduction from Alice only');
 assert.deepEqual(await pass('Uninvolved Charlie has no private requests',
  '/rpc/dd_chat_my_pairs',{jwt:stranger}),[]);
 await denied('Uninvolved Charlie cannot read invitation messages',
  '/rpc/dd_chat_history',{jwt:stranger,data:{p_pair_id:pairId,p_limit:10}});
 assert.equal(await pass('Sender cannot self-accept',
  '/rpc/dd_chat_respond',{jwt:alice,data:{p_pair_id:pairId,p_accept:true}}),false);
 await denied('No messages allowed while pending','/rpc/dd_chat_send_message',
  {jwt:alice,data:{p_pair_id:pairId,p_body:'Not yet accepted'}});
 assert.equal(await pass('Recipient accepts invitation',
  '/rpc/dd_chat_respond',{jwt:bob,data:{p_pair_id:pairId,p_accept:true}}),true);
 const history=await pass('Accepted history contains one stored introduction',
  '/rpc/dd_chat_history',{jwt:bob,data:{p_pair_id:pairId,p_limit:10}});
 assert.equal(history.length,1);
 assert.equal(history[0].body,'Synthetic introduction from Alice only');
 assert.equal(history[0].mine,false,'Bob did not author introduction');
 await pass('Bob can reply after accepting','/rpc/dd_chat_send_message',
  {jwt:bob,data:{p_pair_id:pairId,p_body:'Synthetic reply from Bob'}});
 const aliceHistory=await pass('Alice sees two accepted messages',
  '/rpc/dd_chat_history',{jwt:alice,data:{p_pair_id:pairId,p_limit:10}});
 assert.equal(aliceHistory.length,2);
 assert.ok(aliceHistory.some(x=>x.body==='Synthetic reply from Bob'));
 await denied('Uninvolved Charlie cannot read accepted history',
  '/rpc/dd_chat_history',{jwt:stranger,data:{p_pair_id:pairId,p_limit:10}});
 await denied('Uninvolved Charlie cannot send',
  '/rpc/dd_chat_send_message',{jwt:stranger,
   data:{p_pair_id:pairId,p_body:'Attacker must not enter the conversation'}});
 await denied('Web client cannot read raw private-message table',
  '/dd_chat_messages?select=body',{jwt:stranger,method:'GET',data:null,
   allow:[401,403,404]});
 await denied('Signed-in anonymous account cannot request conversations',
  '/rpc/dd_chat_request',{jwt:token(4,{anonymous:true}),
   data:{p_username:'Researcher02',p_preview:'Anonymous account must be rejected'}});
 assert.equal(await pass('Alice blocks Bob','/rpc/dd_chat_block',
  {jwt:alice,data:{p_pair_id:pairId}}),true);
 await denied('Bob cannot fetch history after block','/rpc/dd_chat_history',
  {jwt:bob,data:{p_pair_id:pairId,p_limit:10}});
 await denied('Bob cannot send after block','/rpc/dd_chat_send_message',
  {jwt:bob,data:{p_pair_id:pairId,p_body:'Blocked message'}});
 console.log('PASS '+checks+' disposable signed-JWT HTTP checks (no live backend)');
})().catch(e=>{console.error('FAIL isolated JWT HTTP acceptance:',e.message);process.exitCode=1});
