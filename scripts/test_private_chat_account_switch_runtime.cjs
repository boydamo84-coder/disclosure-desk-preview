'use strict';
// Runtime QA for the EXISTING disabled-by-default private Chat frontend.
// Synthetic identity and fabricated messages only; NO Supabase/HTTP/Netlify calls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/profile-private-chat.js','utf8');
(async()=>{
function element(tag){
  return {tag,children:[],listeners:{},attrs:{},style:{},textContent:'',value:'',className:'',
    disabled:false,hidden:false,open:false,closest(kind){return kind==='details'?panel:null;},
    append(...items){this.children.push(...items);},
    replaceChildren(...items){this.children=[...items];},
    setAttribute(k,v){this.attrs[k]=v;},
    addEventListener(k,cb){this.listeners[k]=cb;}
  };
}
const panel=element('details');panel.open=true;
const host=element('div');
const document={readyState:'complete',visibilityState:'visible',
  getElementById(id){return id==='ddProfileChatPanel'?panel:id==='ddProfileChatApp'?host:null;},
  createElement:element,addEventListener(){}};
let current='A',authCallback,resolveAHistory;
const calls=[];
const pairs={
 A:[{pair_id:'pair-A',status:'accepted',direction:'received',other_username:'AlphaFriend',unread_count:2},
    {pair_id:'pending-A',status:'pending',direction:'sent',initial_preview:'A preview only',other_username:'WaitingFriend'}],
 B:[{pair_id:'pair-B',status:'accepted',direction:'received',other_username:'BravoFriend',unread_count:1}]
};
const api={auth:{
  getUser:async()=>({data:{user:current?{id:current,is_anonymous:false}:null},error:null}),
  onAuthStateChange:cb=>{authCallback=cb;return {data:{subscription:{unsubscribe(){}}}};}
},rpc:async(name,args)=>{
 calls.push({name,args,current});
 if(name==='dd_chat_my_pairs')return {data:current?pairs[current]:[],error:null};
 if(name==='dd_chat_history'){
  if(args.p_pair_id==='pair-A')return new Promise(resolve=>{resolveAHistory=resolve;});
  return {data:[{message_id:'b-message',body:'<script>safe as text</script>',mine:false}],error:null};
 }
 if(name==='dd_chat_mark_read')return {data:true,error:null};
 throw Error('Unexpected private RPC '+name);
}};
const window={DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://qa.invalid',publishableKey:'qa-key'},
 DD_COMMUNITY_FEATURES:{privateChat:true},supabase:{createClient:()=>api}};
if(useVm)vm.runInNewContext(source,{window,document,prompt:()=>null,confirm:()=>false},{timeout:1500});
else new Function('window','document','prompt','confirm',source)(window,document,()=>null,()=>false);
async function flush(){for(let i=0;i<30;i++)await Promise.resolve();}
function tree(n){return String(n?.textContent||'')+(n?.children||[]).map(tree).join(' ');}
function collect(n){return [n,...(n?.children||[]).flatMap(collect)];}
panel.listeners.toggle();await flush();
const side=host.children[2].children[0];
const accepted=side.children[1],received=side.children[3];
const conversation=host.children[2].children[1].children[0];
assert.equal(accepted.children[0].textContent.includes('AlphaFriend'),true,'A accepted chat loaded');
assert.equal(received.children[0].textContent.includes('WaitingFriend'),true,'A pending chat loaded');
received.children[0].onclick();await flush();
assert.match(tree(conversation),/A preview only/,'Pending request preview exists');
assert.match(tree(conversation),/No further messages can be sent/,'Sender cannot post while pending');
assert.equal(collect(conversation).filter(n=>n.tag==='form').length,0,'No pending-message form');
accepted.children[0].onclick();await flush();
assert.equal(typeof resolveAHistory,'function','A history request is delayed to simulate account switch');
current='B';authCallback();await flush();
assert.match(tree(accepted),/BravoFriend/,'B accepted chat replaces A');
assert.doesNotMatch(tree(host),/AlphaFriend|WaitingFriend|A preview only/,'Account switch clears old private UI');
resolveAHistory({data:[{message_id:'a-message',body:'VERY_PRIVATE_ALPHA_HISTORY',mine:false}],error:null});
await flush();
assert.doesNotMatch(tree(host),/VERY_PRIVATE_ALPHA_HISTORY/,'Old in-flight A history must not reappear in account B');
accepted.children[0].onclick();await flush();
assert.match(tree(conversation),/<script>safe as text<\/script>/,'Message body is retained as text, not parsed HTML');
assert.equal(collect(conversation).some(n=>Object.prototype.hasOwnProperty.call(n,'innerHTML')),false,
 'Private content must not be assigned to innerHTML');
assert.equal(collect(conversation).some(n=>n.tag==='form'),true,'Accepted chat may compose only for current account');
assert.equal(calls.filter(c=>c.name==='dd_chat_mark_read').every(c=>c.args.p_pair_id==='pair-B'),true,
 'Stale account A must not mark messages read under B');
current=null;authCallback();await flush();
assert.equal(collect(conversation).length,1,'Sign-out clears private conversation DOM');
assert.match(tree(host),/Sign in to use one-to-one Chat/,'Guest is prompted to sign in');
assert.equal(calls.some(c=>c.name==='dd_chat_send_message'),false,'Synthetic test has no write');
})().then(()=>console.log('PASS: private Chat A-to-B stale history isolation, invitation gate, text-only rendering and guest signout')).catch(e=>{console.error(e);process.exitCode=1});
