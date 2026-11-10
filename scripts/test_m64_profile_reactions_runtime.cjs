'use strict';
// Fictional accounts only. Execute the actual Hub controller with a tiny DOM.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map();
function element(){return {textContent:'',hidden:false,value:'',classList:{contains:()=>false},replaceChildren(){},append(){},setAttribute(){},addEventListener(){}}}
const node=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
let actor={id:'fictional-a',email:'a@example.invalid',user_metadata:{}},reply={post_likes:'2',post_dislikes:1,comment_likes:3,comment_dislikes:'4'},error=null,authChanged,pending=null;
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
const db={auth:{getUser:async()=>({data:{user:actor}}),onAuthStateChange:fn=>{authChanged=fn}},
 from(){const chain={select(){return chain},order(){return chain},limit(){return chain},eq(){return chain},maybeSingle(){return chain},then(fn){return Promise.resolve({data:[],count:0}).then(fn)}};return chain},
 rpc:async name=>name==='dd_profile_received_reactions'?(pending?pending.promise:{data:[reply],error}):{data:[]}};
const window={DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://mock.invalid',publishableKey:'fictional'},supabase:{createClient:()=>db},addEventListener(){}};
const callbacks=[];
const ctx={window,document:{getElementById:node,readyState:'loading',hidden:false,createElement:element,querySelectorAll:()=>[],addEventListener(){}},setInterval(){},setTimeout:fn=>callbacks.push(fn),console,Date};
vm.createContext(ctx);
const src=fs.readFileSync('assets/research-hub.js','utf8').replace('Object.freeze({refresh})','Object.freeze({refresh,displayReactions,refreshReactions,init})');
vm.runInContext(src,ctx);const hub=window.DDResearchHub;
(async()=>{
 await hub.refresh();assert.equal(node('ddProfileLikesReceived').textContent,'5');assert.equal(node('ddProfileDislikesReceived').textContent,'5');
 // Active vote switched or undone: fresh server result replaces the total.
 reply={post_likes:1,post_dislikes:2,comment_likes:2,comment_dislikes:0};await hub.refresh();
 assert.equal(node('ddProfileLikesReceived').textContent,'3');assert.equal(node('ddProfileDislikesReceived').textContent,'2');
 for(const value of [null,undefined,'',true,false,-1,1.2,'1e3',Number.MAX_SAFE_INTEGER+1]){
  assert.equal(hub.displayReactions([{...reply,post_likes:value}]),false);assert.equal(node('ddProfileLikesReceived').textContent,'—');
 }
 assert.equal(hub.displayReactions([{...reply,post_likes:Number.MAX_SAFE_INTEGER,comment_likes:1}]),false,'Unsafe sum cannot be rendered');
 assert.equal(hub.displayReactions([{post_likes:'0',post_dislikes:0,comment_likes:0,comment_dislikes:'0'}]),true);
 assert.equal(node('ddProfileLikesReceived').textContent,'0','Actual zero is valid');
 error={code:'PGRST202'};await hub.refresh();assert.equal(node('ddProfileLikesReceived').textContent,'—','Missing migration cannot show a fabricated zero');error=null;
 pending=deferred();const old=hub.refresh();await new Promise(setImmediate);
 const oldPending=pending;pending=null;actor={id:'fictional-b',user_metadata:{}};reply={post_likes:0,post_dislikes:0,comment_likes:0,comment_dislikes:0};await hub.refresh();
 oldPending.resolve({data:[{post_likes:99,post_dislikes:99,comment_likes:0,comment_dislikes:0}]});await old;
 assert.equal(node('ddProfileLikesReceived').textContent,'0','Late account A result cannot overwrite B');
 hub.init();await new Promise(setImmediate);
 node('profilePage').classList.contains=()=>true;
 authChanged('SIGNED_OUT',null);assert.equal(node('ddProfileLikesReceived').textContent,'—','Even hidden profile clears on auth event');
 actor=null;node('profilePage').classList.contains=()=>false;await hub.refresh();
 assert.equal(node('ddProfilePrivate').hidden,true);assert.equal(node('ddProfileLikesReceived').textContent,'—');
 console.log('PASS M64 Hub runtime: sums, vote changes, real zero, malformed/unsafe counts, missing RPC, delayed account response and hidden-profile sign-out');
})().catch(e=>{console.error(e);process.exitCode=1});
