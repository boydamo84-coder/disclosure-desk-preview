-- M34 NEWS ARTICLE VOTING — Applied to dedicated Disclosure Desk Supabase on 2026-11-09 as migration 20261109044411
-- Approved regular article interaction: ▲ / ▼ / Comments / Share.
-- story_key is SHA-256 of the existing public news comment identity
-- ('news:' + stable feed ID or publisher URL, max 175 chars).
-- Do not infer actual user identity from story IDs. The database stores no URLs.
-- All writes are registered-account-only RPC calls; no direct public table access.
create table if not exists public.dd_news_article_votes (
 story_key text not null check (story_key ~ '^[a-f0-9]{64}$'),
 voter_id uuid not null references auth.users(id) on delete cascade,
 value smallint not null check (value in (-1,1)),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(story_key,voter_id)
);
create index if not exists dd_news_article_votes_story_idx on public.dd_news_article_votes(story_key);
create index if not exists dd_news_article_votes_voter_time_idx on public.dd_news_article_votes(voter_id,updated_at desc);
alter table public.dd_news_article_votes enable row level security;
revoke all on table public.dd_news_article_votes from public,anon,authenticated;

create or replace function public.dd_news_article_vote_set(p_story_key text,p_value smallint)
returns table(upvotes bigint,downvotes bigint,my_vote smallint)
language plpgsql security definer set search_path = ''
as $$
declare v_actor uuid := auth.uid();
begin
 if v_actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
   raise exception 'Registered account required to vote';
 end if;
 if p_story_key is null or p_story_key !~ '^[a-f0-9]{64}$'
    or p_value is null or p_value not in (-1,0,1) then
   raise exception 'Invalid news article vote';
 end if;
 perform pg_advisory_xact_lock(hashtext('dd-news-vote:'||v_actor::text||':'||p_story_key));
 -- Limit new distinct story votes to 120 currently-held votes created per day;
 -- repeat votes on an existing article are allowed. Prevent arbitrary-key floods.
 if p_value<>0 and not exists(select 1 from public.dd_news_article_votes v
      where v.story_key=p_story_key and v.voter_id=v_actor)
   and (select count(*) from public.dd_news_article_votes v
      where v.voter_id=v_actor and v.created_at>now()-interval '24 hours')>=120 then
   raise exception 'Daily article voting limit reached';
 end if;
 if p_value=0 then
  delete from public.dd_news_article_votes v
   where v.story_key=p_story_key and v.voter_id=v_actor;
 else
  insert into public.dd_news_article_votes(story_key,voter_id,value)
   values(p_story_key,v_actor,p_value)
   on conflict(story_key,voter_id) do update
   set value=excluded.value,updated_at=now();
 end if;
 return query
 select count(*) filter(where v.value=1),
        count(*) filter(where v.value=-1),
        coalesce(max(v.value) filter(where v.voter_id=v_actor),0)::smallint
 from public.dd_news_article_votes v where v.story_key=p_story_key;
end $$;

create or replace function public.dd_news_article_vote_summary(p_story_keys text[])
returns table(story_key text,upvotes bigint,downvotes bigint,my_vote smallint)
language plpgsql stable security definer set search_path = ''
as $$
begin
 if p_story_keys is null or cardinality(p_story_keys)>50 or
    exists(select 1 from unnest(p_story_keys) k where k is null or k !~ '^[a-f0-9]{64}$') then
   raise exception 'Invalid article vote summary request';
 end if;
 return query
 select requested.key::text,
        count(v.*) filter(where v.value=1),
        count(v.*) filter(where v.value=-1),
        coalesce(max(v.value) filter(where v.voter_id=auth.uid()),0)::smallint
 from (select distinct unnest(p_story_keys) as key) requested
 left join public.dd_news_article_votes v on v.story_key=requested.key
 group by requested.key;
end $$;

revoke all on function public.dd_news_article_vote_set(text,smallint) from public,anon,authenticated;
revoke all on function public.dd_news_article_vote_summary(text[]) from public,anon,authenticated;
grant execute on function public.dd_news_article_vote_set(text,smallint) to authenticated;
grant execute on function public.dd_news_article_vote_summary(text[]) to anon,authenticated;
-- Read-only review queries after operator applies a reviewed migration:
-- select relrowsecurity from pg_class where oid='public.dd_news_article_votes'::regclass;
-- select has_table_privilege('authenticated','public.dd_news_article_votes','INSERT');
-- select has_function_privilege('anon','public.dd_news_article_vote_set(text,smallint)','EXECUTE');
