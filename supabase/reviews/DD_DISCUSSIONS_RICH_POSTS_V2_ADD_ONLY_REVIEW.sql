-- Disclosure Desk forum rich posts: ADDITIVE V2 API only. No existing table, RPC or content removed.
-- Source-staged pending real DB verification, public feature flag remains OFF.
begin;
alter table public.dd_forum_threads
 add column if not exists post_tone text not null default 'general',
 add column if not exists image_url text;
do $check$
begin
 if not exists(select 1 from pg_constraint where conrelid='public.dd_forum_threads'::regclass and conname='dd_forum_thread_tone_v2') then
  alter table public.dd_forum_threads add constraint dd_forum_thread_tone_v2
   check(post_tone in ('general','serious','fun'));
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.dd_forum_threads'::regclass and conname='dd_forum_thread_image_url_v2') then
  alter table public.dd_forum_threads add constraint dd_forum_thread_image_url_v2
   check(image_url is null or (
    char_length(image_url)<=1000
    and image_url ~* '^https://[a-z0-9][a-z0-9-]*(\\.[a-z0-9][a-z0-9-]*)*\\.[a-z]{2,}(:443)?([/?#][^[:space:]]*)?$'
    and image_url !~* '(^|[./])(?:localhost|internal|local)([./:]|$)'
   ));
 end if;
end $check$;
create index if not exists dd_forum_threads_section_active_v2_idx
 on public.dd_forum_threads(section_id,status,is_pinned desc,created_at desc,id desc);

-- Read-only public feed, server-side search and genuine 20-post pagination.
create or replace function public.dd_discussions_threads_v2(
 p_section_id uuid,p_limit integer default 20,p_offset integer default 0,
 p_sort text default 'recent',p_search text default '')
returns table(
 id uuid,title text,body text,link_url text,author_name text,
 is_pinned boolean,created_at timestamptz,likes bigint,dislikes bigint,is_mine boolean,
 my_vote smallint,post_tone text,image_url text,reply_count bigint,total_count bigint,section_id uuid)
language plpgsql stable security definer set search_path='' as $$
begin
 if p_section_id is null or coalesce(p_limit,0) not between 1 and 20
  or coalesce(p_offset,-1) not between 0 and 100000
  or p_sort not in ('recent','active','top') or char_length(coalesce(p_search,''))>80
 then raise exception 'Invalid discussion feed query';end if;
 return query
 with visible as (
  select t.id,t.title,t.body,t.link_url,t.author_id,t.is_pinned,t.created_at,t.updated_at,
   t.post_tone,t.image_url,t.section_id
  from public.dd_forum_threads t join public.dd_forum_sections s on s.id=t.section_id
  where t.section_id=p_section_id and t.status='published' and s.status='published'
   and (btrim(coalesce(p_search,''))='' or
     t.title ilike '%'||btrim(p_search)||'%' or t.body ilike '%'||btrim(p_search)||'%')
 ),ordered as (
  select v.*,count(*) over()::bigint as total
  from visible v
  order by v.is_pinned desc,
   case when p_sort='top' then
    (select count(*) from public.dd_forum_votes q where q.target_kind='thread' and q.target_id=v.id and q.value=1) end desc nulls last,
   case when p_sort='active' then v.updated_at end desc nulls last,
   v.created_at desc,v.id desc
  limit p_limit offset p_offset
 )
 select o.id,o.title,o.body,o.link_url,
  case when n.is_public then n.display_name else 'Community member' end,
  o.is_pinned,o.created_at,
  (select count(*) from public.dd_forum_votes q where q.target_kind='thread' and q.target_id=o.id and q.value=1),
  (select count(*) from public.dd_forum_votes q where q.target_kind='thread' and q.target_id=o.id and q.value=-1),
  coalesce(o.author_id=auth.uid(),false),
  coalesce((select q.value from public.dd_forum_votes q where q.target_kind='thread' and q.target_id=o.id and q.voter_id=auth.uid()),0)::smallint,
  o.post_tone,o.image_url,
  (select count(*) from public.dd_forum_replies r where r.thread_id=o.id and r.status='published'),
  o.total,o.section_id
 from ordered o left join public.dd_public_names n on n.user_id=o.author_id;
end $$;

-- A permalink must resolve posts beyond the first 20 without leaking hidden records.
create or replace function public.dd_discussions_thread_v2(p_thread_id uuid)
returns table(
 id uuid,section_id uuid,title text,body text,link_url text,
 author_name text,is_pinned boolean,created_at timestamptz,
 likes bigint,dislikes bigint,is_mine boolean,my_vote smallint,post_tone text,
 image_url text,reply_count bigint)
language sql stable security definer set search_path='' as $$
 select t.id,t.section_id,t.title,t.body,t.link_url,
  case when n.is_public then n.display_name else 'Community member' end,
  t.is_pinned,t.created_at,
  (select count(*) from public.dd_forum_votes v where v.target_kind='thread' and v.target_id=t.id and v.value=1),
  (select count(*) from public.dd_forum_votes v where v.target_kind='thread' and v.target_id=t.id and v.value=-1),
  coalesce(t.author_id=auth.uid(),false),
  coalesce((select v.value from public.dd_forum_votes v where v.target_kind='thread' and v.target_id=t.id and v.voter_id=auth.uid()),0)::smallint,
  t.post_tone,t.image_url,
  (select count(*) from public.dd_forum_replies r where r.thread_id=t.id and r.status='published')
 from public.dd_forum_threads t
 join public.dd_forum_sections s on s.id=t.section_id
 left join public.dd_public_names n on n.user_id=t.author_id
 where t.id=p_thread_id and t.status='published' and s.status='published'
 limit 1;
$$;

-- New rich-post RPC keeps existing 15/day rate, registered-only, source checks and section status.
create or replace function public.dd_discussions_create_thread_v2(
 p_section_id uuid,p_title text,p_body text,p_url text default null,
 p_tone text default 'serious',p_image_url text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=public.dd_discussions_require_registered(); made uuid;
 url text:=nullif(btrim(p_url),''); picture text:=nullif(btrim(p_image_url),'');
begin
 if p_section_id is null or p_title is null
  or char_length(btrim(p_title)) not between 4 and 150
  or coalesce(char_length(p_body),0)>5000 or char_length(btrim(coalesce(p_body,'')))<2
  or p_tone not in ('serious','fun')
 then raise exception 'Invalid post title, text or tag';end if;
 if url is not null and (char_length(url)>1000 or
  url !~* '^https?://[a-z0-9][-a-z0-9.]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$')
 then raise exception 'Invalid source URL';end if;
 if picture is not null and (char_length(picture)>1000 or
  picture !~* '^https://[a-z0-9][a-z0-9-]*(\\.[a-z0-9][a-z0-9-]*)*\\.[a-z]{2,}(:443)?([/?#][^[:space:]]*)?$'
  or picture ~* '(^|[./])(?:localhost|internal|local)([./:]|$)')
 then raise exception 'Invalid public image URL';end if;
 if not exists(select 1 from public.dd_forum_sections s
  where s.id=p_section_id and s.status='published')
 then raise exception 'Public section unavailable';end if;
 perform pg_advisory_xact_lock(hashtext('dd-forum-post:'||actor::text));
 if (select count(*) from public.dd_forum_threads t
   where t.author_id=actor and t.created_at>now()-interval '24 hours')>=15
 then raise exception 'Daily topic limit reached';end if;
 insert into public.dd_forum_threads(section_id,author_id,title,body,link_url,post_tone,image_url)
 values(p_section_id,actor,btrim(p_title),btrim(p_body),url,p_tone,picture)
 returning id into made;
 return made;
end $$;
-- Existing RLS/denied direct-table access and legacy functions stay unchanged.
revoke all on function public.dd_discussions_threads_v2(uuid,integer,integer,text,text) from public,anon,authenticated;
revoke all on function public.dd_discussions_thread_v2(uuid) from public,anon,authenticated;
revoke all on function public.dd_discussions_create_thread_v2(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.dd_discussions_threads_v2(uuid,integer,integer,text,text) to anon,authenticated;
grant execute on function public.dd_discussions_thread_v2(uuid) to anon,authenticated;
grant execute on function public.dd_discussions_create_thread_v2(uuid,text,text,text,text,text) to authenticated;
commit;
