-- M42 additive link nominations. NOT APPLIED TO LIVE by development work.
-- No automatic publication, no public access to submissions or member identity.
begin;
create schema if not exists dd_media_private;
revoke all on schema dd_media_private from public, anon, authenticated;
create table public.dd_media_suggestions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check(category in ('documentaries','movies','books','podcasts')),
 url text not null check(length(url) between 12 and 1800),
 title text not null check(char_length(btrim(title)) between 3 and 180),
 notes text not null default '' check(char_length(notes)<=500),
 status text not null default 'pending' check(status in ('pending','reviewed','declined')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null,
 unique(user_id,url)
);
create index dd_media_suggestion_owner_date on public.dd_media_suggestions(user_id,created_at desc);
create index dd_media_suggestion_queue on public.dd_media_suggestions(created_at) where status='pending';
alter table public.dd_media_suggestions enable row level security;
revoke all on public.dd_media_suggestions from public,anon,authenticated;
grant select on public.dd_media_suggestions to authenticated;
grant insert(user_id,category,url,title,notes) on public.dd_media_suggestions to authenticated;
grant update(status) on public.dd_media_suggestions to authenticated;
create policy dd_media_suggestion_read on public.dd_media_suggestions for select to authenticated
 using (auth.uid() is not null and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
  and (user_id=(select auth.uid()) or (select public.dd_discussions_is_owner())));
create policy dd_media_suggestion_insert on public.dd_media_suggestions for insert to authenticated
 with check (user_id=(select auth.uid()) and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
  and status='pending' and reviewed_by is null and reviewed_at is null);
create policy dd_media_suggestion_review on public.dd_media_suggestions for update to authenticated
 using ((select public.dd_discussions_is_owner())) with check ((select public.dd_discussions_is_owner()));
create function dd_media_private.guard_suggestion() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
  raise exception 'Registered account required';
 end if;
 if TG_OP='INSERT' then
  if new.user_id<>auth.uid() then raise exception 'Account mismatch'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('dd-media-suggestion:'||new.user_id::text,0));
  if (select count(*) from public.dd_media_suggestions where user_id=new.user_id and created_at>now()-interval '24 hours')>=10 then
   raise exception 'Suggestion limit reached';
  end if;
  new.title:=btrim(new.title);new.url:=btrim(new.url);new.notes:=btrim(new.notes);
  if new.url !~ '^https://([a-z0-9-]+\.)+[a-z]{2,}(:443)?(/[^[:space:]]*)?$' then
   raise exception 'Public HTTPS link required';
  end if;
  new.status:='pending';new.created_at:=now();new.reviewed_at:=null;new.reviewed_by:=null;
 else
  if not public.dd_discussions_is_owner() then raise exception 'Site owner required';end if;
  if new.status not in ('reviewed','declined') then raise exception 'Invalid review status';end if;
  new.reviewed_at:=now();new.reviewed_by:=auth.uid();
 end if;
 return new;
end $$;
revoke all on function dd_media_private.guard_suggestion() from public,anon,authenticated;
create trigger dd_media_suggestion_guard before insert or update on public.dd_media_suggestions
 for each row execute function dd_media_private.guard_suggestion();
create function public.dd_media_suggest(p_category text,p_url text,p_title text,p_notes text default '')
 returns uuid language plpgsql security invoker set search_path='' as $$
declare chosen uuid;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Registered account required';end if;
 insert into public.dd_media_suggestions(user_id,category,url,title,notes)
 values(auth.uid(),p_category,p_url,p_title,coalesce(p_notes,'')) returning id into chosen;
 return chosen;
end $$;
create function public.dd_media_suggestion_queue()
 returns table(id uuid,category text,url text,title text,notes text,created_at timestamptz)
 language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or not public.dd_discussions_is_owner() then raise exception 'Site owner required';end if;
 return query select s.id,s.category,s.url,s.title,s.notes,s.created_at
 from public.dd_media_suggestions s where s.status='pending' order by s.created_at limit 100;
end $$;
create function public.dd_media_suggestion_review(p_id uuid,p_status text)
 returns boolean language plpgsql security invoker set search_path='' as $$
declare changed integer;
begin
 if auth.uid() is null or not public.dd_discussions_is_owner() then raise exception 'Site owner required';end if;
 if p_status not in ('reviewed','declined') then raise exception 'Invalid review status';end if;
 update public.dd_media_suggestions set status=p_status where id=p_id and status='pending';
 get diagnostics changed=row_count;return changed=1;
end $$;
revoke all on function public.dd_media_suggest(text,text,text,text) from public,anon,authenticated;
revoke all on function public.dd_media_suggestion_queue() from public,anon,authenticated;
revoke all on function public.dd_media_suggestion_review(uuid,text) from public,anon,authenticated;
grant execute on function public.dd_media_suggest(text,text,text,text),public.dd_media_suggestion_queue(),public.dd_media_suggestion_review(uuid,text) to authenticated;
commit;
