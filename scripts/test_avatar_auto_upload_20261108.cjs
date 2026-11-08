'use strict';
// No network and no real users: fake Android-compatible photo processing and Storage.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('assets/profile-avatars.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/Choose or change your profile picture — saves automatically/);
assert.match(html,/id="ddAvatarSave" hidden disabled>Retry photo upload/);
const names=['ddAvatarPanel','ddAvatarImage','ddAvatarFallback','ddAvatarFile','ddAvatarSave','ddAvatarRemove','ddAvatarStatus','ddAvatarVisible'];
function el(id){return {id,hidden:['ddAvatarPanel','ddAvatarImage','ddAvatarRemove'].includes(id),
 checked:id==='ddAvatarVisible',disabled:id==='ddAvatarSave',value:'',files:[],textContent:'',listeners:{},
 addEventListener(name,fn){this.listeners[name]=fn},removeAttribute(name){this[name]=null}};}
const nodes=Object.fromEntries(names.map(id=>[id,el(id)]));
let stored=null,uploads=0,removals=0,cacheClears=0,visibility=true,failNext=false,objectCounter=0,fallbackLoads=0,revokes=0;
const owner='9d27f101-75c2-4c33-946b-af653833613a',key='2a3180f8-2af4-4d90-bca1-5e503b871497';
const api={
 auth:{getUser:async()=>({data:{user:{id:owner,is_anonymous:false}},error:null}),onAuthStateChange(){}},
 rpc:async(name,args)=>{
  if(name==='dd_avatar_my_settings')return {data:[{public_key:key,visible:visibility}],error:null};
  if(name==='dd_avatar_set_visibility'){visibility=args.p_visible;return {data:true,error:null};}
  throw Error('Unexpected RPC '+name);
 },
 storage:{from(bucket){assert.equal(bucket,'dd-profile-avatars');
  return {
   async download(path){assert.equal(path,key+'/avatar.webp');return stored?{data:stored,error:null}:{data:null,error:{message:'not found'}}},
   async upload(path,blob,opts){
    assert.equal(path,key+'/avatar.webp');assert.equal(opts.upsert,true);
    assert.equal(opts.contentType,'image/webp');uploads++;
    if(failNext){failNext=false;return {error:{message:'Synthetic upload failure'}}}
    stored=blob;return {error:null};
   },
   async remove(paths){assert.equal(paths[0],key+'/avatar.webp');stored=null;removals++;return {error:null}}
  };
 }}
};
const win={DD_COMMUNITY_TEST_CONFIG:{environment:'production',url:'https://fake.invalid',publishableKey:'fake'},
 DD_COMMUNITY_FEATURES:{profileAvatars:true},supabase:{createClient:()=>api},
 DDMemberAvatars:{clearCache(){cacheClears++}}};
const document={getElementById:id=>nodes[id],
 createElement(tag){assert.equal(tag,'canvas');return {width:512,height:512,getContext(){return {fillRect(){},drawImage(){},fillStyle:''}},
 toBlob(cb){cb({type:'image/webp',size:333})}}}};
const ctx={window:win,document,
 URL:{createObjectURL:()=>('blob:mock-'+(++objectCounter)),revokeObjectURL(){revokes++}},
 Image:class {constructor(){this.naturalWidth=800;this.naturalHeight=600}
  set src(_value){fallbackLoads++;Promise.resolve().then(()=>this.onload?.())}},
 createImageBitmap:async()=>({width:400,height:200,close(){}}),confirm:()=>true,console,Promise};
vm.runInNewContext(src,ctx,{timeout:2000});
const file=nodes.ddAvatarFile,save=nodes.ddAvatarSave,remove=nodes.ddAvatarRemove,visible=nodes.ddAvatarVisible,status=nodes.ddAvatarStatus;
async function flush(){for(let i=0;i<50;i++)await Promise.resolve()}
async function choose(photo={type:'image/png',name:'photo.png',size:3000}){file.files=[photo];await file.listeners.change();await flush()}
(async()=>{
 assert.equal(file.disabled,true,'Photo picker cannot run before account key loads');
 await flush();assert.equal(nodes.ddAvatarPanel.hidden,false);
 assert.equal(file.disabled,false,'Photo picker enabled when owner key loaded');
 assert.equal(save.hidden,true,'Retry hidden before selection');
 await choose();assert.equal(uploads,1,'File selection uploads automatically');
 assert.ok(stored);assert.equal(save.hidden,true,'No extra Save click');
 assert.equal(remove.hidden,false,'Remove available');
 assert.match(status.textContent,/saved automatically/i);
 ctx.createImageBitmap=undefined;
 await choose({type:'image/heic',name:'iphone.heic',size:3000});
 assert.equal(uploads,2,'Safari without createImageBitmap automatically saves an HEIC photo');
 assert.equal(fallbackLoads,1,'Safari decodes via HTMLImageElement');
 assert.ok(revokes>=1,'Safari temporary photo URL released');
 ctx.createImageBitmap=async()=>{throw Error('Safari createImageBitmap failed')};
 failNext=true;await choose({type:'image/jpeg',name:'works.jpg',size:3000});
 assert.equal(fallbackLoads,2,'Safari rejection falls back to HTMLImageElement');
 assert.equal(uploads,3);assert.equal(save.hidden,false,'Upload failure shows Retry');
 assert.equal(save.disabled,false);
 save.listeners.click();await flush();assert.equal(uploads,4);
 assert.equal(save.hidden,true,'Retry disappears after success');
 visible.checked=false;await visible.listeners.change();assert.equal(visibility,false,'Hide still works');
 await remove.listeners.click();assert.equal(removals,1);assert.equal(stored,null);
 assert.equal(remove.hidden,true);
 assert.ok(cacheClears>=4,'Member cache invalidated after successful operations');
 console.log('PASS: profile photo auto-saves, Safari fallback, HEIC, first-load readiness, Retry, Hide and Remove');
})().catch(e=>{console.error(e);process.exitCode=1});
