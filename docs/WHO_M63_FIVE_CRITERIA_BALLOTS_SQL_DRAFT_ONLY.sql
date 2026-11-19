-- DISCLOSURE DESK M63: DESIGN REVIEW ONLY. NOT APPROVED FOR PRODUCTION.
-- NEVER run on live Supabase as part of GitHub Actions or a site deployment.
-- Uses auth.uid() / auth.jwt() provided by Supabase. Preview tests use local stubs.
-- Every claim/version starts closed; no votes are enabled by this file.
-- New RPCs are deliberately absent; no SECURITY DEFINER Data API is created.

create table public.dd_who_m63_claim_versions (
  claim_id text not null check (claim_id ~ '^[a-z0-9][a-z0-9-]{6,85}$'),
  claim_version integer not null check (claim_version >= 1),
  statement text not null check (length(trim(statement)) >= 30),
  original_source_url text not null check (original_source_url ~ '^https://[^[:space:]]+$'),
  eligible boolean not null default false,
  enabled boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (claim_id,claim_version),
  check (not enabled or (eligible and reviewed_at is not null))
);
alter table public.dd_who_m63_claim_versions enable row level security;
revoke all on table public.dd_who_m63_claim_versions from public,anon,authenticated;
grant select on table public.dd_who_m63_claim_versions to authenticated;
create policy dd_who_m63_eligible_claims_read on public.dd_who_m63_claim_versions
for select to authenticated
using (eligible and enabled and reviewed_at is not null
       and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');

create table public.dd_who_m63_member_ballots (
  user_id uuid not null default auth.uid(),
  claim_id text not null,
  claim_version integer not null,
  original_points integer check (original_points between 0 and 25),
  independent_points integer check (independent_points between 0 and 30),
  direct_points integer check (direct_points between 0 and 25),
  testable_points integer check (testable_points between 0 and 10),
  alternatives_points integer check (alternatives_points between 0 and 10),
  is_withdrawn boolean not null default false,
  revision integer not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,claim_id,claim_version),
  foreign key (claim_id,claim_version)
   references public.dd_who_m63_claim_versions (claim_id,claim_version)
);
create index dd_who_m63_ballot_claim_idx on public.dd_who_m63_member_ballots
 (claim_id,claim_version) where not is_withdrawn;
alter table public.dd_who_m63_member_ballots enable row level security;
revoke all on table public.dd_who_m63_member_ballots from public,anon,authenticated;
-- Do not grant user_id, claim version, timestamps or revision for modification.
-- INSERT column grant intentionally omits user_id, which defaults to auth.uid().
grant select on table public.dd_who_m63_member_ballots to authenticated;
grant insert (claim_id,claim_version,original_points,independent_points,direct_points,
              testable_points,alternatives_points,is_withdrawn)
 on public.dd_who_m63_member_ballots to authenticated;
grant update (original_points,independent_points,direct_points,testable_points,
              alternatives_points,is_withdrawn)
 on public.dd_who_m63_member_ballots to authenticated;
create policy dd_who_m63_ballot_owner_select on public.dd_who_m63_member_ballots
for select to authenticated
using (user_id = (select auth.uid())
       and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create policy dd_who_m63_ballot_owner_insert on public.dd_who_m63_member_ballots
for insert to authenticated
with check (
 user_id = (select auth.uid())
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists (
  select 1 from public.dd_who_m63_claim_versions c
  where c.claim_id=dd_who_m63_member_ballots.claim_id
    and c.claim_version=dd_who_m63_member_ballots.claim_version
    and c.eligible and c.enabled and c.reviewed_at is not null
 )
);
create policy dd_who_m63_ballot_owner_update on public.dd_who_m63_member_ballots
for update to authenticated
using (user_id = (select auth.uid())
       and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true')
with check (user_id = (select auth.uid())
       and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
-- DELETE is deliberately not granted. Withdrawal is a soft update to preserve
-- the prior ballot identity and cooldown history; no new duplicate ballot.
-- This trigger is invoker-only and cannot bypass RLS.
create function public.dd_who_m63_guard_ballot()
returns trigger language plpgsql security invoker set search_path = ''
as $body$
begin
 if auth.uid() is null or new.user_id is distinct from auth.uid()
    or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Authenticated non-anonymous ballot owner required'
    using errcode='42501';
 end if;
 if tg_op='UPDATE' then
  if new.user_id is distinct from old.user_id
     or new.claim_id is distinct from old.claim_id
     or new.claim_version is distinct from old.claim_version then
    raise exception 'Ballot identity and claim version cannot change'
      using errcode='23514';
  end if;
  if not (new.is_withdrawn and not old.is_withdrawn)
     and old.updated_at > clock_timestamp()-interval '5 minutes' then
    raise exception 'Ballot change cooldown active'
      using errcode='23514';
  end if;
  new.created_at=old.created_at;
  new.revision=old.revision+1;
 else
  new.created_at=clock_timestamp();
  new.revision=1;
 end if;
 if not new.is_withdrawn and not exists (
    select 1 from public.dd_who_m63_claim_versions c
    where c.claim_id=new.claim_id and c.claim_version=new.claim_version
      and c.eligible and c.enabled and c.reviewed_at is not null
 ) then
  raise exception 'Claim version not approved for community ballots'
    using errcode='23514';
 end if;
 new.updated_at=clock_timestamp();
 return new;
end
$body$;
revoke all on function public.dd_who_m63_guard_ballot() from public,anon,authenticated;
create trigger dd_who_m63_ballot_guard_trigger
before insert or update on public.dd_who_m63_member_ballots
for each row execute function public.dd_who_m63_guard_ballot();

-- Published aggregates contain no raw ballots, account IDs or identifiers.
-- Publication is a separate editor action, NEVER run by browser.
-- Each criterion has five coarse score bands; incomplete/unknown votes count
-- as unknown, not as zero. Omit tiny sample sizes instead of exposing them.
create table public.dd_who_m63_public_snapshots (
 claim_id text not null,
 claim_version integer not null,
 criterion text not null check (criterion in
  ('original','independent','direct','testable','alternatives')),
 participants integer not null check (participants >= 0),
 answered integer not null check (answered >= 0),
 unknown_count integer not null check (unknown_count >= 0),
 band_1 integer not null check (band_1 >= 0),
 band_2 integer not null check (band_2 >= 0),
 band_3 integer not null check (band_3 >= 0),
 band_4 integer not null check (band_4 >= 0),
 band_5 integer not null check (band_5 >= 0),
 approved boolean not null default false,
 reviewed_at timestamptz,
 published_at timestamptz,
 primary key (claim_id,claim_version,criterion),
 foreign key (claim_id,claim_version)
 references public.dd_who_m63_claim_versions(claim_id,claim_version),
 check (participants=answered+unknown_count),
 check (answered=band_1+band_2+band_3+band_4+band_5),
 check (not approved or (reviewed_at is not null and published_at is not null))
);
alter table public.dd_who_m63_public_snapshots enable row level security;
revoke all on table public.dd_who_m63_public_snapshots from public,anon,authenticated;
grant select on table public.dd_who_m63_public_snapshots to anon,authenticated;
create policy dd_who_m63_only_safe_approved_aggregates
on public.dd_who_m63_public_snapshots
for select to anon,authenticated
using (
 approved and reviewed_at is not null and published_at is not null
 and participants >= 10 and answered >= 10
 and (unknown_count=0 or unknown_count>=5)
 and (band_1=0 or band_1>=5)
 and (band_2=0 or band_2>=5)
 and (band_3=0 or band_3>=5)
 and (band_4=0 or band_4>=5)
 and (band_5=0 or band_5>=5)
 and exists (
  select 1 from public.dd_who_m63_claim_versions c
  where c.claim_id=dd_who_m63_public_snapshots.claim_id
    and c.claim_version=dd_who_m63_public_snapshots.claim_version
    and c.eligible and c.enabled and c.reviewed_at is not null
 )
);
-- Explicit grants to registry required for the RLS EXISTS check on snapshots
-- for anon; its own RLS still limits reads to published eligible versions.
grant select on table public.dd_who_m63_claim_versions to anon;
drop policy dd_who_m63_eligible_claims_read on public.dd_who_m63_claim_versions;
create policy dd_who_m63_eligible_claims_read on public.dd_who_m63_claim_versions
for select to anon,authenticated
using (eligible and enabled and reviewed_at is not null);
-- No claim rows, ballots or aggregates are created by this SQL.
-- No site feature flag or voting endpoint is activated.
