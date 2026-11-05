'use strict';
// Offline, fake account/browser tests for newly staged private profile pictures.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/profile-avatars.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const config=fs.readFileSync('assets/community-test-config.js','utf8');
const policy=fs.readFileSync('supabase/PROFILE_AVATARS_PRIVATE_REVIEW.sql','utf8');
for(const id of ['ddAvatarPanel','ddAvatarImage','ddAvatarFallback','ddAvatarFile',
 'ddAvatarSave','ddAvatarRemove','ddAvatarStatus'])
 assert.match(html,new RegExp('id="'+id+'"'),'Missing '+id);
assert.match(config,/profileAvatars:false/,'Default photo activation must remain disabled');
assert.match(source,/storage\.from\(BUCKET\)\.download/);
assert.match(source,/storage\.from\(BUCKET\)\.upload/);
assert.match(source,/storage\.from\(BUCKET\)\.remove/);
assert.match(source,/canvas\.toBlob\(resolve,'image\/webp'/);
assert.doesNotMatch(source,/getPublicUrl|createSignedUrl/);
assert.match(policy,/public,file_size_limit,allowed_mime_types/);
assert.match(policy,/false,1048576,ARRAY\['image\/webp'\]/);
assert.equal((policy.match(/create policy dd_avatar_owner_/g)||[]).length,4);
assert.match(policy,/name=auth\.uid\(\)::text\|\|'\/avatar\.webp'/);
console.log('PASS photo contract: fixed private path, owner-only review policies and no public URLs.');
function node(){const listeners={};return {hidden:false,disabled:false,value:'',src:'',
 listeners,addEventListener(k,fn){listeners[k]=fn},
 removeAttribute(k){if(k==='src')this.src='';},setAttribute(){}};}
const ids=Object.fromEntries(['ddAvatarPanel','ddAvatarImage','ddAvatarFallback','ddAvatarFile',
 'ddAvatarSave','ddAvatarRemove','ddAvatarStatus'].map(x=>[x,node()]));
const doc={getElementById:id=>ids[id]||null};
let who='11111111-1111-4111-8111-111111111111';
let authCb,oldResolve,downloadCalls=[],revokeCalls=[];
const blobA={id:'A'},blobB={id:'B'};
const client={auth:{
 getUser:async()=>({data:{user:who?{id:who,is_anonymous:false}:null},error:null}),
 onAuthStateChange:cb=>{authCb=cb;}
},storage:{from:bucket=>{
 assert.equal(bucket,'dd-profile-avatars');
 return {download:path=>{
  downloadCalls.push(path);
  if(path.startsWith('11111111'))return new Promise(resolve=>{oldResolve=resolve;});
  return Promise.resolve({data:blobB,error:null});
 },upload:async()=>{throw Error('No live uploads in test')},
 remove:async()=>{throw Error('No live deletes in test')}};
}}};
const win={DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://synthetic.invalid',publishableKey:'synthetic'},
 DD_COMMUNITY_FEATURES:{profileAvatars:true},supabase:{createClient:()=>client}};
const Url={createObjectURL:b=>'blob:synthetic-'+b.id,
 revokeObjectURL:u=>revokeCalls.push(u)};
vm.runInNewContext(source,{window:win,document:doc,URL:Url,confirm:()=>false,createImageBitmap:async()=>{}});
async function flush(){for(let i=0;i<30;i++)await Promise.resolve();}
(async()=>{
 await flush();assert.equal(typeof oldResolve,'function');
 who='22222222-2222-4222-8222-222222222222';
 authCb();await flush();
 assert.equal(ids.ddAvatarImage.src,'blob:synthetic-B');
 oldResolve({data:blobA,error:null});await flush();
 assert.equal(ids.ddAvatarImage.src,'blob:synthetic-B',
   'Account A pending photo must NOT reappear in B');
 assert.equal(ids.ddAvatarPanel.hidden,false);
 assert.equal(downloadCalls[downloadCalls.length-1],'22222222-2222-4222-8222-222222222222/avatar.webp');
 who=null;authCb();await flush();
 assert.equal(ids.ddAvatarPanel.hidden,true,'Guest may not access profile photo settings');
 assert.equal(ids.ddAvatarImage.src,'','Signout must remove private photo URL');
 assert.ok(revokeCalls.includes('blob:synthetic-B'),'Signout revokes displayed private blob URL');
 assert.equal(typeof ids.ddAvatarSave.listeners.click,'function');
 assert.equal(typeof ids.ddAvatarRemove.listeners.click,'function');
 assert.equal(typeof ids.ddAvatarFile.listeners.change,'function');
 console.log('PASS avatar runtime: no prior-account image leaks, guest clears private URL, controls wired.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
