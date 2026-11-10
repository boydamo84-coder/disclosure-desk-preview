-- Disposable PostgreSQL 17 ONLY. This fixture has NO real member rows.
create role anon nologin;
create role authenticated nologin;
create schema auth;
grant usage on schema auth to anon,authenticated;
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
$$ select jsonb_build_object('is_anonymous',
 coalesce(nullif(current_setting('request.jwt.claim.is_anonymous',true),'')::boolean,false)) $$;
grant execute on function auth.uid() to anon,authenticated;
grant execute on function auth.jwt() to anon,authenticated;

create table public.dd_forum_sections(id uuid primary key,status text not null);
create table public.dd_forum_threads(id uuid primary key,section_id uuid not null,author_id uuid not null,status text not null);
create table public.dd_forum_replies(id uuid primary key,thread_id uuid not null,author_id uuid not null,status text not null);
create table public.dd_forum_votes(target_kind text not null,target_id uuid not null,voter_id uuid not null,value smallint not null,
 primary key(target_kind,target_id,voter_id));
create table public.dd_case_comments(id uuid primary key,author_id uuid not null,status text not null);
create table public.dd_witness_reports(id uuid primary key,author_id uuid not null,status text not null);
create table public.dd_content_votes(target_kind text not null,target_id uuid not null,voter_id uuid not null,value smallint not null,
 primary key(target_kind,target_id,voter_id));
revoke all on public.dd_forum_votes,public.dd_content_votes from public,anon,authenticated;

-- Authors A/B, voters B/C. IDs are deterministic fictional fixture values.
insert into public.dd_forum_sections values (md5('public-section')::uuid,'published'),(md5('hidden-section')::uuid,'hidden');
insert into public.dd_forum_threads values
 (md5('thread-live')::uuid,md5('public-section')::uuid,'11111111-1111-4111-8111-111111111111','published'),
 (md5('thread-removed')::uuid,md5('public-section')::uuid,'11111111-1111-4111-8111-111111111111','removed'),
 (md5('thread-in-hidden-section')::uuid,md5('hidden-section')::uuid,'11111111-1111-4111-8111-111111111111','published'),
 (md5('thread-other-author')::uuid,md5('public-section')::uuid,'22222222-2222-4222-8222-222222222222','published');
insert into public.dd_forum_replies values
 (md5('reply-live')::uuid,md5('thread-live')::uuid,'11111111-1111-4111-8111-111111111111','published'),
 (md5('reply-removed')::uuid,md5('thread-live')::uuid,'11111111-1111-4111-8111-111111111111','removed'),
 (md5('reply-under-removed')::uuid,md5('thread-removed')::uuid,'11111111-1111-4111-8111-111111111111','published');
insert into public.dd_case_comments values
 (md5('comment-approved')::uuid,'11111111-1111-4111-8111-111111111111','approved'),
 (md5('comment-hidden')::uuid,'11111111-1111-4111-8111-111111111111','hidden');
insert into public.dd_witness_reports values
 (md5('witness-published')::uuid,'11111111-1111-4111-8111-111111111111','published'),
 (md5('witness-removed')::uuid,'11111111-1111-4111-8111-111111111111','removed');

insert into public.dd_forum_votes values
 ('thread',md5('thread-live')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('thread',md5('thread-live')::uuid,'33333333-3333-4333-8333-333333333333',-1),
 ('thread',md5('thread-live')::uuid,'11111111-1111-4111-8111-111111111111',1), -- self-excluded
 ('thread',md5('thread-removed')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('thread',md5('thread-in-hidden-section')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('thread',md5('thread-other-author')::uuid,'33333333-3333-4333-8333-333333333333',1),
 ('reply',md5('reply-live')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('reply',md5('reply-live')::uuid,'33333333-3333-4333-8333-333333333333',-1),
 ('reply',md5('reply-live')::uuid,'11111111-1111-4111-8111-111111111111',1),
 ('reply',md5('reply-removed')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('reply',md5('reply-under-removed')::uuid,'22222222-2222-4222-8222-222222222222',1);
insert into public.dd_content_votes values
 ('comment',md5('comment-approved')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('comment',md5('comment-approved')::uuid,'33333333-3333-4333-8333-333333333333',-1),
 ('comment',md5('comment-hidden')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('witness',md5('witness-published')::uuid,'22222222-2222-4222-8222-222222222222',1),
 ('witness',md5('witness-removed')::uuid,'33333333-3333-4333-8333-333333333333',-1);
