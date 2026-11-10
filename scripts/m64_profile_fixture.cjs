'use strict';
// Isolated synthetic profile; external scripts and real accounts are absent.
const fs=require('node:fs');
function buildFixture(){
 const html=fs.readFileSync('index.html','utf8');
 const start=html.indexOf('<section id="profilePage"'),end=html.indexOf('<div class="dd-sources-direct"',start);
 if(start<0||end<start)throw Error('Profile markup missing');
 const styles=[...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(x=>x[0]).join('\n');
 const profile=html.slice(start,end).replace('id="profilePage" class="hidden"','id="profilePage"');
 return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Disclosure Desk profile QA — fictional account</title>'+styles+'<link rel="stylesheet" href="/assets/community-polish.css"></head><body><main style="max-width:1100px;margin:auto">'+profile+'</main><script>('+mockBackend.toString()+')();</script><script src="/assets/research-hub.js"></script></body></html>';
}
function mockBackend(){
 let user={id:'11111111-1111-4111-8111-111111111111',email:'researcher@example.invalid',email_confirmed_at:'2026-11-10',user_metadata:{dd_requested_username:'Researcher'}},counts={post_likes:2,post_dislikes:1,comment_likes:3,comment_dislikes:4},failure=false;
 const listeners=[];window.__m64={setCounts(value){counts=value},setFailure(value){failure=value},switchAccount(){user={...user,id:'22222222-2222-4222-8222-222222222222',email:'second@example.invalid'};counts={post_likes:0,post_dislikes:0,comment_likes:0,comment_dislikes:0};listeners.forEach(fn=>fn('SIGNED_IN',{user}))}};
 const db={auth:{getUser:async()=>({data:{user}}),onAuthStateChange:fn=>listeners.push(fn)},
 from(){const q={select(){return q},order(){return q},limit(){return q},eq(){return q},maybeSingle(){return q},then(fn){return Promise.resolve({data:[],count:0}).then(fn)}};return q},
 rpc:async name=>name==='dd_profile_received_reactions'?{data:[counts],error:failure?{code:'PGRST202'}:null}:{data:[]}};
 window.DD_COMMUNITY_TEST_CONFIG={environment:'test',url:'https://mock.invalid',publishableKey:'fictional'};
 window.supabase={createClient:()=>db};
}
module.exports={buildFixture};
