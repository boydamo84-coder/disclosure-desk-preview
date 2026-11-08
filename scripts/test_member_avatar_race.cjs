'use strict';
// Synthetic, no-network regression for reusable public avatar elements and rapid account changes.
// A delayed previous member/avatar lookup must never overwrite the newest username.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/member-avatars.js','utf8');
const keys={
 alphaone:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 bravotwo:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 gammathree:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
};
const pending=new Map();
let downloads=0;
const keyFor=n=>String(n||'').replace(/[^A-Za-z0-9]/g,'').toLowerCase();
const client={
 rpc:async(name,args)=>{
  assert.equal(name,'dd_avatar_public_keys');
  const key=keyFor(args.p_usernames[0]);
  return {data:keys[key]?[{name_key:key,public_key:keys[key]}]:[],error:null};
 },
 storage:{from:bucket=>{
  assert.equal(bucket,'dd-profile-avatars');
  return {download:path=>{
   downloads++;
   return new Promise(resolve=>{
    if(!pending.has(path))pending.set(path,[]);
    pending.get(path).push(resolve);
   });
  }};
 }}
};
const win={DD_COMMUNITY_FEATURES:{profileAvatars:true},
 DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://synthetic.invalid',publishableKey:'synthetic'},
 supabase:{createClient:()=>client}};
const document={createElement:tag=>({tag,setAttribute(){},remove(){}})};
const urls={created:[],revoked:[]};
const URL={createObjectURL:blob=>{const u='blob:mock-'+blob.id;urls.created.push(u);return u},
 revokeObjectURL:u=>urls.revoked.push(u)};
vm.runInNewContext(source,{window:win,document,URL,Promise},{timeout:1500});
assert.ok(win.DDMemberAvatars);
const pathFor=name=>keys[keyFor(name)]+'/avatar.webp';
const element=()=>({isConnected:true,children:[],replaceChildren(...v){this.children=v}});
const flush=async()=>{for(let n=0;n<35;n++)await Promise.resolve()};
function resolve(name,index,blobId){
 const list=pending.get(pathFor(name))||[];
 assert.ok(list[index], 'Missing pending download: '+name+' #'+index);
 list[index]({data:{id:blobId},error:null});
}
(async()=>{
 // Scenario 1: same DOM tile reused for B while A is still downloading.
 const tile=element();
 const old=win.DDMemberAvatars.decorate(tile,'Alpha_One');
 await flush();
 const newer=win.DDMemberAvatars.decorate(tile,'Bravo_Two');
 await flush();
 resolve('Bravo_Two',0,'new-member');
 await newer;
 assert.equal(tile.children[0]?.src,'blob:mock-new-member');
 resolve('Alpha_One',0,'old-member');
 await old;
 assert.equal(tile.children[0]?.src,'blob:mock-new-member',
  'Old member image must not overwrite newer member on reused tile');
 assert.equal(urls.created.includes('blob:mock-old-member'),false,
  'Stale image must not even obtain a display URL');
 // Scenario 2: profile Hide or logout clears outstanding public image loads.
 const orphan=element();
 const stale=win.DDMemberAvatars.decorate(orphan,'Alpha_One');
 await flush();
 win.DDMemberAvatars.clearCache();
 resolve('Alpha_One',1,'after-hide');
 await stale;
 assert.equal(orphan.children.length,0,
  'Cache invalidation must suppress images resolving after visibility/identity change');
 // Scenario 3: a wrong/invalid next alias must invalidate the old tile request.
 const renamed=element();
 const waiting=win.DDMemberAvatars.decorate(renamed,'Bravo_Two');
 await flush();
 await win.DDMemberAvatars.decorate(renamed,'not a valid alias!');
 resolve('Bravo_Two',1,'old-alias');
 await waiting;
 assert.equal(renamed.children.length,0,'Invalid/replaced alias must suppress old photo');
 // Scenario 4: in-flight map cleanup from the older request must not remove the new one.
 const same=element(),fresh=element();
 const first=win.DDMemberAvatars.decorate(same,'Gamma_Three');
 await flush();
 win.DDMemberAvatars.clearCache();
 const second=win.DDMemberAvatars.decorate(fresh,'Gamma_Three');
 await flush();
 resolve('Gamma_Three',0,'stale-gamma');
 await first;
 resolve('Gamma_Three',1,'latest-gamma');
 await second;
 assert.equal(same.children.length,0);
 assert.equal(fresh.children[0]?.src,'blob:mock-latest-gamma');
 assert.equal(downloads,6,'Only intended mock downloads should occur');
 console.log('PASS member avatar races: account switch, reused tile, cache Hide, invalid alias and new-load persistence.');
})().catch(e=>{console.error(e);process.exitCode=1});
