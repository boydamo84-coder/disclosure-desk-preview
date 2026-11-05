-- DISCLOSURE DESK PROFILE PHOTO POLICY CANDIDATE — UNAPPLIED.
-- Review only. Never run against live omqxizswzcwgzqaczlhe until an
-- encrypted backup+restore, real-auth A/B and explicit release approval.
-- PRIVATE per-account files, one avatar.webp object per registered account.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dd-profile-avatars','dd-profile-avatars',false,1048576,ARRAY['image/webp']::text[])
on conflict(id) do nothing;
do $$
begin
 if not exists(select 1 from storage.buckets
  where id='dd-profile-avatars' and public=false
    and file_size_limit=1048576 and allowed_mime_types=ARRAY['image/webp']::text[]) then
  raise exception 'Avatar bucket must be private, 1MiB and WebP only';
 end if;
end $$;
create policy dd_avatar_owner_select on storage.objects for select to authenticated
using(bucket_id='dd-profile-avatars' and auth.uid() is not null
 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 and name=auth.uid()::text||'/avatar.webp');
create policy dd_avatar_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='dd-profile-avatars' and auth.uid() is not null
 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 and name=auth.uid()::text||'/avatar.webp');
create policy dd_avatar_owner_update on storage.objects for update to authenticated
using(bucket_id='dd-profile-avatars' and auth.uid() is not null
 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 and name=auth.uid()::text||'/avatar.webp')
with check(bucket_id='dd-profile-avatars' and auth.uid() is not null
 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 and name=auth.uid()::text||'/avatar.webp');
create policy dd_avatar_owner_delete on storage.objects for delete to authenticated
using(bucket_id='dd-profile-avatars' and auth.uid() is not null
 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 and name=auth.uid()::text||'/avatar.webp');
commit;
