\set ON_ERROR_STOP on
-- Disposable Postgres: exercise actual SQL RLS and constraints under
-- simulated signed JWT request claims, without contacting Supabase.
do $$
begin
 if (select count(*) from public.dd_who_m63_claim_versions)<>0 then
  raise exception 'Schema must start with zero enabled claims';
 end if;
 if has_table_privilege('anon','public.dd_who_m63_member_ballots','SELECT') then
  raise exception 'Anonymous raw ballot access is exposed';
 end if;
 if has_table_privilege('authenticated','public.dd_who_m63_member_ballots','DELETE') then
  raise exception 'Ballot DELETE must remain forbidden';
 end if;
 if has_column_privilege('authenticated','public.dd_who_m63_member_ballots','user_id','UPDATE') then
  raise exception 'Voter identity can be changed by client';
 end if;
 if has_table_privilege('authenticated','public.dd_who_m63_claim_versions','UPDATE') then
  raise exception 'Users can approve their own claim';
 end if;
end$$;
insert into public.dd_who_m63_claim_versions
 (claim_id,claim_version,statement,original_source_url,eligible,enabled,reviewed_at)
 values
 ('test-original-source-claim',1,'This is a test-only statement with a fully attributed source.','https://example.org/original',true,true,now()),
 ('test-original-source-claim',2,'This is version two of an attributed test statement and context.','https://example.org/original-v2',true,true,now()),
 ('test-original-source-claim',3,'This version has not received editor approval for voting.','https://example.org/third',false,false,null);
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claims='{"is_anonymous":false}';
insert into public.dd_who_m63_member_ballots
 (claim_id,claim_version,original_points,independent_points,direct_points,testable_points,alternatives_points)
 values ('test-original-source-claim',1,0,null,25,10,null);
do $$
declare r record;
begin
 select * into r from public.dd_who_m63_member_ballots;
 if r.user_id<>'11111111-1111-4111-8111-111111111111'::uuid
  or r.original_points<>0 or r.independent_points is not null
  or r.direct_points<>25 or r.alternatives_points is not null
  or r.revision<>1 then
  raise exception 'Null vs zero, signed-in owner and original score caps not preserved';
 end if;
 if (select count(*) from public.dd_who_m63_member_ballots)<>1 then
  raise exception 'Unexpected ballot visibility';
 end if;
end$$;
-- Exact one ballot per account, claim AND version.
do $$
begin
 begin
  insert into public.dd_who_m63_member_ballots
   (claim_id,claim_version,original_points) values ('test-original-source-claim',1,22);
  raise exception 'Duplicate vote unexpectedly allowed';
 exception when unique_violation then null;end;
 begin
  insert into public.dd_who_m63_member_ballots
   (claim_id,claim_version,original_points) values ('test-original-source-claim',3,22);
  raise exception 'Closed claim unexpectedly allowed';
 exception when insufficient_privilege or check_violation then null;end;
 begin
  insert into public.dd_who_m63_member_ballots
   (claim_id,claim_version,original_points) values ('test-original-source-claim',2,26);
  raise exception 'Over-cap integer unexpectedly allowed';
 exception when check_violation then null;end;
 begin
  update public.dd_who_m63_member_ballots set original_points=5
   where claim_id='test-original-source-claim' and claim_version=1;
  raise exception 'Cooldown unexpectedly bypassed';
 exception when check_violation then null;end;
end$$;
-- A different claim version can carry a distinct private ballot.
insert into public.dd_who_m63_member_ballots
 (claim_id,claim_version,original_points)
 values ('test-original-source-claim',2,12);
do $$
begin
 if (select count(*) from public.dd_who_m63_member_ballots)<>2 then
  raise exception 'Version-specific ballot isolation failed';
 end if;
end$$;
-- Second signed-in account cannot select, update or withdraw first user's rows.
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$
begin
 if (select count(*) from public.dd_who_m63_member_ballots)<>0 then
  raise exception 'Private cross-account ballots disclosed';
 end if;
 if (select count(*) from public.dd_who_m63_member_ballots
    where original_points=0)<>0 then
  raise exception 'Cross-account point inference possible';
 end if;
end$$;
insert into public.dd_who_m63_member_ballots
 (claim_id,claim_version,original_points)
 values ('test-original-source-claim',1,15);
do $$
begin
 if (select count(*) from public.dd_who_m63_member_ballots)<>1 then
  raise exception 'Second account not isolated';
 end if;
end$$;
-- Supabase anonymous signed in users still carry role authenticated.
set request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
set request.jwt.claims='{"is_anonymous":true}';
do $$
begin
 if (select count(*) from public.dd_who_m63_member_ballots)<>0 then
  raise exception 'Anonymous-auth user can see ballots';
 end if;
 begin
  insert into public.dd_who_m63_member_ballots
    (claim_id,claim_version,original_points)
   values ('test-original-source-claim',1,11);
  raise exception 'Anonymous-auth vote unexpectedly accepted';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
-- An administrator alone can prepare coarse, reviewed aggregate snapshots.
insert into public.dd_who_m63_public_snapshots
 (claim_id,claim_version,criterion,participants,answered,unknown_count,
  band_1,band_2,band_3,band_4,band_5,approved,reviewed_at,published_at)
 values
 ('test-original-source-claim',1,'original',15,15,0,5,5,5,0,0,true,now(),now()),
 ('test-original-source-claim',1,'independent',9,9,0,9,0,0,0,0,true,now(),now()),
 ('test-original-source-claim',1,'direct',11,10,1,5,5,0,0,0,true,now(),now()),
 ('test-original-source-claim',1,'testable',15,15,0,5,5,5,0,0,false,null,null);
set role anon;
do $$
begin
 if (select count(*) from public.dd_who_m63_public_snapshots)<>1 then
  raise exception 'Unsafe or unreviewed aggregates were publicly visible';
 end if;
 if (select criterion from public.dd_who_m63_public_snapshots limit 1)<>'original' then
  raise exception 'Unexpected public aggregate';
 end if;
end$$;
reset role;
-- Only for test: age an existing ballot while trigger is disabled by
-- superuser (not an operation the authenticated client can perform).
alter table public.dd_who_m63_member_ballots disable trigger dd_who_m63_ballot_guard_trigger;
update public.dd_who_m63_member_ballots set updated_at=now()-interval '10 minutes'
 where user_id='11111111-1111-4111-8111-111111111111'
 and claim_version=1;
alter table public.dd_who_m63_member_ballots enable trigger dd_who_m63_ballot_guard_trigger;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
set request.jwt.claims='{"is_anonymous":false}';
update public.dd_who_m63_member_ballots
 set original_points=24, independent_points=0
 where claim_id='test-original-source-claim' and claim_version=1;
do $$
declare r record;
begin
 select * into r from public.dd_who_m63_member_ballots
 where claim_version=1;
 if r.revision<>2 or r.original_points<>24 or r.independent_points<>0
  then raise exception 'Cooldown expiry or version revision failed';end if;
end$$;
-- Withdraw immediately after edit, preserving unique vote history.
update public.dd_who_m63_member_ballots set is_withdrawn=true
 where claim_id='test-original-source-claim' and claim_version=1;
do $$
declare r record;
begin
 select * into r from public.dd_who_m63_member_ballots where claim_version=1;
 if r.is_withdrawn is not true or r.revision<>3 then
  raise exception 'Withdrawal was not recorded';
 end if;
end$$;
reset role;
select 'M63 ISOLATED POSTGRES RLS PASS: zero enabled claims at install, authenticated ownership, anonymous lockout, five caps/nulls, no duplicate, claim versioning, cooldown, withdrawal, reviewed privacy-safe aggregate counts' as result;
