'use strict';
// Offline regression for Research Edition's per-account last document and position.
// Synthetic Supabase client: no real records, accounts or API network calls.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const bridge=fs.readFileSync('research/wne-cloud-bridge.js','utf8');
const entry=fs.readFileSync('research/research-entry.js','utf8');
const workspace=fs.readFileSync('research/research-workspace.html','utf8');
const writer=fs.readFileSync('research/wne.html','utf8');
const user1='11111111-1111-4111-8111-111111111111';
const user2='22222222-2222-4222-8222-222222222222';
const doc1='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const doc2='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const makeDoc=id=>({version:2,bookTitle:'Research ' + id,active:'section-1',chapters:[{id:'section-1',title:'Section 1',html:'<p>Untouched research</p>'}],font:'Georgia',size:12});
let owner=user1;
const rows=new Map([[doc1,{owner:user1}],[doc2,{owner:user2}]]);
const store=new Map();
let listener;
const db={
 auth:{
  getUser:async()=>({data:{user:{id:owner}},error:null}),
  onAuthStateChange:fn=>listener=fn
 },
 from(table){
  assert.equal(table,'research_documents');
  return {select(){
   return {eq(field,id){
    assert.equal(field,'id');
    return {single:async()=>{
     if(rows.get(id)?.owner!==owner)return {error:new Error('Access denied'),data:null};
     return {error:null,data:{id,title:'Research',content:makeDoc(id),revision:1,updated_at:'2026-11-08T16:08:00Z'}};
    }};
   }};
  }};
 }
};
const window={supabase:{createClient:()=>db},fetch:async()=>{throw Error('Unexpected external fetch')}};
const context={window,localStorage:{setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)||null},location:{href:'https://uapdisclosuredesk.com/research/wne.html?id='+doc1,search:'?id='+doc1},URL,Request,Response,structuredClone,crypto:globalThis.crypto||require('node:crypto').webcrypto,document:{documentElement:{dataset:{}}},console};
vm.runInNewContext(bridge,context,{filename:'wne-cloud-bridge.js',timeout:4000});
(async()=>{
 const r=await window.fetch('/api/manuscript');
 assert.equal(r.status,200,'owner can open cloud document');
 assert.equal(store.get('wne-research-last-document:'+user1),doc1,'last verified document is remembered under owner');
 // Session change cannot let new user read previous owner's document.
 owner=user2;
 const denied=await window.fetch('/api/manuscript');
 assert.notEqual(denied.status,200,'account switch blocked until state reloads');
 assert.equal(store.get('wne-research-last-document:'+user1),doc1);
 assert.equal(store.has('wne-research-last-document:'+user2),false);
 // Last-position restore stays scoped to the active document, including the
 // actual mobile scrolling surface, without editor.focus().
 assert.match(writer,/wne_v081_position_/);
 assert.match(writer,/workareaScroll:work\?\.scrollTop\|\|0/);
 assert.match(writer,/editorScroll:ed\.scrollTop\|\|0/);
 assert.match(writer,/work\.scrollTop=Math\.max/);
 assert.match(writer,/\$\('editor'\)\.scrollTop=Math\.max/);
 assert.match(writer,/if\(pos\.caret!==null&&Number\.isFinite\(pos\.caret\)\)/);
 assert.match(entry,/wne-research-last-document:/);
 assert.match(entry,/\.eq\('id',remembered\)\.maybeSingle\(\)/,'RLS verification before auto-resume');
 assert.match(workspace,/id="dd-documents-btn"/,'Home remains accessible');
 assert.match(workspace,/id="dd-documents-dialog"/,'Home is a dialog over the editor');
 assert.match(workspace,/writer\.src='\.\/wne\.html\?id='/,'document selection opens the editor');
 console.log('PASS: Research Edition resumes owner-verified last document, Home available, per-document scroll/caret retained');
})().catch(e=>{console.error(e);process.exitCode=1});
