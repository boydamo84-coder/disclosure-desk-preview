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
returns trigger language plpgsql security invoker set search_path=public
as $$
begin
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
