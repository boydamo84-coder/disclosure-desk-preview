"use strict";
// Generates ONLY disposable PostgreSQL fixture definitions for isolated CI.
// NEVER contains a live Supabase ref, user credential, email or data payload.
const path=require("node:path");
const {pathToFileURL}=require("node:url");
(async()=>{
 const {AUDITED_OWNER_TABLES}=await import(
   pathToFileURL(path.resolve(__dirname,"../supabase/functions/dd-account-deletion/write-fence-spec-core.mjs")).href
 );
 const A="11111111-1111-4111-8111-111111111111";
 const B="22222222-2222-4222-8222-222222222222";
 const lease="33333333-3333-4333-8333-333333333333";
 const lines=[
  "CREATE ROLE anon NOLOGIN;",
  "CREATE ROLE authenticated NOLOGIN;",
  "CREATE ROLE service_role NOLOGIN BYPASSRLS;",
  "CREATE SCHEMA auth;",
  "CREATE SCHEMA storage;",
  "CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;",
  "GRANT USAGE ON SCHEMA public,auth,storage TO authenticated,service_role;",
  "GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,service_role;",
  "CREATE TABLE public.dd_account_deletion_jobs (account_id uuid primary key, phase text not null, lease_token uuid, lease_expires_at timestamptz);",
  "CREATE TABLE storage.objects (bucket_id text NOT NULL, name text NOT NULL, owner_id text);",
  "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY disposable_allow_storage ON storage.objects FOR ALL TO authenticated USING (true) WITH CHECK (true);",
  "GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;",
 ];
 for(const [table,columns] of Object.entries(AUDITED_OWNER_TABLES)){
   lines.push("CREATE TABLE public."+table+" (id uuid PRIMARY KEY, "+columns.map(c=>c+" uuid").join(", ")+");");
   lines.push("ALTER TABLE public."+table+" ENABLE ROW LEVEL SECURITY;");
   lines.push("CREATE POLICY disposable_allow ON public."+table+" FOR ALL TO authenticated USING (true) WITH CHECK (true);");
   lines.push("GRANT SELECT,INSERT,UPDATE,DELETE ON public."+table+" TO authenticated;");
 }
 lines.push("INSERT INTO public.dd_forum_threads (id,author_id) VALUES ('88888888-8888-4888-8888-888888888888','"+A+"');");
 lines.push("INSERT INTO public.dd_forum_threads (id,author_id) VALUES ('99999999-9999-4999-8999-999999999999','"+B+"');");
 lines.push("INSERT INTO public.dd_account_deletion_jobs VALUES ('"+A+"','approved','"+lease+"',now()+interval '1 hour');");
 lines.push("INSERT INTO public.dd_account_deletion_jobs VALUES ('"+B+"','prepared',NULL,NULL);");
 lines.push("GRANT SELECT ON public.dd_account_deletion_jobs TO authenticated,service_role;");
 process.stdout.write(lines.join("\n")+"\n");
})().catch(e=>{console.error(e);process.exitCode=1;});
