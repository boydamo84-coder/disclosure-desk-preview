#!/usr/bin/env python3
"""Import a bounded batch of publicly catalogued Project Blue Book file metadata.

Source: Encounter Atlas CC BY 4.0 dataset (https://encounteratlas.com/datasets/).
Underlying original files: US National Archives RG 341, series 597821.
Never import latitude/longitude or exact witness addresses.
"""
import argparse
import json
from pathlib import Path
import urllib.request
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/historical-news-archive.json'
SOURCE='https://encounteratlas.com/datasets/files/project-blue-book-case-files.json'

def load_source():
    req=urllib.request.Request(SOURCE,headers={'User-Agent':'DisclosureDesk/1.0 archival research importer'})
    with urllib.request.urlopen(req,timeout=90) as response:
        raw=response.read(25_000_001)
    if len(raw)>25_000_000:raise ValueError('Dataset unexpectedly large')
    payload=json.loads(raw)
    if isinstance(payload,list):return payload
    if isinstance(payload,dict):
        for key in ('records','cases','data','items'):
            if isinstance(payload.get(key),list):return payload[key]
    raise ValueError('Unrecognised source dataset format: archive untouched')

def normalize(row):
    if not isinstance(row,dict):return None
    identifier=str(row.get('nara_id') or '').strip()
    if not identifier.isdecimal():return None
    year=row.get('year')
    try:year=int(year)
    except (ValueError,TypeError):return None
    if not 1947<=year<=1969:return None
    rawurl=str(row.get('nara_url') or '').strip()
    parsed=urlparse(rawurl)
    if parsed.scheme!='https' or parsed.hostname not in ('catalog.archives.gov','www.archives.gov'):return None
    if identifier not in rawurl:return None
    title=str(row.get('title') or '').strip()
    if not title or len(title)>220:return None
    # Folder titles are not scanned for addresses; do not store location, coords or images.
    return {
       'id':'nara-bluebook-'+identifier,
       'title':'Project Blue Book case file — '+title,
       'source':'US National Archives · case-file metadata via Encounter Atlas',
       'url':rawurl,
       'year':year,
       'category':'UAP',
       'kind':'Individual government case file',
       'description':'Archival case folder from Project Blue Book (NARA series 597821). Folder date/year comes from catalog metadata. Its inclusion records an investigation, not a finding of extraordinary technology.',
       'dateType':'case-file folder year',
       'evidenceStatus':'official archival case-file reference; claims not independently verified',
       'metadataCredit':'Encounter Atlas, Project Blue Book case files (CC BY 4.0)',
       'metadataSource':'https://encounteratlas.com/datasets/'
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--limit',type=int,default=200)
    parser.add_argument('--offset',type=int,default=0)
    args=parser.parse_args()
    if not 1<=args.limit<=500:parser.error('Limit must be 1–500')
    if not 0<=args.offset<=11000:parser.error('Offset must be 0–11000')
    raw=load_source()
    candidates=[]
    for row in raw:
        item=normalize(row)
        if item:candidates.append(item)
    if len(candidates)<100:raise RuntimeError('Too few valid case-file records; source schema may have changed')
    candidates.sort(key=lambda x:(x['year'],x['id']))
    selected=candidates[args.offset:args.offset+args.limit]
    if not selected:raise RuntimeError('No records in requested batch')
    rows=json.loads(OUT.read_text(encoding='utf-8'))
    if not isinstance(rows,list):raise ValueError('Existing archive not a list')
    previous={r['id']:r for r in rows}
    added=0
    for record in selected:
        if record['id'] not in previous:
            previous[record['id']]=record
            added+=1
    output=sorted(previous.values(),key=lambda x:(-int(x.get('year',0)),x['id']))
    assert len(output)==len(set(x['id'] for x in output))
    temporary=OUT.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(output,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    temporary.replace(OUT)
    print(f'Valid source cases: {len(candidates)}; selected: {len(selected)}; newly added: {added}; archive total: {len(output)}')
    print('Source: Encounter Atlas CC BY 4.0; linked originals: US National Archives')
if __name__=='__main__':main()
