\set ON_ERROR_STOP on
-- M72: adversarial tests in disposable PostgreSQL after M63 standard fixture.
-- No Supabase accounts, private user data or production database connection.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $m72$
begin
  begin
    update public.dd_who_m63_member_ballots set is_withdrawn=false
      where claim_id='test-original-source-claim' and claim_version=1;
    raise exception 'Reopening a withdrawn vote was accepted';
  exception when sqlstate '55000' then null;
  end;
  begin
    update public.dd_who_m63_member_ballots set original_points=13
      where claim_id='test-original-source-claim' and claim_version=1;
    raise exception 'Editing withdrawn vote was accepted';
  exception when sqlstate '55000' then null;
  end;
end$m72$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $m72$
begin
  begin
    update public.dd_who_m63_member_ballots
       set is_withdrawn=true, original_points=4
     where claim_id='test-original-source-claim' and claim_version=1;
    raise exception 'Combined score modification and withdrawal was accepted';
  exception when sqlstate '55000' then null;
  end;
end$m72$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $m72$
begin
  begin
    insert into public.dd_who_m63_member_ballots
      (claim_id,claim_version,original_points,is_withdrawn)
    values ('test-original-source-claim',2,8,true);
    raise exception 'Phantom withdrawn ballot INSERT was accepted';
  exception when check_violation then null;
  end;
end$m72$;
commit;

-- Original member is still permanently withdrawn and cross-account sessions
-- have not created any new rows as a side effect of failed malicious writes.
do $m72$
declare r record;
begin
  select * into r from public.dd_who_m63_member_ballots
   where user_id='11111111-1111-4111-8111-111111111111'
     and claim_id='test-original-source-claim' and claim_version=1;
  if not r.is_withdrawn or r.revision<>3 then
    raise exception 'Failed malicious attempt changed withdrawn ballot state';
  end if;
  if exists(select 1 from public.dd_who_m63_member_ballots
   where user_id='44444444-4444-4444-8444-444444444444') then
    raise exception 'Phantom ballot persisted despite rejected insert';
  end if;
end$m72$;
select 'M72 PASS: withdrawn ballots cannot be reopened, edited, silently rescored during withdrawal, or inserted already withdrawn' as result;
