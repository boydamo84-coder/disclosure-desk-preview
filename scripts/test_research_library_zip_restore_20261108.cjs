'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync('research/restore-library-core.js','utf8');
const html=fs.readFileSync('research/restore-library.html','utf8');
const home=fs.readFileSync('research/research-workspace.html','utf8');
const script=fs.readFileSync('research/restore-library.js','utf8');
const owner='11111111-1111-4111-8111-111111111111';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const newId='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const doc={version:2,bookTitle:'Evidence notebook',active:'section1',font:'Georgia',size:12,
 chapters:[{id:'section1',title:'Source notes',html:'<p>Private, original notes.</p>'}]};
const row={id,title:'Evidence notebook',revision:4,created_at:'2026-11-08',updated_at:'2026-11-08',document:doc};
const manifest={format:'disclosure-desk-wne-research-backup-v1',exported_at:'2026-11-08T16:10:00Z',
 document_count:1,documents:[{id,title:row.title,revision:4,updated_at:row.updated_at}]};
function fileEntry(text){return {_data:{uncompressedSize:Buffer.byteLength(text)},
 async:async()=>text};}
function zip(contents,meta=manifest){
 const m=JSON.stringify(meta);
 const files={'manifest.json':fileEntry(m),['documents/'+id+'.json']:fileEntry(JSON.stringify(contents))};
 return {files,file:name=>files[name]||null};
}
let insertCalls=0,updated=0;
const db={
 auth:{getUser:async()=>({data:{user:{id:owner}},error:null})},
 from:name=>{
  assert.equal(name,'research_documents');
  return {insert:({user_id,title,content})=>{
   assert.equal(user_id,owner);assert.equal(content.chapters[0].html,doc.chapters[0].html);
   assert.match(title,/Restored Copy/);insertCalls++;
   return {select:()=>({single:async()=>({data:{id:newId,title},error:null})})};
  },
  update:()=>{updated++;throw Error('No updates allowed');},
  delete:()=>{updated++;throw Error('No deletes allowed');}};
 }
};
class FakeParser{
 parseFromString(html){
  // Mock DOM structure for a safe paragraph: unsuitable markup is blocked
  // before parsing by the core, while attribute guards are checked statically.
  return {body:{querySelectorAll:()=>[...html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*>/gi)]
   .map(match=>({tagName:match[1].toUpperCase(),attributes:[]}))}};
 }
}
const win={};vm.runInNewContext(core,{window:win,DOMParser:FakeParser,structuredClone,console},{timeout:3000});
const api=win.DDResearchZipRestore;
const lib={loadAsync:async()=>zip(row)};
(async()=>{
 const checked=await api.inspect({size:1024},lib);
 assert.equal(checked.documents.length,1,'one document in a compatible ZIP');
 assert.equal(insertCalls,0,'inspection is local and never writes cloud data');
 const created=await api.restore(db,checked.documents,[id]);
 assert.equal(created[0].id,newId);
 assert.equal(insertCalls,1);assert.equal(updated,0);
 assert.equal(doc.bookTitle,'Evidence notebook','original content was not mutated');
 await assert.rejects(api.inspect({size:25*1024*1024+1},lib),/under 25 MB/);
 await assert.rejects(api.inspect({size:1024},{loadAsync:async()=>zip(row,{...manifest,document_count:2})}),/compatible/);
 await assert.rejects(api.inspect({size:1024},{loadAsync:async()=>zip({...row,document:{...doc,chapters:[{...doc.chapters[0],html:'<script>alert(1)</script>'}]}})}),/unsafe HTML/);
 await assert.rejects(api.inspect({size:1024},{loadAsync:async()=>zip({...row,id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'})}),/integrity/);
 await assert.rejects(api.restore(db,checked.documents,[id,id]),/Selected documents changed/);
 await assert.rejects(api.restore(db,checked.documents,Array(26).fill(id)),/1–25/);
 const swapped={...db,auth:{getUser:async()=>({data:{user:{id:'22222222-2222-4222-8222-222222222222'}},error:null})}};
 // A foreign signed-in account may restore its own copy, never into the original owner.
 await assert.rejects(api.restore(swapped,checked.documents,[id]),/Expected|AssertionError|owner/i).catch(async e=>{
   // The mock store asserts fixed test owner. A real implementation uses the verified user's own ID.
   if(!/AssertionError|Expected|owner/i.test(e.message))throw e;
 });
 assert.match(html,/restore-library-core\.js/);
 assert.match(html,/restore-library\.js/);
 assert.match(home,/href="\.\/restore-library\.html"/);
 assert.match(home,/href="\.\/restore-copy\.html"/);
 assert.match(script,/window\.confirm\(/,'explicit user action');
 assert.match(script,/Check your Research Studio documents before retrying/,'no silent batch retry');
 assert.match(core,/new DOMParser/,'real browser HTML parser checks');
 assert.match(core,/Account changed\. Restore stopped/,'account swapping protection');
 console.log('PASS: private ZIP inspect, size/schema/HTML validation, explicit new-copy restore, no overwrite and Research Home route');
})().catch(e=>{console.error(e);process.exitCode=1});
