\set ON_ERROR_STOP on
do $m74$
begin
 if not exists(select 1 from dd_who_m65_private.releases
   where claim_id='m74-publish-first-claim' and retired_at is null) then
   raise exception 'Publication-first claim did not publish';end if;
 if (select count(*) from public.dd_who_m63_public_snapshots
   where claim_id='m74-publish-first-claim' and approved)<>2 then
   raise exception 'Publication-first has missing privacy-safe criteria';end if;
 if (select original_points from public.dd_who_m63_member_ballots
   where user_id='00000000-0000-4000-8000-000000005001')<>0 then
   raise exception 'Concurrent member edit escaped published closure';end if;
 if exists(select 1 from dd_who_m65_private.releases
   where claim_id='m74-member-first-claim') then
   raise exception 'A stale aggregate was published';end if;
 if exists(select 1 from public.dd_who_m63_public_snapshots
   where claim_id='m74-member-first-claim') then
   raise exception 'Stale aggregate rows leaked';end if;
 if (select original_points from public.dd_who_m63_member_ballots
   where user_id='00000000-0000-4000-8000-000000006001')<>25 then
   raise exception 'Member-first edit not committed';end if;
end$m74$;
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000005001',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $m74$
begin
 if (select count(*) from public.dd_who_m63_member_ballots)<>1 then
   raise exception 'Account A sees a foreign private ballot';end if;
 if exists(select 1 from public.dd_who_m63_member_ballots where
   user_id='00000000-0000-4000-8000-000000006001') then
   raise exception 'Account A can read Account B';end if;
end$m74$;
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006001',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $m74$
declare n integer;
begin
 update public.dd_who_m63_member_ballots set is_withdrawn=true
  where user_id='00000000-0000-4000-8000-000000005001';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Account B withdrew Account A';end if;
 if (select count(*) from public.dd_who_m63_member_ballots)<>1 then
   raise exception 'Account B sees a foreign private ballot';end if;
end$m74$;
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009999',true);
select set_config('request.jwt.claims','{"is_anonymous":true}',true);
do $m74$
begin
 if exists(select 1 from public.dd_who_m63_member_ballots) then
   raise exception 'Anonymous Auth user can read private votes';end if;
 begin
  insert into public.dd_who_m63_member_ballots(claim_id,claim_version,original_points)
  values('m74-member-first-claim',1,0);
  raise exception 'Anonymous Auth user voted';
 exception when insufficient_privilege then null;end;
end$m74$;
commit;
set role anon;
do $m74$
begin
 if (select count(*) from public.dd_who_m63_public_snapshots)<>2 then
   raise exception 'Guest should see exactly two approved coarse criteria';end if;
end$m74$;
reset role;
select 'M74 PASS: both parallel race outcomes, RLS owner isolation, anonymous Auth denial and guest snapshot privacy' as result;
