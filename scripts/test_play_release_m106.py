"""Fail closed on release package format, unexpected debug/signing data and native alignment."""
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from zipfile import ZipFile

apk, aab = (Path(p) for p in sys.argv[1:])
for path, prefix in [(apk, ""), (aab, "base/")]:
    with ZipFile(path) as archive:
        names = set(archive.namelist())
        assert len(names) == len(archive.namelist()), "Duplicate ZIP records"
        assert prefix + "assets/dd-site/index.html" in names
        manifest = "base/manifest/AndroidManifest.xml" if prefix else "AndroidManifest.xml"
        assert manifest in names
        assert any(re.fullmatch(prefix + (r"dex/classes\d*\.dex" if prefix else r"classes\d*\.dex"), n) for n in names)
        assert not any(n.endswith((".jks", ".keystore", ".p12", ".pem")) for n in names)
        assert not any(re.fullmatch(r"META-INF/[^/]+\.(RSA|DSA|EC|SF)", n, re.I) for n in names), "Unexpected signing on unsigned release"
        if prefix:
            assert "BundleConfig.pb" in names
        native = [n for n in names if re.search(r"/?lib/[^/]+/[^/]+\.so$", n)]
        for entry in native:
            if not any(abi in entry for abi in ("/arm64-v8a/", "/x86_64/")):
                continue
            with tempfile.TemporaryDirectory() as td:
                elf = Path(td) / "library.so"
                elf.write_bytes(archive.read(entry))
                result = subprocess.check_output(["readelf", "-lW", str(elf)], text=True)
                alignments = [int(line.split()[-1], 16) for line in result.splitlines() if line.strip().startswith("LOAD ")]
                assert alignments and min(alignments) >= 16384, f"64-bit ELF not 16-KB aligned: {entry}"
        print(f"PASS {path.name}: unsigned release format; {len(native)} native libraries; 64-bit ELF alignment verified if present")
