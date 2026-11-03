-- Synthetic, disposable Supabase-shape fixture for isolated PostgreSQL CI only.
-- NEVER execute against the live Disclosure Desk Supabase project.
create schema if not exists auth;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create table auth.users(
 id uuid primary key,
 email_confirmed_at timestamptz,
 created_at timestamptz not null default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$$;
grant usage on schema auth,public to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated;
grant execute on function auth.jwt() to anon,authenticated;
create table public.dd_public_names(
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 is_public boolean not null default false
);
insert into auth.users(id,email_confirmed_at,created_at)
select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 now()-interval '1 day',now()-interval '5 days'
from generate_series(1,18) n;
insert into public.dd_public_names(user_id,display_name,is_public)
select id,'Researcher' || right(id::text,2),true from auth.users;
