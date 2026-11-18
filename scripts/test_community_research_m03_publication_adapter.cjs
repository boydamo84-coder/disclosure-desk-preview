'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.resolve(__dirname,'../assets/community-research-publication.js'),'utf8');
const ID='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const PAPER='11111111-1111-4111-8111-111111111111';
function boot({host='localhost',test=true,backend=false,publishing=false,url='https://fixture.supabase.co',user={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',is_anonymous:false}}={}){
 const calls=[];let connections=0,current=user,forceError=null,mutatedResult=null;
 const db={
  auth:{getUser:async()=>({data:{user:current},error:null})},
  rpc:async(name,args)=>{
   calls.push({name,args});
   if(forceError)return {data:null,error:{message:forceError}};
   return {data:mutatedResult||{
    paper_id:args.p_paper_id||PAPER,
    edition:args.p_expected_edition===null?1:
      args.p_expected_edition+ (name==='dd_cr_publish_copy'?1:0),
    status:name==='dd_cr_withdraw_paper'?'withdrawn':'published'
   },error:null};
  }
 };
 const window={
  DD_COMMUNITY_TEST_CONFIG:{environment:test?'test':'production',communityResearchTestDatabase:true,
    url,publishableKey:'sb_publishable_fixture'},
  DD_COMMUNITY_FEATURES:{communityResearchBackend:backend,
    communityResearchPublishing:publishing,researchPublishing:false},
  supabase:{createClient(){connections++;return db}}
 };
 const context={window,location:{hostname:host},String,Promise,Object,Set,Number,Error};
 vm.runInNewContext(src,context,{filename:'community-research-publication.js'});
 return {api:window.DDCommunityResearchPublication,calls,connections:()=>connections,
  setUser:v=>{current=v},setError:e=>{forceError=e},setResult:r=>{mutatedResult=r}};
}
(async()=>{
 for(const host of ['localhost','127.0.0.1','uapdisclosuredesk.com','deploy-preview-17--uap-disclosure-desk.netlify.app']){
  for(const enabled of [false,true]){
   const h=boot({host,backend:enabled,publishing:false});
   assert.equal(h.api.enabled,false);
   assert.equal(h.connections(),0);
  }
 }
 assert.equal(boot({host:'uapdisclosuredesk.com',backend:true,publishing:true}).api.enabled,false,
  'Direct client-side flag modification must never activate production');
 assert.equal(boot({host:'localhost',test:false,backend:true,publishing:true}).api.enabled,false);
 assert.equal(boot({host:'localhost',backend:true,publishing:true,url:'https://omqxizswzcwgzqaczlhe.supabase.co'}).api.enabled,false,
  'Staged publishing must never accidentally use the connected production database');
 const h=boot({backend:true,publishing:true});
 assert.equal(h.api.enabled,true);
 for(const data of [
  {draftId:ID,revision:1,consent:false},
  {draftId:'not-uuid',revision:1,consent:true},
  {draftId:ID,revision:0,consent:true},
  {draftId:ID,revision:1,paperId:PAPER,consent:true},
  {draftId:ID,revision:1,edition:1,consent:true},
 ]){
  await assert.rejects(()=>h.api.publishDraft(data),Error,'Incomplete consent/ID/revision must block before network');
 }
 assert.equal(h.calls.length,0);
 const first=await h.api.publishDraft({draftId:ID,revision:1,consent:true});
 assert.equal(first.paperId,PAPER);
 assert.equal(first.edition,1);
 assert.equal(first.status,'published');
 assert.equal(h.calls[0].name,'dd_cr_publish_copy');
 assert.equal(h.calls[0].args.p_draft_id,ID);
 assert.equal(h.calls[0].args.p_expected_revision,1);
 assert.equal(h.calls[0].args.p_paper_id,null);
 assert.equal(h.calls[0].args.p_confirm_publication,true);
 const next=await h.api.publishDraft({draftId:ID,revision:2,
  paperId:PAPER,edition:1,consent:true});
 assert.equal(next.edition,2);
 assert.equal(h.calls[1].args.p_expected_edition,1);
 const third=await h.api.withdrawPaper({paperId:PAPER,edition:2,consent:true});
 assert.equal(third.status,'withdrawn');
 assert.equal(h.calls[2].name,'dd_cr_withdraw_paper');
 assert.equal(h.calls[2].args.p_confirm_withdrawal,true);
 await assert.rejects(()=>h.api.withdrawPaper({paperId:PAPER,edition:2,consent:false}),Error);
 assert.equal(h.calls.length,3);
 h.setUser({id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',is_anonymous:true});
 await assert.rejects(()=>h.api.publishDraft({draftId:ID,revision:2,consent:true}),/registered/);
 assert.equal(h.calls.length,3);
 h.setUser({id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',is_anonymous:false});
 h.setError('paper edition conflict');
 await assert.rejects(()=>h.api.publishDraft({draftId:ID,revision:2,consent:true}),/rejected/);
 assert.equal(h.calls.length,4);
 h.setError(null);h.setResult({paper_id:PAPER,edition:4,status:'published'});
 await assert.rejects(()=>h.api.publishDraft({draftId:ID,revision:1,consent:true}),/expected edition/);
 assert(!src.includes('.from(')&&!src.includes('.insert(')&&!src.includes('.upsert('),
 'The publication client must only use narrowly scoped RPCs');
 assert(!/service_role|secret_key|localStorage/.test(src),'No high privilege client or local plaintext draft');
 console.log('PASS M03 client: cold flags, production deny, positive consent, first and revised edition, withdrawal, member refresh, error rejection and RPC-only writes.');
})().catch(e=>{console.error(e);process.exitCode=1});
