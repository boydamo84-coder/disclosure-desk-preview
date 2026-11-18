-- M07B: narrow read-only pilot status endpoint. Existing Disclosure Desk project.
-- Returns only whether the current signed-in account is on the private roster;
-- NEVER returns member IDs, emails or the roster, and does not publish content.
begin;
set local statement_timeout='20s';
set local lock_timeout='3s';
do $guard$
begin
 if to_regclass('dd_cr_private.pilot_members') is null or
    to_regprocedure('dd_cr_private.is_pilot()') is null or
    to_regprocedure('public.dd_cr_pilot_status()') is not null
 then raise exception 'M07B expected private pilot gate and no pre-existing status RPC';end if;
end $guard$;
create function public.dd_cr_pilot_status()
returns boolean language sql stable security invoker set search_path=''
as $fn$
 select dd_cr_private.is_pilot();
$fn$;
revoke all on function public.dd_cr_pilot_status() from public,anon,authenticated;
grant execute on function public.dd_cr_pilot_status() to authenticated;
do $verify$
begin
 if has_function_privilege('anon','public.dd_cr_pilot_status()','EXECUTE')
 or not has_function_privilege('authenticated','public.dd_cr_pilot_status()','EXECUTE')
 or (select p.prosecdef from pg_proc p where p.oid='public.dd_cr_pilot_status()'::regprocedure)
 then raise exception 'Status endpoint access is incorrectly exposed';end if;
end $verify$;
commit;
select not has_function_privilege('anon','public.dd_cr_pilot_status()','EXECUTE') as guest_denied,
       has_function_privilege('authenticated','public.dd_cr_pilot_status()','EXECUTE') as authenticated_rpc_allowed;