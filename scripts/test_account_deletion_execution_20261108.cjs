"use strict";
// All deletion tests use synthetic users, forum rows and Storage objects.
// This script NEVER authenticates to Supabase or touches a real account.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const base=path.resolve(__dirname,"../supabase/functions/dd-account-deletion");
const ACCOUNT_A="11111111-1111-4111-8111-111111111111";
const ACCOUNT_B="22222222-2222-4222-8222-222222222222";
const LEASE="33333333-3333-4333-8333-333333333333";
(async()=>{
  const {executeApprovedDeletion,validateManifest,REDACTED_THREAD,REDACTED_REPLY}=
    await import(pathToFileURL(path.join(base,"execution-core.mjs")).href);
  let passed=0;
  const test=async(label,fn)=>{await fn();passed++;console.log("PASS "+label);};
  function sandbox(){
    const state={
      users:new Set([ACCOUNT_A,ACCOUNT_B]),
      roles:new Set(),
      objects:[
        {bucket_id:"dd-profile-avatars",name:"opaqueA/avatar.webp",owner_id:ACCOUNT_A},
        {bucket_id:"research-images",name:"research-A/orphan.png",owner_id:ACCOUNT_A},
        {bucket_id:"dd-profile-avatars",name:"opaqueB/avatar.webp",owner_id:ACCOUNT_B}
      ],
      threads:[
        {id:"T1",author_id:ACCOUNT_A,title:"Sensitive A",body:"A original text",link_url:"https://example.org",image_url:"https://example.org/a.png"},
        {id:"T2",author_id:ACCOUNT_B,title:"Original B",body:"Other person's public text"}
      ],
      replies:[
        {id:"R1",thread_id:"T1",author_id:ACCOUNT_B,body:"B reply to A - MUST survive"},
        {id:"R2",thread_id:"T2",author_id:ACCOUNT_A,body:"A reply under B"},
        {id:"R3",thread_id:"T1",author_id:ACCOUNT_A,body:"A reply under A"}
      ],
      phase:"approved",history:[],failOnRemoval:false,failOnCheckpoint:null,redactionCalls:0,authDeletes:0
    };
    const adapter={
      assertLeaseActive:async(id,lease,phase)=>
        id===ACCOUNT_A && lease===LEASE && phase===state.phase && state.leaseActive!==false,
      assertNotPrivilegedOwner:async id=>{
        if(state.roles.has(id))throw Error("protected_owner");
      },
      redactOwnForumText:async(id,threadMarker,replyMarker)=>{
        state.redactionCalls++;
        for(const t of state.threads)if(t.author_id===id)Object.assign(t,threadMarker);
        for(const r of state.replies)if(r.author_id===id)r.body=replyMarker;
      },
      enumerateOwnedObjects:async id=>state.objects.filter(x=>x.owner_id===id).map(x=>({...x})),
      removeOwnedObject:async(id,bucket,name)=>{
        if(state.failOnRemoval){state.failOnRemoval=false;throw Error("simulated storage outage");}
        state.objects=state.objects.filter(x=>!(x.owner_id===id&&x.bucket_id===bucket&&x.name===name));
      },
      accountExists:async id=>state.users.has(id),
      deleteAuthAccount:async id=>{state.authDeletes++;state.users.delete(id);},
      advancePhase:async(id,lease,before,after)=>{
        assert.equal(id,ACCOUNT_A);assert.equal(lease,LEASE);
        assert.equal(state.phase,before);
        if(state.failOnCheckpoint===after){state.failOnCheckpoint=null;throw Error("simulated checkpoint failure");}
        state.phase=after;state.history.push(after);
      }
    };
    const job=()=>({
      account_id:ACCOUNT_A,lease_token:LEASE,phase:state.phase,
      manifest:state.objects.filter(x=>x.owner_id===ACCOUNT_A).map(x=>({...x})),
      one_time_intent_consumed:true,reauthentication_verified:true,confirmation_verified:true
    });
    return {state,adapter,job};
  }
  await test("normal delete redacts A while leaving B thread and reply untouched",async()=>{
    const x=sandbox(),result=await executeApprovedDeletion(x.job(),x.adapter);
    assert.equal(result.complete,true);assert.equal(x.state.phase,"complete");
    assert.equal(x.state.users.has(ACCOUNT_A),false);
    assert.equal(x.state.users.has(ACCOUNT_B),true);
    assert.equal(x.state.threads[0].title,REDACTED_THREAD.title);
    assert.equal(x.state.threads[0].body,REDACTED_THREAD.body);
    assert.equal(x.state.threads[0].link_url,null);
    assert.equal(x.state.threads[0].image_url,null);
    assert.equal(x.state.threads[1].title,"Original B");
    assert.equal(x.state.replies[0].body,"B reply to A - MUST survive");
    assert.equal(x.state.replies[1].body,REDACTED_REPLY);
    assert.equal(x.state.replies[2].body,REDACTED_REPLY);
    assert.deepEqual(x.state.history,["forum_redacted","storage_cleared","auth_removed","complete"]);
  });
  await test("B-owned avatar cannot be removed by A deletion",async()=>{
    const x=sandbox();await executeApprovedDeletion(x.job(),x.adapter);
    assert.deepEqual(x.state.objects,[{
      bucket_id:"dd-profile-avatars",name:"opaqueB/avatar.webp",owner_id:ACCOUNT_B
    }]);
  });
  await test("protected role blocks deletion before any writes",async()=>{
    const x=sandbox();x.state.roles.add(ACCOUNT_A);
    await assert.rejects(executeApprovedDeletion(x.job(),x.adapter),/protected_owner/);
    assert.equal(x.state.redactionCalls,0);assert.equal(x.state.authDeletes,0);
  });
  await test("cross-owner object in saved manifest refuses before any writes",async()=>{
    const x=sandbox(),j=x.job();j.manifest.push(x.state.objects[2]);
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/foreign_storage_owner/);
    assert.equal(x.state.redactionCalls,0);assert.equal(x.state.authDeletes,0);
  });
  await test("malicious key or unapproved bucket refuses",async()=>{
    const x=sandbox(),j=x.job();
    j.manifest[0].name="../outside";
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/storage_path_invalid/);
    assert.throws(()=>validateManifest([{bucket_id:"public",name:"avatar.webp",owner_id:ACCOUNT_A}],ACCOUNT_A),/bucket_not_approved/);
  });
  await test("partial Storage failure does not delete Auth; safe retry continues",async()=>{
    const x=sandbox(),j=x.job();x.state.failOnRemoval=true;
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/simulated storage outage/);
    assert.equal(x.state.phase,"forum_redacted");
    assert.equal(x.state.users.has(ACCOUNT_A),true);
    // Server-only operator retry reuses SAVED immutable manifest, not a new unverified client manifest.
    j.phase=x.state.phase;
    await executeApprovedDeletion(j,x.adapter);
    assert.equal(x.state.phase,"complete");assert.equal(x.state.authDeletes,1);
  });
  await test("untracked object appears after prepare: stop BEFORE Auth deletion",async()=>{
    const x=sandbox(),j=x.job();
    const original=x.adapter.removeOwnedObject;
    let injected=false;
    x.adapter.removeOwnedObject=async(...args)=>{
      await original(...args);
      if(!injected){
        injected=true;x.state.objects.push({
          bucket_id:"research-images",name:"research-A/new-after-prep.jpg",owner_id:ACCOUNT_A
        });
      }
    };
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/storage_objects_remaining/);
    assert.equal(x.state.phase,"forum_redacted");
    assert.equal(x.state.users.has(ACCOUNT_A),true);
  });
  await test("auth delete succeeded but checkpoint failed: retry verifies absence",async()=>{
    const x=sandbox(),j=x.job();x.state.failOnCheckpoint="auth_removed";
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/simulated checkpoint failure/);
    assert.equal(x.state.phase,"storage_cleared");
    assert.equal(x.state.users.has(ACCOUNT_A),false);
    j.phase=x.state.phase;
    await executeApprovedDeletion(j,x.adapter);
    assert.equal(x.state.authDeletes,1);
    assert.equal(x.state.phase,"complete");
  });
  await test("missing fresh reauth or single-use intent blocks all work",async()=>{
    const x=sandbox(),j=x.job();
    j.reauthentication_verified=false;
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/fresh_reauth_required/);
    j.reauthentication_verified=true;j.one_time_intent_consumed=false;
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/intent_not_consumed/);
    j.one_time_intent_consumed=true;j.confirmation_verified=false;
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/confirmation_required/);
    assert.equal(x.state.redactionCalls,0);
  });
  await test("auth_removed checkpoint requires proven absent Auth and Storage",async()=>{
    const x=sandbox(),j=x.job();j.phase="auth_removed";
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/auth_deletion_unverified/);
    assert.equal(x.state.phase,"approved");
    assert.equal(x.state.users.has(ACCOUNT_A),true);
  });
  await test("already-complete job is not an executable job",async()=>{
    const x=sandbox(),j=x.job();j.phase="complete";
    await assert.rejects(executeApprovedDeletion(j,x.adapter),/already_complete/);
  });
  await test("SQL draft has private RLS ledger and server-only RPC grants",async()=>{
    const sql=fs.readFileSync(path.resolve(__dirname,"../supabase/ACCOUNT_DELETION_BACKEND_DRAFT_NOT_APPLIED.sql"),"utf8");
    assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
    assert.match(sql,/REVOKE ALL ON TABLE public\.dd_account_deletion_jobs FROM PUBLIC, anon, authenticated/);
    assert.match(sql,/GRANT SELECT, INSERT, UPDATE ON TABLE public\.dd_account_deletion_jobs TO service_role/);
    assert.match(sql,/dd_deletion_active_session/);
    assert.match(sql,/dd_deletion_claim/);
    assert.match(sql,/prepared_session_id=p_session/);
    assert.match(sql,/dd_deletion_storage_manifest/);
    assert.match(sql,/owner_id=p_target::text/);
    assert.match(sql,/UPDATE public\.dd_forum_threads/);
    assert.match(sql,/UPDATE public\.dd_forum_replies/);
    assert.doesNotMatch(sql,/DELETE FROM public\.dd_forum_threads/);
    assert.doesNotMatch(sql,/DELETE FROM public\.dd_forum_replies/);
    assert.doesNotMatch(sql,/REFERENCES auth\.users\(id\) ON DELETE CASCADE/);
  });
  await test("staging executor has project lock and no public UI activation",async()=>{
    const src=fs.readFileSync(path.join(base,"execute-staging-only.ts"),"utf8");
    assert.match(src,/DD_ACCOUNT_DELETION_EXECUTION_ENABLED/);
    assert.match(src,/DD_ACCOUNT_DELETION_STAGING_PROJECT_REF/);
    assert.match(src,/url!==\("https:\/\/"\+stagingRef\+"\.supabase\.co"\)/);
    assert.match(src,/auth\.getUser\(bearer\)/);
    assert.match(src,/dd_deletion_active_session/);
    assert.match(src,/auth\.signInWithPassword/);
    assert.match(src,/dd_deletion_prepare/);
    assert.match(src,/dd_deletion_claim/);
    assert.match(src,/executeApprovedDeletion/);
    assert.doesNotMatch(src,/localStorage|sessionStorage|window\./);
  });
  await test("two separate Auth IDs remain isolated across repeated checks",async()=>{
    const a=sandbox(),b=sandbox();
    await executeApprovedDeletion(a.job(),a.adapter);
    assert.equal(a.state.users.has(ACCOUNT_B),true);
    assert.equal(b.state.users.has(ACCOUNT_A),true);
    assert.equal(b.state.threads[0].title,"Sensitive A");
  });
  console.log("Milestone 23: "+passed+" synthetic security groups passed; no live network.");
})().catch(e=>{console.error(e);process.exitCode=1;});
