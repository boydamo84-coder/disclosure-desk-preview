-- STAGED ONLY: run after COMMENT_SECURITY_HARDENING_REVIEW.sql.
-- Approved comment text is readable by guests without exposing account UUIDs.
-- Private/hidden comments, report flags and private research stay restricted.
-- Author identity is never a column in the public feed. No migration applied.

-- Do not grant raw table SELECT, even for authenticated roles; RLS protects ROWS
-- but by itself does not conceal the raw author_id of an approved comment.
revoke select on table public.dd_case_comments from public,anon,authenticated;
-- Registered signed-in members retain INSERT under their existing owner policy.
grant insert on table public.dd_case_comments to authenticated;

-- The sole public read interface returns only approved comments for a
-- requested discussion; bounded input and output. No author UUID or email.
create or replace function public.dd_public_comments(p_case_id text,p_limit integer default 100)
returns table(id uuid,case_id text,parent_id uuid,body text,created_at timestamptz,is_mine boolean)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if p_case_id is null or char_length(p_case_id)<1 or char_length(p_case_id)>180
   or p_limit is null or p_limit<1 or p_limit>100 then
  raise exception 'Invalid discussion request';
 end if;
 return query
  select c.id,c.case_id,c.parent_id,c.body,c.created_at,
    (auth.uid() is not null and c.author_id=auth.uid()) as is_mine
  from public.dd_case_comments c
  where c.case_id=p_case_id and c.status='approved'
  order by c.created_at asc,c.id asc limit p_limit;
end $$;
revoke all on function public.dd_public_comments(text,integer) from public,anon,authenticated;
grant execute on function public.dd_public_comments(text,integer) to anon,authenticated;

-- A separate owner-only history endpoint includes hidden/pending statuses
-- but nothing belonging to other people, and never returns author_id.
create or replace function public.dd_my_comments(p_limit integer default 100)
returns table(id uuid,case_id text,body text,status text,created_at timestamptz)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null
   or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true then
  raise exception 'Registered account required';
 end if;
 if p_limit is null or p_limit<1 or p_limit>100 then
  raise exception 'Invalid history limit';
 end if;
 return query
  select c.id,c.case_id,c.body,c.status,c.created_at
  from public.dd_case_comments c
  where c.author_id=auth.uid()
  order by c.created_at desc,c.id desc limit p_limit;
end $$;
revoke all on function public.dd_my_comments(integer) from public,anon,authenticated;
grant execute on function public.dd_my_comments(integer) to authenticated;

-- Remove raw SELECT without breaking the flagging insert policy's internal
-- approved/non-self check. The function returns a yes/no only for the caller.
create or replace function public.dd_can_flag_comment(p_comment_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and exists (
    select 1 from public.dd_case_comments c
    where c.id=p_comment_id and c.status='approved'
      and c.author_id<>auth.uid()
  )
$$;
revoke all on function public.dd_can_flag_comment(uuid) from public,anon,authenticated;
grant execute on function public.dd_can_flag_comment(uuid) to authenticated;

drop policy if exists dd_flags_insert on public.dd_case_comment_flags;
create policy dd_flags_insert on public.dd_case_comment_flags
 for insert to authenticated with check (
  reporter_id=(select auth.uid())
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and public.dd_can_flag_comment(comment_id)
);

-- Hidden comments and all raw authors remain inaccessible via direct Data API
-- reads. The legitimate moderator queue already uses a separate guarded RPC.
