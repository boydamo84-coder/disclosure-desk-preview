#!/usr/bin/env python3
"""Create a local review queue from existing DVIDS videos; never publish inferred map pins.

Usage: python scripts/review_dvids_map_candidates.py --output /tmp/dvids-review.json
No coordinates or witness positions are inferred from video titles.
"""
import argparse
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CLIPS=ROOT/"data/disclosure-clips.json"
MAP=ROOT/"data/disclosure-map.json"

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    if args.output.resolve().is_relative_to(ROOT):
        raise SystemExit("Review output must be outside the public repository")
    clips=json.loads(CLIPS.read_text(encoding="utf-8"))
    mapped=json.loads(MAP.read_text(encoding="utf-8"))
    mapped_urls={str(item.get("source","")).split("#")[0] for item in mapped}
    queue=[]
    seen=set()
    for clip in clips:
        source=str(clip.get("source",""))
        identifier=str(clip.get("dvidsId",""))
        if not identifier or identifier in seen:
            continue
        seen.add(identifier)
        queue.append({
            "dvids_id":identifier,"title":clip.get("title",""),
            "source":source,"already_mapped_source":source in mapped_urls,
            "review_status":"needs incident and location verification",
            "required_checks":["Distinct incident vs duplicate footage",
              "Date of incident vs video publication date",
              "City or region explicitly supported by original source",
              "AARO or source outcome if published",
              "Approximate town/region placement only",
              "Check official media usage and attribution"]
        })
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Prepared {len(queue)} DVIDS video review candidates; no map entries changed.")

if __name__=="__main__":
    main()
