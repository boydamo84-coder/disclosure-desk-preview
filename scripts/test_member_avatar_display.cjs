'use strict';
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const src=fs.readFileSync('assets/member-avatars.js','utf8');
const chat=fs.readFileSync('assets/profile-private-chat.js','utf8');
const forum=fs.readFileSync('assets/community-discussions.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.match(src,/flags\.profileAvatars!==true/);
assert.match(src,/rpc\('dd_avatar_public_keys'/);
assert.match(src,/storage\.from\(BUCKET\)\.download/);
assert.doesNotMatch(src,/getPublicUrl|service_role/);
assert.match(chat,/DDMemberAvatars\?\.decorate\?\.\(avatar,name\)/);
assert.match(chat,/DDMemberAvatars\?\.decorate\?\.\(avatar,peerName\)/);
assert.match(forum,/DDMemberAvatars\?\.decorate\?\.\(avatar,authorName\)/);
assert.match(forum,/main\.append\(makePostHead\(row,'reply',tools\)\)/); // Replies use the shared decorated author header.
assert.match(html,/assets\/member-avatars\.js/);
assert.match(fs.readFileSync('scripts/build_public_release.cjs','utf8'),/'member-avatars\.js'/);
const off={DD_COMMUNITY_FEATURES:{profileAvatars:false},DD_COMMUNITY_TEST_CONFIG:{environment:'production'}};
vm.runInNewContext(src,{window:off},{timeout:1000});
assert.equal(off.DDMemberAvatars,undefined);
let count=0;
const api={rpc:async()=>({data:[{name_key:'researchera',public_key:'cccc3333-cccc-4333-8ccc-cccccccccccc'}],error:null}),
 storage:{from:name=>{assert.equal(name,'dd-profile-avatars');return {download:async p=>{
 count++;assert.equal(p,'cccc3333-cccc-4333-8ccc-cccccccccccc/avatar.webp');
 return {data:'synthetic-avatar',error:null};}}}}};
const win={DD_COMMUNITY_FEATURES:{profileAvatars:true},
 DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://fake.invalid',publishableKey:'fake'},
 supabase:{createClient:()=>api}};
const document={createElement:tag=>({tag,setAttribute(){},remove(){}})};
const URL={createObjectURL:()=> 'blob:synthetic',revokeObjectURL:()=>{}};
vm.runInNewContext(src,{window:win,document,URL,Promise},{timeout:1000});
const el={isConnected:true,replaceChildren(x){this.child=x}};
(async()=>{await win.DDMemberAvatars.decorate(el,'Researcher_A');
 assert.equal(count,1);assert.equal(el.child.tag,'img');assert.equal(el.child.src,'blob:synthetic');
 console.log('PASS: public-name avatar rendered from opaque private-bucket lookup only while feature flag true.');})()
 .catch(e=>{console.error(e);process.exitCode=1});
