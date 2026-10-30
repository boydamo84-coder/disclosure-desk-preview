#!/usr/bin/env python3
"""Merge approved, source-linked video records in batches without replacing catalogue.
Usage: python scripts/import_video_batch.py approved-videos.json [--apply]
Never manufactures footage or treats search results as verified evidence.
"""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data/disclosure-clips.json"
ALLOWED=("youtube.com","www.youtube.com","youtu.be","dvidshub.net","www.dvidshub.net")

def valid(row):
    if not isinstance(row,dict) or not all(isinstance(row.get(k),str) and row[k].strip() for k in ("id","title","publisher","group","description","source","evidenceStatus")):
        raise ValueError("Video missing required metadata")
    url=urlsplit(row["source"])
    if url.scheme!="https" or url.hostname not in ALLOWED:
        raise ValueError("Unapproved video source host")
    if row["evidenceStatus"] not in ("official","traceable","unverified"):
        raise ValueError("Unknown evidence classification")
    if row.get("dvidsId") and (url.hostname not in ("dvidshub.net","www.dvidshub.net") or not str(row["dvidsId"]).isdigit()):
        raise ValueError("Invalid DVIDS identifier")
    if not row.get("dvidsId") and not row.get("youtubeId"):
        raise ValueError("Playback identifier required")
    return row

def main():
    p=argparse.ArgumentParser()
    p.add_argument("approved_file",type=Path)
    p.add_argument("--apply",action="store_true")
    p.add_argument("--limit",type=int,default=1000)
    args=p.parse_args()
    if not 1<=args.limit<=5000:raise ValueError("Batch limit must be 1–5000")
    source=json.loads(args.approved_file.read_text(encoding="utf-8"))
    current=json.loads(OUT.read_text(encoding="utf-8"))
    if not isinstance(source,list) or not isinstance(current,list):raise ValueError("Expected JSON lists")
    ids={r["id"] for r in current}
    urls={r["source"].split("?")[0] for r in current}
    additions=[]
    for row in source:
        row=valid(row)
        if row["id"] in ids or row["source"].split("?")[0] in urls:continue
        ids.add(row["id"]);urls.add(row["source"].split("?")[0]);additions.append(row)
    print(f"Existing: {len(current)} | eligible new: {len(additions)} | selected: {min(len(additions),args.limit)}")
    if args.apply and additions:
        OUT.write_text(json.dumps(current+additions[:args.limit],ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("Applied approved records")
    else:print("DRY RUN: catalogue unchanged")

if __name__=="__main__":main()
