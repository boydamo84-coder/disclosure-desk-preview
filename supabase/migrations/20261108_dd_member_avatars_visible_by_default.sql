-- Disclosure Desk avatar visibility: 8 November 2026.
-- Separate from older owner-private-only review; DO NOT reapply that review.
-- Public photos are ON by default only after a user uploads an image; the
-- uploader states this, and users can switch visibility OFF at any time.
-- All public paths are random opaque UUIDs, never raw Auth user IDs or emails.
-- One canonical 512px WebP at <opaque-key>/avatar.webp. No raw image retained.
begin;

create table if not exists public.dd_avatar_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 public_key uuid not null unique default gen_random_uuid(),
 visible boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.dd_avatar_profiles enable row level security;
revoke all on public.dd_avatar_profiles from PUBLIC, anon, authenticated;
grant all on public.dd_avatar_profiles to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dd-profile-avatars','dd-profile-avatars',false,1048576,array['image/webp']::text[])
on conflict(id) do nothing;
do $$
begin
 if not exists (select 1 from storage.buckets where id='dd-profile-avatars'
   and public=false and file_size_limit=1048576 and allowed_mime_types=array['image/webp']::text[])
 then raise exception 'Private avatar bucket configuration does not match review';end if;
end $$;

-- All account and visibility writes run through narrowly checked RPCs.
create or replace function public.dd_avatar_my_settings()
returns table(public_key uuid,visible boolean)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 insert into public.dd_avatar_profiles(user_id) values(actor) on conflict do nothing;
 return query select a.public_key,a.visible from public.dd_avatar_profiles a where a.user_id=actor;
end $$;

create or replace function public.dd_avatar_set_visibility(p_visible boolean)
returns boolean
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) or p_visible is null
 then raise exception 'Registered account and visibility choice required';end if;
 update public.dd_avatar_profiles set visible=p_visible,updated_at=now() where user_id=actor;
 return found;
end $$;

-- Safe public lookup: returns only public usernames and RANDOM avatar object
-- keys, never user IDs or private emails; disabled public names cannot appear.
create or replace function public.dd_avatar_public_keys(p_usernames text[])
returns table(name_key text,public_key uuid)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if coalesce(array_length(p_usernames,1),0) not between 1 and 50 then return;end if;
 return query select n.name_key,a.public_key
 from public.dd_public_names n
 join public.dd_avatar_profiles a on a.user_id=n.user_id
 where n.is_public and a.visible
 and n.name_key in
  (select lower(regexp_replace(btrim(x),'[^A-Za-z0-9]','','g')) from unnest(p_usernames) x)
 limit 50;
end $$;

-- Helper functions intentionally return ONLY a boolean, even if called as
-- RPCs. They never reveal UUIDs/paths except through a public username lookup.
create or replace function public.dd_avatar_is_owner_path(p_path text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null
  and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
  and exists(select 1 from public.dd_avatar_profiles a
   where a.user_id=auth.uid() and p_path=a.public_key::text||'/avatar.webp');
$$;

create or replace function public.dd_avatar_is_visible_path(p_path text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1
 from public.dd_avatar_profiles a
 join public.dd_public_names n on n.user_id=a.user_id
 where p_path=a.public_key::text||'/avatar.webp'
 and a.visible and n.is_public);
$$;

revoke all on function public.dd_avatar_my_settings() from PUBLIC,anon,authenticated;
revoke all on function public.dd_avatar_set_visibility(boolean) from PUBLIC,anon,authenticated;
revoke all on function public.dd_avatar_public_keys(text[]) from PUBLIC,anon,authenticated;
revoke all on function public.dd_avatar_is_owner_path(text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_avatar_is_visible_path(text) from PUBLIC,anon,authenticated;
grant execute on function public.dd_avatar_my_settings() to authenticated;
grant execute on function public.dd_avatar_set_visibility(boolean) to authenticated;
grant execute on function public.dd_avatar_public_keys(text[]) to anon,authenticated;
grant execute on function public.dd_avatar_is_owner_path(text) to authenticated;
grant execute on function public.dd_avatar_is_visible_path(text) to anon,authenticated;

-- The bucket itself stays PRIVATE. Public viewing is a RLS-controlled
-- authenticated download operation only for aliases whose owner is showing
-- their photo. Hidden photos become inaccessible to new download requests.
create policy dd_avatar_owner_select on storage.objects for select to authenticated
using(bucket_id='dd-profile-avatars' and public.dd_avatar_is_owner_path(name));
create policy dd_avatar_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='dd-profile-avatars' and public.dd_avatar_is_owner_path(name));
create policy dd_avatar_owner_update on storage.objects for update to authenticated
using(bucket_id='dd-profile-avatars' and public.dd_avatar_is_owner_path(name))
with check(bucket_id='dd-profile-avatars' and public.dd_avatar_is_owner_path(name));
create policy dd_avatar_owner_delete on storage.objects for delete to authenticated
using(bucket_id='dd-profile-avatars' and public.dd_avatar_is_owner_path(name));
-- Supabase Storage operation-scoped READ, not unrestricted object listing.
create policy dd_avatar_visible_download on storage.objects for select to anon,authenticated
using(bucket_id='dd-profile-avatars'
 and storage.allow_any_operation(array['object.get_authenticated','object.get_authenticated_info'])
 and public.dd_avatar_is_visible_path(name));

commit;
