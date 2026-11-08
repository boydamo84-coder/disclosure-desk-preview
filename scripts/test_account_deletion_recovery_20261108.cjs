"use strict";
// Milestone 24: entirely offline, synthetic staging / operator recovery drill.
// Never contacts real Auth, Storage, Supabase, Netlify or the public website.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");

const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const OLD_LEASE="33333333-3333-4333-8333-333333333333";
const NEW_LEASE="44444444-4444-4444-8444-444444444444";
const TICKET="55555555-5555-4555-8555-555555555555";
const WRONG_TICKET="66666666-6666-4666-8666-666666666666";
const iso=n=>new Date(Date.now()+n*1000).toISOString();

(async()=>{
 const {resumeDeletionWithOperatorApproval}=await import(
   pathToFileURL(path.resolve(__dirname,"../supabase/functions/dd-account-deletion/operator-recovery-core.mjs")).href
 );
 const {REDACTED_THREAD,REDACTED_REPLY}=await import(
   pathToFileURL(path.resolve(__dirname,"../supabase/functions/dd-account-deletion/execution-core.mjs")).href
 );
 let passed=0;
 const test=async(label,fn)=>{await fn();passed++;console.log("PASS M24 "+label);};
 function sandbox(initialPhase="forum_redacted") {
   const users=new Set([A,B]);
   const objects=[
     {bucket_id:"dd-profile-avatars",name:"opaque-A/avatar.webp",owner_id:A},
     {bucket_id:"research-images",name:"research-A/orphan.jpeg",owner_id:A},
     {bucket_id:"dd-profile-avatars",name:"opaque-B/avatar.webp",owner_id:B},
   ];
   const threads=[
     {id:"thread-A",author_id:A,title:initialPhase==="approved"?"Personal evidence":REDACTED_THREAD.title,
      body:initialPhase==="approved"?"A's private evidence":REDACTED_THREAD.body,
      image_url:initialPhase==="approved"?"https://example.org/a.png":null,link_url:null},
     {id:"thread-B",author_id:B,title:"B's untouched thread",body:"B's content",image_url:null,link_url:null},
   ];
   const replies=[
     {id:"B-on-A",thread_id:"thread-A",author_id:B,body:"I disagree, B's reply"},
     {id:"A-on-B",thread_id:"thread-B",author_id:A,body:initialPhase==="approved"?"A's reply":REDACTED_REPLY},
   ];
   const state={
     users,objects,threads,replies,writeFrozen:true,staging:true,
     protectedA:false,storageFailure:false,checkpointFailure:"",
     leaseLost:false,lateObject:false,authDeletionFailure:false,
     modified:0,claimCount:0,storageRemoved:[],authDeletes:0,history:[],
     job:{
       account_id:A,phase:initialPhase,lease_token:OLD_LEASE,
       lease_expires_at:iso(-120),manifest:objects.filter(x=>x.owner_id===A).map(x=>({...x})),
       intent_digest:null,confirmed_at:iso(-500),reauthenticated_at:iso(-600),
     },
     approvals:new Map([
       [TICKET,{account_id:A,phase:initialPhase,reviewer:"reviewer-two",
         operator:"operator-one",reason:"storage_failure",expiry:iso(1800),consumed:false}],
       [WRONG_TICKET,{account_id:B,phase:initialPhase,reviewer:"reviewer-two",
         operator:"operator-one",reason:"storage_failure",expiry:iso(1800),consumed:false}],
     ])
   };
   const backend={
     assertStagingEnvironment:async()=>state.staging,
     readPrivateJob:async id=>id===state.job.account_id?{
       ...state.job,manifest:state.job.manifest.map(x=>({...x}))
     }:null,
     verifyWriteFreeze:async id=>id===A&&state.writeFrozen,
     reclaimWithDbaTicket:async(id,ticketId,newLease)=>{
       const ticket=state.approvals.get(ticketId);
       if(!ticket||ticket.consumed||ticket.account_id!==id||
         ticket.phase!==state.job.phase||ticket.expiry<=iso(0)||
         ticket.operator===ticket.reviewer||
         Date.parse(state.job.lease_expires_at)>=Date.now()||
         state.job.phase==="complete")return false;
       ticket.consumed=true;state.claimCount++;
       state.job.lease_token=newLease;state.job.lease_expires_at=iso(900);
       return true;
     },
     makeExecutionAdapter:async()=>{
       return {
         assertLeaseActive:async(id,lease,phase)=> id===A&&
           !state.leaseLost&&state.job.lease_token===lease&&
           state.job.phase===phase&&Date.parse(state.job.lease_expires_at)>Date.now(),
         assertNotPrivilegedOwner:async id=>{
           if(id===A&&state.protectedA)throw Error("protected_owner");
         },
         redactOwnForumText:async id=>{
           state.modified++;
           for(const thread of state.threads)
             if(thread.author_id===id)Object.assign(thread,REDACTED_THREAD);
           for(const reply of state.replies)
             if(reply.author_id===id)reply.body=REDACTED_REPLY;
         },
         enumerateOwnedObjects:async id=>state.objects.filter(x=>x.owner_id===id).map(x=>({...x})),
         removeOwnedObject:async(id,bucket,name)=>{
           if(state.storageFailure){state.storageFailure=false;throw Error("simulated_storage_outage");}
           const before=state.objects.length;
           state.objects=state.objects.filter(x=>
             !(x.owner_id===id&&x.bucket_id===bucket&&x.name===name));
           if(state.objects.length<before)state.storageRemoved.push(bucket+"/"+name);
           if(state.lateObject){state.lateObject=false;state.objects.push({
             owner_id:A,bucket_id:"research-images",name:"newly-uploaded/orphan.png"
           });}
         },
         accountExists:async id=>state.users.has(id),
         deleteAuthAccount:async id=>{
           if(state.authDeletionFailure)throw Error("simulated_auth_outage");
           state.authDeletes++;state.users.delete(id);
         },
         advancePhase:async(id,lease,before,after)=>{
           if(state.checkpointFailure===after){
             state.checkpointFailure="";throw Error("checkpoint_unavailable");
           }
           assert.equal(id,A);assert.equal(lease,NEW_LEASE);
           assert.equal(state.job.phase,before);
           state.job.phase=after;state.history.push(after);
           if(after==="complete"){state.job.manifest=[];state.job.lease_token=null;}
         }
       };
     }
   };
   const request=(ticketId=TICKET)=>({accountId:A,approvalTicketId:ticketId,leaseId:NEW_LEASE});
   return {state,backend,request};
 }

 await test("operator resume of partial Storage stage keeps B's avatar and reply",async()=>{
   const x=sandbox();
   const outcome=await resumeDeletionWithOperatorApproval(x.request(),x.backend);
   assert.equal(outcome.complete,true);
   assert.equal(x.state.job.phase,"complete");
   assert.equal(x.state.users.has(A),false);assert.equal(x.state.users.has(B),true);
   assert.equal(x.state.objects.length,1);
   assert.equal(x.state.objects[0].owner_id,B);
   assert.equal(x.state.replies[0].body,"I disagree, B's reply");
   assert.deepEqual(x.state.history,["storage_cleared","auth_removed","complete"]);
 });

 await test("operator can resume approved stage while redacting A, preserving B",async()=>{
   const x=sandbox("approved");
   await resumeDeletionWithOperatorApproval(x.request(),x.backend);
   assert.equal(x.state.threads[0].title,"Account deleted");
   assert.equal(x.state.threads[0].image_url,null);
   assert.equal(x.state.threads[1].title,"B's untouched thread");
   assert.equal(x.state.replies[0].body,"I disagree, B's reply");
   assert.equal(x.state.replies[1].body,REDACTED_REPLY);
 });

 await test("if Auth was deleted but checkpoint failed, resume completes without second delete",async()=>{
   const x=sandbox("storage_cleared");x.state.users.delete(A);
   x.state.objects=x.state.objects.filter(o=>o.owner_id!==A);
   const out=await resumeDeletionWithOperatorApproval(x.request(),x.backend);
   assert.equal(out.complete,true);assert.equal(x.state.authDeletes,0);
   assert.equal(x.state.users.has(B),true);
 });

 await test("Auth removed checkpoint requires absence of A before completion",async()=>{
   const x=sandbox("auth_removed");
   x.state.objects=x.state.objects.filter(o=>o.owner_id!==A);
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/auth_deletion_unverified/);
   assert.equal(x.state.job.phase,"auth_removed");
 });

 await test("missing verified write freeze refuses before a DBA approval is consumed",async()=>{
   const x=sandbox();x.state.writeFrozen=false;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/write_freeze_not_verified/);
   assert.equal(x.state.claimCount,0);assert.equal(x.state.modified,0);
 });

 await test("staging environment must be independently verified",async()=>{
   const x=sandbox();x.state.staging=false;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/staging_environment_required/);
   assert.equal(x.state.claimCount,0);
 });

 await test("active prior lease cannot be stolen",async()=>{
   const x=sandbox();x.state.job.lease_expires_at=iso(180);
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/existing_lease_not_expired/);
   assert.equal(x.state.claimCount,0);
 });

 await test("ticket tied to account B cannot delete account A",async()=>{
   const x=sandbox();
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(WRONG_TICKET),x.backend),/recovery_approval_refused/);
   assert.equal(x.state.users.has(A),true);assert.equal(x.state.users.has(B),true);
   assert.equal(x.state.claimCount,0);
 });

 await test("wrong ticket phase is rejected",async()=>{
   const x=sandbox();x.state.approvals.get(TICKET).phase="approved";
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/recovery_approval_refused/);
   assert.equal(x.state.claimCount,0);
 });

 await test("expired private DBA ticket cannot be used",async()=>{
   const x=sandbox();x.state.approvals.get(TICKET).expiry=iso(-10);
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/recovery_approval_refused/);
   assert.equal(x.state.claimCount,0);
 });

 await test("ticket requiring two distinct reviewers refuses same-person signoff",async()=>{
   const x=sandbox();x.state.approvals.get(TICKET).reviewer="operator-one";
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/recovery_approval_refused/);
 });

 await test("malformed persisted manifest refuses without consuming approval",async()=>{
   const x=sandbox();
   x.state.job.manifest[0].owner_id=B;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/foreign_storage_owner/);
   assert.equal(x.state.claimCount,0);
 });

 await test("prepared (unconfirmed) job never qualifies for operator recovery",async()=>{
   const x=sandbox("prepared");
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/not_recoverable/);
   assert.equal(x.state.claimCount,0);
 });

 await test("completed job cannot be resurrected",async()=>{
   const x=sandbox("complete");
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/not_recoverable/);
 });

 await test("lost lease after claim stops destructive actions",async()=>{
   const x=sandbox();x.state.leaseLost=true;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/lease_not_current/);
   assert.equal(x.state.storageRemoved.length,0);assert.equal(x.state.authDeletes,0);
 });

 await test("protected site owner stops recovery before deleting files or Auth",async()=>{
   const x=sandbox();x.state.protectedA=true;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/protected_owner/);
   assert.equal(x.state.storageRemoved.length,0);assert.equal(x.state.authDeletes,0);
 });

 await test("late orphan upload stops before Auth removal and requires separate new approval",async()=>{
   const x=sandbox();x.state.lateObject=true;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/storage_objects_remaining/);
   assert.equal(x.state.users.has(A),true);
   assert.equal(x.state.job.phase,"forum_redacted");
   assert.equal(x.state.claimCount,1);
 });

 await test("simulated Storage outage leaves job resumable without false success",async()=>{
   const x=sandbox();x.state.storageFailure=true;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/simulated_storage_outage/);
   assert.equal(x.state.users.has(A),true);assert.equal(x.state.claimCount,1);
   assert.equal(x.state.job.phase,"forum_redacted");
 });

 await test("interrupted Auth call does not silently mark job complete",async()=>{
   const x=sandbox("storage_cleared");x.state.objects=x.state.objects.filter(o=>o.owner_id!==A);
   x.state.authDeletionFailure=true;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/simulated_auth_outage/);
   assert.equal(x.state.users.has(A),true);assert.equal(x.state.job.phase,"storage_cleared");
 });

 await test("one-use ticket cannot be reclaimed twice",async()=>{
   const x=sandbox();x.state.leaseLost=true;
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/lease_not_current/);
   x.state.leaseLost=false;x.state.job.lease_expires_at=iso(-120);
   await assert.rejects(resumeDeletionWithOperatorApproval(x.request(),x.backend),/recovery_approval_refused/);
   assert.equal(x.state.claimCount,1);
 });

 await test("DBA private recovery schema is not public / service-writable",async()=>{
   const sql=fs.readFileSync(path.resolve(__dirname,"../supabase/ACCOUNT_DELETION_BACKEND_DRAFT_NOT_APPLIED.sql"),"utf8");
   assert.equal((sql.match(/^BEGIN;$/gm)||[]).length,1);
   assert.equal((sql.match(/^COMMIT;$/gm)||[]).length,1);
   const names=[...sql.matchAll(/CREATE OR REPLACE FUNCTION public\.([a-z_]+)/g)].map(x=>x[1]);
   assert.equal(names.length,8);assert.equal(new Set(names).size,names.length);
   assert.equal((sql.match(/\bAS \$\$/g)||[]).length,8);
   assert.equal((sql.match(/\bEND \$\$;/g)||[]).length,8);
   assert.doesNotMatch(sql,/CREATE SCHEMA IF NOT EXISTS dd_internal/);
   assert.doesNotMatch(sql,/DECLARE v_ticket[^\n]*;\nDECLARE /);
   const packager=fs.readFileSync(path.resolve(__dirname,"build_public_release.cjs"),"utf8");
   assert.equal(packager.includes("operator-recovery-core.mjs"),false);
   assert.equal(packager.includes("execute-staging-only.ts"),false);
   assert.equal(packager.includes("ACCOUNT_DELETION_BACKEND_DRAFT_NOT_APPLIED.sql"),false);
   assert.match(sql,/CREATE TABLE IF NOT EXISTS dd_deletion_private\.dd_deletion_recovery_approvals/);
   assert.match(sql,/REVOKE ALL ON dd_deletion_private\.dd_deletion_recovery_approvals\s+FROM PUBLIC, anon, authenticated, service_role/);
   assert.match(sql,/SELECT \* INTO v_ticket FROM dd_deletion_private\.dd_deletion_recovery_approvals/);
   assert.match(sql,/v_ticket\.expires_at<=now\(\)/);
   assert.match(sql,/lease_expires_at<now\(\)/);
   assert.match(sql,/v_ticket\.expected_phase/);
   assert.match(sql,/dd_deletion_prepare\(\s+p_target uuid,p_session uuid,p_digest text/);
   assert.doesNotMatch(sql,/p_manifest jsonb/);
   assert.match(sql,/dd_deletion_redact_forum\(\s+p_target uuid,p_lease uuid/);
   assert.doesNotMatch(sql,/DELETE FROM public\.dd_forum_threads/);
   assert.doesNotMatch(sql,/DELETE FROM public\.dd_forum_replies/);
 });

 await test("live Supabase project hard-denied in staging-only source",async()=>{
   const source=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/dd-account-deletion/execute-staging-only.ts"),"utf8");
   assert.match(source,/LIVE_DISCLOSURE_DESK_PROJECT="omqxizswzcwgzqaczlhe"/);
   assert.match(source,/stagingRef===LIVE_DISCLOSURE_DESK_PROJECT/);
   assert.match(source,/DD_ACCOUNT_DELETION_EXECUTION_ENABLED/);
   assert.match(source,/dd_deletion_prepare/);
   assert.match(source,/dd_deletion_redact_forum/);
   assert.match(source,/p_lease:lease/);
 });

 console.log("M24 PASS "+passed+" offline operator recovery/security groups; no live network.");
})().catch(error=>{console.error(error);process.exitCode=1;});
