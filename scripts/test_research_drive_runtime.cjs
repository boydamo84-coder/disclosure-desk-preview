'use strict';
// In-memory DOM/OAuth/Drive test. No real browser, accounts or external calls.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto').webcrypto;
const source=fs.readFileSync('research/google-drive.js','utf8');
function fixture(){
 const ids=new Map(),events={},stored=new Map(),calls=[],attempts=[];let current='account-A',data=new TextEncoder().encode('word-bytes'),badLocation=false,corrupt=false;
 const make=tag=>({tag,children:[],style:{},disabled:false,textContent:'',id:'',append(...nodes){this.children.push(...nodes);for(const n of nodes)if(n?.id)ids.set(n.id,n)},replaceChildren(...nodes){this.children=[...nodes]},setAttribute(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false}});
 const body=make('body'),document={createElement:make,body,head:make('head'),getElementById:id=>ids.get(id)||null};
 let metadata;
 const win={DDResearchDriveConfig:{clientId:'synthetic-client.apps.googleusercontent.com'},
  WNECloudIntegration:{verifiedOwner:async()=>current},wneCaptureDocument:()=>({bookTitle:'Fictional report',chapters:[{html:'text'}]}),DDResearchDocx:{exportFile:async()=>new Blob([data])},
  google:{accounts:{oauth2:{initTokenClient:cfg=>({requestAccessToken(){attempts.push(cfg)}}),hasGrantedAllScopes:()=>true,revoke:(t,cb)=>cb()}}},
  addEventListener:(name,fn)=>events[name]=fn};
 const fetch=async(url,opts={})=>{calls.push({url,method:opts.method||'GET',auth:opts.headers?.Authorization});
  if(opts.method==='POST'){metadata=JSON.parse(opts.body);return new Response('',{headers:{Location:badLocation?'https://evil.invalid/upload':'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=fake'}})}
  if(opts.method==='PUT')return Response.json({id:'created-file'});
  if(url.includes('alt=media'))return new Response(corrupt?'different':data);
  return Response.json({files:metadata?[{id:'created-file',name:metadata.name,modifiedTime:new Date().toISOString(),appProperties:metadata.appProperties}]:[]});};
 const ctx={window:win,document,crypto,TextEncoder,Uint8Array,URL,URLSearchParams,Blob,Response,File,Date,fetch,
  localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
 vm.runInNewContext(source,ctx);
 const walk=n=>[n,...(n.children||[]).flatMap(walk)];
 const button=name=>walk(body).find(n=>n.tag==='button'&&n.textContent===name);
 const text=()=>walk(body).map(n=>n.textContent).join(' ');
 const flush=async()=>{for(let i=0;i<20;i++)await new Promise(r=>setTimeout(r,2))};
 return {win,calls,attempts,stored,button,text,flush,setOwner:v=>{current=v;events['dd-wne-account-changed']()},badLocation:()=>badLocation=true,corrupt:()=>corrupt=true};
}
(async()=>{
 const f=fixture();await f.win.DDResearchDrive.open();f.button('Connect Google Drive').onclick();
 assert.equal(f.attempts[0].scope,'https://www.googleapis.com/auth/drive.file');
 f.setOwner('account-B');await f.attempts[0].callback({access_token:'OLD-A-TOKEN',expires_in:3600});
 assert.equal(f.calls.length,0,'A delayed OAuth callback cannot connect another Research account');
 await f.win.DDResearchDrive.open();f.button('Connect Google Drive').onclick();await f.attempts[1].callback({access_token:'B-TOKEN',expires_in:3600});
 assert.equal(f.calls.length,1);assert(f.calls[0].url.includes('dd_owner'),'file list scopes the DD owner');assert(!f.calls[0].url.includes('account-B'));
 assert.equal([...f.stored.values()].some(s=>s.includes('TOKEN')),false,'no token is persisted');
 f.button('Back up this document').onclick();await f.flush();
 assert(f.text().includes('Word backup verified'),'success requires upload and byte read-back');
 assert.equal(f.calls.filter(c=>c.method==='POST').length,1);assert.equal(f.calls.filter(c=>c.method==='PUT').length,1);
 assert(f.calls.some(c=>c.url.includes('alt=media')));assert(!f.calls.some(c=>['PATCH','DELETE'].includes(c.method)),'existing Drive files are never overwritten/deleted');
 const corrupt=fixture();await corrupt.win.DDResearchDrive.open();corrupt.button('Connect Google Drive').onclick();await corrupt.attempts[0].callback({access_token:'TOKEN',expires_in:3600});corrupt.corrupt();corrupt.button('Back up this document').onclick();await corrupt.flush();assert(corrupt.text().includes('could not be verified'));assert.equal(corrupt.stored.size,0,'failed read-back never records success');
 const hostile=fixture();await hostile.win.DDResearchDrive.open();hostile.button('Connect Google Drive').onclick();await hostile.attempts[0].callback({access_token:'TOKEN',expires_in:3600});hostile.badLocation();hostile.button('Back up this document').onclick();await hostile.flush();assert(hostile.text().includes('valid upload session'));assert(!hostile.calls.some(c=>c.url.startsWith('https://evil.invalid')),'OAuth token cannot be forwarded to an unexpected upload host');
 console.log('PASS Drive owner-bound OAuth, scoped files, memory-only tokens, verified new-file upload, failed read-back and hostile upload host');
})().catch(e=>{console.error(e);process.exitCode=1});
