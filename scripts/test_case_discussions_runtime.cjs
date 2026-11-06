'use strict';
// Synthetic DOM-only regression for existing public case/news/video comments.
// Never accesses a live Supabase account or writes user data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('assets/case-discussions.js','utf8');
async function run(){
  function el(tag){
    const x={tag,children:[],style:{},hidden:false,disabled:false,isConnected:true,
      listeners:{},dataset:{},id:'',value:'',attrs:{},_text:'',
      append(...items){this.children.push(...items)},
      replaceChildren(...items){this.children=[...items];this._text=''},
      addEventListener(kind,fn){this.listeners[kind]=fn},
      setAttribute(name,value){this.attrs[name]=value},
      scrollIntoView(){},reset(){this.value=''},
      querySelector(selector){this._queries??=Object.create(null);return this._queries[selector]??(this._queries[selector]=el('button'))},
      get textContent(){return this._text},
      set textContent(v){this._text=String(v);this.children=[]}
    };
    return x;
  }
  const nodes=new Map(),body=el('body'),header=el('h2');
  const node=id=>{if(!nodes.has(id))nodes.set(id,el('div'));return nodes.get(id)};
  const document={readyState:'complete',body,createElement:el,
    getElementById:()=>null,querySelector:sel=>sel==='h2'?header:node(sel),
    addEventListener(){}};
  const pending=[],inserted=[];
  let auth=async()=>({data:{user:{id:'member-A',is_anonymous:false}},error:null});
  const api={
    auth:{getUser:()=>auth()},
    rpc(name,args){
      assert.equal(name,'dd_public_comments');
      return new Promise(resolve=>pending.push({id:args.p_case_id,resolve}));
    },
    from(name){assert.equal(name,'dd_case_comments');return {insert:async row=>{inserted.push(row);return {error:null}}}}
  };
  const window={DD_COMMUNITY_TEST_CONFIG:{url:'https://mock.invalid',publishableKey:'test',environment:'test'},
    supabase:{createClient:()=>api},DDPublicProfiles:{namesFor:async()=>({})},
    DDCommunityVotes:{mount(){}}};
  new Function('window','document',source)(window,document);
  const tick=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
  const response=(id,bodyText)=>{const i=pending.findIndex(x=>x.id===id);
    assert.notEqual(i,-1,'Expected pending request for '+id);
    const p=pending.splice(i,1)[0];
    p.resolve({data:[{id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',body:bodyText,created_at:'2026-11-06T12:00:00Z',is_mine:false}],error:null})};
  const contents=()=>JSON.stringify(node('#ddCaseDiscussionList').children);
  assert.equal(typeof window.ddOpenCaseDiscussion,'function');
  // A slower response must not replace B after the user switches cases.
  window.ddOpenCaseDiscussion('case-A');window.ddOpenCaseDiscussion('case-B');
  response('case-B','B recent conversation');await tick();
  assert.match(contents(),/B recent conversation/);
  response('case-A','A OLD conversation');await tick();
  assert.doesNotMatch(contents(),/A OLD conversation/);
  // Closing a conversation invalidates requests still in progress.
  window.ddOpenCaseDiscussion('case-C');
  node('#ddCaseDiscussionClose').onclick();
  response('case-C','C CLOSED conversation');await tick();
  assert.doesNotMatch(contents(),/C CLOSED conversation/);
  // Two refreshes of the same case must keep the latest response.
  window.ddOpenCaseDiscussion('case-D');window.ddOpenCaseDiscussion('case-D');
  const d2=pending.filter(x=>x.id==='case-D');
  assert.equal(d2.length,2);
  d2[1].resolve({data:[{id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',body:'D NEW conversation'}],error:null});
  pending.splice(pending.indexOf(d2[1]),1);await tick();
  d2[0].resolve({data:[{id:'cccccccc-cccc-cccc-cccc-cccccccccccc',body:'D OLD conversation'}],error:null});
  pending.splice(pending.indexOf(d2[0]),1);await tick();
  assert.match(contents(),/D NEW conversation/);
  assert.doesNotMatch(contents(),/D OLD conversation/);
  // While auth resolves, switching cases must cancel the queued write.
  let completeAuth;
  auth=()=>new Promise(resolve=>{completeAuth=resolve});
  window.ddOpenCaseDiscussion('case-E');
  const form=node('#ddCaseDiscussionForm');
  node('#ddCaseDiscussionBody').value='Fictional evidence discussion';
  const submit=form.onsubmit({preventDefault(){},target:form});
  await tick();assert.equal(typeof completeAuth,'function');
  window.ddOpenCaseDiscussion('case-F');
  completeAuth({data:{user:{id:'member-A',is_anonymous:false}},error:null});
  await submit;assert.equal(inserted.length,0,'Do not write an earlier draft into newly opened case');
  // A stable case is still allowed to submit the original comment.
  auth=async()=>({data:{user:{id:'member-A',is_anonymous:false}},error:null});
  window.ddOpenCaseDiscussion('case-G');
  node('#ddCaseDiscussionBody').value='Valid same-case post';
  const good=form.onsubmit({preventDefault(){},target:form});
  await tick();
  assert.equal(inserted.length,1);
  assert.equal(inserted[0].case_id,'case-G');
  assert.equal(inserted[0].body,'Valid same-case post');
  const refresh=pending.filter(x=>x.id==='case-G');
  assert.equal(refresh.length,2);
  // Resolve the newest refresh first; previous opening request may remain pending.
  refresh[1].resolve({data:[],error:null});pending.splice(pending.indexOf(refresh[1]),1);
  await good;
  refresh[0].resolve({data:[],error:null});pending.splice(pending.indexOf(refresh[0]),1);await tick();
  assert.equal(form.querySelector('button[type=submit]').disabled,false);
}
if(require.main===module){
  run().then(()=>console.log('PASS: stale public comments, closed dialog, same-case refresh and cross-case posting guarded'))
    .catch(err=>{console.error(err);process.exitCode=1});
}
module.exports=run;
