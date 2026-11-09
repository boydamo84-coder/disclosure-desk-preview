'use strict';
// Inline DOCX import QA: real source in a synthetic DOM, no account, network or files.
// No destructive mutation: all import writes must be action=import-cloud-copy.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync('research/research-docx-import.js','utf8');
const writer=fs.readFileSync('research/wne.html','utf8');
const bridge=fs.readFileSync('research/wne-cloud-bridge.js','utf8');
const build=fs.readFileSync('scripts/build_public_release.cjs','utf8');
const UUIDS=['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'];
const tick=()=>new Promise(res=>setImmediate(res));
const doc={version:2,bookTitle:'Test Source',
 chapters:[{id:'docx-1',title:'Evidence',html:'<p>Original evidence</p>'}],
 font:'Georgia',size:12};
let count=0;
function pass(name){count++;console.log('PASS DOCX IMPORT '+name);}
async function runScenario(options={}){
 const log={picker:0,saves:0,parser:0,confirm:0,uploads:[],navigation:[],alerts:[]};
 const input={type:'',id:'',hidden:false,accept:'',files:[],value:'',listeners:{},
  click(){log.picker++},addEventListener(event,cb){this.listeners[event]=cb},
  setAttribute(key,value){this[key]=value}};
 const toast={textContent:'',classList:{remove(){}}};
 // The branded, copy-safe HTML dialog replaces the previous window.confirm.
 // Exercise its real Confirm/Cancel callbacks; no fake automatic upload.
 function element(tag){
  const item={tagName:tag.toUpperCase(),children:[],listeners:{},textContent:'',
   append(...items){this.children.push(...items)},
   setAttribute(k,v){this[k]=v},addEventListener(k,fn){this.listeners[k]=fn},
   close(){this.open=false},remove(){},showModal(){
    this.open=true;log.confirm++;
    const menu=this.children.find(c=>c.tagName==='MENU');
    const selected=menu?.children.find(b=>b.textContent===(options.confirm===false?'Cancel':'Create imported copy'));
    queueMicrotask(()=>selected?.listeners.click?.());
   }};
  return item;
 }
 const document={createElement(name){return name==='input'?input:element(name)},
  body:{appendChild(){},append(){}},
  getElementById(id){return id==='toast'?toast:null}};
 const env={
  window:{wneSaveBeforeNavigation:async()=>{log.saves++;return options.save!==false},
   DDResearchDocx:{importFile:async file=>{log.parser++;return {document:options.doc||doc,warnings:[]}}},
   confirm(){log.confirm++;return options.confirm!==false},
   alert(message){log.alerts.push(message)},
   top:{location:{assign(url){log.navigation.push(url)}}},
  },
  document,crypto:{randomUUID:()=>UUIDS[(log.parser-1)%UUIDS.length]},
  fetch:async(path,opts)=>{
   log.uploads.push({path,body:JSON.parse(opts.body)});
   return {ok:options.cloud!==false,json:async()=>options.cloud===false?
    {error:'Synthetic cloud rejection'}:{id:UUIDS[1]}};
  },
  setTimeout,queueMicrotask,Promise,console
 };
 env.window.top.location.assign=env.window.top.location.assign.bind(env.window.top.location);
 vm.runInNewContext(src,env,{filename:'research/research-docx-import.js'});
 return {log,input,env,async select(file={name:'Test Source.docx',size:1024}){
  input.files=[file];input.listeners.change();
  for(let i=0;i<15;i++)await tick();
 }};
}
(async()=>{
 assert(writer.includes('<script src="./research-docx-import.js" defer></script>'));
 assert(writer.includes("else if(action==='import')"));
 assert(writer.includes('window.DDResearchImport.open()'));
 assert(!writer.includes("location.assign('/research/import.html')"));
 assert(bridge.includes("if(input?.action==='import-cloud-copy')"));
 assert(build.includes("'research-docx-import.js'"));
 pass('public package allowlists importer, no navigation to a 404 route');

 const ok=await runScenario();
 assert.equal(ok.env.window.DDResearchImport.open(),true);
 assert.equal(ok.log.picker,1,'Native input picker is clicked directly');
 await ok.select();
 assert.equal(ok.log.saves,1);
 assert.equal(ok.log.confirm,1,'branded import confirmation presented before writing');
 assert.equal(ok.log.uploads.length,1);
 assert.equal(ok.log.uploads[0].path,'/api/library');
 assert.equal(ok.log.uploads[0].body.action,'import-cloud-copy');
 assert.equal(ok.log.uploads[0].body.document.bookTitle,'Test Source');
 assert.notEqual(ok.log.uploads[0].body.document.chapters[0].id,doc.chapters[0].id);
 assert.equal(ok.log.navigation.length,1);
 assert.match(ok.log.navigation[0],/^\/research\/research-workspace\.html\?id=/);
 pass('picker, saved original, new-copy upload, and confirmed navigation');

 const failSave=await runScenario({save:false});await failSave.select();
 assert.equal(failSave.log.uploads.length,0);assert.equal(failSave.log.navigation.length,0);
 assert.match(failSave.log.alerts[0],/Save of your open report was not confirmed/);
 pass('failed cloud save leaves old document open; no upload or navigation');

 const denied=await runScenario({confirm:false});await denied.select();
 assert.equal(denied.log.uploads.length,0);assert.equal(denied.log.navigation.length,0);
 pass('cancelled confirmation cannot create a document');

 const failCloud=await runScenario({cloud:false});await failCloud.select();
 assert.equal(failCloud.log.uploads.length,1);
 assert.equal(failCloud.log.navigation.length,0);
 assert.match(failCloud.log.alerts[0],/Synthetic cloud rejection/);
 pass('rejected cloud save cannot navigate or claim success');

 const wrong=await runScenario();await wrong.select({name:'bad.txt',size:50});
 assert.equal(wrong.log.saves,0);assert.equal(wrong.log.uploads.length,0);
 pass('rejects non-DOCX file before any action');

 console.log('PASS DOCX IMPORT TOTAL '+count+' safe source/runtime checks, NO live cloud or Netlify.');
})().catch(e=>{console.error('FAIL DOCX IMPORT',e.stack||e);process.exitCode=1});
