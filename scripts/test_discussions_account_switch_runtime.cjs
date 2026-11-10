'use strict';
// Synthetic browser test of staged Discussions, with NO Supabase or live records.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/community-discussions.js','utf8');
const useVm=true;
(async()=>{
function element(tag){
 const e={tag,children:[],attrs:{},dataset:{},listeners:{},style:{},hidden:false,value:'',className:'',
  disabled:false,textContent:'',classList:{contains:()=>false},
  elements:{namedItem:()=>({value:''})},
  append(...items){this.children.push(...items)},prepend(...items){this.children.unshift(...items)},
  insertBefore(item,before){const index=this.children.indexOf(before);if(index<0)this.children.push(item);else this.children.splice(index,0,item);return item},
  replaceChildren(...items){this.children=[...items]},setAttribute(k,v){this.attrs[k]=v},
  removeAttribute(k){delete this.attrs[k]},addEventListener(k,fn){this.listeners[k]=fn},
  after(){},reset(){},contains(){return false},querySelector(){return element('button')}
 };
 return e;
}
const ids=new Map();
const byId=id=>{if(!ids.has(id))ids.set(id,element(id==='discussionsPage'?'section':'div'));return ids.get(id)};
const witness=element('button'),document={readyState:'complete',
 createElement:element,createTextNode:s=>{const e=element('#text');e.textContent=s;return e},
 getElementById:byId,querySelector:()=>witness,addEventListener(){}};
class TestURL {constructor(s){if(!/^https?:\/\//.test(String(s||'')))throw Error('Invalid mock URL');this.protocol='https:';this.username='';this.password='';this.href=String(s);this.hostname='test.invalid'}}
const Url=useVm?require('node:url').URL:TestURL;
let user='A',authListener,resolveOldThreads,resolveDelayedUser,delayAuth=false;
const sectionId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const threadId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const sectionA={id:sectionId,title:'A Research Section',description:'Sources',topic:'UAP',is_steward:true};
const sectionB={...sectionA,is_steward:false,created_at:'2026-11-04T08:00:00Z'};
const sectionC={id:'cccccccc-cccc-cccc-cccc-cccccccccccc',title:'Newly added subject',description:'Newest last',topic:'UAP',is_steward:false,created_at:'2026-11-10T08:00:00Z'};
const bThread={id:threadId,title:'Shared public evidence',body:'Non-sensitive fictional post',
 created_at:'2026-11-05T09:00:00Z',is_mine:false,is_pinned:false,likes:2,dislikes:0};
const calls=[];
const api={auth:{
 onAuthStateChange:cb=>{authListener=cb;return {data:{subscription:{unsubscribe(){}}}}},
 getUser:async()=>delayAuth?new Promise(resolve=>{resolveDelayedUser=resolve}):
  ({data:{user:user?{id:user,is_anonymous:false}:null},error:null})
},rpc:async(name,args)=>{
 calls.push({name,args,user});
 if(name==='dd_discussions_sections')return {data:user==='A'?[sectionA]:[sectionC,sectionB],error:null};
 if(name==='dd_discussions_threads'){
  if(user==='A')return new Promise(resolve=>{resolveOldThreads=resolve});
  return {data:[bThread],error:null};
 }
 if(name==='dd_discussions_vote')return {data:true,error:null};
 if(name==='dd_discussions_replies')return {data:Array.from({length:6},(_,i)=>({
  id:'dddddddd-dddd-dddd-dddd-'+String(i+1).padStart(12,'0'),
  body:'Independent visible comment '+(i+1),author_name:'Mock reader',
  created_at:'2026-11-10T10:00:00Z',likes:0,dislikes:0,is_mine:false
 })),error:null};
 throw Error('Unexpected RPC '+name);
}};
const browserStorage=new Map(),localStorage={getItem:k=>browserStorage.get(k)||null,setItem:(k,v)=>browserStorage.set(k,String(v)),removeItem:k=>browserStorage.delete(k)};
const window={DD_COMMUNITY_FEATURES:{discussions:true},DD_COMMUNITY_TEST_CONFIG:{
 environment:'test',url:'https://synthetic.invalid',publishableKey:'synthetic'},
 supabase:{createClient:()=>api},navigateTo:()=>{}};
if(useVm)vm.runInNewContext(source,{window,document,URL:Url,Date,localStorage,prompt:()=>null,confirm:()=>false},{timeout:1700});
else new Function('window','document','URL','Date','prompt','confirm',source)(window,document,Url,Date,()=>null,()=>false);
async function flush(){for(let i=0;i<32;i++)await Promise.resolve()}
function walk(node){return [node,...(node.children||[]).flatMap(walk)]}
function allText(node){return walk(node).map(n=>String(n.textContent||'')).join(' ')}
assert.equal(typeof authListener,'function','Forum must observe auth state changes');
authListener('INITIAL_SESSION',{user:{id:'A'}});await flush();
assert.match(allText(byId('ddForumSections')),/A Research Section/,'A sees sections');
const starA=walk(byId('ddForumSections')).find(node=>node.dataset?.sectionFavourite===sectionId);
assert.equal(!!starA,true,'Every subject card offers a favourite star');
starA.onclick();await flush();
assert.equal(byId('ddForumFavouriteGroup').hidden,false,'A sees a quick-access favourites area');
assert.match(allText(byId('ddForumFavouritesNav')),/A Research Section/,'A saved subject appears in favourites');
assert.equal(JSON.parse(browserStorage.get('dd-forum-favourite-sections-v1:A')).includes(sectionId),true,
 'Saved section persists only under account A key');
const enterA=byId('ddForumSections').children[0].children[0];
enterA.onclick();await flush();
assert.equal(typeof resolveOldThreads,'function','A thread fetch is held mid-flight');
assert.equal(byId('ddForumStewardPanel').hidden,false,'A can see its steward controls');
user='B';authListener('SIGNED_IN',{user:{id:'B'}});await flush();
assert.equal(byId('ddForumStewardPanel').hidden,true,'B must not inherit A steward controls');
assert.equal(byId('ddForumThreadPane').hidden,true,'B sees section directory, not A thread context');
assert.match(allText(byId('ddForumSections')),/A Research Section/,'B can still read public section');
assert.equal(byId('ddForumFavouriteGroup').hidden,true,'B does not inherit A account favourites');
assert.equal(byId('ddForumSections').children.length,2,'Both original and new sections appear');
assert.match(allText(byId('ddForumSections').children[0]),/A Research Section/,'Original section retains its position');
assert.match(allText(byId('ddForumSections').children[1]),/Newly added subject/,'Newest section appends at the bottom');
const starB=walk(byId('ddForumSections')).find(node=>node.dataset?.sectionFavourite===sectionId);
starB.onclick();await flush();
assert.equal(JSON.parse(browserStorage.get('dd-forum-favourite-sections-v1:B')).includes(sectionId),true,
 'B can independently favourite the shared public section');
assert.equal(byId('ddForumFavouriteGroup').hidden,false,'B sees their own favourites');
resolveOldThreads({data:[{...bThread,is_mine:true,title:'STAGED_A_ONLY_STEWARD_REPLY'}],error:null});
await flush();
assert.doesNotMatch(allText(byId('ddForumPostList')),/STAGED_A_ONLY_STEWARD_REPLY/,'Stale A result cannot render for B');
const enterB=byId('ddForumSections').children[0].children[0];
enterB.onclick();await flush();
assert.match(allText(byId('ddForumPostList')),/Shared public evidence/,'B loads public topic list');
assert.equal(byId('ddForumStewardPanel').hidden,true,'B steward panel stays hidden');
const openB=walk(byId('ddForumPostList')).find(n=>n.tag==='button'&&n.textContent==='Shared public evidence');
assert.equal(!!openB,true,'The post remains accessible');
openB.onclick();await flush();
assert.equal(byId('ddForumReplyPane').hidden,false,'Post detail opens immediately');
assert.equal(byId('ddForumReplyCreate').hidden,false,'Comment editor is immediately available');
for(let i=1;i<=6;i++)assert.match(allText(byId('ddForumReplies')),new RegExp('Independent visible comment '+i),
 'All six comments load automatically without Read more');
const forumButtons=walk(byId('ddForumPostList')).filter(n=>n.tag==='button').map(n=>n.textContent);
assert.equal(forumButtons.some(t=>/Pin|Edit my|Withdraw my|Escalate to site owner/.test(t)),false,
 'B must not see A author/steward-only actions');
const before=byId('ddForumPostList').children.length;
authListener('TOKEN_REFRESHED',{user:{id:'B'}});await flush();
assert.equal(byId('ddForumPostList').children.length,before,'Same-account token refresh preserves browsing state');
delayAuth=true;
const like=walk(byId('ddForumPostList')).find(n=>n.tag==='button'&&n.textContent.startsWith('▲'));
assert.equal(!!like,true,'B sees public voting control');
like.onclick();await flush();
assert.equal(typeof resolveDelayedUser,'function','Hold account verification across sign-out');
user=null;authListener('SIGNED_OUT',null);await flush();
resolveDelayedUser({data:{user:{id:'B',is_anonymous:false}},error:null});
await flush();
assert.equal(calls.some(c=>c.name==='dd_discussions_vote'),false,
 'Stale queued vote must not execute after identity change');
assert.equal(byId('ddForumStewardPanel').hidden,true,'Signing out removes private steward UI');
})().then(()=>console.log('PASS: forum account-switch state, stewardship, stale fetch and queued-vote guards')).catch(e=>{console.error(e);process.exitCode=1});
