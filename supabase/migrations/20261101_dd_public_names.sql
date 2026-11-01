-- Apply in the Disclosure Desk Supabase SQL Editor before releasing usernames.
-- This table is separate from auth.users metadata: browser-side validation cannot secure names.
create table if not exists public.dd_public_names (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 name_key text generated always as (lower(regexp_replace(display_name,'[^A-Za-z0-9]','','g'))) stored,
 updated_at timestamptz not null default now(),
 constraint dd_public_names_length check (char_length(btrim(display_name)) between 2 and 32),
 constraint dd_public_names_allowed check (display_name ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]*$'),
 constraint dd_public_names_nonempty check (name_key <> ''),
 constraint dd_public_names_reserve check (
  name_key !~ '^(admin|administrator|owner|siteowner|superuser|root|sysadmin|staff|mod|moderator|support|helpdesk|official|verified|developer|webmaster|security|disclosuredesk|boyddigitalstudios|bds|uapdisclosuredesk)([0-9]*|team|staff|help|account|official)$'
  and name_key !~ '(admin|moderator|support|official|verified|staff|disclosuredesk|boyddigitalstudios|uapdisclosuredesk)'
 )
);
create unique index if not exists dd_public_names_unique_key on public.dd_public_names(name_key);
alter table public.dd_public_names enable row level security;
revoke all on public.dd_public_names from anon;
grant select, insert, update on public.dd_public_names to authenticated;
drop policy if exists "Read your display name" on public.dd_public_names;
create policy "Read your display name" on public.dd_public_names for select to authenticated using (user_id=auth.uid());
drop policy if exists "Create your display name" on public.dd_public_names;
create policy "Create your display name" on public.dd_public_names for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "Update your display name" on public.dd_public_names;
create policy "Update your display name" on public.dd_public_names for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
-- Verified permissions cannot be granted by display names; future staff roles must be stored server-side.
