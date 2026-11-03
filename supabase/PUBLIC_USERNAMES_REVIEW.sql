-- STAGED ONLY / NO AUTOMATIC DATABASE DEPLOYMENT.
-- Existing Disclosure Desk public username records stay owner-private.
-- Display names appear beside APPROVED comments/live chats only if owner opts in.
-- No email address or author UUID is ever returned from the public alias RPC.

alter table public.dd_public_names
  add column if not exists is_public boolean not null default false;

-- Existing profile rows are preserved; enforce safe format on new/updated names.
-- Existing owner-only RLS SELECT, INSERT, UPDATE policies remain unchanged.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.dd_public_names'::regclass
      and conname='dd_public_names_safe_public_format'
  ) then
    alter table public.dd_public_names add constraint dd_public_names_safe_public_format
      check (display_name ~ '^[A-Za-z][A-Za-z0-9_]{2,23}$'
        and name_key = lower(display_name)) not valid;
  end if;
end $$;

-- This RPC deliberately returns an item's approved public alias only:
-- never an email, raw author ID, username search list or private document.
create or replace function public.dd_public_aliases(p_kind text,p_ids uuid[])
returns table(content_id uuid,display_name text)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
  if p_kind not in ('comment','chat') or p_ids is null or cardinality(p_ids)>100 then
    raise exception 'Invalid alias request';
  end if;
  if p_kind='comment' then
    return query
      select c.id,n.display_name
      from public.dd_case_comments c
      join public.dd_public_names n on n.user_id=c.author_id
      where c.id=any(p_ids) and c.status='approved' and n.is_public=true;
  elsif p_kind='chat' then
    -- Chat table exists only after the separately reviewed LIVE migration.
    -- No alias is returned for hidden messages or unpublished hearings.
    return query
      select m.id,n.display_name
      from public.dd_live_chat_messages m
      join public.dd_live_events e on e.id=m.event_id and e.is_public=true
      join public.dd_public_names n on n.user_id=m.author_id
      where m.id=any(p_ids) and m.status='approved' and n.is_public=true;
  end if;
end $$;
revoke all on function public.dd_public_aliases(text,uuid[]) from public,anon,authenticated;
-- The username owner opted into public display. Guests may see the name for
-- APPROVED public content only; no email, member roster or account UUID.
grant execute on function public.dd_public_aliases(text,uuid[]) to anon,authenticated;
