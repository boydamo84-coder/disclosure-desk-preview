\set ON_ERROR_STOP on
-- Synthetic evidence and database identities. No production Auth or member data.
create role m65_reviewer_a login;
create role m65_reviewer_b login;
grant dd_who_m65_reviewer to m65_reviewer_a, m65_reviewer_b;

insert into public.dd_who_m63_claim_versions
  (claim_id, claim_version, statement, original_source_url, eligible, enabled, reviewed_at)
values ('m65-test-source-claim', 1, 'Fictional statement used solely to exercise aggregate publication.',
  'https://example.org/original-statement', true, true, now());

do $$
begin
  perform dd_who_m65_private.prepare_result('m65-test-source-claim', 1);
  raise exception 'An empty cohort produced a draft';
exception when sqlstate '55000' then null;
end$$;

-- Populate fictional participants without impersonating live Auth sessions.
alter table public.dd_who_m63_member_ballots disable trigger dd_who_m63_ballot_guard_trigger;
insert into public.dd_who_m63_member_ballots
  (user_id, claim_id, claim_version, original_points, independent_points, direct_points, testable_points)
select ('00000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  'm65-test-source-claim', 1,
  case when i <= 5 then 0 when i <= 10 then 25 else null end,
  case when i = 1 then 30 else 0 end,
  case when i = 15 then null else 0 end,
  case when i <= 5 then 3 else null end
from generate_series(1, 15) i;
insert into public.dd_who_m63_member_ballots
  (user_id, claim_id, claim_version, original_points, is_withdrawn)
values ('00000000-0000-4000-8000-000000000016', 'm65-test-source-claim', 1, 9, true),
       ('00000000-0000-4000-8000-000000000017', 'm65-test-source-claim', 1, null, false);
alter table public.dd_who_m63_member_ballots enable trigger dd_who_m63_ballot_guard_trigger;

select dd_who_m65_private.prepare_result('m65-test-source-claim', 1);
do $$
declare
  candidate jsonb;
begin
  select payload->'criteria' into candidate from dd_who_m65_private.drafts;
  if jsonb_array_length(candidate) <> 1 or candidate->0->>'criterion' <> 'original'
     or (candidate->0->>'participants')::int <> 15 or (candidate->0->>'answered')::int <> 10
     or (candidate->0->>'unknown_count')::int <> 5 or (candidate->0->>'band_1')::int <> 5
     or (candidate->0->>'band_5')::int <> 5 then
    raise exception 'Unsafe cohort exposure, or an incorrect zero/unknown/withdrawal count: %', candidate;
  end if;
end$$;

set session authorization m65_reviewer_a;
insert into dd_who_m65_private.reviews (claim_id, claim_version, digest)
select claim_id, claim_version, digest from dd_who_m65_private.drafts;
do $$
begin
  begin
    insert into dd_who_m65_private.reviews (claim_id, claim_version, digest)
    select claim_id, claim_version, digest from dd_who_m65_private.drafts;
    raise exception 'A duplicate reviewer was accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into dd_who_m65_private.reviews (claim_id, claim_version, digest, reviewer)
    select claim_id, claim_version, digest, 'm65_reviewer_b' from dd_who_m65_private.drafts;
    raise exception 'A reviewer can forge a second identity';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.dd_who_m63_member_ballots;
    raise exception 'The reviewer can read raw ballots';
  exception when insufficient_privilege then null;
  end;
  begin
    perform dd_who_m65_private.publish_result('m65-test-source-claim', 1);
    raise exception 'A reviewer can publish results';
  exception when insufficient_privilege then null;
  end;
end$$;
reset session authorization;

do $$
begin
  perform dd_who_m65_private.publish_result('m65-test-source-claim', 1);
  raise exception 'Published on only one approval';
exception when sqlstate '55000' then null;
end$$;

set session authorization m65_reviewer_b;
insert into dd_who_m65_private.reviews (claim_id, claim_version, digest)
select claim_id, claim_version, digest from dd_who_m65_private.drafts;
reset session authorization;

alter table public.dd_who_m63_member_ballots disable trigger dd_who_m63_ballot_guard_trigger;
insert into public.dd_who_m63_member_ballots
  (user_id, claim_id, claim_version, original_points, independent_points, direct_points)
values ('00000000-0000-4000-8000-000000000018', 'm65-test-source-claim', 1, 0, 0, 0);
alter table public.dd_who_m63_member_ballots enable trigger dd_who_m63_ballot_guard_trigger;

do $$
begin
  perform dd_who_m65_private.publish_result('m65-test-source-claim', 1);
  raise exception 'Published a draft after the underlying tally changed';
exception when sqlstate '55000' then null;
end$$;

select dd_who_m65_private.prepare_result('m65-test-source-claim', 1);
do $$
begin
  perform dd_who_m65_private.publish_result('m65-test-source-claim', 1);
  raise exception 'Old approvals carried over to the new draft';
exception when sqlstate '55000' then null;
end$$;

set session authorization m65_reviewer_a;
insert into dd_who_m65_private.reviews (claim_id, claim_version, digest)
select claim_id, claim_version, digest from dd_who_m65_private.drafts;
reset session authorization;
set session authorization m65_reviewer_b;
insert into dd_who_m65_private.reviews (claim_id, claim_version, digest)
select claim_id, claim_version, digest from dd_who_m65_private.drafts;
reset session authorization;

update public.dd_who_m63_claim_versions set original_source_url = 'https://example.org/corrected'
where claim_id = 'm65-test-source-claim';
do $$
begin
  perform dd_who_m65_private.publish_result('m65-test-source-claim', 1);
  raise exception 'Published a result after the source changed';
exception when sqlstate '55000' then null;
end$$;
update public.dd_who_m63_claim_versions set original_source_url = 'https://example.org/original-statement'
where claim_id = 'm65-test-source-claim';

do $$
begin
  if dd_who_m65_private.publish_result('m65-test-source-claim', 1) <> 1 then
    raise exception 'Expected exactly one privacy-filtered criterion';
  end if;
end$$;

set role anon;
do $$
begin
  if (select count(*) from public.dd_who_m63_public_snapshots
      where criterion = 'original' and participants = 16 and answered = 11
        and band_1 = 6 and band_5 = 5 and unknown_count = 5) <> 1 then
    raise exception 'Published snapshot is missing or inaccurate';
  end if;
  begin
    perform 1 from dd_who_m65_private.reviews;
    raise exception 'Guest can read the private reviewer audit';
  exception when insufficient_privilege then null;
  end;
end$$;
reset role;
set role authenticated;
do $$
begin
  perform dd_who_m65_private.prepare_result('m65-test-source-claim', 1);
  raise exception 'A member can prepare a public result';
exception when insufficient_privilege then null;
end$$;
reset role;

do $$
begin
  update public.dd_who_m63_claim_versions set original_source_url = 'https://example.org/changed-after-publication'
    where claim_id = 'm65-test-source-claim';
  raise exception 'A published result can be relabelled with a new source';
exception when sqlstate '55000' then null;
end$$;

select dd_who_m65_private.retire_result('m65-test-source-claim', 1, 'Synthetic source review correction');
set role anon;
do $$
begin
  if exists (select 1 from public.dd_who_m63_public_snapshots) then
    raise exception 'Retired aggregate is still publicly visible';
  end if;
end$$;
reset role;

do $$
begin
  perform dd_who_m65_private.prepare_result('m65-test-source-claim', 1);
  raise exception 'Retirement allowed a second publication for an existing claim version';
exception when sqlstate '55000' then null;
end$$;
select 'M65 PASS: private review, two identities, stale rejection, small-cell suppression, publication and retirement' as result;
