"""Verify actual APK/AAB website asset bytes; no signing or publication."""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

manifest = json.loads(Path(".release-staging/public-site/release-manifest.json").read_text())
expected = {item["path"]: item for item in manifest["files"]}
assert len(expected) == len(manifest["files"])
for filename, prefix in zip(sys.argv[1:], ("assets/dd-site/", "base/assets/dd-site/"), strict=True):
    with zipfile.ZipFile(filename) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), "duplicate APK/AAB ZIP entries"
        payload = {name[len(prefix):] for name in names
                   if name.startswith(prefix) and not name.endswith("/")}
        # The generated manifest is packaged for the allowlisted native reader.
        assert payload == set(expected) | {"snapshot-manifest.json"}, (filename, payload ^ set(expected))
        for path, record in expected.items():
            data = archive.read(prefix+path)
            assert len(data) == record["bytes"], path
            assert hashlib.sha256(data).hexdigest() == record["sha256"], path
        print(f"PASS {Path(filename).name}: {len(expected)} approved website assets match the reviewed manifest")
