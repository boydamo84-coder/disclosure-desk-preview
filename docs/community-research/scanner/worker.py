#!/usr/bin/env python3
"""Offline, single-file quarantine inspection candidate. No network, DB or publish API.

Run only in the restricted worker container. A scan receipt is advisory to the
next gate; it must never itself authorize publication or a public download.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import resource
import stat
import subprocess
import tempfile
from urllib.parse import urlsplit

MAX_BYTES = 5_000_000
MAX_PAGES = 100
MAX_POINTS = 14400
MAX_JSON = 16_000_000
MAX_OBJECTS = 20_000
MAX_NODES = 200_000
OFFICIAL_DB = Path("/signatures")
QPDF = "/usr/bin/qpdf"
CLAM = "/usr/bin/clamscan"
REF = re.compile(r"^[0-9]+ [0-9]+ R$")
DIGEST = re.compile(r"^[a-f0-9]{64}$")
HEADER = re.compile(rb"^%PDF-(?:1\.[0-7]|2\.0)[\r\n]")
EOF = re.compile(rb"%%EOF[\x00\x09\x0a\x0c\x0d\x20]*$")
BLOCK_KEYS = frozenset((
    "/AA", "/OpenAction", "/JS", "/JavaScript", "/EmbeddedFiles", "/EF",
    "/AF", "/AcroForm", "/XFA", "/RichMediaContent", "/Collection",
    "/FS", "/Sound", "/Movie", "/Launch", "/SubmitForm", "/ImportData",
    "/GoToR", "/GoToE", "/Rendition", "/3D", "/3DD", "/3DV",
    "/FFilter", "/FDecodeParms", "/Encrypt", "/RichMediaSettings",
))
BLOCK_NAMES = frozenset((
    "/JavaScript", "/Launch", "/SubmitForm", "/ImportData", "/GoToR", "/GoToE",
    "/Rendition", "/RichMedia", "/Movie", "/Sound", "/3D", "/FileAttachment",
    "/EmbeddedFile", "/Filespec", "/Screen", "/Widget", "/XFA", "/ResetForm",
    "/Hide", "/GoTo3DView", "/SetOCGState", "/Named", "/RichMediaExecute",
    "/Thread", "/Trans", "/Crypt", "/PS",
))

class Refusal(Exception):
    def __init__(self, reason, status="rejected"):
        super().__init__(reason)
        self.reason, self.status = reason, status

def require(ok, reason="unsupported_pdf"):
    if not ok:
        raise Refusal(reason)

def blocked(reason):
    raise Refusal(reason, "blocked")

def bounded_read(source):
    try:
        fd = os.open(source, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC)
    except OSError:
        raise Refusal("file_unavailable")
    with os.fdopen(fd, "rb") as f:
        info = os.fstat(f.fileno())
        require(stat.S_ISREG(info.st_mode), "not_regular_file")
        require(16 <= info.st_size <= MAX_BYTES, "file_size")
        raw = f.read(MAX_BYTES + 1)
        require(len(raw) == info.st_size and len(raw) <= MAX_BYTES, "file_changed")
    require(HEADER.match(raw) is not None, "pdf_header")
    require(EOF.search(raw[-2048:]) is not None, "pdf_eof")
    return raw

def run_tool(args, timeout, mem, out_limit=MAX_JSON):
    """Bound child CPU, virtual memory and output; never surface parser stderr."""
    def cap():
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_CPU, (timeout, timeout + 1))
        resource.setrlimit(resource.RLIMIT_AS, (mem, mem))
        resource.setrlimit(resource.RLIMIT_FSIZE, (out_limit, out_limit))
        resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
        os.umask(0o077)
    with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
        try:
            proc = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=out, stderr=err,
                                  timeout=timeout, check=False, preexec_fn=cap,
                                  env={"PATH": "/usr/bin:/bin", "LANG": "C.UTF-8", "HOME": "/tmp"},
                                  cwd="/tmp", close_fds=True)
        except (OSError, subprocess.SubprocessError):
            blocked("scanner_unavailable_or_timeout")
        if out.tell() >= out_limit or err.tell() >= out_limit or proc.returncode < 0:
            blocked("scanner_resource_limit")
        out.seek(0)
        err.seek(0)
        return proc.returncode, out.read(out_limit), err.read(out_limit)

def _clam_scan(file, database, *, official_only):
    # The callable below is used only by trusted QA for its fictional signature
    # database. The production entry point never accepts a fixture flag.
    flags = [
        CLAM, "--database=" + str(database), "--stdout", "--no-summary",
        "--follow-dir-symlinks=0", "--follow-file-symlinks=0",
        "--scan-pdf=yes", "--scan-archive=yes", "--alert-encrypted=yes",
        "--alert-exceeds-max=yes", "--alert-broken=yes", "--alert-macros=yes",
        "--max-filesize=6M", "--max-scansize=64M", "--max-files=2000",
        "--max-recursion=20", "--max-scantime=30000",
        "--official-db-only=" + ("yes" if official_only else "no"),
    ]
    if official_only:
        flags.append("--fail-if-cvd-older-than=2")
    rc, out, err = run_tool(flags + [str(file)], 90, 3 * 1024**3, 1_000_000)
    if rc == 1:
        raise Refusal("malware_or_scan_limit_detected")
    if rc != 0:
        blocked("antivirus_error_or_stale_signatures")
    # Return code 0 can also occur when no file was scanned/skipped. Require
    # exactly the success line for our fixed, private staged file, no warnings.
    expected = (str(file) + ": OK").encode()
    if out.strip() != expected or err.strip():
        blocked("antivirus_result_unconfirmed")
    return True

def official_scan(file):
    # Must be mounted read-only by the trusted operator. No user input controls
    # this directory. Reject missing databases, symlinks and partial installs.
    if not OFFICIAL_DB.is_dir() or OFFICIAL_DB.is_symlink():
        blocked("official_signatures_unavailable")
    for stem in ("main", "daily", "bytecode"):
        candidates = [OFFICIAL_DB / (stem + suffix) for suffix in (".cvd", ".cld")]
        present = [p for p in candidates if p.is_file() and not p.is_symlink()]
        if len(present) != 1:
            blocked("official_signatures_unavailable")
    return _clam_scan(file, OFFICIAL_DB, official_only=True)

def qpdf_document(path):
    # JSON v2 includes unreferenced objects and decoded object-stream members.
    rc, raw, err = run_tool([QPDF, "--json=2", "--json-stream-data=none",
                            "--json-key=pages", "--json-key=encrypt",
                            "--json-key=qpdf", str(path)], 20, 512 * 1024**2)
    if rc in (2, 3):
        raise Refusal("pdf_parse_or_warning")
    if rc != 0 or err.strip():
        blocked("pdf_parser_unconfirmed")
    try:
        document = json.loads(raw)
    except (ValueError, RecursionError):
        blocked("pdf_parser_output")
    require(isinstance(document, dict), "pdf_parser_output")
    require(document.get("encrypt", {}).get("encrypted") is False, "encrypted_pdf")
    objects = document.get("qpdf")
    pages = document.get("pages")
    require(isinstance(objects, list) and len(objects) == 2
            and isinstance(objects[0], dict) and objects[0].get("jsonversion") == 2
            and isinstance(objects[1], dict), "pdf_parser_output")
    require(isinstance(pages, list) and 1 <= len(pages) <= MAX_PAGES, "page_count")
    obj = objects[1]
    require(len(obj) <= MAX_OBJECTS and "trailer" in obj, "object_limit")
    def resolve(value):
        seen = set()
        while isinstance(value, str) and REF.fullmatch(value):
            require(value not in seen and len(seen) < 32, "object_reference")
            seen.add(value)
            item = obj.get("obj:" + value)
            require(isinstance(item, dict) and "value" in item, "object_reference")
            value = item["value"]
        return value
    def check_url(value):
        val = resolve(value)
        require(isinstance(val, str) and val.startswith("u:") and len(val) <= 2048,
                "unsupported_link")
        url = val[2:]
        require(not any(ord(x) < 33 or ord(x) == 127 for x in url), "unsupported_link")
        try:
            parsed = urlsplit(url)
            valid = parsed.scheme.lower() == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password
        except ValueError:
            valid = False
        require(valid, "unsupported_link")
    def check_action(value):
        act = resolve(value)
        require(isinstance(act, dict), "unsupported_action")
        kind = resolve(act.get("/S"))
        if kind == "/URI":
            require(set(act) <= {"/Type", "/S", "/URI", "/IsMap"} and act.get("/IsMap") in (None, False),
                    "unsupported_action")
            check_url(act.get("/URI"))
        elif kind == "/GoTo":
            require(set(act) <= {"/Type", "/S", "/D"} and "/D" in act, "unsupported_action")
        else:
            raise Refusal("unsupported_action")
    # Inspect every disclosed PDF object and every nested dictionary, not just
    # the first page. PDF strings are u:/b:; name objects are canonical / names.
    nodes = 0
    stack = []
    for item in obj.values():
        require(isinstance(item, dict) and len(item) == 1, "pdf_parser_output")
        if "stream" in item:
            stream = item["stream"]
            require(isinstance(stream, dict) and set(stream) == {"dict"} and isinstance(stream["dict"], dict),
                    "pdf_parser_output")
            require("/F" not in stream["dict"], "external_stream")
            stack.append(stream["dict"])
        else:
            require("value" in item, "pdf_parser_output")
            stack.append(item["value"])
    while stack:
        node = stack.pop()
        nodes += 1
        require(nodes <= MAX_NODES, "object_limit")
        if isinstance(node, list):
            stack.extend(node)
        elif isinstance(node, dict):
            for key in node:
                require(key.startswith("/") and key not in BLOCK_KEYS, "active_or_unsupported_content")
            subtype = resolve(node.get("/Subtype"))
            if resolve(node.get("/Type")) == "/Annot":
                require(subtype == "/Link", "unsupported_annotation")
            if "/Annots" in node:
                anns = resolve(node["/Annots"])
                require(isinstance(anns, list), "unsupported_annotation")
                for ann in anns:
                    annotation = resolve(ann)
                    require(isinstance(annotation, dict) and resolve(annotation.get("/Subtype")) == "/Link",
                            "unsupported_annotation")
            if "/A" in node:
                require(subtype == "/Link" or "/Title" in node, "unsupported_action")
                check_action(node["/A"])
            kind = resolve(node.get("/S"))
            if resolve(node.get("/Type")) == "/Action" or kind in ("/URI", "/GoTo"):
                check_action(node)
            stack.extend(node.values())
        elif isinstance(node, str):
            require(not node.startswith("n:") and node not in BLOCK_NAMES,
                    "active_or_unsupported_content")
    def dimension(page, key):
        current, seen = page, set()
        for _ in range(32):
            require(isinstance(current, dict), "page_tree")
            if key in current:
                return resolve(current[key])
            parent = current.get("/Parent")
            if parent is None:
                return None
            require(isinstance(parent, str) and REF.fullmatch(parent) and parent not in seen, "page_tree")
            seen.add(parent)
            current = resolve(parent)
        raise Refusal("page_tree")
    def finite(value):
        return type(value) in (int, float) and math.isfinite(value) and abs(value) <= MAX_POINTS * 100
    seen_pages = set()
    for p in pages:
        require(isinstance(p, dict) and isinstance(p.get("object"), str)
                and p["object"] not in seen_pages, "page_tree")
        seen_pages.add(p["object"])
        page = resolve(p["object"])
        require(isinstance(page, dict) and resolve(page.get("/Type")) == "/Page", "page_tree")
        unit = dimension(page, "/UserUnit")
        unit = 1 if unit is None else unit
        require(finite(unit) and unit > 0, "page_dimensions")
        media = dimension(page, "/MediaBox")
        crop = dimension(page, "/CropBox")
        for box in [media] + ([] if crop is None else [crop]):
            require(isinstance(box, list) and len(box) == 4 and all(finite(v) for v in box), "page_dimensions")
            require(0 < (box[2] - box[0]) * unit <= MAX_POINTS and
                    0 < (box[3] - box[1]) * unit <= MAX_POINTS, "page_dimensions")
    # Check the same original bytes for structural errors/stream decoding
    # warnings. No repair, rewriting, decryption or content extraction.
    rc, _out, err = run_tool([QPDF, "--check", str(path)], 20, 512 * 1024**2)
    if rc in (2, 3):
        raise Refusal("pdf_parse_or_warning")
    if rc != 0 or err.strip():
        blocked("pdf_parser_unconfirmed")
    return len(pages)

def _inspect(source, expected_sha, scanner):
    if not isinstance(expected_sha, str) or not DIGEST.fullmatch(expected_sha):
        return {"status": "blocked", "reason": "missing_expected_digest"}
    try:
        raw = bounded_read(source)
        digest = hashlib.sha256(raw).hexdigest()
        require(digest == expected_sha, "digest_mismatch")
        with tempfile.TemporaryDirectory(prefix="dd-pdf-", dir="/tmp") as td:
            staged = Path(td) / "document.pdf"
            with staged.open("xb") as file:
                file.write(raw)
            staged.chmod(0o400)
            if scanner(staged) is not True:
                blocked("antivirus_result_unconfirmed")
            pages = qpdf_document(staged)
            require(hashlib.sha256(bounded_read(staged)).hexdigest() == digest, "digest_mismatch")
            return {"status": "scan_passed_next_gate_only", "sha256": digest,
                    "bytes": len(raw), "pages": pages}
    except Refusal as e:
        return {"status": e.status, "reason": e.reason}
    except (OSError, ValueError, RecursionError, OverflowError, TypeError, KeyError, AttributeError):
        return {"status": "blocked", "reason": "inspection_unconfirmed"}

def inspect(source, expected_sha):
    # No database, process option, or test override is accepted from users.
    return _inspect(source, expected_sha, official_scan)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Offline PDF quarantine inspection; no public release.")
    parser.add_argument("source", type=Path)
    parser.add_argument("sha256")
    args = parser.parse_args()
    verdict = inspect(args.source, args.sha256)
    print(json.dumps(verdict, separators=(",", ":")), flush=True)
    raise SystemExit(0 if verdict["status"] == "scan_passed_next_gate_only" else 1)
