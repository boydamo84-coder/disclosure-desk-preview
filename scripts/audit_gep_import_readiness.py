#!/usr/bin/env python3
"""Privacy-first GEP CSV readiness report. Never writes case-level source data.
Use locally: python scripts/audit_gep_import_readiness.py file.csv
No permission to publish is inferred from this audit.
"""
import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path

EXPECTED_MD5 = "0e644aa110ff6eef6c0a3666590a2042"
REQUIRED = ("Fallnummer", "Datum", "Land", "Sichtungsort",
            "Klassifikation_Hendry", "Klassifikation_Hynek", "Sachverhalt")
SENSITIVE_LOCATION = re.compile(r"\b(?:straße|strasse|street|road|avenue|hausnummer|apartment|wohnung)\b|\b\d{5}\b", re.I)

def audit(path):
    data = path.read_bytes()
    checksum = hashlib.md5(data).hexdigest()
    if checksum != EXPECTED_MD5:
        raise ValueError("Unexpected dataset version/checksum; refusing preparation")
    text = data.decode("utf-8-sig")
    reader = csv.DictReader(text.splitlines(), delimiter=";")
    missing = set(REQUIRED) - set(reader.fieldnames or ())
    if missing:
        raise ValueError("Missing required source fields: " + ", ".join(sorted(missing)))
    totals, statuses, countries = 0, Counter(), Counter()
    invalid_dates = missing_core = sensitive_places = duplicates = 0
    seen = set()
    for record in reader:
        totals += 1
        case_id = record["Fallnummer"].strip()
        if not case_id or case_id in seen:
            duplicates += 1
        seen.add(case_id)
        countries[record["Land"].strip() or "(blank)"] += 1
        statuses[record["Klassifikation_Hendry"].strip() or "(blank)"] += 1
        if not all(record[x].strip() for x in ("Fallnummer", "Datum", "Land", "Sichtungsort")):
            missing_core += 1
        try:
            datetime.strptime(record["Datum"].strip(), "%d.%m.%Y")
        except ValueError:
            invalid_dates += 1
        if SENSITIVE_LOCATION.search(record["Sichtungsort"]):
            sensitive_places += 1
    return {
        "dataset": "GEP 1972–2026.09",
        "source_md5_matches": True,
        "records": totals,
        "distinct_country_labels": len(countries),
        "counts_by_country": dict(countries.most_common()),
        "classifications_hendry": dict(statuses.most_common()),
        "rows_with_missing_basic_location_or_id_or_date": missing_core,
        "rows_with_invalid_sighting_date": invalid_dates,
        "duplicate_or_blank_case_numbers": duplicates,
        "location_strings_requiring_extra_privacy_review": sensitive_places,
        "coordinates_present": False,
        "ready_to_publish": False,
        "blockers": [
            "Written permission or verified reuse licence for this exact release",
            "Reviewed country and town geocoding (never raw witness coordinates)",
            "Classification and duplicate review; privacy-screened descriptions",
            "Licence-required attribution and provenance display"
        ],
        "note": "Aggregate audit only. Zero source rows or witness descriptions exported."
    }

if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("csv_file", type=Path)
    args = p.parse_args()
    print(json.dumps(audit(args.csv_file), ensure_ascii=False, indent=2))
