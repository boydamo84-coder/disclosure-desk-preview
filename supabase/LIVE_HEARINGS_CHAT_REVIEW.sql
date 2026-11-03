-- Disclosure Desk LIVE: verified event schedule + account-only hearing chat.
-- Additive schema. No existing tables, documents, boards, users or rows modified.
-- Apply only to the existing Disclosure Desk Supabase project after security review.

create table if not exists public.dd_live_events (
  id text primary key check (id ~ '^[a-z0-9-]{8,120}$'),
  title text not null check (char_length(btrim(title)) between 8 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming','live','ended','cancelled')),
  source_url text not null check (source_url ~ '^https://'),
  stream_url text check (stream_url is null or stream_url ~ '^https://'),
  recording_url text check (recording_url is null or recording_url ~ '^https://'),
  source_label text not null default 'Official Congressional source',
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at>starts_at)
);
create index if not exists dd_live_events_upcoming on public.dd_live_events(starts_at) where is_public=true and status in ('upcoming','live');

create table if not exists public.dd_live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.dd_live_events(id) on delete restrict,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 500),
  status text not null default 'approved' check (status in ('approved','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists dd_live_chat_room_time on public.dd_live_chat_messages(event_id,created_at desc) where status='approved';
create index if not exists dd_live_chat_author_time on public.dd_live_chat_messages(author_id,created_at desc);

create table if not exists public.dd_live_chat_flags (
  message_id uuid not null references public.dd_live_chat_messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam','abuse','privacy','other')),
  created_at timestamptz not null default now(),
  primary key (message_id,reporter_id)
);
create index if not exists dd_live_chat_flags_created on public.dd_live_chat_flags(reporter_id,created_at desc);

alter table public.dd_live_events enable row level security;
alter table public.dd_live_chat_messages enable row level security;
alter table public.dd_live_chat_flags enable row level security;

revoke all on public.dd_live_events, public.dd_live_chat_messages, public.dd_live_chat_flags from anon, authenticated;
grant select on public.dd_live_events to anon, authenticated;
grant select,insert on public.dd_live_chat_messages to authenticated;
grant insert on public.dd_live_chat_flags to authenticated;

drop policy if exists dd_live_events_public_read on public.dd_live_events;
create policy dd_live_events_public_read on public.dd_live_events
for select to anon,authenticated using (is_public=true);

drop policy if exists dd_live_chat_read on public.dd_live_chat_messages;
create policy dd_live_chat_read on public.dd_live_chat_messages
for select to authenticated using (
 status='approved'
 and (select auth.uid()) is not null
 and exists (select 1 from public.dd_live_events e where e.id=event_id and e.is_public=true)
);

drop policy if exists dd_live_chat_insert on public.dd_live_chat_messages;
create policy dd_live_chat_insert on public.dd_live_chat_messages
for insert to authenticated with check (
 (select auth.uid())=author_id
 and status='approved'
 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 and exists (
   select 1 from public.dd_live_events e
   where e.id=event_id and e.is_public=true
   and e.status in ('upcoming','live')
   and now()>=e.starts_at-interval '45 minutes'
   and now()<least(coalesce(e.ends_at,e.starts_at+interval '4 hours'), e.starts_at+interval '4 hours')
 )
);
drop policy if exists dd_live_chat_flag_insert on public.dd_live_chat_flags;
create policy dd_live_chat_flag_insert on public.dd_live_chat_flags
for insert to authenticated with check (
 (select auth.uid())=reporter_id
 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
 and exists (select 1 from public.dd_live_chat_messages m where m.id=message_id and m.status='approved' and m.author_id<>reporter_id)
);

-- Server-side throttle and timestamp guard; client may not override created_at or status.
create or replace function public.dd_live_chat_guard()
returns trigger language plpgsql security invoker set search_path=public
as $$
begin
 perform pg_advisory_xact_lock(hashtext(new.author_id::text)); -- Serialise simultaneous posts from one account.
 if new.author_id is distinct from auth.uid() then raise exception 'Invalid chat author'; end if;
 if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'A registered account is required'; end if;
 new.created_at=now();
 new.status='approved';
 if exists(select 1 from public.dd_live_chat_messages m where m.author_id=new.author_id and m.created_at>now()-interval '4 seconds') then
  raise exception 'Please slow down before posting again';
 end if;
 if (select count(*) from public.dd_live_chat_messages m where m.author_id=new.author_id and m.created_at>now()-interval '10 minutes')>=24 then
  raise exception 'Chat rate limit reached. Try again later';
 end if;
 if (select count(*) from public.dd_live_chat_messages m where m.author_id=new.author_id and m.created_at>now()-interval '1 day')>=180 then
  raise exception 'Daily chat limit reached';
 end if;
 if exists(select 1 from public.dd_live_chat_messages m where m.author_id=new.author_id and lower(btrim(m.body))=lower(btrim(new.body)) and m.created_at>now()-interval '2 minutes') then
  raise exception 'Duplicate message';
 end if;
 return new;
end $$;
drop trigger if exists dd_live_chat_guard_trigger on public.dd_live_chat_messages;
create trigger dd_live_chat_guard_trigger before insert on public.dd_live_chat_messages
for each row execute function public.dd_live_chat_guard();

create or replace function public.dd_live_chat_flag_guard()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 perform pg_advisory_xact_lock(hashtext(new.reporter_id::text));
 if new.reporter_id is distinct from auth.uid() then raise exception 'Invalid reporter'; end if;
 if (select count(*) from public.dd_live_chat_flags where reporter_id=new.reporter_id and created_at>now()-interval '1 hour')>=10 then
  raise exception 'Reporting limit reached';
 end if;
 new.created_at=now();
 return new;
end $$;
drop trigger if exists dd_live_chat_flag_guard_trigger on public.dd_live_chat_flags;
create trigger dd_live_chat_flag_guard_trigger before insert on public.dd_live_chat_flags
for each row execute function public.dd_live_chat_flag_guard();

-- Moderation uses existing server-only moderator allowlist, not user-editable metadata.
create or replace function public.dd_moderate_live_chat(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path=public
as $$
begin
 if auth.uid() is null or not public.dd_is_comment_moderator() then raise exception 'Not authorised'; end if;
 if p_status not in ('approved','hidden') then raise exception 'Invalid status'; end if;
 update public.dd_live_chat_messages set status=p_status where id=p_id;
 if not found then raise exception 'Message unavailable'; end if;
end $$;
revoke all on function public.dd_moderate_live_chat(uuid,text) from public, anon;
grant execute on function public.dd_moderate_live_chat(uuid,text) to authenticated;

-- This project already has a supabase_realtime publication. Do not drop/recreate
-- it; add only this new row-protected chat table for INSERT subscriptions.
do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
    and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='dd_live_chat_messages') then
  alter publication supabase_realtime add table public.dd_live_chat_messages;
 end if;
end $$;

-- ARCHIVED HEARING CHAT, READ-ONLY AFTER CLOSE, AND COMMUNITY FIVE-FLAG REVIEW
-- Hearing rows and approved messages persist when events end. Event recordings are
-- linked through the existing official recording_url field; no video is rehosted.
-- Guests see message text/time, NEVER account IDs. Explicit moderator actions can hide it.
alter table public.dd_live_chat_messages
 add column if not exists review_flag_floor integer not null default 0
 check(review_flag_floor >= 0);

-- Never expose raw author IDs via Data API, even on an approved message.
revoke select on table public.dd_live_chat_messages from public,anon,authenticated;
grant insert on table public.dd_live_chat_messages to authenticated;
drop policy if exists dd_live_chat_read on public.dd_live_chat_messages;

-- Stable public record for a publisher-verified hearing; callable by guests.
create or replace function public.dd_public_hearing_chat(
 p_event_id text,p_before timestamptz default null,p_limit integer default 60)
returns table(id uuid,body text,created_at timestamptz,is_mine boolean)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if p_event_id is null or p_event_id !~ '^[a-z0-9-]{8,120}$'
  or p_limit is null or p_limit<1 or p_limit>100 then
  raise exception 'Invalid hearing discussion request';
 end if;
 return query
  select m.id,m.body,m.created_at,
    (auth.uid() is not null and m.author_id=auth.uid()) as is_mine
  from public.dd_live_chat_messages m
  join public.dd_live_events e on e.id=m.event_id
  where m.event_id=p_event_id and e.is_public=true and e.status<>'cancelled'
   and m.status='approved'
   and (p_before is null or m.created_at<p_before)
  order by m.created_at desc,m.id desc limit p_limit;
end $$;
revoke all on function public.dd_public_hearing_chat(text,timestamptz,integer)
 from public,anon,authenticated;
grant execute on function public.dd_public_hearing_chat(text,timestamptz,integer)
 to anon,authenticated;

-- INSERT guard can inspect prior messages without exposing author rows to callers.
create or replace function public.dd_live_chat_guard()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or new.author_id is distinct from auth.uid()
  or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true then
   raise exception 'Registered account required';
 end if;
 perform pg_advisory_xact_lock(hashtext('live-chat-user:'||new.author_id::text));
 new.created_at=now();new.status='approved';
 if exists(select 1 from public.dd_live_chat_messages m
   where m.author_id=new.author_id and m.created_at>now()-interval '4 seconds') then
  raise exception 'Please slow down before posting again';
 end if;
 if (select count(*) from public.dd_live_chat_messages m
   where m.author_id=new.author_id and m.created_at>now()-interval '10 minutes')>=24 then
  raise exception 'Chat rate limit reached. Try again later';
 end if;
 if (select count(*) from public.dd_live_chat_messages m
   where m.author_id=new.author_id and m.created_at>now()-interval '1 day')>=180 then
  raise exception 'Daily chat limit reached';
 end if;
 if exists(select 1 from public.dd_live_chat_messages m
   where m.author_id=new.author_id and lower(btrim(m.body))=lower(btrim(new.body))
    and m.created_at>now()-interval '2 minutes') then
  raise exception 'Duplicate message';
 end if;
 return new;
end $$;
revoke all on function public.dd_live_chat_guard() from public,anon,authenticated;

-- A registered user may flag only a published non-self message.
create or replace function public.dd_can_flag_live_chat(p_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and exists(
   select 1 from public.dd_live_chat_messages m
   join public.dd_live_events e on e.id=m.event_id and e.is_public=true
   where m.id=p_id and m.author_id<>auth.uid() and m.status='approved'
  )
$$;
revoke all on function public.dd_can_flag_live_chat(uuid) from public,anon,authenticated;
grant execute on function public.dd_can_flag_live_chat(uuid) to authenticated;
drop policy if exists dd_live_chat_flag_insert on public.dd_live_chat_flags;
create policy dd_live_chat_flag_insert on public.dd_live_chat_flags for insert
 to authenticated with check(
  reporter_id=(select auth.uid())
  and public.dd_can_flag_live_chat(message_id)
 );

create or replace function public.dd_live_chat_flag_guard()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or new.reporter_id is distinct from auth.uid()
  or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true
  or not public.dd_can_flag_live_chat(new.message_id) then
  raise exception 'Cannot report this hearing message';
 end if;
 perform pg_advisory_xact_lock(hashtext('live-chat-user-flags:'||new.reporter_id::text));
 perform pg_advisory_xact_lock(hashtext('live-chat-message-flags:'||new.message_id::text));
 if (select count(*) from public.dd_live_chat_flags f
   where f.reporter_id=new.reporter_id and f.created_at>now()-interval '1 hour')>=10 then
  raise exception 'Reporting limit reached';
 end if;
 new.created_at=now();return new;
end $$;
revoke all on function public.dd_live_chat_flag_guard() from public,anon,authenticated;

create or replace function public.dd_live_chat_autohide()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 perform pg_advisory_xact_lock(hashtext('live-chat-message-flags:'||new.message_id::text));
 update public.dd_live_chat_messages m
 set status='hidden'
 where m.id=new.message_id and m.status='approved'
  and (select count(*) from public.dd_live_chat_flags f
       where f.message_id=m.id)-m.review_flag_floor>=5;
 return new;
end $$;
revoke all on function public.dd_live_chat_autohide() from public,anon,authenticated;
drop trigger if exists dd_live_chat_autohide_trigger on public.dd_live_chat_flags;
create trigger dd_live_chat_autohide_trigger
 after insert on public.dd_live_chat_flags for each row execute function public.dd_live_chat_autohide();

create or replace function public.dd_live_chat_moderation_queue()
returns table(id uuid,event_id text,body text,flag_count bigint,latest_flag timestamptz)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null
  or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true
  or not public.dd_is_comment_moderator() then raise exception 'Not authorised';end if;
 return query
  select m.id,m.event_id,m.body,count(f.reporter_id),max(f.created_at)
  from public.dd_live_chat_messages m
  left join public.dd_live_chat_flags f on f.message_id=m.id
  where m.status='hidden'
  group by m.id,m.event_id,m.body,m.created_at
  order by m.created_at desc limit 200;
end $$;
revoke all on function public.dd_live_chat_moderation_queue() from public,anon,authenticated;
grant execute on function public.dd_live_chat_moderation_queue() to authenticated;

create or replace function public.dd_moderate_live_chat(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null
  or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true
  or not public.dd_is_comment_moderator() then raise exception 'Not authorised';end if;
 if p_id is null or p_status not in ('approved','hidden') then
  raise exception 'Invalid moderation status';end if;
 perform pg_advisory_xact_lock(hashtext('live-chat-message-flags:'||p_id::text));
 update public.dd_live_chat_messages m
 set status=p_status,
  review_flag_floor=case when p_status='approved'
   then (select count(*)::integer from public.dd_live_chat_flags f where f.message_id=m.id)
   else m.review_flag_floor end
 where m.id=p_id;
 if not found then raise exception 'Message not found';end if;
end $$;
revoke all on function public.dd_moderate_live_chat(uuid,text) from public,anon,authenticated;
grant execute on function public.dd_moderate_live_chat(uuid,text) to authenticated;

-- Only approved public hearing events will ever be returned to non-mod guests.
-- Archived messages do not expire when the official video finishes; all posts
-- after the approved live-chat window stay forbidden by dd_live_chat_insert RLS.
-- Trusted ingest service: explicit grants on this project's Data API.
grant select,insert,update on public.dd_live_events to service_role;
grant select,insert,update,delete on public.dd_live_chat_messages to service_role;
grant select,insert,update,delete on public.dd_live_chat_flags to service_role;
