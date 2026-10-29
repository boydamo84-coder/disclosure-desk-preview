#!/usr/bin/env python3
"""Read-only preflight inspection for the German GEP CSV.

Does not publish, geocode, or copy witness reports into Disclosure Desk.
Usage: python scripts/preflight_gep_csv.py path/to/GEP.csv
"""
import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

EXPECTED_MD5 = "0e644aa110ff6eef6c0a3666590a2042"
MAX_SIZE = 12 * 1024 * 1024

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_file", type=Path)
    parser.add_argument("--allow-other-version", action="store_true",
                        help="Inspect a different version without claiming it is the October 2026 release")
    args = parser.parse_args()
    data = args.csv_file.read_bytes()
    if len(data) > MAX_SIZE:
        raise SystemExit("Refusing unexpectedly large CSV")
    md5 = hashlib.md5(data).hexdigest()
    if md5 != EXPECTED_MD5 and not args.allow_other_version:
        raise SystemExit("Dataset checksum differs from GEP version 2026.09; no import performed. Actual md5: " + md5)
    decoded = None
    encoding = None
    for candidate in ("utf-8-sig", "cp1252"):
        try:
            decoded = data.decode(candidate)
            encoding = candidate
            break
        except UnicodeDecodeError:
            continue
    if decoded is None:
        raise SystemExit("Unknown encoding; no import performed")
    sample = decoded[:8192]
    dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    reader = csv.DictReader(decoded.splitlines(), dialect=dialect)
    headings = reader.fieldnames or []
    total = 0
    blanks = Counter()
    for row in reader:
        total += 1
        for key in headings:
            if not (row.get(key) or "").strip():
                blanks[key] += 1
    print(json.dumps({
        "dataset_version": "2026.09" if md5 == EXPECTED_MD5 else "different/unverified",
        "bytes": len(data), "md5": md5, "encoding": encoding,
        "delimiter": dialect.delimiter, "records": total,
        "columns": headings, "blank_cells_by_column": dict(blanks),
        "publication": "NOT APPROVED: confirm source licence, text privacy, classification mapping, and town geocoding first",
        "source": "https://zenodo.org/records/23117630"
    }, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
