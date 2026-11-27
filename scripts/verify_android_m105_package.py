"""Verify actual APK website asset bytes; no signing or publication."""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

manifest = json.loads(Path(".release-staging/public-site/release-manifest.json").read_text())
expected = {item["path"]: item for item in manifest["files"]}
assert len(expected) == len(manifest["files"])
if len(sys.argv) != 2:
    sys.exit("Usage: verify_android_m105_package.py PATH_TO_APK")
filename = sys.argv[1]
prefix = "assets/dd-site/"
with zipfile.ZipFile(filename) as archive:
    embedded = json.loads(archive.read(prefix + "snapshot-manifest.json"))
    assert embedded["files"] == list(expected), "APK snapshot allowlist"
    assert embedded["totalBytes"] == manifest["totalBytes"], "APK snapshot byte count"
    staged = json.loads(Path("android-test/app/src/main/assets/dd-site/snapshot-manifest.json").read_text())
    assert embedded == staged, "APK snapshot provenance"
    names = archive.namelist()
    assert len(names) == len(set(names)), "duplicate APK ZIP entries"
    payload = {name[len(prefix):] for name in names
               if name.startswith(prefix) and not name.endswith("/")}
    # The generated manifest is packaged for the allowlisted native reader.
    assert payload == set(expected) | {"snapshot-manifest.json"}, (filename, payload ^ set(expected))
    for path, record in expected.items():
        data = archive.read(prefix+path)
        assert len(data) == record["bytes"], path
        assert hashlib.sha256(data).hexdigest() == record["sha256"], path
    print(f"PASS {Path(filename).name}: {len(expected)} approved website assets match the reviewed manifest")
