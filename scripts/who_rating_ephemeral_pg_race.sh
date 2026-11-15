#!/usr/bin/env bash
set -euo pipefail
# M22 CI-only concurrency. No real Supabase project/JWT; disposable Postgres.
test "$PGDATABASE" = "who_evidence_ci"
test "$PGHOST" = "127.0.0.1"
dir="$(mktemp -d)"
first_pid=""
cleanup() {
  if test -n "$first_pid"; then kill "$first_pid" 2>/dev/null || true; fi
  rm -rf "$dir"
}
trap cleanup EXIT
psql -X -v ON_ERROR_STOP=1 -c \
  "INSERT INTO auth.users(id) VALUES('66666666-6666-4666-8666-666666666666')"
psql -X -v ON_ERROR_STOP=1 -c \
  "INSERT INTO auth.sessions(id,user_id) VALUES('66666666-6666-4666-8666-666666666666','66666666-6666-4666-8666-666666666666')"
cat >"$dir/first.sql" <<'SQL'
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';
SET LOCAL request.jwt.claims = '{"is_anonymous":false,"session_id":"66666666-6666-4666-8666-666666666666"}';
SELECT * FROM public.dd_who_claim_rating_set('claim-fixture-2026',33::SMALLINT);
\echo FIRST_VOTE_DONE
SELECT pg_sleep(4);
COMMIT;
SQL
cat >"$dir/second.sql" <<'SQL'
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';
SET LOCAL request.jwt.claims = '{"is_anonymous":false,"session_id":"66666666-6666-4666-8666-666666666666"}';
SELECT * FROM public.dd_who_claim_rating_set('claim-fixture-2026',99::SMALLINT);
COMMIT;
SQL
psql -X -v ON_ERROR_STOP=1 -f "$dir/first.sql" >"$dir/first.log" 2>&1 &
first_pid=$!
found=0
for i in $(seq 1 70); do
  if grep -q 'FIRST_VOTE_DONE' "$dir/first.log"; then found=1; break; fi
  if ! kill -0 "$first_pid" 2>/dev/null; then break; fi
  sleep 0.1
done
if test "$found" -ne 1; then
  echo "First concurrent writer never reached the pending commit"
  cat "$dir/first.log"
  exit 1
fi
set +e
psql -X -v ON_ERROR_STOP=1 -f "$dir/second.sql" >"$dir/second.log" 2>&1
second_rc=$?
set -e
wait "$first_pid"
first_pid=""
if test "$second_rc" -eq 0 || ! grep -q 'Please wait before changing this rating' "$dir/second.log"; then
  echo "Concurrent same-account writer was not stopped by cooldown:"
  cat "$dir/first.log"
  cat "$dir/second.log"
  exit 1
fi
record="$(psql -X -At -v ON_ERROR_STOP=1 -c \
  "SELECT count(*)::text || ':' || min(score)::text FROM public.dd_who_claim_ratings WHERE claim_id='claim-fixture-2026' AND voter_id='66666666-6666-4666-8666-666666666666'")"
if test "$record" != "1:33"; then
  echo "Concurrent writer changed or duplicated protected vote: $record"
  exit 1
fi
echo "Who M22 concurrent writes: one synthetic account, same claim, first 33 kept; second 99 rejected after lock. No real JWT or live database."
