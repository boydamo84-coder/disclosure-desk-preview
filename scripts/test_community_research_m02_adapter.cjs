'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../assets/community-research-private-drafts.js'),'utf8');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const draftId='66666666-6666-4666-8666-666666666666';
const input={title:'A privately saved research paper',abstract:'Provisional summary only',body:'Draft for future review',paper_type:'case',source_urls:['https://example.org/original']};
function boot({host='localhost',flag=false,user={id:A,is_anonymous:false}}={}){
 const calls=[];let current=user;let dbConnections=0;
 const db={
  auth:{getUser:async()=>({data:{user:current},error:null})},
  from(table){
   if(table!=='dd_cr_drafts')throw Error('Unexpected table '+table);
   const q={table,where:[],data:null,mode:null,select:null};
   const builder={
    insert(data){q.mode='insert';q.data=data;return builder},
    update(data){q.mode='update';q.data=data;return builder},
    delete(){q.mode='delete';return builder},
    select(columns){q.select=columns;if(!q.mode)q.mode='list';return builder},
    eq(key,value){q.where.push([key,value]);return builder},
    order(key,options){q.order=[key,options];return builder},
    limit(value){q.limit=value;return builder},
    async single(){calls.push(q);return {data:{id:draftId,revision:1,...q.data},error:null}},
    async maybeSingle(){calls.push(q);return {data:q.mode==='delete'?{id:draftId}:{id:draftId,revision:2,...q.data},error:null}},
    then(resolve,reject){calls.push(q);return Promise.resolve({data:[],error:null}).then(resolve,reject)}
   };
   return builder;
  }
 };
 const window={DD_COMMUNITY_TEST_CONFIG:{environment:'test',communityResearchTestDatabase:true,url:'https://example.supabase.co',publishableKey:'sb_publishable_fixture'},
  DD_COMMUNITY_FEATURES:{communityResearchBackend:flag,researchPublishing:false},
  supabase:{createClient(){dbConnections++;return db}}
 };
 const context={window,location:{hostname:host},URL,Error,String,Set,Number,Object,Array,Promise};
 vm.runInNewContext(src,context,{filename:'community-research-private-drafts.js'});
 return {api:window.DDCommunityResearchDrafts,calls,setUser:u=>{current=u},getConnections:()=>dbConnections};
}
(async()=>{
 for(const host of ['localhost','127.0.0.1','uapdisclosuredesk.com','deploy-preview-23--uap-disclosure-desk.netlify.app']){
  const h=boot({host,flag:false});
  assert.equal(h.api.enabled,false);
  assert.equal(h.getConnections(),0,'No network or client on disabled flag');
 }
 const live=boot({host:'uapdisclosuredesk.com',flag:true});
 assert.equal(live.api.enabled,false,'Production must never be activated by browser-level flag');
 const h=boot({host:'localhost',flag:true});
 assert.equal(h.api.enabled,true);
 assert.deepEqual(await h.api.listMine(),[]);
 assert.deepEqual(h.calls[0].where,[['author_id',A]],'Draft list must scope owner id');
 const created=await h.api.saveMine(input);
 assert.equal(created.revision,1);
 assert.equal(h.calls[1].mode,'insert');
 assert.equal(h.calls[1].data.title,input.title);
 assert.equal(h.calls[1].data.author_id,undefined,'Server must assign draft ownership');
 const saved=await h.api.saveMine(input,{id:draftId,expectedRevision:1});
 assert.equal(saved.revision,2);
 assert.deepEqual(h.calls[2].where,[['id',draftId],['author_id',A],['revision',1]],'Optimistic owner+revision check');
 await h.api.deleteMine(draftId);
 assert.deepEqual(h.calls[3].where,[['id',draftId],['author_id',A]],'Delete must scope owner');
 assert.equal(h.calls[3].mode,'delete');
 const count=h.calls.length;
 await assert.rejects(()=>h.api.saveMine({...input,source_urls:['javascript:alert(1)']}),/HTTPS links/);
 await assert.rejects(()=>h.api.saveMine({...input,body:'X'.repeat(30001)}),/permitted limits/);
 await assert.rejects(()=>h.api.saveMine(input,{id:'wrong-id',expectedRevision:1}),/valid private draft ID/);
 assert.equal(h.calls.length,count,'Invalid drafts cannot reach the backend');
 h.setUser({id:A,is_anonymous:true});
 await assert.rejects(()=>h.api.saveMine(input),/registered Disclosure Desk account/);
 h.setUser({id:B,is_anonymous:false});
 await h.api.listMine();
 assert.deepEqual(h.calls.at(-1).where,[['author_id',B]],'Account switch must never reuse prior owner filter');
 assert(!src.includes('localStorage'),'Private research text must not be persisted in browser storage');
 assert(!/\.from\(['"](?:research_documents|dd_cr_publications|dd_cr_editions|dd_cr_votes|dd_cr_comments)/.test(src),
  'Private adapter cannot access W.NE records or public/social tables');
 assert(!src.includes('security_role')&&!src.includes('service_role'),'No privileged key');
 console.log('PASS M02 author adapter: cold flag, production deny, own draft lifecycle, revision compare, HTTPS validation, anonymous reject, account switch; no public publish or W.NE writes.');
})().catch(e=>{console.error(e);process.exitCode=1});
