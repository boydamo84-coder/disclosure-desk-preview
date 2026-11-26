"""Single official signature-set acceptance test with a synthetic clean PDF."""
import hashlib
import os
from pathlib import Path
import resource
import socket
import tempfile
import time
import worker
from test_worker import pdf

assert os.getuid()!=0 and {n for _,n in socket.if_nameindex()}=={'lo'}
assert not os.access('/worker',os.W_OK) and not os.access('/signatures',os.W_OK)
raw=pdf()
with tempfile.TemporaryDirectory(prefix='dd-official-qa-') as td:
    path=Path(td)/'fixture.pdf'; path.write_bytes(raw)
    start=time.monotonic()
    receipt=worker.inspect(path,hashlib.sha256(raw).hexdigest())
    elapsed=round(time.monotonic()-start,2)
    peak_mib=round(resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss/1024,1)
    assert path.read_bytes()==raw
assert not list(Path('/tmp').glob('dd-pdf-*'))
print(f'Official-only scan outcome: {receipt["status"]}; reason: {receipt.get("reason","none")}; elapsed {elapsed}s; peak child RSS {peak_mib} MiB',flush=True)
assert receipt=={'status':'scan_passed_next_gate_only','sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'pages':2},receipt
print('PASS real ClamAV official-only signature path, freshness gate, actual qpdf, and unchanged synthetic PDF; no live host or member content',flush=True)
