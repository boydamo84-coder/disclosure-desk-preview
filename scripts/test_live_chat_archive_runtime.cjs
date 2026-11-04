'use strict';
// LIVE read-only transcript runtime: fake DOM, fake public RPC, no Supabase
// service, no hearing publication, no real chat or account credentials.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Element {
 constructor(tag){this.tag=tag;this.className='';this.children=[];this.dataset={};this.attrs={};this.textContent='';this.hidden=false;this.disabled=false;this.value='';this.listeners={};}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=items}
 setAttribute(key,value){this.attrs[key]=value}
 addEventListener(name,callback){this.listeners[name]=callback}
}
const document={createElement:tag=>new Element(tag),visibilityState:'visible',
 querySelector(){return null},getElementById(){return null}};
const earlier=Date.parse('2026-10-01T14:00:00Z');
const page=Array.from({length:60},(_,i)=>({
 id:'archived-message-'+i,
 body:'Synthetic approved message '+i,
 created_at:new Date(earlier-i*60000).toISOString(),is_mine:false
}));
let publicReads=0,oldReads=0,unsubscribe=0,removedChannel=0,postCalls=0;
const api={
 auth:{
  getUser:async()=>({data:{user:null},error:null}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe(){unsubscribe++}}}})
 },
 rpc:async(name,args)=>{
  assert.equal(name,'dd_public_hearing_chat','Only approved guest-read RPC');
  assert.equal(args.p_limit,60);
  publicReads++;
  if(args.p_event_id==='synthetic-ended-hearing'){
   if(args.p_before!==null){
    oldReads++;
    assert.equal(args.p_before,page[59].created_at);
    return {data:[{id:'archived-message-older',body:'Older approved fictional message',
      created_at:new Date(earlier-60*60000).toISOString(),is_mine:false}],error:null};
   }
   return {data:page,error:null};
  }
  if(args.p_event_id==='synthetic-live-hearing')
   return {data:[{id:'live-message',body:'Live approved fictional message',
    created_at:new Date(earlier).toISOString(),is_mine:false}],error:null};
  throw Error('Unexpected hearing requested');
 },
 from(){postCalls++;throw Error('Read-only guest UI must never post to database')},
 channel(){return {on(){return this},subscribe(){return this}}},
 removeChannel:async()=>{removedChannel++}
};
const window={supabase:{createClient:()=>api},
 DDPublicProfiles:{namesFor:async()=>({})},
 prompt(){throw Error('Guest cannot flag')},
 location:{assign(){throw Error('Do not navigate in test')}}};
const intervals=[];
vm.runInNewContext(fs.readFileSync('assets/live-chat.js','utf8'),
 {window,document,Date,Intl,console,
  setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length},
  clearInterval(){}},{timeout:3000});
function child(el,cls){
 const c=el.children.find(x=>x.className===cls);
 assert.ok(c,'Missing '+cls);return c;
}
function textTree(el){return String(el.textContent||'')+(el.children||[]).map(textTree).join('')}
async function flush(){for(let i=0;i<50;i++)await Promise.resolve()}
(async()=>{
 const archiveHost=new Element('div'),liveHost=new Element('div');
 const archiveDispose=window.ddLiveChatMount(archiveHost,{id:'synthetic-ended-hearing',status:'ended'});
 await flush();
 const archive=archiveHost.children[0],form=child(archive,'dd-live-chat-form'),
       sign=child(archive,'dd-live-chat-join'),list=child(archive,'dd-live-chat-messages'),
       older=child(archive,'outline');
 assert.equal(form.hidden,true,'Archived room must not permit posting');
 assert.equal(sign.hidden,true,'Archived room does not offer join/post');
 assert.equal(list.children.length,60,'All 60 approved fictional messages rendered');
 assert.equal(older.hidden,false,'Earlier saved chat is available');
 assert.match(textTree(list),/Synthetic approved message 59/);
 assert.doesNotMatch(textTree(list),/synthetic-ended-hearing|author_id|@example/,'Never leak account IDs');
 const liveDispose=window.ddLiveChatMount(liveHost,{id:'synthetic-live-hearing',status:'live'});
 await flush();
 assert.equal(intervals.some(x=>x.ms===15000),true,'LIVE room polls while active');
 assert.equal(child(liveHost.children[0],'dd-live-chat-form').hidden,true,'Guests cannot post LIVE');
 window.ddLiveChatClose(); // Schedule refresh closes LIVE room only.
 assert.equal(unsubscribe,1,'Only LIVE auth listener unsubscribed');
 assert.equal(removedChannel,1,'Only LIVE channel disconnected');
 assert.equal(list.children.length,60,'Saved archive transcript survived schedule refresh');
 await older.onclick();
 assert.equal(oldReads,1,'Archived pagination remains functional after LIVE cleanup');
 assert.equal(list.children.length,61,'Older approved message appended without losing original history');
 assert.match(textTree(list),/Older approved fictional message/);
 assert.equal(older.hidden,true,'Pagination completes when older page is short');
 assert.equal(postCalls,0,'No guest posts, votes or flags');
 archiveDispose();liveDispose();
 assert.equal(unsubscribe,2,'Archive cleans up only when its own view closes');
 assert.ok(publicReads>=3,'Archive and LIVE loaded through public safe RPC');
 console.log('PASS: guest archive read-only, saved chat survives LIVE cleanup, older replay pagination, no guest writes or account ID exposure');
})().catch(err=>{console.error(err);process.exitCode=1});
