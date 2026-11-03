-- STAGED ONLY: Community self-moderation, user-approved rules.
-- Apply AFTER COMMENT_SECURITY_HARDENING_REVIEW.sql and
-- COMMENT_PUBLIC_READ_PRIVACY_REVIEW.sql in the designated beta migration.
-- All valid registered comments publish immediately; 1-4 flags leave visible.
-- FIFTH flag by a DIFFERENT registered account hides the comment for review.
-- A dislike is NOT a flag. No permanent deletion from community flags alone.

alter table public.dd_case_comments
 add column if not exists review_flag_floor integer not null default 0
 check(review_flag_floor>=0);

-- The BEFORE flag guard takes this same comment lock. Thus each AFTER trigger
-- counts all prior committed distinct flaggers without missing a simultaneous 5th.
create or replace function public.dd_comment_autohide()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_count integer;
begin
 perform pg_advisory_xact_lock(hashtext('dd-comment-flags:'||new.comment_id::text));
 select count(*) into v_count from public.dd_case_comment_flags f
 where f.comment_id=new.comment_id;
 update public.dd_case_comments c
 set status='hidden',updated_at=now()
 where c.id=new.comment_id and c.status='approved'
   and v_count-c.review_flag_floor>=5;
 return new;
end $$;
revoke all on function public.dd_comment_autohide() from public,anon,authenticated;
drop trigger if exists dd_comment_autohide_on_flag on public.dd_case_comment_flags;
create trigger dd_comment_autohide_on_flag after insert on public.dd_case_comment_flags
 for each row execute function public.dd_comment_autohide();

-- Only the existing owner-selected moderator allowlist may reapprove.
-- Advance baseline after approval; previously reviewed flags must not
-- instantly re-hide the comment. Existing flagger IDs remain immutable.
create or replace function public.dd_moderate_case_comment(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or not public.dd_is_comment_moderator() then
  raise exception 'Not authorised';
 end if;
 if p_status not in ('approved','hidden','rejected') then
  raise exception 'Invalid status';
 end if;
 perform pg_advisory_xact_lock(hashtext('dd-comment-flags:'||p_id::text));
 update public.dd_case_comments c
  set status=p_status,updated_at=now(),
  review_flag_floor=case when p_status='approved'
    then (select count(*)::integer from public.dd_case_comment_flags f
          where f.comment_id=c.id)
    else c.review_flag_floor end
 where c.id=p_id;
 if not found then raise exception 'Comment not found';end if;
end $$;
revoke all on function public.dd_moderate_case_comment(uuid,text) from public,anon,authenticated;
grant execute on function public.dd_moderate_case_comment(uuid,text) to authenticated;

-- Queue ONLY comments that have been hidden, not every one-flag complaint.
-- Serious privacy, safety, threats and unlawful content still require an
-- urgent independent reporting route for prompt human attention.
create or replace function public.dd_case_comment_moderation_queue()
returns table(comment_id uuid,case_id text,body text,status text,
              flag_count bigint,latest_flag timestamptz)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or not public.dd_is_comment_moderator() then
  raise exception 'Not authorised';
 end if;
 return query
  select c.id,c.case_id,c.body,c.status,count(f.id),max(f.created_at)
  from public.dd_case_comments c
  join public.dd_case_comment_flags f on f.comment_id=c.id
  where c.status='hidden'
  group by c.id,c.case_id,c.body,c.status
  order by max(f.created_at) desc limit 200;
end $$;
revoke all on function public.dd_case_comment_moderation_queue() from public,anon,authenticated;
grant execute on function public.dd_case_comment_moderation_queue() to authenticated;
