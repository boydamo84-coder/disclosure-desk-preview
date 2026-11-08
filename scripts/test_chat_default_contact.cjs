'use strict';
// Fake identity/DOM test; no real Supabase connection or account changes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('assets/public-profiles.js','utf8');
assert.match(fs.readFileSync('assets/community-test-config.js','utf8'),/privateChat:false/);
assert.match(src,/row \? row\.chat_contact_opt_in===true : true/);
assert.match(src,/settings\.chat_contact_opt_in=publicName&&chatOptIn\.checked/);
let user='NEW',authCb;const writes=[];
const rows={NEW:null,OFF:{display_name:'ResearcherOff',is_public:true,chat_contact_opt_in:false},
 ON:{display_name:'ResearcherOn',is_public:true,chat_contact_opt_in:true}};
function el(tag='div'){return {tag,children:[],style:{},dataset:{},textContent:'',value:'',checked:false,hidden:false,
 append(...xs){this.children.push(...xs)},setAttribute(k,v){this[k]=v},addEventListener(k,v){this[k]=v},
 querySelector(q){if(q==='.card-body')return this;if(q==='button[type="submit"]'){
 const find=e=>e.tag==='button'&&e.type==='submit'?e:(e.children||[]).map(find).find(Boolean);
 return find(this)}return null}}}
const root=el();root.id='ddProfileUsername';
const doc={readyState:'loading',listeners:{},createElement:el,getElementById:id=>id==='ddProfileUsername'?root:null,
 addEventListener(k,fn){this.listeners[k]=fn}};
const api={auth:{getUser:async()=>({data:{user:{id:user,is_anonymous:false,
 user_metadata:{dd_requested_username:'ResearcherNew'}}},error:null}),onAuthStateChange:f=>authCb=f},
 from:()=>({select(){return this},eq(){return this},
 maybeSingle:async()=>({data:rows[user],error:null}),
 upsert:async d=>{writes.push({...d});return {error:null}}})};
const win={DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://fake.invalid',publishableKey:'fake'},
 DD_COMMUNITY_FEATURES:{privateChat:true},supabase:{createClient:()=>api}};
vm.runInNewContext(src,{window:win,document:doc,Date,Promise},{timeout:2000});
doc.listeners.DOMContentLoaded();
const host=root.children[0],form=host.children.find(c=>c.tag==='form');
const input=form.children.find(c=>c.id==='ddPublicProfileName');
const boxes=form.children.filter(c=>c.tag==='label').map(c=>c.children?.[0]).filter(c=>c?.type==='checkbox');
const [publicBox,chatBox]=boxes;
async function flush(){for(let i=0;i<25;i++)await Promise.resolve()}
async function save(){form.onsubmit({preventDefault(){}});await flush()}
(async()=>{
 await flush();assert.equal(host.hidden,false);
 assert.equal(publicBox.checked,false,'Public alias remains opt-in');
 assert.equal(chatBox.checked,true,'New account chat-request toggle must default ON');
 input.value='ResearcherNew';publicBox.checked=true;await save();
 assert.equal(writes[0].chat_contact_opt_in,true);
 user='OFF';authCb();await flush();assert.equal(chatBox.checked,false,'Explicit opt-out preserved');
 publicBox.checked=true;await save();assert.equal(writes[1].chat_contact_opt_in,false);
 user='ON';authCb();await flush();assert.equal(chatBox.checked,true);
 chatBox.checked=false;await save();assert.equal(writes[2].chat_contact_opt_in,false);
 chatBox.checked=true;publicBox.checked=false;await save();
 assert.equal(writes[3].chat_contact_opt_in,false,'Private aliases cannot be contacted');
 console.log('PASS default-on new public alias, explicit opt-out, repeated update, and private alias safety.');
})().catch(e=>{console.error(e);process.exitCode=1});
