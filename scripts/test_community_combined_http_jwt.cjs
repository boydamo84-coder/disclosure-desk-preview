'use strict';
// Combined consent-Chat + public Discussions isolation. Requires the same
// disposable PostgreSQL/PostgREST gateway used by the separate HTTP suites.
// Uses only fictional JWTs and 127.0.0.1; never contacts Supabase/Netlify.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const base=process.env.DD_HTTP_TEST_ORIGIN||'http://127.0.0.1:3000';
const u=new URL(base);
assert.equal(u.protocol,'http:');
assert.ok(['127.0.0.1','localhost'].includes(u.hostname),'Refuse nonlocal API');
assert.equal(u.port,'3000');
const secret=process.env.DD_CI_JWT_SECRET;
assert.ok(secret&&secret.length>=32,'Disposable JWT test secret required');
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
function jwt(n){
 const h=b64({alg:'HS256',typ:'JWT'});
 const p=b64({sub:'00000000-0000-0000-0000-'+String(n).padStart(12,'0'),
  role:'authenticated',is_anonymous:false,exp:Math.floor(Date.now()/1000)+300});
 const signed=h+'.'+p;
 return signed+'.'+crypto.createHmac('sha256',secret).update(signed).digest('base64url');
}
async function call(name,as,args={}){
 const r=await fetch(base+'/rpc/'+name,{method:'POST',
  headers:{'content-type':'application/json',...(as?{authorization:'Bearer '+jwt(as)}:{})},
  body:JSON.stringify(args),signal:AbortSignal.timeout(10000)});
 const txt=await r.text();let data;
 try{data=JSON.parse(txt)}catch{data=txt}
 return {status:r.status,data};
}
function ok(result,label){assert.equal(result.status,200,label+': '+JSON.stringify(result.data).slice(0,200));return result.data}
function refused(result,label){
 assert.ok([400,401,403,404].includes(result.status),label+': unexpectedly '+result.status);
 assert.notEqual(result.data?.code,'PGRST102','Invalid body is not permission denial');
}
(async()=>{
 const alice=1,bob=2,owner=3;
 const aPairs=ok(await call('dd_chat_my_pairs',alice),'Alice private list');
 assert.equal(aPairs.length,1,'Chat fixture has one accepted, blocked pair');
 const pairId=aPairs[0].pair_id;
 assert.match(pairId,/^[a-f0-9-]{36}$/i);
 assert.equal(aPairs[0].contact_unavailable,true,'Blocked pair is visibly unavailable');
 const forumOwnerPairs=ok(await call('dd_chat_my_pairs',owner),'Forum admin private list');
 assert.deepEqual(forumOwnerPairs,[],'Forum owner has no blanket private chat access');
 refused(await call('dd_chat_history',owner,{p_pair_id:pairId,p_limit:50}),
  'Forum admin must not read a private conversation');
 refused(await call('dd_chat_history',null,{p_pair_id:pairId,p_limit:50}),
  'Public guest must not read a private conversation');
 refused(await call('dd_chat_report_queue',owner,{p_limit:30}),
  'Forum owner must NOT inherit private chat report-queue privileges');
 console.log('PASS 1/4 — public Discussions administration cannot open private Chat or moderation reports.');
 const sections=ok(await call('dd_discussions_sections',null,{p_limit:100}),
  'Guest public forum list');
 assert.equal(sections.length,1,'Forum fixture created one public section');
 assert.ok(!JSON.stringify(sections).includes('Synthetic introduction from Alice'),
  'Public forum projections must never include private-chat messages');
 const forumThreads=ok(await call('dd_discussions_threads',null,{
  p_section_id:sections[0].id,p_limit:100,p_sort:'recent'}),'Guest forum topics');
 assert.equal(forumThreads.length,1,'Forum fixture restored one topic');
 assert.ok(!JSON.stringify(forumThreads).includes('Synthetic reply from Bob'),
  'Forum topic feed must not leak private-chat history');
 console.log('PASS 2/4 — guest public forum remains available with private chat installed.');
 const bPairs=ok(await call('dd_chat_my_pairs',bob),'Bob private list');
 assert.equal(bPairs.length,1);
 assert.equal(bPairs[0].pair_id,pairId,'Both owners see same pair through their own RPC');
 const bForum=ok(await call('dd_discussions_sections',bob,{p_limit:100}),
  'Bob public forum list');
 assert.equal(bForum.length,1);
 assert.equal(bForum[0].is_steward,false,'Chat participation never grants public section stewardship');
 const forumOwnerSections=ok(await call('dd_discussions_owner_sections',owner,{p_limit:30}),
  'Actual forum owner administration');
 assert.ok(Array.isArray(forumOwnerSections),'Forum owner can administer sections independently');
 console.log('PASS 3/4 — private Chat membership and public Forum stewardship remain separate.');
 const guestPairs=await call('dd_chat_my_pairs',null);
 refused(guestPairs,'Anonymous public viewer cannot enumerate private messages');
 const forumMemberChatQueue=await call('dd_chat_report_queue',bob,{p_limit:30});
 refused(forumMemberChatQueue,'Forum member cannot read private Chat reports');
 console.log('PASS 4/4 — guests and forum members denied private conversation/abuse queues.');
 console.log('PASS COMBINED: 4/4 cross-feature HTTP security acceptance cases. No live data.');
})().catch(err=>{console.error('FAIL combined Chat/Discussions:',err.stack||err);process.exitCode=1});
