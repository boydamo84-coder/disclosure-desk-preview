'use strict';
// Tests actual public-profiles.js with a mocked DOM and two fabricated users.
// No connected Supabase requests, secrets, database changes or user emails.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const A='synthetic-A',B='synthetic-B';
let current=A,collision=false,authListener=null;
const writes=[];
function node(tag='div'){
 return {tag,children:[],style:{},dataset:{},textContent:'',value:'',checked:false,hidden:false,
  listeners:{},append(...x){this.children.push(...x)},setAttribute(k,v){this[k]=v},
  addEventListener(k,fn){this.listeners[k]=fn},querySelector(selector){
    if(selector==='button[type="submit"]'){
      const find=(el)=>{
        if(el.tag==='button'&&el.type==='submit')return el;
        for(const child of el.children||[]){const found=find(child);if(found)return found;}
        return null;
      };
      return find(this);
    }
    if(selector==='.card-body')return this;return null;
  }};
}
const root=node();root.id='ddProfileUsername';
const document={readyState:'loading',listeners:{},
 getElementById(id){return id==='ddProfileUsername'?root:null},
 createElement:node,addEventListener(k,fn){this.listeners[k]=fn}};
const api={
 auth:{getUser:async()=>({data:{user:{id:current,is_anonymous:false,
  user_metadata:{dd_requested_username:'Prefill_'+current}}},error:null}),
  onAuthStateChange(fn){authListener=fn}},
 from(table){
  assert.equal(table,'dd_public_names');
  return {
   select(){return this},eq(){return this},
   maybeSingle:async()=>({data:{display_name:current===A?'Alpha_A':'Bravo_B',
     is_public:false,chat_contact_opt_in:false},error:null}),
   upsert:async(settings,opts)=>{
    writes.push({settings,opts,current});
    return {error:collision?{message:'duplicate key value violates unique constraint'}:null};
   }
  };
 }};
const window={DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://synthetic.invalid',
 publishableKey:'not-a-real-key'},DD_COMMUNITY_FEATURES:{privateChat:false},
 supabase:{createClient:()=>api}};
vm.runInNewContext(fs.readFileSync('assets/public-profiles.js','utf8'),
 {window,document,Date,console,Promise},{timeout:2000});
document.listeners.DOMContentLoaded();
const host=root.children[0],form=host.children.find(x=>x.tag==='form');
const input=form.children.find(x=>x.tag==='input');
const opt=form.children.find(x=>x.tag==='label'&&x.children[0]?.type==='checkbox').children[0];
const status=form.children.find(x=>x.tag==='p');
async function flush(){for(let i=0;i<18;i++)await Promise.resolve()}
async function submit(){form.listeners.submit({preventDefault(){}});await flush()}
(async()=>{
 await flush();
 assert.equal(host.hidden,false,'Account A settings visible');
 assert.equal(input.value,'Alpha_A');
 input.value='Different_A';
 // A form should not save to B even when auth changed before the refresh UI.
 current=B;
 await submit();
 assert.equal(writes.length,0,'Stale A form must not write B account');
 assert.match(status.textContent,/sign-in changed/i);
 assert.equal(typeof authListener,'function');
 authListener();await flush();
 assert.equal(input.value,'Bravo_B','B should have its own data loaded');
 input.value='Bravo_New';opt.checked=true;
 collision=true;await submit();
 assert.equal(writes.length,1);
 assert.equal(writes[0].settings.user_id,B,'Only B account ID used');
 assert.equal(writes[0].settings.display_name,'Bravo_New');
 assert.match(status.textContent,/already taken/i,'Duplicate alias shown clearly');
 assert.equal(status.dataset.error,'yes');
 collision=false;await submit();
 assert.equal(writes.length,2);
 assert.equal(writes[1].opts.onConflict,'user_id');
 assert.equal(status.dataset.error,'no');
 assert.match(status.textContent,/Saved/i);
 assert.ok(writes.every(x=>x.settings.user_id===B),'Never overwrite A on stale form');
 console.log('PASS: synthetic username form blocks cross-account stale write, shows duplicate warning, and saves only current owner');
})().catch(e=>{console.error(e);process.exitCode=1});
