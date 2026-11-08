"use strict";
// Synthetic phase/row tests + source audit. Never connects to Supabase.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const base=path.resolve(__dirname,"../supabase");
const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const L="33333333-3333-4333-8333-333333333333";
(async()=>{
 const core=await import(pathToFileURL(path.join(base,"functions/dd-account-deletion/write-fence-spec-core.mjs")).href);
 const {mayWriteForAccount,shouldBlockRowWrite,AUDITED_OWNER_TABLES,FROZEN_PHASES}=core;
 const sql=fs.readFileSync(path.join(base,"ACCOUNT_DELETION_WRITE_FENCE_DRAFT_NOT_APPLIED.sql"),"utf8");
 const schema=fs.readFileSync(path.join(base,"ACCOUNT_DELETION_BACKEND_DRAFT_NOT_APPLIED.sql"),"utf8");
 const stage=fs.readFileSync(path.join(base,"functions/dd-account-deletion/execute-staging-only.ts"),"utf8");
 const now=Date.parse("2026-11-08T22:00:00Z");
 const jobs={
   [A]:{phase:"approved",lease:L,expiresAt:now+900000},
   [B]:{phase:"prepared",lease:null,expiresAt:0}
 };
 let passed=0;
 const check=(name,fn)=>{fn();passed++;console.log("PASS M26 "+name);};
 check("33 audited public account-owner tables registered",()=>{
   assert.equal(Object.keys(AUDITED_OWNER_TABLES).length,33);
 });
 check("every audited table has an INSERT/UPDATE trigger with exact owner columns",()=>{
   for(const [table,cols] of Object.entries(AUDITED_OWNER_TABLES)){
     const pattern="CREATE TRIGGER dd_deletion_fence_insert_update\\s+BEFORE INSERT OR UPDATE ON public\\."+table+"\\s+FOR EACH ROW EXECUTE FUNCTION public\\.dd_deletion_guard_owned_mutation\\(([^)]*)\\)";
     const block=sql.match(new RegExp(pattern));
     assert.ok(block,table+" missing trigger");
     assert.deepEqual([...block[1].matchAll(/'([^']+)'/g)].map(x=>x[1]),cols,table+" column mismatch");
   }
 });
 check("all 33 authenticated DELETE paths have restrictive policies",()=>{
   assert.equal((sql.match(/CREATE POLICY dd_deletion_fence_authenticated_delete/g)||[]).length,33);
   for(const table of Object.keys(AUDITED_OWNER_TABLES)){
     const p="CREATE POLICY dd_deletion_fence_authenticated_delete\\s+ON public\\."+table+" AS RESTRICTIVE FOR DELETE TO authenticated";
     assert.match(sql,new RegExp(p));
   }
 });
 check("private Storage upload/update/delete restrictions present",()=>{
   for(const mode of ["insert","update","delete"]){
     const p="CREATE POLICY dd_deletion_fence_storage_"+mode+"\\s+ON storage\\.objects AS RESTRICTIVE FOR "+mode.toUpperCase()+" TO authenticated";
     assert.match(sql,new RegExp(p));
   }
   assert.equal((sql.match(/bucket_id NOT IN \('dd-profile-avatars','research-images'\)/g)||[]).length,4);
 });
 check("Storage schema, downloads and actual bytes are not altered",()=>{
   assert.doesNotMatch(sql,/ALTER TABLE storage\./i);
   assert.doesNotMatch(sql,/CREATE POLICY dd_deletion_fence_storage_select/i);
   assert.doesNotMatch(sql,/DELETE FROM storage\.objects|UPDATE storage\.objects/i);
 });
 check("owner writes serialize with deletion claim row lock",()=>{
   assert.match(sql,/FROM public\.dd_account_deletion_jobs j[\s\S]{0,100}WHERE j\.account_id=p_user FOR SHARE/);
 });
 check("guard covers caller and both old and new owner fields",()=>{
   assert.match(sql,/v_actor:=auth\.uid\(\)/);
   assert.match(sql,/v_before->>v_column/);
   assert.match(sql,/v_after->>v_column/);
 });
 check("cleanup requires server role, matching lease and expiry",()=>{
   assert.match(sql,/request\.jwt\.claim\.role',true\)='service_role'/);
   assert.match(sql,/v_lease::text=current_setting\('dd\.cleanup_lease',true\)/);
   assert.match(sql,/v_expires>now\(\)/);
   assert.match(schema,/PERFORM set_config\('dd\.cleanup_lease',p_lease::text,true\)/);
 });
 check("prepared user may still write",()=>{
   assert.equal(mayWriteForAccount({actorId:A,jobs:{[A]:{phase:"prepared"}},now}),true);
 });
 check("old signed-in session cannot add posts after claim",()=>{
   assert.equal(shouldBlockRowWrite({table:"dd_forum_threads",newRow:{author_id:A},actorId:A,jobs,role:"authenticated",now}),true);
 });
 check("old signed-in session cannot save Research content",()=>{
   assert.equal(shouldBlockRowWrite({table:"research_documents",newRow:{user_id:A},actorId:A,jobs,role:"authenticated",now}),true);
 });
 check("B can continue editing its own research",()=>{
   assert.equal(shouldBlockRowWrite({table:"research_documents",newRow:{user_id:B},actorId:B,jobs,role:"authenticated",now}),false);
 });
 check("B's public reply is not blocked by A's deletion",()=>{
   assert.equal(shouldBlockRowWrite({table:"dd_forum_replies",newRow:{author_id:B},actorId:B,jobs,role:"authenticated",now}),false);
 });
 check("cannot change ownership of A thread to B by updating",()=>{
   assert.equal(shouldBlockRowWrite({table:"dd_forum_threads",oldRow:{author_id:A},newRow:{author_id:B},actorId:B,jobs,role:"service_role",now}),true);
 });
 check("B cannot create new chat pair involving frozen A",()=>{
   assert.equal(shouldBlockRowWrite({table:"dd_chat_pairs",newRow:{inviter_id:B,invitee_id:A},actorId:B,jobs,role:"authenticated",now}),true);
 });
 check("authenticated client cannot spoof cleanup even with real lease",()=>{
   assert.equal(mayWriteForAccount({actorId:A,jobs,role:"authenticated",cleanupLease:L,now}),false);
 });
 check("wrong or expired service cleanup lease is rejected",()=>{
   assert.equal(mayWriteForAccount({actorId:A,jobs,role:"service_role",cleanupLease:"wrong",now}),false);
   assert.equal(mayWriteForAccount({actorId:A,jobs,role:"service_role",cleanupLease:L,now:now+3600000}),false);
 });
 check("valid service-role lease allows owner-only redaction",()=>{
   assert.equal(shouldBlockRowWrite({table:"dd_forum_threads",oldRow:{author_id:A},newRow:{author_id:A},jobs,role:"service_role",cleanupLease:L,now}),false);
 });
 check("completed account remains frozen even if old lease exists",()=>{
   assert.equal(mayWriteForAccount({actorId:A,jobs:{[A]:{phase:"complete",lease:L,expiresAt:now+1000}},role:"service_role",cleanupLease:L,now}),false);
 });
 check("all lifecycle phases align with coordinator",()=>{
   assert.deepEqual(FROZEN_PHASES,["approved","forum_redacted","storage_cleared","auth_removed","complete"]);
 });
 check("an unregistered user-owned table is refused in the mock model",()=>{
   assert.throws(()=>shouldBlockRowWrite({table:"unregistered_table",newRow:{user_id:A},jobs,now}),/unregistered_owner_table/);
 });
 check("draft is a transaction but DOES NOT enable destructive execution",()=>{
   assert.equal((sql.match(/^BEGIN;$/gm)||[]).length,1);
   assert.equal((sql.match(/^COMMIT;$/gm)||[]).length,1);
   assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION public\.dd_deletion_write_fence_active/);
   assert.match(stage,/dd_deletion_write_fence_active/);
   assert.match(stage,/LIVE_DISCLOSURE_DESK_PROJECT="omqxizswzcwgzqaczlhe"/);
 });
 check("no real user identifiers or production mutations are tested",()=>{
   assert.doesNotMatch(sql,/boydamo84|garyboyd@|ma\.ria\.ana|coreyweir1/i);
 });
 console.log("M26 PASS "+passed+" mock write-fence/security groups; no database/network operations.");
})().catch(e=>{console.error(e);process.exitCode=1;});
