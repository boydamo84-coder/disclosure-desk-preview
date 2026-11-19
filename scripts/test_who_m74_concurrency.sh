#!/usr/bin/env bash
set -euo pipefail
# Never run against existing Supabase projects. Two real concurrent psql
# connections, synthetic JWT settings, disposable local PostgreSQL only.
test "$PGHOST" = "127.0.0.1"
test "$PGPORT" = "5432"
test "$PGDATABASE" = "dd_who_m74_ci"
if env | grep -Eq '^(SUPABASE_URL|SUPABASE_DB_URL|DATABASE_URL)='; then
 echo 'M74 REFUSED: cloud connection variable present' >&2
 exit 2
fi
psql -X -v ON_ERROR_STOP=1 -f scripts/fixtures/who-m74-setup.sql
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Scenario 1: admin publication SHARE lock is held first. A member's
# UPDATE must block until publication commits, then fail closed.
psql -X -At -v ON_ERROR_STOP=1 >"$tmp/publish" 2>&1 <<'SQL' &
begin;
lock table public.dd_who_m63_member_ballots in share mode;
select 'M74_PUBLISH_LOCK_READY';
select pg_sleep(3);
do $m74$
begin
 if dd_who_m65_private.publish_result('m74-publish-first-claim',1)<>2 then
  raise exception 'Expected two safe published criteria';end if;
end$m74$;
commit;
select 'M74_PUBLISH_FIRST_DONE';
SQL
pub_pid=$!
ready=0
for i in $(seq 1 70); do
 if grep -q M74_PUBLISH_LOCK_READY "$tmp/publish"; then ready=1; break; fi
 if ! kill -0 "$pub_pid" 2>/dev/null; then break; fi
 sleep 0.1
done
test "$ready" = "1" || { cat "$tmp/publish"; exit 3; }
psql -X -At -v ON_ERROR_STOP=1 >"$tmp/member" 2>&1 <<'SQL'
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000005001',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $m74$
begin
 begin
  update public.dd_who_m63_member_ballots set original_points=25
   where user_id='00000000-0000-4000-8000-000000005001'
     and claim_id='m74-publish-first-claim';
  raise exception 'Race: member changed score after publication';
 exception when sqlstate '55000' then null;end;
end$m74$;
commit;
select 'M74_UPDATE_AFTER_PUBLISH_REJECTED';
SQL
wait "$pub_pid"
grep -q M74_PUBLISH_FIRST_DONE "$tmp/publish"
grep -q M74_UPDATE_AFTER_PUBLISH_REJECTED "$tmp/member"

# Scenario 2: member update ROW EXCLUSIVE lock is held first. Admin
# publication waits; the changed cohort invalidates its signed draft.
psql -X -At -v ON_ERROR_STOP=1 >"$tmp/member2" 2>&1 <<'SQL' &
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006001',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
update public.dd_who_m63_member_ballots set original_points=25
 where user_id='00000000-0000-4000-8000-000000006001'
   and claim_id='m74-member-first-claim';
select 'M74_MEMBER_LOCK_READY';
select pg_sleep(3);
commit;
select 'M74_MEMBER_FIRST_DONE';
SQL
member_pid=$!
ready=0
for i in $(seq 1 70); do
 if grep -q M74_MEMBER_LOCK_READY "$tmp/member2"; then ready=1; break; fi
 if ! kill -0 "$member_pid" 2>/dev/null; then break; fi
 sleep 0.1
done
test "$ready" = "1" || { cat "$tmp/member2"; exit 4; }
psql -X -At -v ON_ERROR_STOP=1 >"$tmp/publish2" 2>&1 <<'SQL'
do $m74$
begin
 begin
  perform dd_who_m65_private.publish_result('m74-member-first-claim',1);
  raise exception 'Race: stale approved digest was published';
 exception when sqlstate '55000' then null;end;
end$m74$;
select 'M74_STALE_PUBLICATION_REJECTED';
SQL
wait "$member_pid"
grep -q M74_MEMBER_FIRST_DONE "$tmp/member2"
grep -q M74_STALE_PUBLICATION_REJECTED "$tmp/publish2"
psql -X -v ON_ERROR_STOP=1 -f scripts/fixtures/who-m74-assertions.sql
echo 'M74 PASS: independent concurrent Postgres connections, fictional JWT/RLS requests, no Supabase Auth/API call'
