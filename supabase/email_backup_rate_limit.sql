-- One backup email per authenticated user per 60 minutes. Service role only.
create table if not exists public.dd_email_backup_limit (
 user_id uuid primary key references auth.users(id) on delete cascade,
 last_requested_at timestamptz not null default now()
);
alter table public.dd_email_backup_limit enable row level security;
create or replace function public.dd_reserve_email_backup(account_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare updated_count integer;
begin
 if auth.role() is distinct from 'service_role' then
  raise exception 'Not authorised';
 end if;
 insert into public.dd_email_backup_limit(user_id,last_requested_at)
 values(account_id,now()) on conflict(user_id) do update
 set last_requested_at=excluded.last_requested_at
 where dd_email_backup_limit.last_requested_at < now()-interval '60 minutes';
 get diagnostics updated_count=row_count;
 return updated_count=1;
end;
$$;
revoke all on function public.dd_reserve_email_backup(uuid) from public,anon,authenticated;
grant execute on function public.dd_reserve_email_backup(uuid) to service_role;
