"""Real isolated PostgreSQL transaction/role QA, no hosted connection or Storage API."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import time
import uuid

DB = "dd-quota-local-test"
SCHEMA = "dd_cr_quarantine_internal"
BASE = Path(__file__).resolve().parent
OWNER = "00000000-0000-4000-8000-000000000001"
SHA = "a"*64
def sql(query, *, ok=True):
    proc = subprocess.run(["docker","exec","-i",DB,"psql","-X","-qAt","-v","ON_ERROR_STOP=1","-U","postgres","-d","postgres"],
                          input=query,text=True,capture_output=True,timeout=30)
    if ok and proc.returncode != 0:
        raise AssertionError(proc.stderr[-1000:])
    if not ok and proc.returncode == 0:
        raise AssertionError("Unexpected SQL success")
    return proc.stdout.strip(), proc.stderr, proc.returncode
def reserve(key, *, size=5_000_000, kind="quarantine", conflict=False, state="reserved"):
    return f"INSERT INTO {SCHEMA}.reservations(id,owner_id,copy_kind,expected_sha256,bytes,state) VALUES ('{key}','{OWNER}','{kind}','{SHA}',{size},'{state}')"+(" ON CONFLICT(id) DO NOTHING" if conflict else "")+";"
def used():
    result=sql(f"SELECT used_bytes FROM {SCHEMA}.budget;")[0]
    return int(result)
def count():
    return int(sql(f"SELECT count(*) FROM {SCHEMA}.reservations WHERE state<>'released';")[0])
def audit():
    assert sql(f"SELECT used_bytes = (SELECT coalesce(sum(bytes),0) FROM {SCHEMA}.reservations WHERE state<>'released') FROM {SCHEMA}.budget;")[0]=="t"
def main():
    for _ in range(30):
        p=subprocess.run(["docker","exec",DB,"sh","-c",'test "$(cat /proc/1/comm)" = postgres && pg_isready -U postgres'],capture_output=True)
        if p.returncode==0:
            break
        time.sleep(1)
    else:raise AssertionError("Local PostgreSQL failed to start")
    sql("CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;")
    sql((BASE/"QUOTA_DRAFT_NOT_APPLIED.sql").read_text())
    assert used()==0
    for actor in ("anon","authenticated","service_role"):
        sql(f"SET ROLE {actor}; SELECT * FROM {SCHEMA}.reservations;",ok=False)
        sql(f"SET ROLE {actor}; "+reserve(uuid.uuid4()),ok=False)
        sql(f"SET ROLE {actor}; UPDATE {SCHEMA}.budget SET used_bytes=0;",ok=False)
        sql(f"SET ROLE {actor}; SELECT {SCHEMA}.account_reservation();",ok=False)
    print("PASS real PostgreSQL: guest, member and service API roles cannot reach private quota ledger",flush=True)
    raw=str(uuid.uuid4())
    sql(reserve(raw))
    sql(reserve(raw,conflict=True))
    assert used()==5_000_000 and count()==1
    sql(reserve(uuid.uuid4(),size=5_000_001),ok=False)
    sql(reserve(uuid.uuid4(),size=0),ok=False)
    sql(reserve(uuid.uuid4(),state="present"),ok=False)
    sql(f"UPDATE {SCHEMA}.reservations SET bytes=2 WHERE id='{raw}';",ok=False)
    sql(f"UPDATE {SCHEMA}.reservations SET owner_id='{uuid.uuid4()}' WHERE id='{raw}';",ok=False)
    sql(f"UPDATE {SCHEMA}.reservations SET state='released',deletion_confirmed_at=clock_timestamp() WHERE id='{raw}';",ok=False)
    sql(f"DELETE FROM {SCHEMA}.reservations WHERE id='{raw}';",ok=False)
    sql(f"UPDATE {SCHEMA}.reservations SET state='present' WHERE id='{raw}';")
    copy=str(uuid.uuid4())
    sql(reserve(copy,kind="approved_copy"))
    assert used()==10_000_000 and count()==2
    sql(f"UPDATE {SCHEMA}.reservations SET state='delete_pending' WHERE id='{raw}';")
    sql(f"UPDATE {SCHEMA}.reservations SET state='released' WHERE id='{raw}';",ok=False)
    assert used()==10_000_000
    # This is a trusted fixture of an authoritative deletion confirmation;
    # no actual Storage API has been called. An untrusted client cannot set it.
    sql(f"UPDATE {SCHEMA}.reservations SET state='released',deletion_confirmed_at=clock_timestamp() WHERE id='{raw}';")
    assert used()==5_000_000 and count()==1
    sql(f"UPDATE {SCHEMA}.reservations SET state='present',deletion_confirmed_at=NULL WHERE id='{raw}';",ok=False)
    sql(f"UPDATE {SCHEMA}.reservations SET state='released' WHERE id='{raw}';")
    assert used()==5_000_000
    audit()
    print("PASS immutable reservations, copy accounting, idempotency and deletion-pending retention; only trusted confirmation releases bytes",flush=True)
    sql("\n".join(reserve(uuid.uuid4()) for _ in range(47)))
    assert used()==240_000_000
    def race(_):
        cmd=reserve(uuid.uuid4())
        proc=subprocess.run(["docker","exec","-i",DB,"psql","-X","-qAt","-v","ON_ERROR_STOP=1","-U","postgres","-d","postgres"],
                            input=cmd,text=True,capture_output=True,timeout=30)
        if proc.returncode!=0:
            assert "quota_exceeded" in proc.stderr, proc.stderr[-300:]
        return proc.returncode==0
    with ThreadPoolExecutor(max_workers=6) as pool:
        results=list(pool.map(race,range(6)))
    assert sum(results)==2,results
    assert used()==250_000_000 and count()==50
    sql(reserve(uuid.uuid4(),size=1),ok=False)
    audit()
    print("PASS six concurrent writers at 240MB: only two 5MB reservations accepted; exact 250MB cap without drift",flush=True)
    # Failed transaction must release its row lock and not leave phantom bytes.
    sql(f"BEGIN; UPDATE {SCHEMA}.reservations SET state='delete_pending' WHERE id='{copy}'; ROLLBACK;")
    assert used()==250_000_000
    assert sql(f"SELECT state FROM {SCHEMA}.reservations WHERE id='{copy}';")[0]=="reserved"
    audit()
    print("PASS rollback and authoritative ledger consistency",flush=True)

if __name__=="__main__":main()
