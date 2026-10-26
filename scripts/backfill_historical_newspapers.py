#!/usr/bin/env python3
"""Bounded historical newspaper discovery via Library of Congress Chronicling America.

Results describe searchable newspaper PAGES, not verified article-level UFO stories.
No third-party article text, images or copyrighted clippings are copied.
"""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"data/historical-news-archive.json"
TERMS=("flying saucer","flying saucers","flying disc","flying disk","flying disks","unidentified flying object","UFO","alien craft","alien spacecraft","disc shaped object","disk shaped object","mysterious object in sky")
API="https://www.loc.gov/collections/chronicling-america/"
HEADERS={"User-Agent":"DisclosureDeskResearch/1.0 (historical metadata importer)"}

def discover(year,term,page=1):
    args={"fo":"json","at":"results,pagination","dl":"page","qs":term,"ops":"PHRASE",
          "start_date":f"{year}-01-01","end_date":f"{year}-12-31",
          "c":"50","sp":str(page),"dates":f"{year}/{year}","searchType":"advanced"}
    url=API+"?"+urllib.parse.urlencode(args)
    req=urllib.request.Request(url,headers=HEADERS)
    with urllib.request.urlopen(req,timeout=12) as response:
        return json.load(response)

def normalise(item,year,term):
    if not isinstance(item,dict):return None
    url=str(item.get("id") or item.get("url") or "").split("?")[0]
    if url.startswith("http://www.loc.gov/"):url="https://"+url[len("http://"):]
    if not url.startswith(("https://www.loc.gov/resource/","https://www.loc.gov/item/")):return None
    raw_dates=item.get("date") or item.get("dates") or []
    if isinstance(raw_dates,list): raw_dates=next((str(d) for d in raw_dates if re.search(r"\d{4}",str(d))),"")
    match=re.search(r"\b(18\d{2}|19\d{2}|20\d{2})\b",str(raw_dates))
    actual_year=int(match.group(1)) if match else None
    if actual_year!=year:return None
    title=str(item.get("title") or "Historic newspaper page").strip()[:220]
    if not title:return None
    uid=hashlib.sha256(url.encode()).hexdigest()[:20]
    return {
        "id":"loc-"+uid,
        "title":title,
        "source":"Library of Congress · Chronicling America",
        "url":url,
        "year":actual_year,
        "category":"UAP",
        "kind":"Historic newspaper page (keyword match)",
        "description":"Newspaper page returned for the historical search phrase '"+term+
          "'. This is a page-level search result, not proof that an individual UFO article appears on the page.",
        "keywords":[term],
        "dateType":"newspaper publication year",
        "evidenceStatus":"archival newspaper source; claim unverified"
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--start-year",type=int,default=1947)
    parser.add_argument("--end-year",type=int,default=1952)
    parser.add_argument("--pages-per-query",type=int,default=2)
    parser.add_argument("--max-records",type=int,default=350)
    parser.add_argument("--max-queries",type=int,default=8)
    parser.add_argument("--term-offset",type=int,default=0)
    args=parser.parse_args()
    if not 1860<=args.start_year<=args.end_year<=1963: parser.error("LOC historical pilot supports 1860–1963")
    if not 1<=args.pages_per_query<=4:parser.error("pages-per-query must be between 1 and 4")
    if not 1<=args.max_records<=2000:parser.error("max-records must be 1–2000")
    if not 1<=args.max_queries<=30:parser.error("max-queries must be 1–30")
    if not 0<=args.term_offset<len(TERMS):parser.error("term-offset out of range")
    existing=json.loads(OUTPUT.read_text(encoding="utf-8"))
    if not isinstance(existing,list):raise ValueError("Existing archive must be a JSON array")
    records={x["id"]:x for x in existing if isinstance(x,dict) and x.get("id")}
    attempts=successes=added=0
    consecutive_failures=0
    first_sample=True
    rejected=0
    observed_years={}
    yearly_added={}
    term_added={}
    seen_this_run=set()
    for year in range(args.start_year,args.end_year+1):
        for term in TERMS[args.term_offset:]:
            for page in range(1,args.pages_per_query+1):
                if added>=args.max_records or attempts>=args.max_queries or consecutive_failures>=3:break
                attempts+=1
                try:
                    data=discover(year,term,page)
                    if not isinstance(data.get("results"),list):raise ValueError("No results array")
                    successes+=1
                    consecutive_failures=0
                    for item in data["results"]:
                        if first_sample:
                            print("Sample LOC schema keys:",sorted(item.keys()) if isinstance(item,dict) else type(item).__name__)
                            print("Sample LOC ID:",str(item.get("id",""))[:150] if isinstance(item,dict) else "")
                            print("Sample LOC date:",str(item.get("date",item.get("dates","")))[:120] if isinstance(item,dict) else "")
                            first_sample=False
                        record=normalise(item,year,term)
                        if not record:
                            rejected+=1
                            raw=str(item.get("date","")) if isinstance(item,dict) else ""
                            y=raw[:4]
                            observed_years[y]=observed_years.get(y,0)+1
                            continue
                        if record["id"] in seen_this_run:continue
                        seen_this_run.add(record["id"])
                        if record["id"] not in records:
                            records[record["id"]]=record
                            added+=1
                            yearly_added[year]=yearly_added.get(year,0)+1
                            term_added[term]=term_added.get(term,0)+1
                    if len(data["results"])<50:break
                except Exception as exc:
                    print(f"LOC unavailable for {year} / {term} / {page}: {type(exc).__name__}: {str(exc)[:90]}")
                    consecutive_failures+=1
                    if consecutive_failures>=3:
                        print("Stopping early after three consecutive source errors; archive preserved")
                        break
                    break
                time.sleep(1.2)
            if added>=args.max_records or attempts>=args.max_queries:break
    print("Added by year:",sorted(yearly_added.items()))
    print("Added by search phrase:",sorted(term_added.items()))
    print("Query cap:",args.max_queries)
    print("Rejected LOC result rows:",rejected)
    print("Rejected publication years:",sorted(observed_years.items(),key=lambda x:-x[1])[:20])
    if not successes:
        raise RuntimeError("All Library of Congress queries failed; existing archive preserved")
    if added==0 and not any(x.startswith("loc-") for x in records):
        raise RuntimeError("Zero historical pages imported; inspect sample LOC schema in logs. Existing archive preserved")
    ordered=sorted(records.values(),key=lambda x:(-int(x.get("year",0)),x.get("id","")))
    temp=OUTPUT.with_suffix(".json.tmp")
    temp.write_text(json.dumps(ordered,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    temp.replace(OUTPUT)
    print(f"Queries {successes}/{attempts} successful; {added} new pages; {len(ordered)} total archive records")
if __name__=="__main__":main()
