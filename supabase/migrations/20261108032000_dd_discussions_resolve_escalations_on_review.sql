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
commit;
