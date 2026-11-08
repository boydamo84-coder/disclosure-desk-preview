-- STAGED ONLY: do not execute against live until FCM, server secrets and review tests pass.
-- Owner-approved private Android chat push, no message text stored or sent.
begin;
create table if not exists public.dd_android_push_devices (
  fcm_token text primary key check (char_length(fcm_token) between 40 and 4096),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dd_android_push_devices_user_idx on public.dd_android_push_devices(user_id);
alter table public.dd_android_push_devices enable row level security;
revoke all on public.dd_android_push_devices from public, anon, authenticated;
grant select, insert, update, delete on public.dd_android_push_devices to service_role;

create table if not exists public.dd_android_chat_push_queue (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.dd_chat_pairs(id) on delete cascade,
  message_id uuid not null unique references public.dd_chat_messages(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'queued' check (status in ('queued','sent','no-device','blocked','error')),
  last_error text,
  processed_at timestamptz
);
create index if not exists dd_android_chat_push_queue_status_idx on public.dd_android_chat_push_queue(status,created_at);
alter table public.dd_android_chat_push_queue enable row level security;
revoke all on public.dd_android_chat_push_queue from public, anon, authenticated;
grant select, insert, update, delete on public.dd_android_chat_push_queue to service_role;

create or replace function public.dd_android_push_enqueue_message()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  p public.dd_chat_pairs%rowtype;
  target uuid;
begin
  select * into p from public.dd_chat_pairs where id=new.pair_id and status='accepted';
  if not found then return new; end if;
  if new.author_id=p.inviter_id then target=p.invitee_id;
  elsif new.author_id=p.invitee_id then target=p.inviter_id;
  else return new; end if;
  if exists(select 1 from public.dd_chat_blocks b
     where (b.blocker_id=p.inviter_id and b.blocked_id=p.invitee_id)
        or (b.blocker_id=p.invitee_id and b.blocked_id=p.inviter_id))
  then return new; end if;
  insert into public.dd_android_chat_push_queue(pair_id,message_id,recipient_id)
    values(new.pair_id,new.id,target) on conflict (message_id) do nothing;
  return new;
end $$;
revoke all on function public.dd_android_push_enqueue_message() from public, anon, authenticated;
drop trigger if exists dd_android_enqueue_private_chat_push on public.dd_chat_messages;
create trigger dd_android_enqueue_private_chat_push
  after insert on public.dd_chat_messages for each row
  execute function public.dd_android_push_enqueue_message();
commit;
