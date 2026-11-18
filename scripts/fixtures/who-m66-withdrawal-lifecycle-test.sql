\set ON_ERROR_STOP on
-- M66 synthetic fixture. Requires M65 fixture first: it creates the
-- independent reviewer roles. NO credentials, real members or production DB.
insert into public.dd_who_m63_claim_versions
  (claim_id, claim_version, statement, original_source_url, eligible, enabled, reviewed_at)
values (
  'm66-postpublish-fictional-claim', 1,
  'Fictional UAP statement to check that withdrawal retires published community totals.',
  'https://example.org/m66-fictional-source', true, true, now()
);

-- Admin seeds fictional ballots; client owner rules remain enabled afterwards.
alter table public.dd_who_m63_member_ballots disable trigger dd_who_m63_ballot_guard_trigger;
insert into public.dd_who_m63_member_ballots
 (user_id, claim_id, claim_version, original_points, independent_points, updated_at)
select ('00000000-0000-4000-8000-' || lpad((200+i)::text,12,'0'))::uuid,
 'm66-postpublish-fictional-claim', 1, 0, 0, clock_timestamp()-interval '15 minutes'
from generate_series(1,12) i;
alter table public.dd_who_m63_member_ballots enable trigger dd_who_m63_ballot_guard_trigger;

select dd_who_m65_private.prepare_result('m66-postpublish-fictional-claim',1);
set session authorization m65_reviewer_a;
insert into dd_who_m65_private.reviews (claim_id, claim_version, digest)
select claim_id,claim_version,digest from dd_who_m65_private.drafts
where claim_id='m66-postpublish-fictional-claim';
reset session authorization;
set session authorization m65_reviewer_b;
insert into dd_who_m65_private.reviews (claim_id, claim_version, digest)
select claim_id,claim_version,digest from dd_who_m65_private.drafts
where claim_id='m66-postpublish-fictional-claim';
reset session authorization;
do $$
begin
  if dd_who_m65_private.publish_result('m66-postpublish-fictional-claim',1) <> 2 then
    raise exception 'M66 fixture expected two privacy-safe criteria';
  end if;
end$$;

set role anon;
do $$
begin
  if (select count(*) from public.dd_who_m63_public_snapshots
       where claim_id='m66-postpublish-fictional-claim') <> 2 then
    raise exception 'Fixture did not publish its two safe bands';
  end if;
end$$;
reset role;

-- A second signed-in account cannot withdraw the first account's vote.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000202',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $$
declare affected integer;
begin
  update public.dd_who_m63_member_ballots set is_withdrawn=true
   where claim_id='m66-postpublish-fictional-claim'
     and user_id='00000000-0000-4000-8000-000000000201';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Account B withdrew account A ballot'; end if;
end$$;
commit;

-- Once published, the claim version admits no new ballot or point changes.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $$
begin
  begin
    update public.dd_who_m63_member_ballots set original_points=25
      where claim_id='m66-postpublish-fictional-claim';
    raise exception 'A postpublication ballot score was edited';
  exception when sqlstate '55000' then null;
  end;
end$$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000250',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $$
begin
  begin
    insert into public.dd_who_m63_member_ballots
       (claim_id,claim_version,original_points)
    values ('m66-postpublish-fictional-claim',1,0);
    raise exception 'An additional postpublication ballot was accepted';
  exception when sqlstate '55000' then null;
  end;
end$$;
commit;

-- The member's allowed withdrawal instantly retires the public aggregate.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
update public.dd_who_m63_member_ballots
   set is_withdrawn=true
 where claim_id='m66-postpublish-fictional-claim'
   and claim_version=1;
commit;

do $$
declare reason text;
begin
  select retirement_reason into reason from dd_who_m65_private.releases
    where claim_id='m66-postpublish-fictional-claim' and retired_at is not null;
  if reason is null or reason not like 'Automatic retirement%' then
    raise exception 'Withdrawal did not create a private retirement audit';
  end if;
  if (select count(*) from public.dd_who_m63_public_snapshots
       where claim_id='m66-postpublish-fictional-claim' and approved) <> 0 then
    raise exception 'Retired snapshots still marked approved';
  end if;
  if (select is_withdrawn from public.dd_who_m63_member_ballots
       where claim_id='m66-postpublish-fictional-claim'
         and user_id='00000000-0000-4000-8000-000000000201') is not true then
    raise exception 'Original member withdrawal was not saved';
  end if;
end$$;
set role anon;
do $$
begin
  if (select count(*) from public.dd_who_m63_public_snapshots
       where claim_id='m66-postpublish-fictional-claim') <> 0 then
    raise exception 'Guest can still read a retired aggregate';
  end if;
end$$;
reset role;

-- Retirement is final: no recalculation or second publication of a claim version.
do $$
begin
  begin
    perform dd_who_m65_private.prepare_result('m66-postpublish-fictional-claim',1);
    raise exception 'Retired version became publishable again';
  exception when sqlstate '55000' then null;
  end;
end$$;
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000251',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $$
begin
  begin
    insert into public.dd_who_m63_member_ballots
      (claim_id,claim_version,original_points)
    values ('m66-postpublish-fictional-claim',1,0);
    raise exception 'Retired version accepted new ballots';
  exception when sqlstate '55000' then null;
  end;
end$$;
commit;

select 'M66 PASS: cross-account deny, version freeze, withdrawal-triggered retirement, no public rows, no republish' as result;
