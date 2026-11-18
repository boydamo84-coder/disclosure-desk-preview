'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.resolve(__dirname,'../assets/community-research-private-drafts.js'),'utf8');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const id=n=>'f0000000-0000-4000-8000-'+String(n).padStart(12,'0');
function setup({host='localhost',flag=true}={}){
 let user={id:A,is_anonymous:false};const calls=[];
 const fixture=[...Array.from({length:65},(_,i)=>({
  id:id(i+1),author_id:A,revision:1,title:'Private paper '+(i+1),abstract:'Own draft',
  paper_type:'case',body:'VERY PRIVATE CONTENT '+i,source_urls:[],updated_at:new Date(2026,10,18,i%24,i%60).toISOString()
 })),...Array.from({length:4},(_,i)=>({id:id(i+70),author_id:B,revision:1,title:'Foreign paper',body:'FOREIGN DATA'}))];
 const db={
  auth:{getUser:async()=>({data:{user},error:null})},
  from(table){
   assert.equal(table,'dd_cr_drafts');
   const q={where:[],order:[],first:null,last:null,select:null};
   const b={
    select(fields){q.select=fields;return b},
    eq(k,v){q.where.push([k,v]);return b},
    order(k,opts){q.order.push([k,opts]);return b},
    range(first,last){q.first=first;q.last=last;return b},
    then(resolve,reject){
     calls.push(q);
     let data=fixture.filter(row=>q.where.every(([k,v])=>row[k]===v));
     data.sort((l,r)=>r.id.localeCompare(l.id));
     if(Number.isInteger(q.first))data=data.slice(q.first,q.last+1);
     const columns=q.select.split(',');
     data=data.map(row=>Object.fromEntries(columns.map(k=>[k,row[k]])));
     return Promise.resolve({data,error:null}).then(resolve,reject);
    }
   };
   return b;
  }
 };
 const window={
  DD_COMMUNITY_TEST_CONFIG:{environment:'test',communityResearchTestDatabase:true,
   url:'https://isolated-test.supabase.co',publishableKey:'sb_publishable_fixture'},
  DD_COMMUNITY_FEATURES:{communityResearchBackend:flag,researchPublishing:false},
  supabase:{createClient:()=>db}
 };
 vm.runInNewContext(code,{window,location:{hostname:host},String,Error,URL,Object,Array,Set,Promise,Number,Date});
 return {api:window.DDCommunityResearchDrafts,calls,changeUser:u=>{user=u}};
}
(async()=>{
 const off=setup({host:'uapdisclosuredesk.com'});
 assert.equal(off.api.enabled,false);
 const disabled=setup({flag:false});assert.equal(disabled.api.enabled,false);
 const h=setup();
 assert.equal(h.api.enabled,true);
 const first=await h.api.listMinePaged({page:0,pageSize:20});
 assert.equal(first.page,0);assert.equal(first.items.length,20);assert.equal(first.hasMore,true);
 assert(!h.calls[0].select.includes('body'),'Listing must not retrieve full private draft text');
 assert(!h.calls[0].select.includes('source_urls'),'Listing must not retrieve raw source URLs');
 assert.deepEqual(h.calls[0].where,[['author_id',A]]);
 assert.deepEqual([h.calls[0].first,h.calls[0].last],[0,20]);
 const second=await h.api.listMinePaged({page:1,pageSize:20});
 const fourth=await h.api.listMinePaged({page:3,pageSize:20});
 assert.equal(second.items.length,20);
 assert.equal(fourth.items.length,5);assert.equal(fourth.hasMore,false);
 assert.equal(new Set([...first.items,...second.items,...fourth.items].map(x=>x.id)).size,45,'No duplicate draft IDs across page slices');
 assert.deepEqual([h.calls[2].first,h.calls[2].last],[60,80]);
 assert(!JSON.stringify(fourth).includes('FOREIGN DATA'));
 const before=h.calls.length;
 for(const args of [{page:-1},{page:50001},{page:0,pageSize:21},{page:1.3},{page:0,pageSize:0}]){
  await assert.rejects(()=>h.api.listMinePaged(args),/Invalid private-draft page bounds/);
 }
 assert.equal(h.calls.length,before,'Invalid pages must never contact database');
 h.changeUser({id:B,is_anonymous:false});
 const other=await h.api.listMinePaged({page:0,pageSize:20});
 assert.equal(other.items.length,4);
 assert.deepEqual(h.calls.at(-1).where,[['author_id',B]]);
 h.changeUser({id:B,is_anonymous:true});
 await assert.rejects(()=>h.api.listMinePaged(),/registered Disclosure Desk account/);
 console.log('PASS M05 private draft pagination: 65 owner drafts beyond 50, 4 cross-account records isolated, metadata-only page, end-of-results detection, invalid bounds and disabled production gate.');
})().catch(e=>{console.error(e);process.exitCode=1});
