'use strict';
// No network or real users. Exercise the actual public-profiles module.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('assets/public-profiles.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/Your username will be public and searchable for Chat by default/);
assert.match(fs.readFileSync('cloud-boards.js','utf8'),/dd_requested_username:requestedName/);
let current='UFO',listener=null;const writes=[];
const rows={
 UFO:null,
 HIDDEN:{display_name:'HiddenMember',is_public:false,chat_contact_opt_in:false},
 CHAT_OFF:{display_name:'ChatOffUser',is_public:true,chat_contact_opt_in:false}
};
const usernames={UFO:'UFO',HIDDEN:'HiddenMember',CHAT_OFF:'ChatOffUser',TAKEN:'UFO'};
function el(tag='div'){return {tag,children:[],style:{},dataset:{},textContent:'',value:'',checked:false,hidden:false,
 append(...x){this.children.push(...x)},setAttribute(k,v){this[k]=v},addEventListener(k,fn){this.listeners[k]=fn},
 listeners:{},querySelector(q){if(q==='.card-body')return this;if(q==='button[type="submit"]'){
  const find=e=>e.tag==='button'&&e.type==='submit'?e:(e.children||[]).map(find).find(Boolean);return find(this)}
  return null;}
};}
const root=el();root.id='ddProfileUsername';
const doc={readyState:'loading',listeners:{},createElement:el,
 getElementById:id=>id==='ddProfileUsername'?root:null,
 addEventListener(k,fn){this.listeners[k]=fn}};
const api={
 auth:{async getUser(){return {data:{user:{id:current,is_anonymous:false,user_metadata:{dd_requested_username:usernames[current]}}},error:null}},
       onAuthStateChange(fn){listener=fn}},
 from(table){assert.equal(table,'dd_public_names');let userId;
  return {select(){return this},eq(col,id){assert.equal(col,'user_id');userId=id;return this},
   async maybeSingle(){return {data:rows[userId]??null,error:null}},
   async upsert(data,opts){
    writes.push({data,opts});
    if(data.user_id==='TAKEN')return {error:{message:'duplicate key value violates unique constraint'}};
    if(!rows[data.user_id])rows[data.user_id]={...data};
    else if(!opts?.ignoreDuplicates)rows[data.user_id]={...data};
    return {error:null};
   }}}
};
const win={DD_COMMUNITY_TEST_CONFIG:{environment:'production',url:'https://fake.invalid',publishableKey:'fake'},
 DD_COMMUNITY_FEATURES:{privateChat:true},supabase:{createClient:()=>api}};
vm.runInNewContext(src,{window:win,document:doc,Date,console,Promise},{timeout:2000});
doc.listeners.DOMContentLoaded();
const host=root.children[0],form=host.children.find(x=>x.tag==='form');
const input=form.children.find(x=>x.id==='ddPublicProfileName');
const boxes=form.children.filter(x=>x.tag==='label').map(x=>x.children?.[0]).filter(x=>x?.type==='checkbox');
const [publicBox,chatBox]=boxes;
async function flush(){for(let i=0;i<65;i++)await Promise.resolve()}
(async()=>{
 await flush();
 assert.equal(rows.UFO.display_name,'UFO');
 assert.equal(rows.UFO.is_public,true);
 assert.equal(rows.UFO.chat_contact_opt_in,true);
 assert.equal(writes.length,1,'New signup automatically registers once');
 assert.equal(writes[0].opts.onConflict,'user_id');
 assert.equal(writes[0].opts.ignoreDuplicates,true,'Must not overwrite privacy preferences in a race');
 assert.equal(input.value,'UFO');assert.equal(publicBox.checked,true);assert.equal(chatBox.checked,true);
 listener();await flush();assert.equal(writes.length,1,'Repeat session events never rewrite existing profile');
 current='HIDDEN';listener();await flush();
 assert.equal(writes.length,1,'Saved hidden profile must never be republished');
 assert.equal(publicBox.checked,false);assert.equal(chatBox.checked,false);
 current='CHAT_OFF';listener();await flush();
 assert.equal(writes.length,1,'Saved chat-contact OFF must never be reset');
 assert.equal(publicBox.checked,true);assert.equal(chatBox.checked,false);
 current='TAKEN';listener();await flush();
 assert.equal(writes.length,2,'Missing name may attempt initial insert once');
 assert.equal(host.children.find(x=>x.tag==='form').children.find(x=>x.tag==='p').dataset.error,'yes');
 assert.equal(input.value,'UFO','Collision keeps chosen signup name editable');
 console.log('PASS real username module: first sign-in auto-public and contactable; repeat login, Hide, Chat off preserved; name collision shown');
})().catch(e=>{console.error(e);process.exitCode=1});
