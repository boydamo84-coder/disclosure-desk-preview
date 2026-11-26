"""No-deploy integrated acceptance: synthetic bytes only, real isolated programs.

This QA runner is not an upload, publication, storage or receipt-authentication
service. It only exchanges known fictional data with disposable Docker test
containers over local process stdin/stdout. No member content or network.
"""
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
import uuid

BASE = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(BASE/'scanner'), str(BASE/'quarantine')]
import test_worker
import test_quota as quota

DB = 'dd-pipeline-local-test'
quota.DB = DB
SCHEMA = quota.SCHEMA
OWNER = quota.OWNER
BUDGET = 250_000_000

SCANNER_QA = r'''
import base64, hashlib, json, os, socket, sys, tempfile
from pathlib import Path
import worker, test_worker
assert os.getuid() != 0 and {n for _,n in socket.if_nameindex()} == {'lo'}
assert not os.access('/worker', os.W_OK)
p = json.load(sys.stdin)
clean = test_worker.pdf()
flagged = test_worker.pdf(marker='Fictional local scanner test signature')
active = test_worker.pdf(action='/OpenAction << /S /JavaScript /JS (void 0) >>')
fixtures = {'clean':clean, 'flagged':flagged, 'active':active, 'wrong_digest':clean, 'official_missing':clean}
raw=base64.b64decode(p['fixture'],validate=True)
assert raw == fixtures[p['case']], 'QA accepts only built-in fictional fixture bytes'
with tempfile.TemporaryDirectory(prefix='dd-pipe-scan-') as td:
    d=Path(td); source=d/'fixture.pdf'; source.write_bytes(raw)
    sig=d/'fixture.hdb'; sig.write_text(f'{hashlib.md5(flagged).hexdigest()}:{len(flagged)}:DD_Fictional_Match\n')
    if p['case']=='official_missing':
        receipt=worker.inspect(source,p['sha256'])
    else:
        receipt=worker._inspect(source,p['sha256'],lambda path:worker._clam_scan(path,sig,official_only=False))
    assert source.read_bytes()==raw
assert not list(Path('/tmp').glob('dd-pdf-*'))
print(json.dumps(receipt,separators=(',',':')))
'''

RENDERER_QA = r'''
import base64, hashlib, json, os, socket, sys, tempfile
from pathlib import Path
import renderer
assert os.getuid()!=0 and {n for _,n in socket.if_nameindex()}=={'lo'}
assert not os.access('/renderer',os.W_OK)
p=json.load(sys.stdin); raw=base64.b64decode(p['fixture'],validate=True)
assert hashlib.sha256(raw).hexdigest() in ALLOWED_FIXTURE_DIGESTS, 'QA accepts only fixed fictional fixture bytes'
with tempfile.TemporaryDirectory(prefix='dd-pipe-render-') as td:
    source=Path(td)/'fictional.pdf'; source.write_bytes(raw)
    result=renderer.render_candidate(source,p['receipt'])
    assert source.read_bytes()==raw
assert not list(Path('/tmp').glob('dd-render-*'))
if 'files' in result:
    result['files']={name:base64.b64encode(data).decode('ascii') for name,data in result['files'].items()}
print(json.dumps(result,separators=(',',':')))
'''


def sha(data): return hashlib.sha256(data).hexdigest()
def b64(data): return base64.b64encode(data).decode('ascii')

def run_container(image, script, data, *, scan=False):
    # Local Docker process only; no ports, mounts, secrets, network, privileges.
    result = subprocess.run([
        'docker','run','--rm','-i','--network','none','--read-only','--cap-drop','ALL',
        '--security-opt','no-new-privileges','--pids-limit','64','--memory','4g' if scan else '1g',
        '--cpus','2','--tmpfs', '/tmp:rw,nosuid,nodev,noexec,size=128m,mode=1777' if scan else '/tmp:rw,nosuid,nodev,noexec,size=64m,mode=1777',
        '--entrypoint','/usr/bin/python3',image,'-B','-c',script],
        input=json.dumps(data),text=True,capture_output=True,timeout=300)
    assert result.returncode==0, 'synthetic container process failed: '+result.stderr[-1000:]
    assert not result.stderr, 'unexpected container diagnostic'
    assert 1 <= len(result.stdout) <= 8_000_000, 'unexpected fixture output size'
    return json.loads(result.stdout)


def inspect_fixture(case, raw, expected):
    return run_container('dd-pdf-scanner:qa',SCANNER_QA,{'case':case,'fixture':b64(raw),'sha256':expected},scan=True)


def render_fixture(raw, receipt, clean):
    allowed={sha(clean),sha(clean+b'\n')}
    return run_container('dd-pdf-renderer:qa', 'ALLOWED_FIXTURE_DIGESTS = '+repr(allowed)+'\n'+RENDERER_QA,
                         {'fixture':b64(raw),'receipt':receipt})


def reserve(data, kind, item=None):
    key = item or str(uuid.uuid4())
    assert type(data) is bytes and 1<=len(data)<=5_000_000
    stmt = (f"INSERT INTO {SCHEMA}.reservations(id,owner_id,copy_kind,expected_sha256,bytes) "
            f"VALUES ('{key}','{OWNER}','{kind}','{sha(data)}',{len(data)});")
    return key,stmt


def change(key,state):
    quota.sql(f"UPDATE {SCHEMA}.reservations SET state='{state}' WHERE id='{key}';")


def pending_then_fixture_release(key, amount):
    used=quota.used(); change(key,'delete_pending')
    assert quota.used()==used, 'deletion request must stay counted'
    quota.sql(f"UPDATE {SCHEMA}.reservations SET state='released' WHERE id='{key}';",ok=False)
    # Only a synthetic fixture for trusted physical deletion confirmation; NO storage API.
    quota.sql(f"UPDATE {SCHEMA}.reservations SET state='released',deletion_confirmed_at=clock_timestamp() WHERE id='{key}';")
    assert quota.used()==used-amount


def checked_candidate(result, original):
    assert result['status']=='render_candidate_next_gate_only', result.get('reason')
    assert set(result)=={'status','candidate_bytes','manifest_sha256','files'}
    assert set(result['files'])=={'manifest.json','page-001.png','page-002.png'}
    files={key:base64.b64decode(val,validate=True) for key,val in result['files'].items()}
    manifest=json.loads(files['manifest.json'])
    assert set(manifest)=={'version','source_sha256','page_count','pages'}
    assert manifest['source_sha256']==sha(original) and manifest['page_count']==2 and manifest['version']==1
    assert sha(files['manifest.json'])==result['manifest_sha256']
    assert result['candidate_bytes']==sum(map(len,files.values()))<=5_000_000
    assert len(manifest['pages'])==2
    for i,page in enumerate(manifest['pages'],1):
        name=f'page-{i:03d}.png'
        assert page['page']==i and page['file']==name
        assert 1<=page['width']<=2000 and 1<=page['height']<=2000
        assert files[name].startswith(b'\x89PNG\r\n\x1a\n') and page['sha256']==sha(files[name]) and page['bytes']==len(files[name])
    return files


def ensure_db():
    for _ in range(30):
        p=subprocess.run(['docker','exec',DB,'sh','-c','test "$(cat /proc/1/comm)" = postgres && pg_isready -U postgres'],capture_output=True)
        if p.returncode==0: break
        time.sleep(1)
    else: raise AssertionError('disposable DB startup failed')
    quota.sql('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;')
    quota.sql((BASE/'quarantine'/'QUOTA_DRAFT_NOT_APPLIED.sql').read_text())
    assert quota.used()==0


def main():
    ensure_db()
    clean=test_worker.pdf()
    # Reserve original bytes before invoking the scanner. `present` is a local
    # metadata fixture only; no bucket or Storage operation is invoked.
    source_key, source_stmt=reserve(clean,'quarantine'); quota.sql(source_stmt); change(source_key,'present')
    assert quota.used()==len(clean)
    exact=inspect_fixture('clean',clean,sha(clean))
    assert exact=={'status':'scan_passed_next_gate_only','sha256':sha(clean),'bytes':len(clean),'pages':2},exact
    # This exact real child-process result, not a hand-written clean receipt,
    # is carried into the separate renderer container.
    renderer_invocations=0
    def next_gate(raw,receipt):
        nonlocal renderer_invocations
        if receipt.get('status')!='scan_passed_next_gate_only':
            return None
        renderer_invocations+=1
        return render_fixture(raw,receipt,clean)
    rep=next_gate(clean,exact); files=checked_candidate(rep,clean)
    print('PASS actual ClamAV/qpdf receipt bound to unchanged fictional PDF reaches separate real Poppler renderer',flush=True)
    entries=[reserve(data,'approved_copy') for data in files.values()]
    quota.sql('BEGIN;\n'+'\n'.join(stmt for _,stmt in entries)+'\nCOMMIT;')
    for key,_ in entries: change(key,'present')
    baseline=len(clean)+sum(map(len,files.values()))
    assert quota.used()==baseline and quota.count()==len(entries)+1
    quota.audit()
    print(f'PASS real Postgres accounted for exact source ({len(clean)} B), every PNG and manifest ({sum(map(len,files.values()))} B) before candidate storage; no real writes',flush=True)
    # Negative inputs use the actual scan results and are not passed to render.
    cases=[('flagged',test_worker.pdf(marker='Fictional local scanner test signature'),'malware_or_scan_limit_detected'),
           ('active',test_worker.pdf(action='/OpenAction << /S /JavaScript /JS (void 0) >>'),'active_or_unsupported_content'),
           ('wrong_digest',clean,'digest_mismatch'),('official_missing',clean,'official_signatures_unavailable')]
    for case,raw,reason in cases:
        key,stmt=reserve(raw,'quarantine'); quota.sql(stmt); change(key,'present')
        receipt=inspect_fixture(case,raw,'0'*64 if case=='wrong_digest' else sha(raw))
        assert receipt['status'] in ('blocked','rejected') and receipt['reason']==reason and set(receipt)=={'status','reason'},receipt
        # Fail closed in the explicit QA branch; do not pass failed receipts
        # to the downstream renderer, and never reserve derivatives for them.
        assert next_gate(raw,receipt) is None
        assert quota.used()==baseline+len(raw)
        pending_then_fixture_release(key,len(raw)); assert quota.used()==baseline
    assert renderer_invocations==1
    print('PASS actual flagged/active/wrong-digest/missing-official-signature results do not invoke renderer or reserve derivatives; quarantine counts until fixture deletion confirmation',flush=True)
    # Even an authentic clean receipt from different bytes may not render.
    altered=render_fixture(clean+b'\n',exact,clean)
    assert altered=={'status':'blocked','reason':'source_receipt_mismatch'},altered
    wrong_count=render_fixture(clean,dict(exact,pages=1),clean)
    assert wrong_count=={'status':'blocked','reason':'page_count_mismatch'},wrong_count
    assert quota.used()==baseline
    print('PASS post-scan byte change and incorrect receipt page count blocked in separate real renderer with no output',flush=True)
    # Fill the budget with fictional metadata to just under combined candidate
    # size; there is enough capacity for the initial PNG(s), but not all.
    first_page=len(files['page-001.png']); room=first_page+1
    assert room < sum(map(len,files.values()))
    left=BUDGET-room-baseline
    assert left>0
    padding=[]
    while left:
        amt=min(left,5_000_000); padding.append(reserve(b'x'*amt,'quarantine')[1]); left-=amt
    quota.sql('BEGIN;\n'+'\n'.join(padding)+'\nCOMMIT;')
    before=quota.used(); rows=quota.count(); assert before==BUDGET-room
    ordered=[reserve(files[name],'approved_copy') for name in ['page-001.png','page-002.png','manifest.json']]
    _,err,_=quota.sql('BEGIN;\n'+'\n'.join(stmt for _,stmt in ordered)+'\nCOMMIT;',ok=False)
    assert 'quota_exceeded' in err and quota.used()==before and quota.count()==rows
    for key,_ in ordered:
        assert quota.sql(f"SELECT count(*) FROM {SCHEMA}.reservations WHERE id='{key}';")[0]=='0'
    quota.audit()
    print('PASS insufficient capacity rejects whole multi-file candidate transaction with zero partial reservations and exact accounting',flush=True)
    print('PASS synthetic offline pipeline only; no live storage, API, publication, official database coverage or auth claim',flush=True)

if __name__=='__main__': main()
