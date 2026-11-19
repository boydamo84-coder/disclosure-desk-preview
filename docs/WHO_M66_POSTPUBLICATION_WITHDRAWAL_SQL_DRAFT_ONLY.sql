-- M66: disposable-database / design-review continuation of M63 + M65.
-- NOT authorised for the live Supabase project. Run AFTER the M65 draft.
-- Policy: a claim version becomes closed once any aggregate has been published.
-- No new member ballots or score edits for that version. A ballot owner may
-- still withdraw their existing ballot; its first withdrawal immediately retires
-- the public snapshot. Retirement never republishes or recalculates a series.
-- Earlier screenshots/exports cannot be recalled. Explain this before voting.
--
-- These trigger functions live in the private schema and have NO public RPC
-- grants. Both operate only on row changes governed by M63 owner RLS + guards.

create function dd_who_m65_private.guard_postpublication_ballot()
returns trigger language plpgsql security definer set search_path = '' as $body$
declare
  was_published boolean;
begin
  select exists (
    select 1 from dd_who_m65_private.releases release
    where release.claim_id = new.claim_id
      and release.claim_version = new.claim_version
  ) into was_published;
  if not was_published then
    return new;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'This claim version is closed after aggregate publication'
      using errcode = '55000';
  end if;

  -- A member keeps the right to withdraw, but must not alter points,
  -- identity, claim, or previously withdrawn status during withdrawal.
  -- M63's existing owner/cooldown/RLS checks still run independently.
  if not (
    old.is_withdrawn = false and new.is_withdrawn = true
    and (new.user_id, new.claim_id, new.claim_version,
         new.original_points, new.independent_points, new.direct_points,
         new.testable_points, new.alternatives_points)
        is not distinct from
        (old.user_id, old.claim_id, old.claim_version,
         old.original_points, old.independent_points, old.direct_points,
         old.testable_points, old.alternatives_points)
  ) then
    raise exception 'After publication only an existing member ballot may be withdrawn'
      using errcode = '55000';
  end if;
  return new;
end;
$body$;

create trigger dd_who_m66_guard_postpublication_ballot
before insert or update on public.dd_who_m63_member_ballots
for each row execute function dd_who_m65_private.guard_postpublication_ballot();

create function dd_who_m65_private.retire_on_member_withdrawal()
returns trigger language plpgsql security definer set search_path = '' as $body$
begin
  if old.is_withdrawn = false and new.is_withdrawn = true
     and exists (
       select 1 from dd_who_m65_private.releases release
       where release.claim_id = new.claim_id
         and release.claim_version = new.claim_version
         and release.retired_at is null
     ) then
    perform dd_who_m65_private.retire_result(
      new.claim_id, new.claim_version,
      'Automatic retirement following a member withdrawal after publication'
    );
  end if;
  return new;
end;
$body$;

create trigger dd_who_m66_retire_on_member_withdrawal
after update of is_withdrawn on public.dd_who_m63_member_ballots
for each row execute function dd_who_m65_private.retire_on_member_withdrawal();

revoke execute on function dd_who_m65_private.guard_postpublication_ballot()
  from public, anon, authenticated, service_role, dd_who_m65_reviewer;
revoke execute on function dd_who_m65_private.retire_on_member_withdrawal()
  from public, anon, authenticated, service_role, dd_who_m65_reviewer;
