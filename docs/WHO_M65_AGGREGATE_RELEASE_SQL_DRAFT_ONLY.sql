-- M65 staging draft. Apply only after M63 in a disposable database.
-- Reviewers use separate direct database identities. No browser RPC is added.
create schema dd_who_m65_private;
revoke all on schema dd_who_m65_private from public, anon, authenticated, service_role;
create role dd_who_m65_reviewer nologin;
grant usage on schema dd_who_m65_private to dd_who_m65_reviewer;

create table dd_who_m65_private.drafts (
  claim_id text not null,
  claim_version integer not null,
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  payload jsonb not null,
  prepared_at timestamptz not null default clock_timestamp(),
  primary key (claim_id, claim_version),
  foreign key (claim_id, claim_version)
    references public.dd_who_m63_claim_versions (claim_id, claim_version)
);

create table dd_who_m65_private.reviews (
  claim_id text not null,
  claim_version integer not null,
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  reviewer name not null default session_user,
  reviewed_at timestamptz not null default clock_timestamp(),
  primary key (claim_id, claim_version, digest, reviewer),
  foreign key (claim_id, claim_version)
    references dd_who_m65_private.drafts (claim_id, claim_version)
);

create table dd_who_m65_private.releases (
  claim_id text not null,
  claim_version integer not null,
  digest text not null,
  published_at timestamptz not null default clock_timestamp(),
  retired_at timestamptz,
  retirement_reason text,
  primary key (claim_id, claim_version),
  foreign key (claim_id, claim_version)
    references dd_who_m65_private.drafts (claim_id, claim_version),
  check ((retired_at is null) = (retirement_reason is null))
);

revoke all on all tables in schema dd_who_m65_private from public, anon, authenticated, service_role;
alter table dd_who_m65_private.drafts enable row level security;
alter table dd_who_m65_private.reviews enable row level security;
alter table dd_who_m65_private.releases enable row level security;

grant select on dd_who_m65_private.drafts to dd_who_m65_reviewer;
grant insert (claim_id, claim_version, digest) on dd_who_m65_private.reviews to dd_who_m65_reviewer;
create policy who_m65_draft_review on dd_who_m65_private.drafts
  for select to dd_who_m65_reviewer using (true);
create policy who_m65_review_own_identity on dd_who_m65_private.reviews
  for insert to dd_who_m65_reviewer with check (
    reviewer = session_user
    and exists (
      select 1 from dd_who_m65_private.drafts draft
      where draft.claim_id = reviews.claim_id and draft.claim_version = reviews.claim_version
        and draft.digest = reviews.digest
    )
  );

create function dd_who_m65_private.aggregate_payload(wanted_id text, wanted_version integer)
returns jsonb language sql stable security invoker set search_path = '' as $body$
  with active as (
    select original_points, independent_points, direct_points, testable_points, alternatives_points
    from public.dd_who_m63_member_ballots ballot
    where ballot.claim_id = wanted_id and ballot.claim_version = wanted_version
      and not is_withdrawn
      and num_nonnulls(original_points, independent_points, direct_points, testable_points, alternatives_points) > 0
  ), bands as (
    select answer.criterion, 1 + answer.points * 5 / (answer.maximum + 1) as band
    from active
    cross join lateral (values
      ('original', original_points, 25), ('independent', independent_points, 30),
      ('direct', direct_points, 25), ('testable', testable_points, 10),
      ('alternatives', alternatives_points, 10)
    ) answer(criterion, points, maximum)
  ), counted as (
    select criterion, count(*)::integer as participants, count(band)::integer as answered,
      count(*) filter (where band is null)::integer as unknown_count,
      count(*) filter (where band = 1)::integer as band_1,
      count(*) filter (where band = 2)::integer as band_2,
      count(*) filter (where band = 3)::integer as band_3,
      count(*) filter (where band = 4)::integer as band_4,
      count(*) filter (where band = 5)::integer as band_5
    from bands group by criterion
  ), safe as (
    select * from counted
    where answered >= 10 and (unknown_count = 0 or unknown_count >= 5)
      and (band_1 = 0 or band_1 >= 5) and (band_2 = 0 or band_2 >= 5)
      and (band_3 = 0 or band_3 >= 5) and (band_4 = 0 or band_4 >= 5)
      and (band_5 = 0 or band_5 >= 5)
  )
  select jsonb_build_object(
    'claim_id', claim.claim_id, 'claim_version', claim.claim_version,
    'statement', claim.statement, 'original_source_url', claim.original_source_url,
    'criteria', coalesce((select jsonb_agg(to_jsonb(safe) order by criterion) from safe), '[]'::jsonb)
  )
  from public.dd_who_m63_claim_versions claim
  where claim.claim_id = wanted_id and claim.claim_version = wanted_version
    and claim.eligible and claim.enabled and claim.reviewed_at is not null;
$body$;

create function dd_who_m65_private.prepare_result(wanted_id text, wanted_version integer)
returns text language plpgsql security invoker set search_path = '' as $body$
declare
  current_payload jsonb;
  current_digest text;
begin
  perform 1 from public.dd_who_m63_claim_versions
    where claim_id = wanted_id and claim_version = wanted_version for update;
  if exists (select 1 from dd_who_m65_private.releases
    where claim_id = wanted_id and claim_version = wanted_version) then
    raise exception 'This claim version already used its one publication' using errcode = '55000';
  end if;
  current_payload = dd_who_m65_private.aggregate_payload(wanted_id, wanted_version);
  if current_payload is null or jsonb_array_length(current_payload->'criteria') = 0 then
    raise exception 'No eligible aggregate meets the publication thresholds' using errcode = '55000';
  end if;
  current_digest = encode(sha256(convert_to(current_payload::text, 'UTF8')), 'hex');
  insert into dd_who_m65_private.drafts (claim_id, claim_version, digest, payload)
  values (wanted_id, wanted_version, current_digest, current_payload)
  on conflict (claim_id, claim_version) do update
    set digest = excluded.digest, payload = excluded.payload, prepared_at = clock_timestamp();
  return current_digest;
end;
$body$;

create function dd_who_m65_private.publish_result(wanted_id text, wanted_version integer)
returns integer language plpgsql security invoker set search_path = '' as $body$
declare
  draft dd_who_m65_private.drafts%rowtype;
  current_payload jsonb;
  latest_review timestamptz;
  publication_time timestamptz;
  published integer;
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Publish in a read committed transaction to validate the current tally' using errcode = '55000';
  end if;
  -- Prevent public publication racing a ballot edit. The lock is held only for the admin transaction.
  lock table public.dd_who_m63_member_ballots in share mode;
  perform 1 from public.dd_who_m63_claim_versions
    where claim_id = wanted_id and claim_version = wanted_version for update;
  if exists (select 1 from dd_who_m65_private.releases
    where claim_id = wanted_id and claim_version = wanted_version) then
    raise exception 'This claim version already used its one publication' using errcode = '55000';
  end if;
  select * into draft from dd_who_m65_private.drafts
    where claim_id = wanted_id and claim_version = wanted_version;
  current_payload = dd_who_m65_private.aggregate_payload(wanted_id, wanted_version);
  if draft.digest is null or current_payload is null or current_payload is distinct from draft.payload then
    raise exception 'The claim or counts changed. Prepare and review a fresh draft.' using errcode = '55000';
  end if;
  select max(reviewed_at) into latest_review from dd_who_m65_private.reviews
    where claim_id = wanted_id and claim_version = wanted_version and digest = draft.digest
    having count(*) >= 2;
  if latest_review is null then
    raise exception 'Two distinct reviewers must approve the exact draft' using errcode = '55000';
  end if;
  publication_time = clock_timestamp();
  insert into dd_who_m65_private.releases (claim_id, claim_version, digest, published_at)
    values (wanted_id, wanted_version, draft.digest, publication_time);
  insert into public.dd_who_m63_public_snapshots (
    claim_id, claim_version, criterion, participants, answered, unknown_count,
    band_1, band_2, band_3, band_4, band_5, approved, reviewed_at, published_at
  )
  select wanted_id, wanted_version, criterion, participants, answered, unknown_count,
    band_1, band_2, band_3, band_4, band_5, true, latest_review, publication_time
  from jsonb_to_recordset(current_payload->'criteria') as result (
    criterion text, participants integer, answered integer, unknown_count integer,
    band_1 integer, band_2 integer, band_3 integer, band_4 integer, band_5 integer
  );
  get diagnostics published = row_count;
  return published;
end;
$body$;

create function dd_who_m65_private.retire_result(wanted_id text, wanted_version integer, reason text)
returns boolean language plpgsql security invoker set search_path = '' as $body$
begin
  if coalesce(length(btrim(reason)), 0) < 8 then
    raise exception 'Provide a reason for retiring this snapshot' using errcode = '22023';
  end if;
  update dd_who_m65_private.releases set retired_at = clock_timestamp(), retirement_reason = reason
    where claim_id = wanted_id and claim_version = wanted_version and retired_at is null;
  if not found then return false; end if;
  update public.dd_who_m63_public_snapshots set approved = false
    where claim_id = wanted_id and claim_version = wanted_version;
  return true;
end;
$body$;

create function dd_who_m65_private.keep_published_source_identity()
returns trigger language plpgsql security invoker set search_path = '' as $body$
begin
  if (new.statement, new.original_source_url) is distinct from (old.statement, old.original_source_url)
     and exists (select 1 from dd_who_m65_private.releases
       where claim_id = old.claim_id and claim_version = old.claim_version) then
    raise exception 'Published source identity is immutable. Retire the result and use a new claim version.'
      using errcode = '55000';
  end if;
  return new;
end;
$body$;
create trigger dd_who_m65_source_identity_after_publication
  before update of statement, original_source_url on public.dd_who_m63_claim_versions
  for each row execute function dd_who_m65_private.keep_published_source_identity();

revoke execute on all functions in schema dd_who_m65_private
  from public, anon, authenticated, service_role, dd_who_m65_reviewer;
