"use strict";
// Real PostgreSQL syntax/RLS/trigger acceptance against disposable localhost
// fixture ONLY. Refuses any remote host, other DB name or production credentials.
const assert=require("node:assert/strict");
const {spawnSync}=require("node:child_process");
if(!["127.0.0.1","localhost"].includes(process.env.PGHOST) ||
   process.env.PGDATABASE!=="dd_fence_fixture" ||
   process.env.PGUSER!=="postgres"){
  throw Error("NON-DISPOSABLE DATABASE REFUSED");
}
const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const L="33333333-3333-4333-8333-333333333333";
let count=0;
function sql(query){
  const r=spawnSync("psql",["-X","-A","-t","-v","ON_ERROR_STOP=1","-c",query],
    {encoding:"utf8",env:process.env,timeout:10000});
  if(r.error)throw r.error;
  return {ok:r.status===0,out:r.stdout.trim(),error:r.stderr.trim()};
}
function test(name,query,expected){
 const r=sql(query);
 assert.equal(r.ok,expected, name+": "+r.error.slice(0,300));
 count++;console.log("PASS POSTGRES "+name);
}
function countCheck(name,query,expected){
 const r=sql(query);
 assert.equal(r.ok,true,r.error.slice(0,300));
 assert.equal(r.out.split("\n").at(-1).trim(),String(expected),name);
 count++;console.log("PASS POSTGRES "+name);
}
countCheck("33 owner triggers compiled",
 "SELECT count(*) FROM pg_trigger WHERE tgname='dd_deletion_fence_insert_update' AND NOT tgisinternal",33);
countCheck("36 restrictive row-level policies compiled",
 "SELECT count(*) FROM pg_policies WHERE policyname LIKE 'dd_deletion_fence_%' AND permissive='RESTRICTIVE'",36);
test("old A bearer cannot insert Research",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+A+"',true);INSERT INTO public.research_documents(id,user_id) VALUES('44444444-4444-4444-8444-444444444444','"+A+"');ROLLBACK;",false);
test("B can still insert own Research",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+B+"',true);INSERT INTO public.research_documents(id,user_id) VALUES('44444444-4444-4444-8444-444444444444','"+B+"');ROLLBACK;",true);
test("frozen A cannot upload private avatar",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+A+"',true);INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('dd-profile-avatars','a/new.webp','"+A+"');ROLLBACK;",false);
test("B can still upload private avatar",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+B+"',true);INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('dd-profile-avatars','b/new.webp','"+B+"');ROLLBACK;",true);
test("A can still write unrelated fixture bucket",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+A+"',true);INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('unrelated-bucket','a/other.webp','"+A+"');ROLLBACK;",true);
test("A cannot change another user's thread into its own",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+A+"',true);UPDATE public.dd_forum_threads SET author_id='"+A+"' WHERE id='99999999-9999-4999-8999-999999999999';ROLLBACK;",false);
test("B cannot take ownership of frozen A thread",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+B+"',true);UPDATE public.dd_forum_threads SET author_id='"+B+"' WHERE id='88888888-8888-4888-8888-888888888888';ROLLBACK;",false);
test("direct authenticated DELETE of frozen A row matches zero",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+A+"',true);DELETE FROM public.dd_forum_threads WHERE author_id='"+A+"';ROLLBACK;",true);
countCheck("frozen A thread survives unauthorised tests",
 "SELECT count(*) FROM public.dd_forum_threads WHERE author_id='"+A+"'",1);
test("service role cannot update A without exact cleanup lease",
 "BEGIN;SET LOCAL ROLE service_role;SELECT set_config('request.jwt.claim.role','service_role',true);UPDATE public.dd_forum_threads SET author_id=author_id WHERE id='88888888-8888-4888-8888-888888888888';ROLLBACK;",false);
test("valid server-side cleanup lease can redact A",
 "BEGIN;SET LOCAL ROLE service_role;SELECT set_config('request.jwt.claim.role','service_role',true);SELECT set_config('dd.cleanup_lease','"+L+"',true);UPDATE public.dd_forum_threads SET author_id=author_id WHERE id='88888888-8888-4888-8888-888888888888';ROLLBACK;",true);
test("client cannot forge cleanup lease even when matching",
 "BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','"+A+"',true);SELECT set_config('dd.cleanup_lease','"+L+"',true);UPDATE public.dd_forum_threads SET author_id=author_id WHERE id='88888888-8888-4888-8888-888888888888';ROLLBACK;",false);
countCheck("prepared B remains present after all tests",
 "SELECT count(*) FROM public.dd_account_deletion_jobs WHERE account_id='"+B+"' AND phase='prepared'",1);
console.log("PASS POSTGRES "+count+" local-only runtime checks; no Supabase/Netlify.");
