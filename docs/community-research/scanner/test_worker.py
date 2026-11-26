"""Actual ClamAV + qpdf in the isolated no-network container; synthetic PDFs only."""
import hashlib
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import worker

def pdf(*, pages=2, action="", annotation="", dimension=300, marker="Synthetic evidence"):
    # Strict xref table, text, vector lines and a tiny image; fictitious evidence.
    objects = [None]
    def stream(content):
        return f"<< /Length {len(content.encode())} >>\nstream\n{content}\nendstream"
    objects += [
        f"<< /Type /Catalog /Pages 2 0 R {action} >>",
        "<< /Type /Pages /Kids [" + " ".join(f"{9+i} 0 R" for i in range(pages)) + f"] /Count {pages} /MediaBox [0 0 {dimension} {dimension}] >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        stream("0 0 1 rg 20 200 120 75 re f 0 0 0 RG 20 90 250 90 re S 20 120 m 270 120 l S BT /F1 14 Tf 30 160 Td ("+marker+") Tj ET q 60 0 0 60 180 200 cm /Im1 Do Q"),
        stream("1 0 0 rg 20 200 120 75 re f BT /F1 14 Tf 30 160 Td (Page two) Tj ET"),
        "<< /Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length 25 >>\nstream\n00ff00ff00000000ffffff00>\nendstream",
        "<< /Producer (Fictional Disclosure Desk scanner fixture) >>",
        "<< >>",
    ]
    for i in range(pages):
        a = annotation if i == 0 else ""
        objects.append(f"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 3 0 R >> /XObject << /Im1 6 0 R >> >> /Contents {4 if i == 0 else 5} 0 R {a} >>")
    output = b"%PDF-1.7\n"
    offsets = [0]
    for i, body in enumerate(objects[1:], 1):
        offsets.append(len(output))
        output += f"{i} 0 obj\n{body}\nendobj\n".encode()
    start = len(output)
    output += f"xref\n0 {len(objects)}\n0000000000 65535 f \n".encode()
    output += "".join(f"{n:010d} 00000 n \n" for n in offsets[1:]).encode()
    output += f"trailer\n<< /Size {len(objects)} /Root 1 0 R /Info 7 0 R >>\nstartxref\n{start}\n%%EOF\n".encode()
    return output

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def main():
    assert os.getuid() != 0
    assert {name for _,name in socket.if_nameindex()} == {"lo"}, "network interface unexpectedly available"
    assert not os.access("/worker", os.W_OK), "worker code should be read-only"
    print("PASS non-root, no-network, read-only worker boundary", flush=True)
    with tempfile.TemporaryDirectory(prefix="dd-scan-test-") as td:
        dir = Path(td)
        raw = pdf()
        flagged = pdf(marker="Fictional local scanner test signature")
        signatures = dir / "fixture.hdb"
        signatures.write_text(f"{hashlib.md5(flagged).hexdigest()}:{len(flagged)}:DD_Fictional_Match\n")
        def scan_fixture(path):
            return worker._clam_scan(path, signatures, official_only=False)
        def run(raw, *, scanner=scan_fixture, digest=None):
            path = dir / "source.pdf"
            path.write_bytes(raw)
            receipt = worker._inspect(path, digest or sha(raw), scanner)
            assert path.read_bytes() == raw, "original bytes were modified"
            return receipt
        def passed(raw, pages=2):
            verdict = run(raw)
            assert verdict == {"status": "scan_passed_next_gate_only", "sha256":sha(raw),
                               "bytes":len(raw), "pages":pages}, verdict
        def rejected(raw, reason=None):
            verdict = run(raw)
            assert verdict["status"] == "rejected", verdict
            if reason is not None:
                assert verdict["reason"] == reason, verdict
            assert "sha256" not in verdict, verdict
        passed(raw)
        rejected(flagged, "malware_or_scan_limit_detected")
        print("PASS genuine ClamAV scan accepted valid PDF and detected harmless fixture signature", flush=True)
        # Legitimate clickable HTTPS source reference (only rendered inert downstream).
        link = "/Annots [<< /Type /Annot /Subtype /Link /Rect [1 1 10 10] /A << /S /URI /URI (https://example.invalid/source) >> >>]"
        passed(pdf(annotation=link))
        rejected(pdf(annotation=link.replace("https://example.invalid/source", "http://example.invalid/source")), "unsupported_link")
        rejected(pdf(action="/OpenAction << /S /JavaScript /JS (void 0) >>"), "active_or_unsupported_content")
        rejected(pdf(action="/Names << /EmbeddedFiles << /Names [] >> >>"), "active_or_unsupported_content")
        rejected(pdf(action="/AcroForm << /Fields [] >>"), "active_or_unsupported_content")
        rejected(pdf(annotation="/Annots [<< /Type /Annot /Subtype /FileAttachment /Rect [1 1 10 10] >>]"))
        rejected(pdf(pages=101), "page_count")
        rejected(pdf(dimension=14401), "page_dimensions")
        print("PASS qpdf genuine parse of page tree, sources, actions, attachments, forms and dimensions", flush=True)
        rejected(b"Not a PDF document at all", "pdf_header")
        rejected(raw[:-7], "pdf_eof")
        rejected(b" " * 5_000_001, "file_size")
        assert run(raw,digest="0"*64)=={"status":"rejected","reason":"digest_mismatch"}
        f=dir/"original.pdf";f.write_bytes(raw)
        symlink=dir/"symlink.pdf";symlink.symlink_to(f)
        assert worker._inspect(symlink,sha(raw),scan_fixture)=={"status":"rejected","reason":"file_unavailable"}
        fifo=dir/"pipe";os.mkfifo(fifo)
        assert worker._inspect(fifo,sha(raw),scan_fixture)=={"status":"rejected","reason":"not_regular_file"}
        print("PASS malformed, byte cap, digest binding, symlink and FIFO refusal", flush=True)
        compressed=dir/"compressed.pdf"
        subprocess.run([worker.QPDF,"--object-streams=generate",str(f),str(compressed)],check=True)
        passed(compressed.read_bytes())
        action=dir/"active.pdf";action.write_bytes(pdf(action="/OpenAction << /S /JavaScript /JS (void 0) >>"))
        subprocess.run([worker.QPDF,"--object-streams=generate",str(action),str(compressed)],check=True)
        rejected(compressed.read_bytes(), "active_or_unsupported_content")
        encrypted=dir/"encrypted.pdf"
        subprocess.run([worker.QPDF,"--encrypt","","owner-fixture","256","--",str(f),str(encrypted)],check=True)
        rejected(encrypted.read_bytes())
        print("PASS object-stream parsing and encrypted PDF refusal", flush=True)
        unavailable=lambda path: worker._clam_scan(path,dir/"missing.hdb",official_only=False)
        assert run(raw,scanner=unavailable)["status"]=="blocked"
        assert run(raw,scanner=lambda _:False)["status"]=="blocked"
        assert worker.inspect(f,sha(raw))=={"status":"blocked","reason":"official_signatures_unavailable"}
        # The production API has no custom-signature or skip-scan argument.
        try: worker.inspect(f,sha(raw),scanner=scan_fixture)
        except TypeError: pass
        else: raise AssertionError("fixture injection should not be available on worker entrypoint")
        print("PASS missing engine/signatures, unconfirmed verdict and production fixture exclusion", flush=True)
        assert not list(Path("/tmp").glob("dd-pdf-*")), "staged copy not removed"
        print("PASS ephemeral staged copies cleaned", flush=True)

if __name__=="__main__":
    main()
