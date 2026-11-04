'use strict';
// Runs the ACTUAL assets/research-hub.js in a synthetic, network-free DOM.
// No Supabase account, Auth token, real witness or stored research is used.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const A='synthetic-A',B='synthetic-B';
let signedIn=A,confirmChanges=true;
const log=[],elems=new Map();
function node(tag='div'){
 return {tag,className:'',children:[],textContent:'',hidden:false,value:'',disabled:false,listeners:{},
  classList:{contains:()=>false},append(...x){this.children.push(...x);},
  replaceChildren(...x){this.children=x;},setAttribute(n,v){this[n]=v},
  addEventListener(k,v){this.listeners[k]=v},querySelector(){return null},
  remove(){},focus(){},scrollIntoView(){}};
}
const get=id=>{if(!elems.has(id))elems.set(id,node());return elems.get(id)};
const document={readyState:'loading',getElementById:get,createElement:node,
 querySelector(){return null},querySelectorAll(){return []},addEventListener(){}};
function from(table){
 const state={deleting:false,criteria:[]};
 const q={select(){
   if(state.deleting){
    log.push({kind:'delete',table,user:signedIn,criteria:state.criteria});
    return Promise.resolve({data:[{id:state.criteria[0][1]}],error:null});
   }
   return q;},
  order(){return q;},eq(k,v){state.criteria.push([k,v]);return q;},
  maybeSingle(){return Promise.resolve({data:{display_name:'Test '+signedIn},error:null});},
  delete(){state.deleting=true;return q;},
  limit(){
   const data=table==='dd_witness_reports'?[{id:'report-'+signedIn,category:'Light',
    city:'City '+signedIn,country:'UK',status:'published',event_date:'2026-01-01'}]:
    table==='research_documents'?[{id:'doc-'+signedIn,title:'Private '+signedIn,updated_at:'2026-01-01'}]:[];
   return Promise.resolve({data,error:null,count:data.length});
  }
 };
 return q;
}
const client={auth:{getUser:async()=>({data:{user:{id:signedIn,email:'test@example.invalid',
 email_confirmed_at:'2026-01-01',user_metadata:{}}},error:null})},
 from,rpc:async(name,args={})=>{
  if(name==='dd_my_comments')return {data:[{id:'comment-'+signedIn,
   case_id:'news:synthetic',body:'Example comment',status:'approved',
   created_at:new Date().toISOString()}],error:null};
  if(name==='dd_is_comment_moderator')return {data:false,error:null};
  if(name==='dd_delete_my_comment'||name==='dd_edit_my_comment'||name==='research_trash_document'){
   log.push({kind:'rpc',name,args,user:signedIn});return {data:true,error:null};
  }
  throw Error('Unexpected mock RPC: '+name);
 }};
const window={DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://example.invalid',
 publishableKey:'not-a-real-key'},supabase:{createClient:()=>client},
 DDWitnessReports:{refresh:async()=>{}},ddGoToDiscussionOrigin(){},ddOpenCaseDiscussion(){}};
vm.runInNewContext(fs.readFileSync('assets/research-hub.js','utf8'),
 {window,document,Date,console,confirm:()=>confirmChanges,setTimeout:()=>{}},{timeout:2000});
function first(id){const r=get(id).children[0];assert.ok(r,'Missing '+id);return r}
function button(row,label){
 const bar=row.children.find(x=>x.className==='dd-profile-actions');
 assert.ok(bar,'Missing action bar');
 const b=bar.children.find(x=>x.textContent===label);assert.ok(b,'Missing '+label);return b;
}
async function flush(){for(let i=0;i<16;i++)await Promise.resolve()}
(async()=>{
 await window.DDResearchHub.refresh();
 assert.match(first('ddProfileWitnessList').children[0].textContent,/synthetic-A/);
 const stale=button(first('ddProfileWitnessList'),'Delete report');
 signedIn=B;stale.onclick();await flush();
 assert.equal(log.length,0,'A stale button MUST NOT alter anything after changing accounts');
 await window.DDResearchHub.refresh();
 assert.match(first('ddProfileWitnessList').children[0].textContent,/synthetic-B/);
 const del=button(first('ddProfileWitnessList'),'Delete report');
 confirmChanges=false;del.onclick();await flush();
 assert.equal(log.length,0,'Cancel must not call the API');
 confirmChanges=true;del.onclick();await flush();
 const removed=log.filter(x=>x.kind==='delete');
 assert.equal(removed.length,1,'One user-confirmed mutation');
 assert.equal(removed[0].table,'dd_witness_reports');
 assert.deepEqual(removed[0].criteria,[['id','report-'+B],['author_id',B]],
  'Report delete must filter on both item ID AND logged-in owner');
 await window.DDResearchHub.refresh();
 const row=first('ddProfileCommentsList');const edit=button(row,'Edit');edit.onclick();
 const form=row.children.find(x=>x.tag==='form');assert.ok(form,'Edit form exists');
 form.children[0].children[0].value='Edited synthetic comment';
 form.listeners.submit({preventDefault(){}});await flush();
 assert.ok(log.some(x=>x.name==='dd_edit_my_comment'
   &&x.args.p_id==='comment-'+B&&x.args.p_body==='Edited synthetic comment'));
 await window.DDResearchHub.refresh();
 button(first('ddProfileFilesList'),'Move to trash').onclick();await flush();
 assert.ok(log.some(x=>x.name==='research_trash_document'&&x.args.p_id==='doc-'+B));
 assert.equal(log.some(x=>JSON.stringify(x).includes('report-'+A)||
  JSON.stringify(x).includes('doc-'+A)),false,'Never mutate A after B sign-in');
 console.log('PASS: owner-switch stale action denied, confirmations respected, witness/comment/document operations scoped to synthetic B');
})().catch(e=>{console.error(e);process.exitCode=1});
