'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('research/wne-cloud-bridge.js','utf8');
const writer=fs.readFileSync('research/wne.html','utf8');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const sid='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const owner='11111111-1111-4111-8111-111111111111';
const foreign='22222222-2222-4222-8222-222222222222';
const content={version:2,bookTitle:'Test report',active:'s1',chapters:[{id:'s1',title:'Section',html:'<p>Previous real writing</p>'}],font:'Georgia',size:12};
const rows=[
 {id,user_id:owner,title:'Test report',content,revision:2,created_at:'2026-11-08T10:00:00Z',updated_at:'2026-11-08T12:00:00Z'},
 {id:other,user_id:foreign,title:'Not the same account',content,revision:1}
];
const revisions=[
 {id:sid,document_id:id,user_id:owner,revision:1,saved_at:'2026-11-08T11:00:00Z',title:'Test report',content}
];
let active=owner,inserted=null,lastZip=null;
class JSZip {
 constructor(){this.files={};lastZip=this}
 file(name,text){this.files[name]=text;return this}
 async generateAsync(){return new Blob(['zip-mock'],{type:'application/zip'})}
}
function table(name){
 const isDocs=name==='research_documents';
 assert.ok(isDocs||name==='research_document_revisions','unexpected table '+name);
 const source=isDocs?rows:revisions;
 return {
  select(){
   const filters={};
   const q={
    eq(k,v){filters[k]=v;return this},
    order(){return this},
    range(first,last){return Promise.resolve({data:source.filter(r=>r.user_id===active).filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v)).slice(first,last+1),error:null})},
    limit(n){return Promise.resolve({data:source.filter(r=>r.user_id===active).filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v)).slice(0,n),error:null})},
    single:async()=>{
     const r=source.filter(r=>r.user_id===active).find(r=>Object.entries(filters).every(([k,v])=>r[k]===v));
     return r?{data:r,error:null}:{data:null,error:new Error('Access denied')};
    }
   };
   return q;
  },
  insert(row){
   assert.equal(name,'research_documents');
   return {select(){return {single:async()=>{
    if(row.user_id!==active)return {data:null,error:new Error('Forbidden')};
    inserted={...row,id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'};
    return {data:inserted,error:null};
   }}}};
  }
 };
}
const db={auth:{getUser:async()=>({data:{user:{id:active}},error:null}),onAuthStateChange(){}},from:table};
const win={supabase:{createClient:()=>db},JSZip,fetch:async()=>{throw Error('external request not expected')}};
const store=new Map(),ctx={
 window:win,location:{href:'https://uapdisclosuredesk.com/research/wne.html?id='+id,search:'?id='+id},
 URL,URLSearchParams,Request,Response,Blob,crypto:require('node:crypto').webcrypto,
 structuredClone,console,document:{documentElement:{dataset:{}}},localStorage:{
 getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)
 }
};
vm.runInNewContext(source,ctx,{timeout:4000,filename:'wne-cloud-bridge.js'});
(async()=>{
 const opened=await win.fetch('/api/manuscript');
 assert.equal(opened.status,200,'owner verified manuscript loads');
 const zip=await win.WNECloudIntegration.makeLibraryZip();
 assert.equal(zip.documentCount,1,'backup must not include another account');
 assert.match(zip.filename,/WNE-Research-2026/);
 assert.equal(zip.blob.type,'application/zip');
 assert.ok(lastZip.files['documents/'+id+'.json']);
 assert.ok(!lastZip.files['documents/'+other+'.json']);
 const file=JSON.parse(lastZip.files['documents/'+id+'.json']);
 assert.equal(file.document.chapters[0].html,'<p>Previous real writing</p>');
 const listed=await (await win.fetch('/api/snapshots')).json();
 assert.equal(listed.items.length,1,'owner sees only own checkpoints');
 assert.equal(listed.items[0].id,sid);
 const recovered=await win.fetch('/api/snapshot/'+sid);
 assert.equal(recovered.status,200);
 assert.equal((await recovered.json()).manuscript.chapters.length,1);
 const copied=await win.fetch('/api/recovery/copy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:sid})});
 assert.equal(copied.status,200,'can restore as a NEW document');
 assert.equal((await copied.json()).created_copy,true);
 assert.match(inserted.title,/Recovered/);
 assert.notEqual(inserted.id,id,'original document must not be replaced');
 assert.doesNotMatch(writer,/window\.top\.location\.assign\('\/research\/import\.html'\)/,'DOCX import must not navigate away to a potentially missing page');
 assert.match(writer,/DDResearchImport\.open\(\)/,'Import launches a direct Android file picker');
 const direct=await win.WNECloudIntegration.recoveryList();
 assert.equal(direct.items[0].id,sid,'owner can obtain recovery history without legacy fetch route');
 const preview=await win.WNECloudIntegration.recoveryPreview(sid);
 assert.equal(preview.manuscript.bookTitle,'Test report','direct owner-scoped checkpoint preview works');
 const copy=await win.WNECloudIntegration.recoveryCopy(sid);
 assert.equal(copy.created_copy,true,'direct recovery creates a new owner-scoped document');
 assert.notEqual(copy.id,id,'direct recovery never overwrites the original');
 assert.match(writer,/window\.wneEmergencyCopy=async function\(/,'Emergency Copy direct save exists');
 assert.match(writer,/syncEditor\(\); \/\/ Include the CURRENT editable HTML/,'Emergency includes unsaved editor contents');
 assert.match(writer,/jszip@3\.10\.1/,'Pinned ZIP dependency');
 active=foreign;
 const rejected=await win.fetch('/api/snapshots');
 assert.notEqual(rejected.status,200,'a changed account must not see prior recovery history');
 console.log('PASS: owner-only cloud ZIP, direct recovery list/preview/copy, Emergency Copy and inline DOCX Import; original unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});
