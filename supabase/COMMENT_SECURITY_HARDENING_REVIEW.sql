-- STAGED ONLY. Apply to the Disclosure Desk project after real-account acceptance.
-- Existing comment/flag tables already exist. This is a reviewed additive guard
-- patch, not a new schema or a production deployment.
-- Protect registered-only posting, self-flagging and concurrent rate limits.

drop policy if exists dd_comments_submit on public.dd_case_comments;
create policy dd_comments_submit on public.dd_case_comments for insert to authenticated
 with check (
  author_id=(select auth.uid())
  and status='approved'
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
);

drop policy if exists dd_flags_insert on public.dd_case_comment_flags;
create policy dd_flags_insert on public.dd_case_comment_flags for insert to authenticated
 with check (
  reporter_id=(select auth.uid())
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and exists (
    select 1 from public.dd_case_comments c
    where c.id=comment_id and c.status='approved'
      and c.author_id<>(select auth.uid())
  )
);

-- Trigger functions remain SECURITY DEFINER for private rate-limit queries;
-- the caller's user ID is verified from the JWT, not client-supplied metadata.
create or replace function public.dd_guard_comment_insert()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null
   or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true then
  raise exception 'Registered account required to comment';
 end if;
 if new.author_id is distinct from auth.uid() then
  raise exception 'Incorrect comment author';
 end if;
 -- Serialise same-account submissions so parallel retries cannot bypass limits.
 perform pg_advisory_xact_lock(hashtext('dd-comment-user:'||new.author_id::text));
 if new.parent_id is not null
   and not exists(select 1 from public.dd_case_comments p
     where p.id=new.parent_id and p.case_id=new.case_id and p.status='approved') then
  raise exception 'Invalid reply parent';
 end if;
 new.created_at:=now();new.updated_at:=now();
 if (select count(*) from public.dd_case_comments
   where author_id=new.author_id and created_at>now()-interval '10 minutes')>=5 then
  raise exception 'Posting limit reached. Try again later';
 end if;
 if (select count(*) from public.dd_case_comments
   where author_id=new.author_id and created_at>now()-interval '24 hours')>=40 then
  raise exception 'Daily posting limit reached';
 end if;
 if exists(select 1 from public.dd_case_comments
   where author_id=new.author_id and case_id=new.case_id
    and lower(btrim(body))=lower(btrim(new.body))
    and created_at>now()-interval '24 hours') then
  raise exception 'Duplicate comment';
 end if;
 return new;
end $$;

create or replace function public.dd_guard_comment_flag()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null
   or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true then
  raise exception 'Registered account required to flag a comment';
 end if;
 if new.reporter_id is distinct from auth.uid() then
  raise exception 'Incorrect flag reporter';
 end if;
 if not exists (
    select 1 from public.dd_case_comments c
     where c.id=new.comment_id and c.status='approved' and c.author_id<>auth.uid()
   ) then
  raise exception 'You cannot flag your own or an unavailable comment';
 end if;
 perform pg_advisory_xact_lock(hashtext('dd-comment-flag-user:'||new.reporter_id::text));
 if (select count(*) from public.dd_case_comment_flags f
    where f.reporter_id=new.reporter_id and f.created_at>now()-interval '1 hour')>=12 then
  raise exception 'Flagging limit reached';
 end if;
 new.created_at:=now();
 return new;
end $$;

-- No REST EXECUTE access to internal privileged trigger helpers.
revoke all on function public.dd_guard_comment_insert() from public,anon,authenticated;
revoke all on function public.dd_guard_comment_flag() from public,anon,authenticated;
