#!/usr/bin/env python3
"""Merge reviewed international map cases. No geocoding or automatic fact claims."""
import argparse
import json
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

TARGET = Path(__file__).resolve().parents[1] / "data/disclosure-map.json"
FIELDS = ("id", "title", "category", "city", "lat", "lon", "eventDate", "desc", "source", "documents", "locationPrecision", "assessment")

def check(row):
    if not isinstance(row, dict) or any(not row.get(k) for k in FIELDS):
        raise ValueError("Missing required case metadata")
    if not str(row["id"]).startswith("dd-"):
        raise ValueError("Invalid stable case id")
    for key, bound in (("lat",90), ("lon",180)):
        v=row[key]
        if isinstance(v,bool) or not isinstance(v,(int,float)) or abs(v)>bound:
            raise ValueError("Invalid coordinate")
    date.fromisoformat(row["eventDate"])
    if row["locationPrecision"] not in ("approximate town centre", "approximate regional centre"):
        raise ValueError("Exact witness locations are not permitted")
    if urlsplit(row["source"]).scheme != "https":
        raise ValueError("HTTPS source required")
    if not isinstance(row["documents"],list) or not row["documents"]:
        raise ValueError("Official supporting document required")
    for doc in row["documents"]:
        if not all(doc.get(k) for k in ("title","publisher","url","kind")) or urlsplit(doc["url"]).scheme!="https":
            raise ValueError("Incomplete supporting document")
    return row

def main():
    p=argparse.ArgumentParser()
    p.add_argument("reviewed_json",type=Path)
    p.add_argument("--apply",action="store_true")
    p.add_argument("--batch-size",type=int,default=5000,help="Maximum new records per run (1-5000)")
    a=p.parse_args()
    if not 1 <= a.batch_size <= 5000:
        raise ValueError("Batch size must be between 1 and 5000")
    incoming=json.loads(a.reviewed_json.read_text(encoding="utf-8"))
    existing=json.loads(TARGET.read_text(encoding="utf-8"))
    if not isinstance(incoming,list) or not isinstance(existing,list):
        raise ValueError("JSON arrays expected")
    ids={row["id"] for row in existing}
    sources={row.get("source") for row in existing}
    pending=[]
    for raw in incoming:
        row=check(raw)
        if row["id"] in ids or row["source"] in sources:
            print("Skipped already present or potentially duplicated:",row["id"])
            continue
        ids.add(row["id"])
        sources.add(row["source"])
        pending.append(row)
    total=len(pending)
    pending=pending[:a.batch_size]
    print("Validated new cases:",total,"; selected for batch:",len(pending),"; remaining:",total-len(pending))
    if a.apply and pending:
        TARGET.write_text(json.dumps(existing+pending,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("Saved approved records")
    else:
        print("Preview only; no file changes")

if __name__=="__main__":
    main()
