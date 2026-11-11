-- M89: staged, read-only across-subject Discussions feed. Never apply without release approval.
-- Uses the SAME published threads, votes, replies, author and section controls.
begin;
create or replace function public.dd_discussions_global_feed(
 p_limit integer default 10, p_offset integer default 0, p_sort text default 'popular'
)
returns table(
 id uuid, title text, body text, link_url text, author_name text,
 is_pinned boolean, created_at timestamptz, likes bigint, dislikes bigint,
 is_mine boolean, my_vote smallint, post_tone text, image_url text,
 reply_count bigint, total_count bigint, section_id uuid, section_title text
)
language plpgsql stable security definer
set search_path = ''
as $function$
begin
 if coalesce(p_limit,0) not between 1 and 20
  or coalesce(p_offset,-1) not between 0 and 100000
  or p_sort not in ('popular','new','top')
 then raise exception 'Invalid global discussion feed query'; end if;
 return query
 with visible as (
  select t.id,t.section_id,s.title as section_title,t.title,t.body,t.link_url,
   t.author_id,t.is_pinned,t.created_at,t.post_tone,t.image_url,
   (select count(*) from public.dd_forum_votes v where v.target_kind='thread' and v.target_id=t.id and v.value=1)::bigint as likes,
   (select count(*) from public.dd_forum_votes v where v.target_kind='thread' and v.target_id=t.id and v.value=-1)::bigint as dislikes,
   (select count(*) from public.dd_forum_replies r where r.thread_id=t.id and r.status='published')::bigint as reply_count
  from public.dd_forum_threads t
  join public.dd_forum_sections s on s.id=t.section_id
  where t.status='published' and s.status='published'
 ), ranked as (
  select v.*,count(*) over()::bigint as total_count
  from visible v
  order by
   case when p_sort='popular' then
    (2.0*greatest(v.likes-v.dislikes,0)+v.reply_count)
    /power(1.0+greatest(extract(epoch from (now()-v.created_at)),0)/86400.0,0.7)
    end desc nulls last,
   case when p_sort='top' then v.likes-v.dislikes end desc nulls last,
   case when p_sort='new' then v.created_at end desc nulls last,
   v.created_at desc,v.id desc
  limit p_limit offset p_offset
 )
 select o.id,o.title,o.body,o.link_url,
  case when n.is_public then n.display_name else 'Community member' end,
  o.is_pinned,o.created_at,o.likes,o.dislikes,
  coalesce(o.author_id=auth.uid(),false),
  coalesce((select v.value from public.dd_forum_votes v
   where v.target_kind='thread' and v.target_id=o.id and v.voter_id=auth.uid()),0)::smallint,
  o.post_tone,o.image_url,o.reply_count,o.total_count,o.section_id,o.section_title
 from ranked o
 left join public.dd_public_names n on n.user_id=o.author_id;
end
$function$;
revoke all on function public.dd_discussions_global_feed(integer,integer,text) from public;
revoke all on function public.dd_discussions_global_feed(integer,integer,text) from anon,authenticated;
grant execute on function public.dd_discussions_global_feed(integer,integer,text) to anon,authenticated;
comment on function public.dd_discussions_global_feed(integer,integer,text) is
 'Read-only published Discussions posts across subjects. Popular weighs engagement with recency decay; New is newest; Top is net likes.';
commit;
