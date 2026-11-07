'use strict';
// Synthetic account-switch QA for private Chat. Never connects to Supabase.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('assets/profile-private-chat.js','utf8');
async function run(){
 let panel;
 function element(tag){
  return {tag,children:[],listeners:{},attributes:{},textContent:'',value:'',hidden:false,disabled:false,open:false,
   append(...x){this.children.push(...x)},replaceChildren(...x){this.children=[...x]},
   setAttribute(k,v){this.attributes[k]=v},addEventListener(k,f){this.listeners[k]=f},
   closest(which){return which==='details'?panel:null}};
 }
 panel=element('details');panel.open=true;
 const host=element('div');
 const document={readyState:'complete',visibilityState:'visible',
  createElement:element,addEventListener(){},
  getElementById(id){return id==='ddProfileChatPanel'?panel:id==='ddProfileChatApp'?host:null}};
 let current='A',authCallback,holdAuth=false,releaseAuth;
 const calls=[];
 const pairs={
  A:[{pair_id:'pair-A',status:'accepted',direction:'received',other_username:'Alpha',unread_count:0}],
  B:[{pair_id:'pair-B',status:'accepted',direction:'received',other_username:'Beta',unread_count:0}]
 };
 const api={auth:{
   getUser:()=>holdAuth?new Promise(resolve=>{releaseAuth=resolve}):
     Promise.resolve({data:{user:current?{id:current,is_anonymous:false}:null},error:null}),
   onAuthStateChange:fn=>{authCallback=fn;return {data:{subscription:{unsubscribe(){}}}}}
  },rpc:async(name,args)=>{
   calls.push({name,args,current});
   if(name==='dd_chat_my_pairs')return {data:pairs[current]||[],error:null};
   if(name==='dd_chat_history')return {data:[],error:null};
   if(name==='dd_chat_send_message')return {data:true,error:null};
   throw Error('Unexpected RPC: '+name);
  }};
 const window={DD_COMMUNITY_FEATURES:{privateChat:true},DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://invalid.test',publishableKey:'synthetic'},
  supabase:{createClient:()=>api}};
 new Function('window','document','prompt','confirm',source)(window,document,()=>null,()=>false);
 const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve()};
 const walk=(el)=>[el,...(el.children||[]).flatMap(walk)];
 const sendComposer=()=>walk(host).find(x=>x.tag==='form'&&
  walk(x).some(y=>y.tag==='button'&&y.textContent==='Send'));
 const choose=label=>{const btn=walk(host).find(x=>x.tag==='button'&&x.textContent.startsWith(label));
  assert.ok(btn,'Expected accepted conversation '+label);btn.onclick()};
 authCallback('SIGNED_IN',{user:{id:'A'}});await flush();
 choose('Alpha');await flush();
 let form=sendComposer();assert.ok(form,'A composer is present after acceptance');
 const input=walk(form).find(x=>x.tag==='textarea');
 input.value='A stale delayed message';
 holdAuth=true;
 form.onsubmit({preventDefault(){}});
 await flush();assert.equal(typeof releaseAuth,'function','A action is waiting on auth');
 // Switching accounts invalidates queued actions, not just the message display.
 holdAuth=false;current='B';authCallback('SIGNED_IN',{user:{id:'B'}});await flush();
 releaseAuth({data:{user:{id:'A',is_anonymous:false}},error:null});
 await flush();
 assert.equal(calls.filter(x=>x.name==='dd_chat_send_message').length,0,'A message must not be sent after switching to B');
 choose('Beta');await flush();
 form=sendComposer();assert.ok(form,'B can open their own accepted conversation');
 walk(form).find(x=>x.tag==='textarea').value='Fresh B message';
 form.onsubmit({preventDefault(){}});await flush();
 const sent=calls.filter(x=>x.name==='dd_chat_send_message');
 assert.equal(sent.length,1,'Stable B may send one message');
 assert.equal(sent[0].args.p_pair_id,'pair-B','B may not write to old A pair');
 assert.equal(sent[0].args.p_body,'Fresh B message');
 // Sign-out clears the private UI and invalidates any future delayed actions.
 current=null;authCallback('SIGNED_OUT',null);await flush();
 assert.equal(walk(host).some(x=>x.textContent==='A stale delayed message'),false);
}
if(require.main===module){
 run().then(()=>console.log('PASS: account switch cancels queued Chat send; stable conversation remains usable'))
 .catch(e=>{console.error(e);process.exitCode=1});
}
module.exports=run;
