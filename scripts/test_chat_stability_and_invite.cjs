'use strict';
// No external network, real accounts, messages or database writes. Test live UI logic with stubbed Supabase RPCs.
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/profile-private-chat.js','utf8');
async function run(){
 let panel,owner='sender-A',reply='success',rows=[],authCb,historyCalls=0;
 const requests=[];
 function el(tag){
  const obj={tag,children:[],listeners:{},attributes:{},dataset:{},style:{},className:'',
   textContent:'',value:'',hidden:false,disabled:false,open:false,scrollHeight:10,scrollTop:0,clientHeight:10,
   append(...items){this.children.push(...items)},replaceChildren(...items){this.children=[...items]},
   setAttribute(k,v){this.attributes[k]=v},addEventListener(k,f){this.listeners[k]=f},
   focus(){},closest(k){return k==='details'?panel:null},
   querySelector(sel){return walk(this).find(e=>sel.startsWith('.')&&e.className?.split(' ').includes(sel.slice(1)))||null},
   classList:{add(){},remove(){},contains(){return false}}};
  return obj;
 }
 const walk=e=>[e,...(e.children||[]).flatMap(walk)];
 const find=(root,fn)=>walk(root).find(fn);
 panel=el('details');panel.open=true;
 const host=el('div'),add=el('button'),inboxSearch=el('input');
 const ids={ddProfileChatPanel:panel,ddProfileChatApp:host,ddChatNew:add,ddChatInboxSearch:inboxSearch};
 const document={readyState:'complete',visibilityState:'visible',createElement:el,
  addEventListener(){},getElementById(id){return ids[id]||null}};
 const api={auth:{
  getUser:async()=>({data:{user:owner?{id:owner,is_anonymous:false}:null},error:null}),
  onAuthStateChange:f=>{authCb=f}
 },rpc:async(name,args)=>{
  if(name==='dd_chat_my_pairs')return {data:rows,error:null};
  if(name==='dd_chat_history'){historyCalls++;return {data:[],error:null}}
  if(name==='dd_chat_request'){
   requests.push({name,args});
   if(reply==='unavailable')return {data:null,error:{message:'Username unavailable'}};
   if(reply==='unconfirmed')return {data:null,error:null};
   rows=[{pair_id:'11111111-1111-4111-8111-111111111111',status:'pending',
    direction:'sent',other_username:args.p_username,initial_preview:args.p_preview,unread_count:0}];
   return {data:rows[0].pair_id,error:null};
  }
  throw Error('Unexpected RPC '+name);
 }};
 const win={DD_COMMUNITY_FEATURES:{privateChat:true},DD_COMMUNITY_TEST_CONFIG:{
  environment:'production',url:'https://invalid.example',publishableKey:'synthetic'},
  supabase:{createClient:()=>api},requestAnimationFrame:fn=>fn()};
 new Function('window','document','prompt','confirm',source)(win,document,()=>null,()=>false);
 const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve()};
 panel.listeners.toggle();await flush();
 function currentForm(){
  add.onclick();
  const form=find(host,e=>e.tag==='form'&&typeof e.onsubmit==='function');
  assert.ok(form,'new-chat request form mounted');
  const username=find(form,e=>e.tag==='input');
  const reveal=find(form,e=>e.tag==='button'&&e.textContent==='Request chat');
  const message=find(form,e=>e.tag==='textarea');
  const send=find(form,e=>e.tag==='button'&&e.textContent==='Send request');
  const feedback=find(form,e=>e.className?.includes('dd-chat-request-feedback'));
  assert.ok(username&&reveal&&message&&send&&feedback,'request controls and persistent feedback mounted');
  return {form,username,reveal,message,send,feedback};
 }
 async function attempt(target,text){
  const form=currentForm();
  form.username.value=target;form.reveal.onclick();form.message.value=text;
  form.form.onsubmit({preventDefault(){}});await flush();
  return form;
 }
 let c=await attempt('TheUnknown','Hello from a test account.');
 assert.equal(requests.length,1,'Send request must call authenticated RPC exactly once');
 assert.deepEqual(requests[0].args,{p_username:'TheUnknown',p_preview:'Hello from a test account.'});
 assert.equal(c.feedback.dataset.state,'success');
 assert.match(c.feedback.textContent,/Request sent/);
 assert.equal(c.send.disabled,false);
 assert.ok(find(host,e=>e.textContent==='TheUnknown'),'pending request appears');
 reply='unavailable';rows=[];
 c=await attempt('UFO','Hello from a test account.');
 assert.equal(requests.length,2);
 assert.equal(c.feedback.dataset.state,'error');
 assert.match(c.feedback.textContent,/save a public username/i,'unavailable member should give guidance');
 assert.equal(c.send.disabled,false);
 reply='unconfirmed';
 c=await attempt('UFO','Hello from a test account.');
 assert.equal(c.feedback.dataset.state,'error');
 assert.match(c.feedback.textContent,/not confirmed/i,'Do not falsely claim a server write succeeded');
 reply='success';
 c=await attempt('UFO','Hello from a test account.');
 assert.equal(c.feedback.dataset.state,'success');
 // Verify routine inbox refreshes don't rebuild the composer and dismiss keyboard while typing.
 rows=[{pair_id:'22222222-2222-4222-8222-222222222222',status:'accepted',
   direction:'received',other_username:'ResearchPal',unread_count:0,contact_unavailable:false}];
 await win.DDPrivateChat.refresh();
 const entry=find(host,e=>e.tag==='button'&&e.textContent==='ResearchPal');
 assert.ok(entry,'accepted row should appear in conversation list');
 entry.onclick();await flush();
 const oldComposer=find(host,e=>e.tag==='form'&&e.className==='dd-chat-compose');
 assert.ok(oldComposer,'accepted chat composer exists');
 const before=historyCalls;
 for(let i=0;i<8;i++)await win.DDPrivateChat.refresh();
 assert.strictEqual(find(host,e=>e.tag==='form'&&e.className==='dd-chat-compose'),oldComposer,
  'unchanged polls must preserve same input node and keyboard focus');
 assert.equal(historyCalls,before,'unchanged polling must not re-fetch and rebuild 100-message history');
 authCb('TOKEN_REFRESHED',{user:{id:owner}});await flush();
 assert.strictEqual(find(host,e=>e.tag==='form'&&e.className==='dd-chat-compose'),oldComposer,
  'token refresh must not close active conversation');
 // A real account switch must still discard owner state and the previous editor.
 owner='sender-B';rows=[];
 authCb('SIGNED_IN',{user:{id:owner}});await flush();
 assert.ok(!find(host,e=>e.tag==='form'&&e.className==='dd-chat-compose'),
  'account switching removes former account composer');
 console.log('PASS: Send request invokes RPC; explicit success and error, no fake success, stable 8 refreshes/token refresh, account switch clears.');
}
run().catch(e=>{console.error(e);process.exitCode=1});