'use strict';
// No network, no live users or records. Execute actual owner-only moderation JS
// with fabricated account changes and deliberately delayed RPC responses.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/discussions-admin.js','utf8');
function element(tag='div'){
 return {tag,children:[],textContent:'',className:'',style:{},hidden:false,
  disabled:false,open:false,value:'',listeners:{},
  append(...nodes){this.children.push(...nodes)},
  replaceChildren(...nodes){this.children=[...nodes]},
  before(){},setAttribute(k,v){this[k]=v},
  addEventListener(k,fn){this.listeners[k]=fn}
 };
}
function deferred(){
 let resolve,reject;const promise=new Promise((done,fail)=>{resolve=done;reject=fail});
 return {promise,resolve,reject};
}
const names=['ddAdminDiscussions','ddAdminForumStatus','ddAdminForumQueue',
 'ddAdminForumSections','ddAdminForumRefresh'];
const nodes=Object.fromEntries(names.map(n=>[n,element()]));
let user='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',changeListener=null;
const pending=deferred();let queueCalls=0;
const oldRow={section_title:'Owner A confidential moderation',target_kind:'thread',
 target_id:'a',review_state:'pending',content_preview:'Owner A hidden report'};
const newRow={section_title:'Owner B review',target_kind:'thread',
 target_id:'b',review_state:'completed',decision:'removed',
 flag_count:2,content_preview:'Owner B synthetic report'};
const client={
 auth:{
  getUser:async()=>({data:{user:user?{id:user,is_anonymous:false}:null},error:null}),
  onAuthStateChange(callback){changeListener=callback;
   return {data:{subscription:{unsubscribe(){}}}}}
 },
 rpc:async(name)=>{
  if(name==='dd_discussions_owner_review_items'){
   queueCalls++;return queueCalls===1?pending.promise:{data:[newRow],error:null};
  }
  if(name==='dd_discussions_owner_sections')return {data:[],error:null};
  throw Error('Unexpected mock RPC '+name);
 }
};
const context={
 window:{DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://example.invalid',publishableKey:'qa'},
  DD_COMMUNITY_FEATURES:{discussions:true},supabase:{createClient:()=>client}},
 document:{readyState:'complete',getElementById:k=>nodes[k]||null,
  createElement:element},Date,Promise,console,
 confirm(){throw Error('Unexpected confirmation')},
 prompt(){throw Error('Unexpected prompt')}
};
function flatten(root){
 const out=[];function visit(n){
  if(!n||typeof n!=='object')return;
  if(typeof n.textContent==='string')out.push(n.textContent);
  for(const x of n.children||[])visit(x);
 }
 visit(root);return out.join('|');
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 vm.runInNewContext(source,context,{filename:'assets/discussions-admin.js'});
 assert.equal(typeof changeListener,'function','Must subscribe to auth changes');
 assert.equal(typeof nodes.ddAdminDiscussions.listeners.toggle,'function');
 const root=nodes.ddAdminDiscussions,queue=nodes.ddAdminForumQueue,sections=nodes.ddAdminForumSections;
 root.open=true;root.listeners.toggle();await tick();await tick();
 assert.equal(queueCalls,1,'First owner request queued');
 assert(!flatten(queue).includes(oldRow.section_title),'Pending query has not rendered anything');

 user=null;changeListener('SIGNED_OUT',null);
 assert.equal(root.open,false,'Owner accordion immediately closes on logout');
 assert.equal(flatten(queue),'','Old moderation results cleared immediately');
 pending.resolve({data:[oldRow],error:null});
 await tick();await tick();
 assert(!flatten(queue).includes('Owner A'),'Late private queue must not appear after signout');
 assert.equal(flatten(sections),'','Site-owner sections also remain clear');
 console.log('PASS ADMIN account switch drops delayed private review RPC and clears nested DOM');

 user='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';changeListener('SIGNED_IN',null);
 root.open=true;root.listeners.toggle();await tick();await tick();
 const content=flatten(queue);
 assert(content.includes('Owner B review'),'New account owner list is fresh');
 assert(content.includes('✓ Completed · Removed'),'Resolved report shows completed marker');
 assert(!content.includes('Owner A'),'Old account details never repainted');
 assert.equal(queueCalls,2,'New owner review loaded once');
 console.log('PASS ADMIN subsequent owner queue shows completed decisions without previous owner data');

 user=null;changeListener('SIGNED_OUT',null);
 assert.equal(flatten(queue),'','Logout wipes rendered owner review');
 assert.equal(flatten(sections),'','Logout wipes section stewardship');
 assert.equal(root.open,false,'Logout shuts owner accordion');
 console.log('PASS ADMIN signout removes owner queue and section privileges immediately');
})().catch(error=>{console.error('FAIL ADMIN ACCOUNT SWITCH:',error.stack||error);
 process.exitCode=1});
