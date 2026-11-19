\set ON_ERROR_STOP on
-- M72 regression after M66 closed-vote and retirement fixtures.
-- All backend identities are fictional and database is disposable.
do $m72$
begin
 if has_schema_privilege('anon','dd_who_m65_private','USAGE')
    or has_schema_privilege('authenticated','dd_who_m65_private','USAGE')
    or has_schema_privilege('service_role','dd_who_m65_private','USAGE') then
  raise exception 'Private reviewer/publication schema exposed to public API roles';
 end if;
 if has_function_privilege('authenticated',
      'dd_who_m65_private.retire_result(text,integer,text)','EXECUTE') then
  raise exception 'Authenticated members can call private aggregate retirement';
 end if;
 if has_table_privilege('anon','public.dd_who_m63_member_ballots','SELECT') then
  raise exception 'Anonymous access to private raw ballots exposed';
 end if;
end$m72$;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $m72$
begin
  begin
    update public.dd_who_m63_member_ballots
       set is_withdrawn=false
     where claim_id='m66-postpublish-fictional-claim' and claim_version=1;
    raise exception 'Retired published ballot resurrected';
  exception when sqlstate '55000' then null;
  end;
end$m72$;
commit;

set role anon;
do $m72$
begin
 if exists(select 1 from public.dd_who_m63_public_snapshots
   where claim_id='m66-postpublish-fictional-claim') then
  raise exception 'Withdrawn published aggregate became visible again';
 end if;
end$m72$;
reset role;
select 'M72 PASS: no private schema/RPC access, no retired ballot resurrection, no re-exposure of retired aggregate' as result;
