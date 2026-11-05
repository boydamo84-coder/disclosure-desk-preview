'use strict';
// Real signed HTTP/JWT requests against disposable GitHub-only PostgREST and PostgreSQL.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=process.env.DD_HTTP_TEST_ORIGIN||'http://127.0.0.1:3000';
const url=new URL(base);assert.equal(url.protocol,'http:');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname));assert.equal(url.port,'3000');
const secret=process.env.DD_CI_JWT_SECRET;assert.ok(secret?.length>=32);
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const jwt=(n,{anonymous=false,expired=false,sign=secret}={})=>{
 const raw=b64({alg:'HS256',typ:'JWT'})+'.'+b64({
  role:'authenticated',sub:'00000000-0000-0000-0000-'+String(n).padStart(12,'0'),
  is_anonymous:anonymous,exp:Math.floor(Date.now()/1000)+(expired?-60:300)
 });
 return raw+'.'+crypto.createHmac('sha256',sign).update(raw).digest('base64url');
};
let checks=0;
async function request(path,{as=null,data={},method='POST'}={}){
 const res=await fetch(base+path,{method,
 headers:{...(data!==null?{'content-type':'application/json'}:{}),
  ...(as?{authorization:'Bearer '+as}:{})},
 body:data===null?undefined:JSON.stringify(data),
 signal:AbortSignal.timeout(10000)});
 const raw=await res.text();let payload;
 try{payload=raw?JSON.parse(raw):null}catch{payload=raw}
 return {status:res.status,payload};
}
async function ok(label,path,opts={}){
 const r=await request(path,opts);
 assert.equal(r.status,200,label+' expected HTTP 200: '+JSON.stringify(r.payload).slice(0,260));
 checks++;console.log('PASS '+label+' HTTP 200');
 return r.payload;
}
async function denied(label,path,opts={}){
 const r=await request(path,opts);
 assert.ok([400,401,403,404].includes(r.status),label+' unexpectedly HTTP '+r.status+
  ' '+JSON.stringify(r.payload).slice(0,260));
 // A transport/JSON syntax error is not proof of an auth restriction.
 assert.notEqual(r.payload?.code,'PGRST102','Malformed input is not an ACL denial');
 checks++;console.log('PASS '+label+' rejected '+r.status);
}
(async()=>{
 const A=jwt(1),B=jwt(2),owner=jwt(3),guest=null;
 await denied('forged JWT cannot author a topic','/rpc/dd_discussions_create_section',
  {as:jwt(1,{sign:'incorrect-signed-test-key'}),data:{p_title:'Fraudulent Section',p_description:'',p_topic:'UAP'}});
 await denied('expired JWT cannot create section','/rpc/dd_discussions_create_section',
  {as:jwt(1,{expired:true}),data:{p_title:'Expired Section',p_description:'',p_topic:'UAP'}});
 assert.deepEqual(await ok('guest may read initially empty sections','/rpc/dd_discussions_sections',
  {as:guest,data:{p_limit:50}}),[]);
 await denied('guest cannot create section','/rpc/dd_discussions_create_section',
  {as:guest,data:{p_title:'Guest Section',p_description:'',p_topic:'UAP'}});
 await denied('signed-in anonymous cannot create section','/rpc/dd_discussions_create_section',
  {as:jwt(4,{anonymous:true}),data:{p_title:'Anonymous Section',p_description:'',p_topic:'UAP'}});
 const sid=await ok('A creates a public section','/rpc/dd_discussions_create_section',
  {as:A,data:{p_title:'Fictional Research Sources',p_description:'Source verification practice',p_topic:'UAP'}});
 assert.match(sid,/^[0-9a-f-]{36}$/i);
 const sections=await ok('guest may read public section','/rpc/dd_discussions_sections',
  {as:guest,data:{p_limit:100}});
 assert.equal(sections.length,1);assert.equal(sections[0].is_steward,false,
  'Guest must not gain steward ability');
 const steward=await ok('A can see own stewardship','/rpc/dd_discussions_sections',
  {as:A,data:{p_limit:100}});
 assert.equal(steward[0].is_steward,true);
 const Bsections=await ok('B cannot inherit A stewardship','/rpc/dd_discussions_sections',
  {as:B,data:{p_limit:100}});
 assert.equal(Bsections[0].is_steward,false);
 const tid=await ok('B publishes topic without steward preapproval',
  '/rpc/dd_discussions_create_thread',{as:B,data:{
   p_section_id:sid,p_title:'Evidence provenance check',p_body:'A synthetic public discussion',
   p_url:'https://example.org/source'}});
 assert.match(tid,/^[0-9a-f-]{36}$/i);
 const rid=await ok('B publishes an open reply','/rpc/dd_discussions_reply',
  {as:B,data:{p_thread_id:tid,p_body:'A synthetic follow-up note',p_parent_id:null}});
 assert.match(rid,/^[0-9a-f-]{36}$/i);
 const threads=await ok('guest sees published topic','/rpc/dd_discussions_threads',
  {as:guest,data:{p_section_id:sid,p_limit:100,p_sort:'recent'}});
 assert.equal(threads.length,1);
 assert.equal(threads[0].title,'Evidence provenance check');
 assert.equal(threads[0].is_mine,false,'Guest never owns a thread');
 const replies=await ok('guest sees published replies','/rpc/dd_discussions_replies',
  {as:guest,data:{p_thread_id:tid,p_limit:100}});
 assert.equal(replies.length,1);
 await denied('guest cannot vote','/rpc/dd_discussions_vote',
  {as:guest,data:{p_kind:'thread',p_id:tid,p_value:1}});
 assert.equal(await ok('A can vote','/rpc/dd_discussions_vote',
  {as:A,data:{p_kind:'thread',p_id:tid,p_value:1}}),true);
 await denied('ordinary author B cannot pin as steward','/rpc/dd_discussions_pin',
  {as:B,data:{p_thread_id:tid,p_pinned:true}});
 assert.equal(await ok('actual steward A can pin','/rpc/dd_discussions_pin',
  {as:A,data:{p_thread_id:tid,p_pinned:true}}),true);
 await denied('B cannot open site-owner moderation','/rpc/dd_discussions_owner_queue',
  {as:B,data:{p_limit:50}});
 await denied('B cannot edit A section as steward','/rpc/dd_discussions_update_section',
  {as:B,data:{p_section_id:sid,p_description:'Improper takeover',p_topic:'UAP'}});
 await denied('guest cannot read raw forum table','/dd_forum_threads?select=title',
  {as:guest,data:null,method:'GET'});
 await denied('B cannot read raw forum table','/dd_forum_threads?select=title',
  {as:B,data:null,method:'GET'});
 await denied('thread author B cannot flag own topic','/rpc/dd_discussions_flag',
  {as:B,data:{p_kind:'thread',p_id:tid,p_reason:'spam'}});
 for(let n=4;n<=7;n++){
  assert.equal(await ok('report '+(n-3)+' independent reporter','/rpc/dd_discussions_flag',
   {as:jwt(n),data:{p_kind:'thread',p_id:tid,p_reason:'spam'}}),true);
 }
 assert.equal((await ok('four reports keep topic public','/rpc/dd_discussions_threads',
  {as:guest,data:{p_section_id:sid,p_limit:100,p_sort:'recent'}})).length,1);
 assert.equal(await ok('fifth unique report triggers temporary hide','/rpc/dd_discussions_flag',
  {as:jwt(8),data:{p_kind:'thread',p_id:tid,p_reason:'spam'}}),true);
 assert.equal((await ok('guest no longer sees hidden topic','/rpc/dd_discussions_threads',
  {as:guest,data:{p_section_id:sid,p_limit:100,p_sort:'recent'}})).length,0);
 const queue=await ok('overall owner reviews hidden topic only','/rpc/dd_discussions_owner_queue',
  {as:owner,data:{p_limit:50}});
 assert.equal(queue.length,1);assert.equal(queue[0].target_id,tid);
 assert.equal(queue[0].flag_count,5);
 await denied('B cannot restore hidden topic','/rpc/dd_discussions_owner_review',
  {as:B,data:{p_kind:'thread',p_id:tid,p_status:'published',p_reason:'Unauthorised restore'}});
 assert.equal(await ok('site owner restores after review','/rpc/dd_discussions_owner_review',
  {as:owner,data:{p_kind:'thread',p_id:tid,p_status:'published',p_reason:'Reviewed fictional content'}}),true);
 assert.equal((await ok('restored topic again public','/rpc/dd_discussions_threads',
  {as:guest,data:{p_section_id:sid,p_limit:100,p_sort:'recent'}})).length,1);
 console.log('PASS '+checks+' signed HTTP forum checks on disposable PostgreSQL, no live site');
})().catch(err=>{console.error('FAIL isolated forum HTTP:',err.message);process.exitCode=1});
