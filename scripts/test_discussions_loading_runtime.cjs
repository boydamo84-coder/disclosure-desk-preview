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

let authListener,hold=false,queue=[],calls=[];
const sectionId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const threadId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const section={id:sectionId,title:'Public subject',description:'Research',topic:'UAP',thread_count:1};
const row=title=>({id:threadId,section_id:sectionId,section_title:section.title,title,body:'Public fictional post',created_at:'2026-11-05T09:00:00Z',likes:2,dislikes:0,total_count:1});
const api={auth:{
 onAuthStateChange:cb=>{authListener=cb;return {data:{subscription:{unsubscribe(){}}}}},
 getUser:async()=>({data:{user:null},error:null})
},rpc:(name,args)=>{
 calls.push({name,args});
 if(['dd_discussions_sections','dd_discussions_global_feed'].includes(name)){
  if(hold)return new Promise(resolve=>queue.push({name,args,resolve}));
  return Promise.resolve({data:name==='dd_discussions_sections'?[section]:[row('Original post')],error:null});
 }
 return Promise.resolve({data:[],error:null});
}};
const storage=new Map(),localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const window={DD_COMMUNITY_FEATURES:{discussions:true},DD_COMMUNITY_TEST_CONFIG:{environment:'test',url:'https://synthetic.invalid',publishableKey:'synthetic'},supabase:{createClient:()=>api},navigateTo:()=>{}};
const location={search:''};
vm.runInNewContext(source,{window,document,URL,URLSearchParams,location,Date,localStorage,prompt:()=>null,confirm:()=>false},{timeout:1700});
async function flush(){for(let i=0;i<40;i++)await Promise.resolve()}
function allText(n){return [n.textContent,...(n.children||[]).map(allText)].join(' ')}
const feed=byId('ddForumGlobalFeed'),status=byId('ddForumGlobalStatus'),retry=byId('ddForumGlobalRetry'),directory=byId('ddForumSections');
function take(name,sort){const i=queue.findIndex(q=>q.name===name&&(!sort||q.args.p_sort===sort));assert(i>=0,'Pending '+name);return queue.splice(i,1)[0]}
function answer(request,data){request.resolve({data,error:null})}
function fail(request){request.resolve({data:null,error:{message:'Mock network failure'}})}
const global='dd_discussions_global_feed',subjects='dd_discussions_sections';
await flush();
hold=true;
// Sign-out starts fresh reads in parallel; the section read is deliberately held.
authListener('INITIAL_SESSION',null);
assert.match(allText(feed),/Loading discussions/);
assert.match(status.textContent,/Loading/);
let firstFeed=take(global),firstSubjects=take(subjects);
assert.equal(firstFeed.args.p_offset,0);
answer(firstFeed,[row('First guest post')]);await flush();
assert.match(allText(feed),/First guest post/,'Posts render without waiting for subjects');
assert.match(allText(directory),/Loading discussion subjects/);
answer(firstSubjects,[section]);await flush();
assert.match(allText(directory),/Public subject/);
// Revisit keeps already rendered posts, does not duplicate requests and starts from offset 0.
void window.DDDiscussions.refresh();
assert.match(allText(feed),/First guest post/);
assert.match(status.textContent,/Updating discussions/);
let refreshFeed=take(global),refreshSubjects=take(subjects);
assert.equal(refreshFeed.args.p_offset,0);
void window.DDDiscussions.refresh();
assert(!queue.some(q=>q.name===global),'No overlapping background global feed requests');
let nextSubjects=take(subjects);
answer(refreshSubjects,[section]);answer(nextSubjects,[section]);fail(refreshFeed);await flush();
assert.match(allText(feed),/First guest post/);
assert.match(status.textContent,/Could not refresh/);
assert.equal(retry.hidden,false,'Visible retry after failure');
retry.onclick();let retryFeed=take(global);
answer(retryFeed,[row('Updated post')]);await flush();
assert.match(allText(feed),/Updated post/);
assert.equal(retry.hidden,true);
// Changing sort supersedes an in-flight refresh; no stale content flash.
void window.DDDiscussions.refresh();let old=take(global),oldSubjects=take(subjects);
byId('ddForumGlobalSort').onchange({target:{value:'new'}});
assert.doesNotMatch(allText(feed),/Updated post/);
let sorted=take(global,'new');answer(sorted,[row('New sort post')]);answer(old,[row('Stale sort result')]);answer(oldSubjects,[section]);await flush();
assert.match(allText(feed),/New sort post/);assert.doesNotMatch(allText(feed),/Stale sort result/);
// Identity changes clear same-account cached rows and reject results from the old session.
void window.DDDiscussions.refresh();let oldAccount=take(global),oldAccountSubjects=take(subjects);
authListener('SIGNED_IN',{user:{id:'other-user'}});
assert.doesNotMatch(allText(feed),/New sort post/);
let newAccount=take(global),newSubjects=take(subjects);
answer(newAccount,[row('Other account public post')]);answer(newSubjects,[section]);answer(oldAccount,[row('Old account stale post')]);answer(oldAccountSubjects,[section]);await flush();
assert.match(allText(feed),/Other account public post/);
assert.doesNotMatch(allText(feed),/Old account stale post/);
// A subject-list failure does not erase the independently successful feed.
void window.DDDiscussions.refresh();let independent=take(global),failedSubjects=take(subjects);
fail(failedSubjects);answer(independent,[row('Feed still available')]);await flush();
assert.match(allText(feed),/Feed still available/);
assert.match(byId('ddForumStatus').textContent,/subjects are temporarily unavailable/);
// Deep links still wait for the requested section rather than displaying another feed.
location.search='?dd_section='+sectionId;
authListener('SIGNED_OUT',null);
assert(!queue.some(q=>q.name===global),'Deep link retains subject-first resolution');
answer(take(subjects),[section]);await flush();
assert.equal(byId('ddForumThreadTitle').textContent,'Public subject');
assert(!queue.length,'All fixtures resolved');
})().then(()=>console.log('PASS: parallel guest reads, loading status, preserved refresh, retry, duplicate protection, sort and account isolation')).catch(e=>{console.error(e);process.exitCode=1});
