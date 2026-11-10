'use strict';
// Disposable PostgreSQL only. Also exports scenarios for a local PGlite run.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const migration=fs.readFileSync('supabase/migrations/20261109234548_media_link_submissions.sql','utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',ADMIN='99999999-9999-4999-8999-999999999999';
const setup=`do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin;end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;end$$;
create schema if not exists auth;create table if not exists auth.users(id uuid primary key);
insert into auth.users(id) values('${A}'),('${B}'),('${ADMIN}') on conflict do nothing;
create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.uid(),auth.jwt() to anon,authenticated;
create or replace function public.dd_discussions_is_owner() returns boolean language sql stable as $$select coalesce(auth.uid()='${ADMIN}'::uuid,false)$$;`;
const as=(id,sql,anonymous=false)=>`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);select set_config('request.jwt.claims','{"is_anonymous":${anonymous}}',false);${sql}`;
const steps=[
 ['member sends a private nomination',as(A,"select public.dd_media_suggest('books','https://example.org/book','A title','Private note');"),null],
 ['another member cannot read it',as(B,'select count(*) as visible from public.dd_media_suggestions;'),/\b0\b/],
 ['anonymous role cannot read nominations',"reset role;set role anon;select * from public.dd_media_suggestions;",null,/permission denied/],
 ['anonymous auth accounts cannot submit',as(A,"select public.dd_media_suggest('books','https://example.org/anon','Anonymous title','');",true),null,/Registered account required/],
 ['plain HTTP rejected',as(A,"select public.dd_media_suggest('books','http://example.org/book','Invalid title','');"),null,/HTTPS/],
 ['credential URLs rejected',as(A,"select public.dd_media_suggest('books','https://user:password@example.org/','Invalid title','');"),null,/HTTPS/],
 ['duplicate nomination rejected',as(A,"select public.dd_media_suggest('books','https://example.org/book','Same title','');"),null,/duplicate/],
 ['members cannot review',as(A,"select public.dd_media_suggestion_review((select id from public.dd_media_suggestions limit 1),'reviewed');"),null,/Site owner required/],
 ['cannot spoof the submitting account',as(A,`insert into public.dd_media_suggestions(user_id,category,url,title,notes) values('${B}','books','https://example.org/spoof','Spoofed title','');`),null,/Account mismatch/],
 ['cannot bypass timestamp rate limits',as(A,`insert into public.dd_media_suggestions(user_id,category,url,title,notes,created_at) values('${A}','books','https://example.org/timestamp','Timestamp title','',now()-interval '2 days');`),null,/permission denied/],
 ['admin queue exposes pending suggestions only to owner',as(ADMIN,'select count(*) from public.dd_media_suggestion_queue();'),/\b1\b/],
 ['admin review is real and does not publish content',as(ADMIN,"select public.dd_media_suggestion_review((select id from public.dd_media_suggestions limit 1),'reviewed');"),/t|true/],
 ['member sees reviewed status on own item',as(A,'select status from public.dd_media_suggestions;'),/reviewed/],
 ['ten suggestions allowed',as(B,"select public.dd_media_suggest('podcasts','https://example.org/episode/'||n,'Episode '||n,'') from generate_series(1,10) n;"),null],
 ['eleventh suggestion rejected',as(B,"select public.dd_media_suggest('podcasts','https://example.org/episode/11','Episode eleven','');"),null,/limit reached/],
 ['private trigger not publicly executable',"reset role;select has_function_privilege('anon','dd_media_private.guard_suggestion()','execute');",/f|false/]
];
module.exports={setup,migration,steps};
if(require.main===module){
 if(process.env.PGDATABASE!=='dd_fence_fixture')throw Error('Only the explicitly disposable CI database may run this test.');
 const sql=q=>cp.execFileSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8',stdio:['pipe','pipe','pipe']});
 sql(setup);sql(migration);
 for(const [label,query,match,error] of steps){
  if(error){assert.throws(()=>sql(query),e=>error.test(String(e.stderr||e.message)),label)}
  else {const output=sql(query);if(match)assert.match(output,match,label)}
  console.log('PASS media SQL '+label);
 }
}
