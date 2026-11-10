-- M63: Aggregate reactions RECEIVED by a registered author, never votes cast.
-- This is an owner-only, read-only RPC. No new tables, user identifiers, or
-- voter information are exposed, and private/removed/hidden items do not count.
-- Migration is STAGED IN GITHUB. Do not apply to production without release gates.
create or replace function public.dd_profile_received_reactions()
returns table(post_likes bigint, post_dislikes bigint,
              comment_likes bigint, comment_dislikes bigint)
language plpgsql stable security definer set search_path = ''
as $$
declare v_actor uuid := auth.uid();
begin
 if v_actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
   raise exception 'Registered account required' using errcode='42501';
 end if;
 return query
 with received as (
   -- Public Discussion posts; section and post must both be published.
   select v.value, 'post'::text as category
   from public.dd_forum_threads t
   join public.dd_forum_sections s on s.id=t.section_id and s.status='published'
   join public.dd_forum_votes v on v.target_kind='thread' and v.target_id=t.id
   where t.author_id=v_actor and t.status='published' and v.voter_id<>v_actor
   union all
   -- Replies only count while their thread, section and reply are published.
   select v.value, 'comment'::text
   from public.dd_forum_replies r
   join public.dd_forum_threads t on t.id=r.thread_id and t.status='published'
   join public.dd_forum_sections s on s.id=t.section_id and s.status='published'
   join public.dd_forum_votes v on v.target_kind='reply' and v.target_id=r.id
   where r.author_id=v_actor and r.status='published' and v.voter_id<>v_actor
   union all
   -- Community comments on case, News, Video, Archive and Watch & Read.
   select v.value, 'comment'::text
   from public.dd_case_comments c
   join public.dd_content_votes v on v.target_kind='comment' and v.target_id=c.id
   where c.author_id=v_actor and c.status='approved' and v.voter_id<>v_actor
   union all
   -- Public witness reports are authored posts, but private/hidden reports are excluded.
   select v.value, 'post'::text
   from public.dd_witness_reports w
   join public.dd_content_votes v on v.target_kind='witness' and v.target_id=w.id
   where w.author_id=v_actor and w.status='published' and v.voter_id<>v_actor
 )
 select count(*) filter(where category='post' and value=1),
        count(*) filter(where category='post' and value=-1),
        count(*) filter(where category='comment' and value=1),
        count(*) filter(where category='comment' and value=-1)
 from received;
end $$;

-- SECURITY DEFINER is necessary because raw voting tables deny client reads.
-- The function takes NO user_id parameter: every registered caller sees only
-- their own aggregates. No private profile documents or vote identities returned.
revoke all on function public.dd_profile_received_reactions() from public,anon,authenticated;
grant execute on function public.dd_profile_received_reactions() to authenticated;
