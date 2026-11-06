-- DISCLOSURE DESK — UNAPPLIED PRIVATE 1:1 CHAT BACKEND REVIEW
-- TARGET ONLY: Supabase Disclosure Desk project omqxizswzcwgzqaczlhe.
-- DO NOT APPLY TO LIVE, PRODUCTION OR ANOTHER PROJECT WITHOUT A SEPARATE
-- STAGING DATABASE REVIEW AND EXPLICIT DEPLOYMENT APPROVAL.
-- This file is NOT in supabase/migrations, no job automatically applies it.
-- Consent: one invitation preview -> recipient accepts -> then direct messages.
-- Every write is RPC-only, participant checked server-side; no public direct
-- table privileges, no routine access by moderators to private histories.

-- Independent opt-in: public alias alone must NOT enable chat discovery.
alter table public.dd_public_names
 add column if not exists chat_contact_opt_in boolean not null default false;

create table if not exists public.dd_chat_pairs(
 id uuid primary key default gen_random_uuid(),
 inviter_id uuid not null references auth.users(id) on delete cascade,
 invitee_id uuid not null references auth.users(id) on delete cascade,
 initial_preview text not null check(char_length(btrim(initial_preview)) between 5 and 1000),
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 answered_at timestamptz,
 inviter_read_at timestamptz,
 invitee_read_at timestamptz,
 check(inviter_id<>invitee_id)
);
-- One invite per unordered pair for v1: refusal cannot be circumvented by reversing direction.
create unique index if not exists dd_chat_unique_unordered_pair
 on public.dd_chat_pairs (least(inviter_id,invitee_id),greatest(inviter_id,invitee_id));
create index if not exists dd_chat_inviter_created on public.dd_chat_pairs(inviter_id,created_at desc);
create index if not exists dd_chat_invitee_created on public.dd_chat_pairs(invitee_id,created_at desc);

create table if not exists public.dd_chat_messages(
 id uuid primary key default gen_random_uuid(),
 pair_id uuid not null references public.dd_chat_pairs(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists dd_chat_messages_recent on public.dd_chat_messages(pair_id,created_at desc);

create table if not exists public.dd_chat_blocks(
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),
 check(blocker_id<>blocked_id)
);

-- Only content chosen for reporting is copied into a limited moderation record.
create table if not exists public.dd_chat_reports(
 id uuid primary key default gen_random_uuid(),
 pair_id uuid not null references public.dd_chat_pairs(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(reason in ('spam','abuse','privacy','harassment','threats','other')),
 reported_message_id uuid references public.dd_chat_messages(id) on delete set null,
 reported_excerpt text not null check(char_length(reported_excerpt)<=2000),
 created_at timestamptz not null default now(),
 unique(pair_id,reporter_id,reason)
);

-- Separate owner-only allowlist: regular public-comment moderators never
-- automatically gain access to reported private-message excerpts.
create table if not exists public.dd_chat_owner_admins(
 user_id uuid primary key references auth.users(id) on delete cascade
);
-- Owner enrollment is a separate explicit server-admin step before launch.
-- Do NOT seed accounts, emails or UUIDs into public Git code.

alter table public.dd_chat_pairs enable row level security;
alter table public.dd_chat_messages enable row level security;
alter table public.dd_chat_blocks enable row level security;
alter table public.dd_chat_reports enable row level security;
alter table public.dd_chat_owner_admins enable row level security;
revoke all on public.dd_chat_pairs,public.dd_chat_messages,public.dd_chat_blocks,
 public.dd_chat_reports,public.dd_chat_owner_admins from PUBLIC,anon,authenticated;
grant all on public.dd_chat_pairs,public.dd_chat_messages,public.dd_chat_blocks,
 public.dd_chat_reports,public.dd_chat_owner_admins to service_role;
-- No direct SELECT, INSERT, UPDATE or DELETE grant/policy to web users.
-- The reviewed SECURITY DEFINER RPCs below are the only authorised Data API.

create or replace function public.dd_chat_request(p_username text,p_preview text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); receiver uuid; new_id uuid; key text;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 if p_preview is null or char_length(btrim(p_preview)) not between 5 and 1000
 then raise exception 'Write a preview of 5 to 1000 characters';end if;
 key:=lower(regexp_replace(coalesce(btrim(p_username),''),'[^A-Za-z0-9]','','g'));
 if char_length(key) not between 3 and 24 then raise exception 'Username unavailable';end if;
 -- Both users opt into alias visibility and separate chat contact consent.
 if not exists(select 1 from public.dd_public_names n
  where n.user_id=actor and n.is_public and n.chat_contact_opt_in)
 then raise exception 'Enable your public username and private-chat requests first';end if;
 select n.user_id into receiver from public.dd_public_names n
  where n.name_key=key and n.is_public and n.chat_contact_opt_in;
 if receiver is null or receiver=actor then raise exception 'Username unavailable';end if;
 perform pg_advisory_xact_lock(hashtext('dd-chat-request:'||actor::text));
 if exists(select 1 from public.dd_chat_blocks b
  where (b.blocker_id=actor and b.blocked_id=receiver)
     or (b.blocker_id=receiver and b.blocked_id=actor))
 then raise exception 'Chat request unavailable';end if;
 if (select count(*) from public.dd_chat_pairs p
    where p.inviter_id=actor and p.created_at>now()-interval '24 hours')>=10
 then raise exception 'Daily chat-request limit reached';end if;
 insert into public.dd_chat_pairs(inviter_id,invitee_id,initial_preview)
 values(actor,receiver,btrim(p_preview))
 on conflict do nothing returning id into new_id;
 if new_id is null then raise exception 'A request already exists with this account';end if;
 return new_id;
end $$;

create or replace function public.dd_chat_respond(p_pair_id uuid,p_accept boolean)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); accepted_pair uuid; inviter uuid; preview text;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 if p_pair_id is null or p_accept is null then raise exception 'Invalid chat response';end if;
 -- One recipient-only pending -> decided transition under the row update lock.
 -- Only a successful acceptance writes the introduction as message number one.
 update public.dd_chat_pairs p
 set status=case when p_accept then 'accepted' else 'declined' end,answered_at=now()
 where p.id=p_pair_id and p.invitee_id=actor and p.status='pending'
 and not exists(select 1 from public.dd_chat_blocks b where
  (b.blocker_id=p.inviter_id and b.blocked_id=p.invitee_id) or
  (b.blocker_id=p.invitee_id and b.blocked_id=p.inviter_id))
 returning p.id,p.inviter_id,p.initial_preview into accepted_pair,inviter,preview;
 if accepted_pair is not null and p_accept then
  insert into public.dd_chat_messages(pair_id,author_id,body)
  values(accepted_pair,inviter,preview);
 end if;
 return accepted_pair is not null;
end $$;

create or replace function public.dd_chat_send_message(p_pair_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); p record; new_id uuid;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 if p_pair_id is null or p_body is null or char_length(btrim(p_body)) not between 1 and 2000
 then raise exception 'Message must contain 1–2000 characters';end if;
 select * into p from public.dd_chat_pairs
 where id=p_pair_id and status='accepted'
  and (inviter_id=actor or invitee_id=actor) for share;
 if not found then raise exception 'Accepted chat required';end if;
 if exists(select 1 from public.dd_chat_blocks b
  where (b.blocker_id=p.inviter_id and b.blocked_id=p.invitee_id)
    or (b.blocker_id=p.invitee_id and b.blocked_id=p.inviter_id))
 then raise exception 'Chat unavailable';end if;
 perform pg_advisory_xact_lock(hashtext('dd-chat-message:'||actor::text));
 if (select count(*) from public.dd_chat_messages m
   where m.author_id=actor and m.created_at>now()-interval '10 minutes')>=30
 then raise exception 'Message rate limit reached';end if;
 insert into public.dd_chat_messages(pair_id,author_id,body)
 values(p_pair_id,actor,btrim(p_body)) returning id into new_id;
 return new_id;
end $$;

create or replace function public.dd_chat_my_pairs()
returns table(pair_id uuid,direction text,other_username text,initial_preview text,
 status text,created_at timestamptz,answered_at timestamptz,
 contact_unavailable boolean,unread_count integer)
language sql stable security definer set search_path=pg_catalog,public as $$
 select p.id,
  case when p.inviter_id=auth.uid() then 'sent' else 'received' end,
  case when n.is_public then n.display_name else 'Researcher' end,
  p.initial_preview,p.status,p.created_at,p.answered_at,
  exists(select 1 from public.dd_chat_blocks b where
   (b.blocker_id=p.inviter_id and b.blocked_id=p.invitee_id) or
   (b.blocker_id=p.invitee_id and b.blocked_id=p.inviter_id)),
  (select count(*)::integer from public.dd_chat_messages m
   where m.pair_id=p.id and m.author_id<>auth.uid()
    and (case when p.inviter_id=auth.uid() then p.inviter_read_at else p.invitee_read_at end is null
     or m.created_at>case when p.inviter_id=auth.uid()
       then p.inviter_read_at else p.invitee_read_at end))
 from public.dd_chat_pairs p
 left join public.dd_public_names n on n.user_id=
   (case when p.inviter_id=auth.uid() then p.invitee_id else p.inviter_id end)
 where auth.uid() is not null
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and (p.inviter_id=auth.uid() or p.invitee_id=auth.uid())
 order by p.created_at desc limit 100
$$;

create or replace function public.dd_chat_history(p_pair_id uuid,p_limit integer default 100)
returns table(message_id uuid,mine boolean,body text,sent_at timestamptz)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 if p_pair_id is null or coalesce(p_limit,0) not between 1 and 100
 then raise exception 'Invalid chat history request';end if;
 if not exists(select 1 from public.dd_chat_pairs p where p.id=p_pair_id
  and p.status='accepted' and (p.inviter_id=auth.uid() or p.invitee_id=auth.uid())
  and not exists(select 1 from public.dd_chat_blocks b where
   (b.blocker_id=p.inviter_id and b.blocked_id=p.invitee_id) or
   (b.blocker_id=p.invitee_id and b.blocked_id=p.inviter_id)))
 then raise exception 'Accepted and unblocked chat required';end if;
 return query
 select m.id,m.author_id=auth.uid(),m.body,m.created_at
 from public.dd_chat_messages m where m.pair_id=p_pair_id
 order by m.created_at desc,m.id desc limit p_limit;
end $$;

-- Mark only a message the participant actually selected from the accepted pair.
-- No arbitrary future timestamp can be supplied by the browser.
create or replace function public.dd_chat_mark_read(p_pair_id uuid,p_last_message_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); p record; seen timestamptz;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 if p_pair_id is null or p_last_message_id is null
 then raise exception 'Invalid read marker';end if;
 select * into p from public.dd_chat_pairs
 where id=p_pair_id and status='accepted'
  and (inviter_id=actor or invitee_id=actor) for update;
 if not found then return false;end if;
 if exists(select 1 from public.dd_chat_blocks b
  where (b.blocker_id=p.inviter_id and b.blocked_id=p.invitee_id)
    or (b.blocker_id=p.invitee_id and b.blocked_id=p.inviter_id))
 then return false;end if;
 select m.created_at into seen from public.dd_chat_messages m
 where m.id=p_last_message_id and m.pair_id=p_pair_id;
 if seen is null then return false;end if;
 update public.dd_chat_pairs q
 set inviter_read_at=case when actor=q.inviter_id then
     greatest(coalesce(q.inviter_read_at,'-infinity'::timestamptz),seen)
     else q.inviter_read_at end,
  invitee_read_at=case when actor=q.invitee_id then
     greatest(coalesce(q.invitee_read_at,'-infinity'::timestamptz),seen)
     else q.invitee_read_at end
 where q.id=p_pair_id;
 return true;
end $$;

create or replace function public.dd_chat_block(p_pair_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); p record; target uuid;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 select * into p from public.dd_chat_pairs
 where id=p_pair_id and (inviter_id=actor or invitee_id=actor) for update;
 if not found then return false;end if;
 target:=case when p.inviter_id=actor then p.invitee_id else p.inviter_id end;
 insert into public.dd_chat_blocks(blocker_id,blocked_id)
 values(actor,target) on conflict do nothing;
 update public.dd_chat_pairs set status='declined',answered_at=now()
 where id=p_pair_id and status='pending';
 return true;
end $$;

create or replace function public.dd_chat_report(p_pair_id uuid,p_reason text,p_message_id uuid default null)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); p record; excerpt text; affected int;
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required';end if;
 if p_pair_id is null or p_reason not in ('spam','abuse','privacy','harassment','threats','other')
 then raise exception 'Invalid report';end if;
 select * into p from public.dd_chat_pairs
 where id=p_pair_id and (inviter_id=actor or invitee_id=actor);
 if not found then return false;end if;
 if p_message_id is not null then
  select m.body into excerpt from public.dd_chat_messages m
  where m.id=p_message_id and m.pair_id=p_pair_id;
  if excerpt is null then raise exception 'Message unavailable';end if;
 else excerpt:=p.initial_preview;end if;
 -- Only the selected message/intro enters the owner review queue.
 insert into public.dd_chat_reports(pair_id,reporter_id,reason,reported_message_id,reported_excerpt)
 values(p_pair_id,actor,p_reason,p_message_id,excerpt)
 on conflict do nothing;
 get diagnostics affected=row_count;
 return affected=1;
end $$;

create or replace function public.dd_chat_report_queue(p_limit integer default 50)
returns table(report_id uuid,reason text,reported_excerpt text,created_at timestamptz)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
  or not exists(select 1 from public.dd_chat_owner_admins a where a.user_id=auth.uid())
 then raise exception 'Site owner authorisation required';end if;
 if coalesce(p_limit,0) not between 1 and 100 then raise exception 'Invalid limit';end if;
 return query
 select r.id,r.reason,r.reported_excerpt,r.created_at
 from public.dd_chat_reports r order by r.created_at desc limit p_limit;
end $$;

-- Privileged entry points: no PUBLIC or anonymous EXECUTE, least privilege.
revoke all on function public.dd_chat_request(text,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_respond(uuid,boolean) from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_send_message(uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_my_pairs() from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_history(uuid,integer) from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_block(uuid) from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_mark_read(uuid,uuid) from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_report(uuid,text,uuid) from PUBLIC,anon,authenticated;
revoke all on function public.dd_chat_report_queue(integer) from PUBLIC,anon,authenticated;
grant execute on function public.dd_chat_request(text,text) to authenticated;
grant execute on function public.dd_chat_respond(uuid,boolean) to authenticated;
grant execute on function public.dd_chat_send_message(uuid,text) to authenticated;
grant execute on function public.dd_chat_my_pairs() to authenticated;
grant execute on function public.dd_chat_history(uuid,integer) to authenticated;
grant execute on function public.dd_chat_block(uuid) to authenticated;
grant execute on function public.dd_chat_mark_read(uuid,uuid) to authenticated;
grant execute on function public.dd_chat_report(uuid,text,uuid) to authenticated;
grant execute on function public.dd_chat_report_queue(integer) to authenticated;
