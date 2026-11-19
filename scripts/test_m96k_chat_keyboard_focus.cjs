'use strict';
/* M96K: in-memory Chat and Samsung keyboard event regression (no network). */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('assets/profile-private-chat.js','utf8');
(async()=>{
 let panel,host,page,history,activeElement=null,selected='',events={},viewportEvents={},queue=[];
 function traverse(x){return [x,...(x?.children||[]).flatMap(traverse)]}
 function element(tag){
  const node={tag,children:[],parentElement:null,className:'',attrs:{},listeners:{},
   style:{values:{},setProperty(name,value){this.values[name]=value}},dataset:{},
   textContent:'',value:'',open:false,hidden:false,disabled:false,
   scrollTop:0,scrollHeight:0,clientHeight:150,isConnected:true,
   append(...elements){for(const e of elements){if(typeof e==='object'&&e)e.parentElement=this;this.children.push(e)}},
   replaceChildren(...elements){this.children=[];this.append(...elements)},
   setAttribute(name,value){this.attrs[name]=value},
   addEventListener(name,cb){this.listeners[name]=cb},
   closest(sel){
    if(sel==='details')return panel;
    if(sel.startsWith('.')){
      const cls=sel.slice(1);let cur=this;
      while(cur){if(cur.className?.split(' ').includes(cls))return cur;cur=cur.parentElement}
    }return null;
   },
   querySelector(sel){return traverse(this).find(e=>e!==this&&e.className?.split(' ').includes(sel.slice(1)))||null},
   querySelectorAll(sel){return []},
   classList:{
    add(c){node.className=(node.className||'')+' '+c},
    remove(c){node.className=(node.className||'').replace(new RegExp('\\b'+c+'\\b','g'),'')},
    contains(c){return node.className.split(' ').includes(c)}
   }};
  return node;
 }
 panel=element('details');panel.open=true;
 host=element('div');page=element('section');
 page.style={values:{},setProperty(name,value){this.values[name]=value}};
 const nav=element('nav');nav.className='nav';
 nav.getBoundingClientRect=()=>({height:72});
 const document={readyState:'complete',visibilityState:'visible',listeners:{},
  get activeElement(){return activeElement},
  getElementById(id){return ({ddProfileChatPanel:panel,ddProfileChatApp:host,chatPage:page})[id]||null},
  createElement:element,querySelector(selector){return selector==='nav.nav'?nav:null},
  addEventListener(name,cb){events[name]=cb}};
 const user={id:'owner-account'};
 const accepted={pair_id:'11111111-1111-4111-8111-111111111111',status:'accepted',
  direction:'received',other_username:'Fellow researcher',contact_unavailable:false,unread_count:0};
 const api={auth:{
  getUser:async()=>({data:{user:{...user,is_anonymous:false}},error:null}),
  onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}
 },rpc:async(name)=>{
  if(name==='dd_chat_my_pairs')return {data:[accepted],error:null};
  if(name==='dd_chat_history')return {data:[{body:'Most recent reply',mine:false,message_id:'42',sent_at:'2026-11-19T01:10:00Z'},
   {body:'Older message',mine:true,message_id:'41',sent_at:'2026-11-19T01:09:00Z'}],error:null};
  throw Error('Unexpected RPC '+name)
 }};
 const win={
  DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://invalid.test',publishableKey:'synthetic'},
  DD_COMMUNITY_FEATURES:{privateChat:true},
  supabase:{createClient:()=>api},
  innerHeight:920,
  visualViewport:{height:820,offsetTop:0,addEventListener(name,cb){viewportEvents[name]=cb}},
  setInterval(){},setTimeout(cb){queue.push(cb);return queue.length},
  requestAnimationFrame(cb){cb();return 1},
  addEventListener(name,cb){events['window:'+name]=cb}
 };
 vm.runInNewContext(code,{window:win,document,prompt:()=>null,confirm:()=>false},{timeout:1800});
 const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve()};
 panel.listeners.toggle();await flush();
 const choice=traverse(host).find(x=>x.tag==='button'&&x.textContent==='Fellow researcher');
 assert(choice,'accepted chat must exist');
 choice.onclick();await flush();
 history=traverse(host).find(x=>x.className==='dd-chat-history');
 const body=traverse(host).find(x=>x.tag==='textarea'&&x.attrs['aria-label']==='Write a private message');
 assert(history&&body,'history and composer must exist');
 assert.equal(page.classList.contains('dd-chat-is-conversation'),true);
 history.scrollTop=300;history.scrollHeight=1500;history.clientHeight=260;
 // Simulate Gboard reducing visualViewport height before focusin.
 win.visualViewport.height=580;
 activeElement=body;
 assert.equal(typeof events.focusin,'function');
 events.focusin({target:body});
 for(const cb of queue.splice(0))cb();
 assert.equal(history.scrollTop,1500,'focus must move history to newest message');
 assert.equal(page.style.values['--dd-chat-bottom-space'],'0px','keyboard opening should use visual area');
 history.scrollTop=250;history.scrollHeight=1600;
 win.visualViewport.height=480;viewportEvents.resize();
 assert.equal(history.scrollTop,1600,'viewport contraction must keep newest bubbles visible');
 // Do not force-scroll a member reading old history with the keyboard dismissed.
 activeElement=null;history.scrollTop=140;
 win.visualViewport.height=820;viewportEvents.resize();
 assert.equal(history.scrollTop,140,'normal viewport resize must preserve reading position');
 assert.equal(nav.className,'nav','premium navigation must be unchanged');
 assert.equal(page.style.values['--dd-chat-bottom-space'],'76px','closed keyboard leaves room for dock');
 console.log('PASS M96K: keyboard focus and resize reveal latest chat, older-history reading preserved and premium nav unchanged');
})().catch(e=>{console.error('M96K FAIL:',e.stack||e);process.exitCode=1});
