#!/usr/bin/env python3
"""Offline page representation candidate. No API, serving, publication or storage client.

Only a trusted, isolated render orchestrator may pass the internal scan receipt.
The receipt is a consistency check, NOT authentication or permission to publish.
"""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import resource
import stat
import struct
import subprocess
import tempfile
import time
import zlib

from PIL import Image

MAX_SOURCE_BYTES = 5_000_000
MAX_CANDIDATE_BYTES = 5_000_000  # all page PNGs + manifest, never per page alone
MAX_PAGES = 100
MAX_EDGE = 2000
MAX_PPM_BYTES = 3 * MAX_EDGE * MAX_EDGE + 128
TOTAL_SECONDS = 240
PDFINFO = "/usr/bin/pdfinfo"
PDFTOPPM = "/usr/bin/pdftoppm"
SHA = re.compile(r"[a-f0-9]{64}\Z")
PPM_HEADER = re.compile(rb"P6\n([1-9][0-9]{0,3}) ([1-9][0-9]{0,3})\n255\n")
PNG_SIG = b"\x89PNG\r\n\x1a\n"

class Blocked(Exception):
    pass


def demand(value, reason):
    if not value:
        raise Blocked(reason)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def read_source(path):
    fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK | os.O_NOFOLLOW | os.O_CLOEXEC)
    with os.fdopen(fd, "rb") as file:
        before = os.fstat(file.fileno())
        demand(stat.S_ISREG(before.st_mode), "not_regular_file")
        demand(16 <= before.st_size <= MAX_SOURCE_BYTES, "source_size")
        data = file.read(MAX_SOURCE_BYTES + 1)
        demand(len(data) == before.st_size <= MAX_SOURCE_BYTES, "source_changed")
        return data


def verify_scan_receipt(receipt):
    demand(type(receipt) is dict and set(receipt) == {"status", "sha256", "bytes", "pages"}, "scan_receipt_unconfirmed")
    demand(receipt["status"] == "scan_passed_next_gate_only", "scan_receipt_unconfirmed")
    demand(type(receipt["sha256"]) is str and SHA.fullmatch(receipt["sha256"]) is not None, "scan_receipt_unconfirmed")
    demand(type(receipt["bytes"]) is int and 16 <= receipt["bytes"] <= MAX_SOURCE_BYTES, "scan_receipt_unconfirmed")
    demand(type(receipt["pages"]) is int and 1 <= receipt["pages"] <= MAX_PAGES, "scan_receipt_unconfirmed")


def tool(args, max_output, deadline):
    timeout = min(20, deadline - time.monotonic())
    demand(timeout >= 0.1, "render_time_limit")
    def limits():
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_CPU, (20, 21))
        resource.setrlimit(resource.RLIMIT_AS, (768 * 1024**2, 768 * 1024**2))
        resource.setrlimit(resource.RLIMIT_FSIZE, (max_output + 1, max_output + 1))
        resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
        os.umask(0o077)
    with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
        try:
            p = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=out, stderr=err,
                               cwd="/tmp", env={"PATH":"/usr/bin:/bin", "LANG":"C.UTF-8", "HOME":"/tmp"},
                               close_fds=True, preexec_fn=limits, timeout=timeout, check=False)
        except (OSError, subprocess.SubprocessError):
            raise Blocked("renderer_unavailable_or_timeout") from None
        demand(p.returncode == 0 and err.tell() == 0, "renderer_warning_or_error")
        demand(0 < out.tell() <= max_output, "renderer_output_limit")
        out.seek(0)
        return out.read(max_output + 1)


def page_count(path, deadline):
    # Only count and encryption state are consumed; never include PDF metadata.
    info = tool([PDFINFO, str(path)], 1_000_000, deadline)
    counts = re.findall(rb"(?m)^Pages:[ \t]+([1-9][0-9]*)[ \t]*$", info)
    encryption = re.findall(rb"(?m)^Encrypted:[ \t]+([^\r\n]+)$", info)
    demand(len(counts) == len(encryption) == 1 and encryption[0].strip() == b"no", "page_count_unconfirmed")
    demand(len(counts[0]) <= 3, "page_count_unconfirmed")
    return int(counts[0])


def clean_png(ppm):
    """Only trusted-size raw RGB pixels cross the renderer/encoder boundary."""
    header = PPM_HEADER.match(ppm)
    demand(header is not None, "invalid_raster_output")
    width, height = [int(n) for n in header.groups()]
    demand(1 <= width <= MAX_EDGE and 1 <= height <= MAX_EDGE, "raster_dimensions")
    raw = ppm[header.end():]
    demand(len(raw) == 3 * width * height, "invalid_raster_output")
    image = Image.frombytes("RGB", (width, height), raw)
    output = io.BytesIO()
    image.save(output, format="PNG", compress_level=6)  # fresh RGB image, no source metadata
    png = output.getvalue()
    validate_png(png, width, height)
    return png, width, height


def validate_png(png, width, height):
    # Strict whitelist: no text, EXIF, profiles, extra data, animation or URLs.
    demand(png.startswith(PNG_SIG), "invalid_png")
    offset, state = len(PNG_SIG), 0
    while offset + 12 <= len(png):
        n = struct.unpack_from(">I", png, offset)[0]
        kind = png[offset+4:offset+8]
        end = offset + 12 + n
        demand(end <= len(png), "invalid_png")
        data = png[offset+8:end-4]
        crc = struct.unpack_from(">I", png, end-4)[0]
        demand(zlib.crc32(kind + data) & 0xffffffff == crc, "invalid_png")
        if state == 0:
            demand(kind == b"IHDR" and data == struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0), "invalid_png")
            state = 1
        elif state in (1, 2) and kind == b"IDAT" and n > 0:
            state = 2
        elif state == 2 and kind == b"IEND" and n == 0:
            demand(end == len(png), "invalid_png")
            return
        else:
            raise Blocked("invalid_png")
        offset = end
    raise Blocked("invalid_png")


def render_candidate(source, trusted_scan_receipt):
    """Produce private candidate files in memory, atomically all-or-nothing.

    Never usable as a public publish/serve response. On any failure the result
    has no page bytes, manifest, filename or parser detail. The caller must
    independently establish the receipt's origin before use.
    """
    try:
        verify_scan_receipt(trusted_scan_receipt)
        raw = read_source(source)
        sha = digest(raw)
        demand(sha == trusted_scan_receipt["sha256"] and len(raw) == trusted_scan_receipt["bytes"], "source_receipt_mismatch")
        deadline = time.monotonic() + TOTAL_SECONDS
        with tempfile.TemporaryDirectory(prefix="dd-render-", dir="/tmp") as folder:
            copy = Path(folder) / "document.pdf"
            with copy.open("xb") as f:
                f.write(raw)
            copy.chmod(0o400)
            count = page_count(copy, deadline)
            demand(count == trusted_scan_receipt["pages"], "page_count_mismatch")
            files, pages, total = {}, [], 0
            for number in range(1, count + 1):
                demand(time.monotonic() < deadline, "render_time_limit")
                ppm = tool([PDFTOPPM, "-f", str(number), "-l", str(number), "-singlefile", "-scale-to", str(MAX_EDGE),
                            "-cropbox", "-hide-annotations", str(copy)], MAX_PPM_BYTES, deadline)
                png, width, height = clean_png(ppm)
                total += len(png)
                demand(total <= MAX_CANDIDATE_BYTES, "candidate_byte_limit")
                name = f"page-{number:03d}.png"
                pages.append({"page":number, "file":name, "width":width, "height":height,
                              "bytes":len(png), "sha256":digest(png)})
                files[name] = png
            demand(digest(read_source(copy)) == sha, "staged_copy_changed")
            manifest = json.dumps({"version":1, "source_sha256":sha, "page_count":count, "pages":pages},
                                  sort_keys=True, separators=(",", ":")).encode("ascii")
            total += len(manifest)
            demand(time.monotonic() <= deadline, "render_time_limit")
            demand(total <= MAX_CANDIDATE_BYTES, "candidate_byte_limit")
            files["manifest.json"] = manifest
            return {"status":"render_candidate_next_gate_only", "candidate_bytes":total,
                    "manifest_sha256":digest(manifest), "files":files}
    except Blocked as e:
        return {"status":"blocked", "reason":str(e)}
    except (OSError, ValueError, MemoryError, OverflowError, TypeError, KeyError, struct.error):
        return {"status":"blocked", "reason":"render_unconfirmed"}
