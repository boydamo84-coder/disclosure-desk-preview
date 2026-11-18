-- M07B status RPC tests after M07 synthetic A/B/C policy suite.
set role authenticated;
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $check$
begin
 if public.dd_cr_pilot_status() is distinct from true then
  raise exception 'Active pilot B did not pass status RPC';end if;
end $check$;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
begin
 if public.dd_cr_pilot_status() is distinct from false then
  raise exception 'Previously revoked pilot A still eligible';end if;
end $check$;
set request.jwt.claims='{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","is_anonymous":false}';
do $check$
begin
 if public.dd_cr_pilot_status() is distinct from false then
  raise exception 'Uninvited user C eligible for pilot';end if;
end $check$;
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":true}';
do $check$
begin
 if public.dd_cr_pilot_status() is distinct from false then
  raise exception 'Anonymous member became pilot';end if;
end $check$;
reset role;
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 begin
  perform public.dd_cr_pilot_status();
  raise exception 'Guest accessed pilot RPC';
 exception when insufficient_privilege then null;end;
end $check$;
reset role;
select 'PASS M07B: authenticated own-eligibility read only; revoked A, uninvited C and guest denied' as result;
