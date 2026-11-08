-- Disclosure Desk: make overall-owner final decisions complete steward escalations.
-- Narrow upgrade to the already installed, owner-only audited RPC. No new public access.
-- The hidden state remains an unresolved review by design; published/removed resolve.
-- Backfill only previously owner-removed and audited content; keep private records.
begin;

create or replace function public.dd_discussions_owner_review(
 p_kind text,p_id uuid,p_status text,p_reason text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); affected integer;
begin
 if not public.dd_discussions_is_owner() then raise exception 'Overall site owner required';end if;
 if p_kind not in ('section','thread','reply') or p_id is null
  or p_status not in ('published','hidden','removed')
  or char_length(btrim(coalesce(p_reason,''))) not between 8 and 500
 then raise exception 'Invalid owner review';end if;
 if p_kind='section' then
  update public.dd_forum_sections s set status=p_status,updated_at=now() where s.id=p_id;
 elsif p_kind='thread' then
  update public.dd_forum_threads t set status=p_status,
   reviewed_flag_count=case when p_status='published' then
    (select count(*)::integer from public.dd_forum_flags f where f.target_kind='thread' and f.target_id=t.id)
    else t.reviewed_flag_count end,
   is_pinned=case when p_status='published' then t.is_pinned else false end,updated_at=now()
   where t.id=p_id;
 else
  update public.dd_forum_replies r set status=p_status,
   reviewed_flag_count=case when p_status='published' then
    (select count(*)::integer from public.dd_forum_flags f where f.target_kind='reply' and f.target_id=r.id)
    else r.reviewed_flag_count end,
   updated_at=now() where r.id=p_id;
 end if;
 get diagnostics affected=row_count;
 if affected=1 then
  -- Resolve the active steward escalation only when an owner reaches a final
  -- decision. Hidden/pending-review remains open and stays in the owner queue.
  if p_kind in ('thread','reply') and p_status in ('published','removed') then
   update public.dd_forum_escalations e set status='resolved'
    where e.target_kind=p_kind and e.target_id=p_id and e.status='open';
  end if;
  insert into public.dd_forum_audit(actor_id,action,target_kind,target_id,details)
  values(actor,'owner_status_review',p_kind,p_id,jsonb_build_object('status',p_status,'reason',btrim(p_reason)));
 end if;
 return affected=1;
end $$;

-- Preserve the explicit auth-only EXECUTE permission and avoid widening
-- SECURITY DEFINER function exposure during replacement.
revoke all on function public.dd_discussions_owner_review(text,uuid,text,text)
 from PUBLIC,anon,authenticated;
grant execute on function public.dd_discussions_owner_review(text,uuid,text,text)
 to authenticated;

-- Historical correction for already owner-removed items whose escalation
-- was left open by the earlier function. Owner audit AFTER escalation is
-- mandatory; author-withdrawn items or pending/hid items are not included.
update public.dd_forum_escalations e
set status='resolved'
where e.status='open'
 and exists(
  select 1 from public.dd_forum_audit a
  where a.action='owner_status_review'
   and a.target_kind=e.target_kind and a.target_id=e.target_id
   and a.created_at>=e.created_at and a.details->>'status'='removed'
 )
 and (
  (e.target_kind='thread' and exists(
   select 1 from public.dd_forum_threads t
   where t.id=e.target_id and t.status='removed'))
  or
  (e.target_kind='reply' and exists(
   select 1 from public.dd_forum_replies r
   where r.id=e.target_id and r.status='removed'))
 );
-- Archive-aware overall-owner list: reviewed reports remain discoverable with
-- explicit completed/pending labels and database-side chronological sorting.
-- Client does not receive UUIDs of authors/reporters or public raw table grants.
create or replace function public.dd_discussions_owner_review_items(
 p_limit integer default 100,p_filter text default 'all',p_sort text default 'newest')
returns table(
 target_kind text,target_id uuid,section_title text,
 flag_count bigint,escalation_count bigint,content_preview text,
 latest_escalation_reason text,review_state text,decision text,
 decided_at timestamptz,activity_at timestamptz,decision_reason text)
language plpgsql stable security definer set search_path=pg_catalog,public as $
begin
 if not public.dd_discussions_is_owner() then raise exception 'Overall site owner required';end if;
 if coalesce(p_limit,0) not between 1 and 100
   or p_filter not in ('all','pending','completed')
   or p_sort not in ('newest','oldest')
 then raise exception 'Invalid owner review filter';end if;
 return query
 with targets as (
  select 'thread'::text as kind,t.id as item_id,s.title as section_title,
    t.body as body,t.status as item_status,t.updated_at
  from public.dd_forum_threads t join public.dd_forum_sections s on s.id=t.section_id
  union all
  select 'reply'::text,r.id,s.title,r.body,r.status,r.updated_at
  from public.dd_forum_replies r
  join public.dd_forum_threads t on t.id=r.thread_id
  join public.dd_forum_sections s on s.id=t.section_id
 ), cases as (
  select t.kind as target_kind,t.item_id as target_id,t.section_title,
   f.flag_count,e.escalation_count,left(t.body,600) as content_preview,
   er.reason as latest_escalation_reason,
   case when t.item_status='hidden' or e.escalation_count>0 then 'pending'::text
    when a.decision in ('published','removed') then 'completed'::text
    else 'pending'::text end as review_state,
   a.decision,a.decided_at,
   greatest(t.updated_at,coalesce(f.latest_at,t.updated_at),
    coalesce(e.latest_at,t.updated_at),coalesce(a.decided_at,t.updated_at)) as activity_at,
   a.decision_reason
  from targets t
  left join lateral (
   select count(*)::bigint as flag_count,max(f.created_at) as latest_at
   from public.dd_forum_flags f
   where f.target_kind=t.kind and f.target_id=t.item_id
  ) f on true
  left join lateral (
   select count(*)::bigint as escalation_count,max(e.created_at) as latest_at
   from public.dd_forum_escalations e
   where e.target_kind=t.kind and e.target_id=t.item_id and e.status='open'
  ) e on true
  left join lateral (
   select e.reason
   from public.dd_forum_escalations e
   where e.target_kind=t.kind and e.target_id=t.item_id
   order by e.created_at desc limit 1
  ) er on true
  left join lateral (
   select a.details->>'status' as decision,
    a.details->>'reason' as decision_reason,a.created_at as decided_at
   from public.dd_forum_audit a
   where a.action='owner_status_review' and a.target_kind=t.kind and a.target_id=t.item_id
   order by a.created_at desc,a.id desc limit 1
  ) a on true
  where t.item_status='hidden' or e.escalation_count>0 or a.decided_at is not null
 )
 select c.target_kind,c.target_id,c.section_title,c.flag_count,c.escalation_count,
  c.content_preview,c.latest_escalation_reason,c.review_state,c.decision,
  c.decided_at,c.activity_at,c.decision_reason
 from cases c
 where p_filter='all' or c.review_state=p_filter
 order by
  case when p_sort='oldest' then c.activity_at end asc nulls last,
  case when p_sort='newest' then c.activity_at end desc nulls last,
  c.target_id
 limit p_limit;
end $;
revoke all on function public.dd_discussions_owner_review_items(integer,text,text)
 from PUBLIC,anon,authenticated;
grant execute on function public.dd_discussions_owner_review_items(integer,text,text)
 to authenticated;

commit;
